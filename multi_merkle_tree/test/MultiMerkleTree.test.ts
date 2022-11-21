/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

import { toFixedHex } from "@webb-tools/sdk-core";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { poseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
import { MerkleTree, PoseidonHasher } from "../src";
import { MultiMerkleTree__factory } from "../typechain";
const TruffleAssert = require("truffle-assertions");
const assert = require("assert");

// const MerkleTreeWithHistory = artifacts.require('MerkleTreePoseidonMock');

describe.only("MultiMerkleTree", () => {
  let merkleForest;
  let hasherInstance: PoseidonHasher;
  let sender;
  let wallet;
  const groupLevels = 5;
  const subtreeLevels = 20;
  let tree: MerkleTree;
  let forest: MerkleTree;

  async function getSubtree(merkleForest: any, index: number) {
    const subtreeAddr = await merkleForest.subtrees(index);
    const merkleTree = await ethers.getContractAt("MerkleTree", subtreeAddr);
    return merkleTree;
  }

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    wallet = signers[0];
    sender = await wallet.getAddress();
    hasherInstance = await PoseidonHasher.createPoseidonHasher(wallet);
    tree = new MerkleTree(subtreeLevels);
    forest = new MerkleTree(groupLevels);

    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    const MultiMerkleTree = await ethers.getContractFactory(
      "MultiMerkleTree",
      wallet
    );
    // const MerkleTreeWithHistory = new MerkleTreeWithHistory__factory();
    merkleForest = await MultiMerkleTree.deploy(
      groupLevels,
      subtreeLevels,
      hasherInstance.contract.address,
      verifier.address
    );
  });

  describe("#constructor", () => {
    it("should initialize", async () => {
      const defaultGroupRoot = await hasherInstance.contract.zeros(groupLevels - 1);
      const groupZeroValue = await hasherInstance.contract.zeros(0);
      const firstSubtree = await merkleForest.filledSubtrees(0);
      const initialRoot = await merkleForest.getLastRoot();
      assert.strictEqual(
        firstSubtree,
        toFixedHex(BigNumber.from(groupZeroValue.toString()))
      );
      assert.strictEqual(
        defaultGroupRoot,
        toFixedHex(BigNumber.from(initialRoot.toString()))
      );
      assert.strictEqual(
        defaultGroupRoot,
        toFixedHex(initialRoot.toString())
      );

      const defaultSubtreeRoot = await hasherInstance.contract.zeros(subtreeLevels - 1);
      const subtree = await getSubtree(merkleForest, 0);
      const initialSubtreeRoot = await subtree.getLastRoot();
      assert.strictEqual(
        initialSubtreeRoot,
        toFixedHex(BigNumber.from(defaultSubtreeRoot.toString()))
      );
      assert.strictEqual(await subtree.levels(), tree.levels);
      assert.strictEqual(await merkleForest.levels(), forest.levels);
      assert.strictEqual(0, tree.number_of_elements());
      assert.strictEqual(0, await subtree.nextIndex());

      const subtreeRoot = await tree.root();
      assert.strictEqual(initialSubtreeRoot, toFixedHex(subtreeRoot.toString()));
      const initialForestRoot = await merkleForest.getLastRoot();
      const forestRoot = await forest.root();
      assert.strictEqual(initialForestRoot, toFixedHex(forestRoot.toString()));
    });
  });

  describe("#hash", () => {
    it("should hash", async () => {
      const contractResult = await hasherInstance.contract.hashLeftRight(
        10,
        10
      );
      const result = BigNumber.from(poseidon([10, 10]));
      assert.strictEqual(result.toString(), contractResult.toString());

      const zeroValues = [];
      let currentZeroValue =
        "21663839004416932945382355908790599225266501822907911457504978515578255421292";
      zeroValues.push(currentZeroValue);

      for (let i = 0; i < 31; i++) {
        currentZeroValue = BigNumber.from(
          poseidon([i, currentZeroValue, currentZeroValue])
        ).toString();
        zeroValues.push(currentZeroValue);
      }
    });
  });

  describe("#insert", () => {
    it("should insert subtree correctly", async () => {
      // let rootFromContract;
      // let subtree = await getSubtree(merkleForest, 0);

      for (let i = 1; i < 11; i++) {
        // const i = 1;
        await merkleForest.insertSubtree(0, toFixedHex(i), { from: sender });
        await tree.insert(i);
        const { merkleRoot } = await tree.path(i - 1);
        const subtree = await getSubtree(merkleForest, 0);
        // rootFromContract = await merkleForest.getLastSubtreeRoot(0);
        const subtreeRootFromContract = await subtree.getLastRoot();
        assert.strictEqual(
          toFixedHex(merkleRoot),
          subtreeRootFromContract.toString()
        );
        const rootFromContract = await merkleForest.getLastSubtreeRoot(0);
        assert.strictEqual(toFixedHex(merkleRoot), rootFromContract.toString());
        assert.strictEqual(subtreeRootFromContract, rootFromContract);
      }
    });

    it("should reject if tree is full", async () => {
      const levels = 6;
      const MerkleTreeWithHistory = await ethers.getContractFactory(
        "MerkleTreePoseidonMock",
        wallet
      );
      // const MerkleTreeWithHistory = new MerkleTreeWithHistory__factory();
      const merkleTreeWithHistory = await MerkleTreeWithHistory.deploy(
        levels,
        hasherInstance.contract.address
      );
      for (let i = 0; i < 2 ** levels; i++) {
        TruffleAssert.passes(
          await merkleTreeWithHistory.insert(toFixedHex(i + 42))
        );
      }

      await TruffleAssert.reverts(
        merkleTreeWithHistory.insert(toFixedHex(1337)),
        "Merkle tree is full. No more leaves can be added"
      );

      await TruffleAssert.reverts(
        merkleTreeWithHistory.insert(toFixedHex(1)),
        "Merkle tree is full. No more leaves can be added"
      );
    });
  });

  describe("#isKnownSubtreeRoot", () => {
    it("should work", async () => {
      let path;

      for (let i = 1; i < 5; i++) {
        TruffleAssert.passes(
          await merkleForest.insertSubtree(0, toFixedHex(i), { from: sender })
        );
        await tree.insert(i);
        path = await tree.path(i - 1);
        const isKnown = await merkleForest.isKnownSubtreeRoot(
          toFixedHex(path.merkleRoot)
        );
        assert(isKnown);
      }

      TruffleAssert.passes(
        await merkleForest.insertSubtree(0, toFixedHex(42), { from: sender })
      );
      // check outdated root
      path = await tree.path(3);
      const isKnown = await merkleForest.isKnownSubtreeRoot(
        toFixedHex(path.merkleRoot)
      );
      assert(isKnown);
    });

    it("should not return uninitialized roots", async () => {
      TruffleAssert.passes(
        await merkleForest._insert(toFixedHex(42), { from: sender })
      );
      const isKnown = await merkleForest.isKnownRoot(toFixedHex(0));
      assert(!isKnown);
    });
  });

  describe("#insertions using deposit commitments", async () => {
    it("should rebuild root correctly between native and contract", async () => {
      const commitment =
        "0x0101010101010101010101010101010101010101010101010101010101010101";
      await tree.insert(commitment);
      const { merkleRoot: subtreeRoot } = await tree.path(0);
      await forest.insert(subtreeRoot);
      const { merkleRoot, pathElements, pathIndices } = await forest.path(0);
      await merkleForest.insertSubtree(0, toFixedHex(commitment), {
        from: sender,
      });
      const rootFromContract = BigNumber.from(await merkleForest.getLastRoot());
      assert.strictEqual(
        merkleRoot.toHexString(),
        rootFromContract.toHexString()
      );
      let curr = subtreeRoot.toHexString();
      for (let i = 0; i < pathElements.length; i++) {
        const elt = pathElements[i];
        const side = pathIndices[i];
        if (side === 0) {
          const contractResult = await hasherInstance.contract.hashLeftRight(
            curr,
            elt
          );
          curr = contractResult.toString();
        } else {
          const contractResult = await hasherInstance.contract.hashLeftRight(
            elt,
            curr
          );
          curr = contractResult.toString();
        }
      }

      assert.strictEqual(BigInt(curr).toString(), merkleRoot.toString());
    });
  });
  describe.only("#verifyProof", async () => {
    const commitment =
      "0x0101010101010101010101010101010101010101010101010101010101010101";
    const wasmPath =
      "./artifacts/circuits/merkle_proof_test/merkle_proof_test_js/merkle_proof_test.wasm";
    const zkeyPath = "build/merkle_proof_test/2/circuit_final.zkey";
    let subtreeRoot: BigNumber;
    let subtreePathElements: BigNumber[];
    let subtreePathIndices: number[];
    let forestRoot: BigNumber;
    let forestPathElements: BigNumber[];
    let roots: string[];
    let forestPathIndices: number[];
    let merkleRoot: BigNumber;
    beforeEach(async () => {
      const groupZeroValue = await BigNumber.from(
        await hasherInstance.contract.zeros(0)
      );
      // Insert commitment into subtree
      await tree.insert(commitment);
      // eslint-disable-next-line prettier/prettier
      const { merkleRoot: subRoot, pathElements: subPathElements, pathIndices: subPathIndices } = tree.path(0);

      subtreeRoot = subRoot;
      subtreePathElements = subPathElements;
      subtreePathIndices = subPathIndices;

      // Insert subtree root as a leaf onto forest
      await forest.insert(subtreeRoot);
      const { merkleRoot, pathElements, pathIndices } = await forest.path(0);
      forestRoot = merkleRoot;
      forestPathElements = pathElements;
      forestPathIndices = pathIndices;

      // create root array
      roots = [
        forestRoot.toString(),
        BigNumber.from(groupZeroValue.toString()).toString(),
      ];

      // insert commitment onto contract
      await merkleForest.insertSubtree(0, toFixedHex(commitment), {
        from: sender,
      });
    });
    it("should verify proof", async () => {
      const groupZeroValue = await BigNumber.from(
        await hasherInstance.contract.zeros(0)
      );
      const subtreePathElements1 = subtreePathElements.map((elem) => {
        return elem.toString();
      });
      console.log("groupZeroValue: ", groupZeroValue.toString())
      console.log("subtreePathElements1: ", subtreePathElements1);
      let subtreePathIndex = MerkleTree.calculateIndexFromPathIndices(subtreePathIndices);
      let forestPathIndex = MerkleTree.calculateIndexFromPathIndices(forestPathIndices);
      const publicInputs = {
        leaf: commitment,
        pathElements: forestPathElements.map((elem) => elem.toString()),
        pathIndices: forestPathIndex,
        subtreePathElements: subtreePathElements1,
        subtreePathIndices: subtreePathIndex,
        roots: [forestRoot.toString(), groupZeroValue.toString()],
        isEnabled: "1",
      };
      console.log("publicInputs: ", publicInputs);
      console.log("wasmPath: ", wasmPath);
      const { proof, publicSignals } = await groth16.fullProve(
        publicInputs,
        wasmPath,
        zkeyPath
      );
      console.log("proof: ", proof);
      console.log("publicSignals: ", publicSignals);
      assert(false);
    });
  });
});
