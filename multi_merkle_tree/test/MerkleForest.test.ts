/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

import { toFixedHex } from "@webb-tools/sdk-core";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { poseidon, poseidon_gencontract as poseidonContract } from "circomlibjs";
import { MerkleTree, PoseidonHasher } from "../src";
import { LinkableIncrementalBinaryTree__factory } from "../typechain";
const TruffleAssert = require("truffle-assertions");
const assert = require("assert");

// const MerkleTreeWithHistory = artifacts.require('MerkleTreePoseidonMock');

describe.only("MerkleForest", () => {
  let merkleForest;
  let hasherInstance: PoseidonHasher;
  let sender;
  let wallet;
  const groupLevels = 5;
  const subtreeLevels = 20;
  let tree: MerkleTree;
  let forest: MerkleTree;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    wallet = signers[0];
    sender = await wallet.getAddress();
    hasherInstance = await PoseidonHasher.createPoseidonHasher(wallet);
    tree = new MerkleTree(subtreeLevels);
    forest = new MerkleTree(groupLevels);

    const poseidonABI = poseidonContract.generateABI(2);
    const poseidonBytecode = poseidonContract.createCode(2);

    const PoseidonLibFactory = new ethers.ContractFactory(
      poseidonABI,
      poseidonBytecode,
      wallet
    );
    const poseidonLib = await PoseidonLibFactory.deploy();
    await poseidonLib.deployed();

    const LinkableIncrementalBinaryTree = await ethers.getContractFactory(
      "LinkableIncrementalBinaryTree",
      {
        signer: wallet,
        libraries: {
          PoseidonT3: poseidonLib.address,
        },
      }
    );
    const linkableIncrementalBinaryTree =
      await LinkableIncrementalBinaryTree.deploy();
    await linkableIncrementalBinaryTree.deployed();

    const MultiMerkleTree = await ethers.getContractFactory("MerkleForest", {
      signer: wallet,
      libraries: {
        PoseidonT3: poseidonLib.address,
        LinkableIncrementalBinaryTree: linkableIncrementalBinaryTree.address,
      },
    });
    // const libraryAddresses = {
    //   ['contracts/LinkableIncrementalBinaryTree.sol:LinkableIncrementalBinaryTree']: linkableIncrementalBinaryTree.address,
    //   ['contracts/Poseidon.sol:PoseidonT3']: poseidonT3Library.address,
    // };
    // const factory = new PoseidonHasher__factory(libraryAddresses, signer);

    // const MerkleTreeWithHistory = new MerkleTreeWithHistory__factory();
    merkleForest = await MultiMerkleTree.deploy(groupLevels, subtreeLevels);
    await merkleForest.deployed();
  });

  describe("#constructor", () => {
    it("should initialize", async () => {
      const defaultGroupRoot = await hasherInstance.contract.zeros(
        groupLevels - 1
      );

      const initialRoot = await merkleForest.getLastRoot();
      assert.strictEqual(
        defaultGroupRoot,
        toFixedHex(BigNumber.from(initialRoot.toString()))
      );
      assert.strictEqual(defaultGroupRoot, toFixedHex(initialRoot.toString()));

      const defaultSubtreeRoot = await hasherInstance.contract.zeros(
        subtreeLevels - 1
      );
      const initialSubtreeRoot = await merkleForest.getLastSubtreeRoot(0);
      assert.strictEqual(
        initialSubtreeRoot.toHexString(),
        toFixedHex(BigNumber.from(defaultSubtreeRoot.toString()))
      );
      const subtree = await merkleForest.subtrees(0);
      assert.strictEqual(await subtree.depth.toNumber(), tree.levels);
      const forestData = await merkleForest.merkleForest();
      assert.strictEqual(forestData.depth.toNumber(), forest.levels);
      assert.strictEqual(0, forestData.numberOfLeaves.toNumber());
      assert.strictEqual(0, await forestData.currentRootIndex);

      const subtreeRoot = await tree.root();
      assert.strictEqual(
        initialSubtreeRoot.toHexString(),
        toFixedHex(subtreeRoot.toString())
      );
      const initialForestRoot = await merkleForest.getLastRoot();
      const forestRoot = await forest.root();
      assert.strictEqual(initialForestRoot.toHexString(), toFixedHex(forestRoot.toString()));
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
        const { merkleRoot: subtreeRoot } = await tree.path(i - 1);
        const subtreeRootFromContract = await merkleForest.getLastSubtreeRoot(
          0
        );
        assert.strictEqual(
          toFixedHex(subtreeRoot),
          subtreeRootFromContract.toHexString()
        );
        if (i === 1) {
          await forest.insert(subtreeRoot);
        } else {
          await forest.update(0, subtreeRoot);
        }
        const { merkleRoot: forestRoot } = await forest.path(0);

        const forestRootFromContract = await merkleForest.getLastRoot();
        assert.strictEqual(
          toFixedHex(forestRoot),
          forestRootFromContract.toHexString()
        );
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
});