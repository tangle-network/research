"use strict";
/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_core_1 = require("@webb-tools/sdk-core");
const ethers_1 = require("ethers");
const hardhat_1 = require("hardhat");
const circomlibjs_1 = require("circomlibjs");
const src_1 = require("../src");
const TruffleAssert = require('truffle-assertions');
const assert = require('assert');
const MerkleTreeWithHistory = hardhat_1.artifacts.require('MerkleTreePoseidonMock');
(0, hardhat_1.contract)('MerkleTree w/ Poseidon hasher', (accounts) => {
    let merkleTreeWithHistory;
    let hasherInstance;
    let levels = 30;
    const sender = accounts[0];
    let tree;
    beforeEach(async () => {
        const signers = await hardhat_1.ethers.getSigners();
        const wallet = signers[0];
        hasherInstance = await src_1.PoseidonHasher.createPoseidonHasher(wallet);
        tree = new sdk_core_1.MerkleTree(levels);
        merkleTreeWithHistory = await MerkleTreeWithHistory.new(levels, hasherInstance.contract.address);
    });
    describe('#constructor', () => {
        it('should initialize', async () => {
            const zeroValue = await merkleTreeWithHistory.ZERO_VALUE();
            const firstSubtree = await merkleTreeWithHistory.filledSubtrees(0);
            assert.strictEqual(firstSubtree, (0, sdk_core_1.toFixedHex)(ethers_1.BigNumber.from(zeroValue.toString())));
            const firstZero = await hasherInstance.contract.zeros(0);
            assert.strictEqual(firstZero, (0, sdk_core_1.toFixedHex)(ethers_1.BigNumber.from(zeroValue.toString())));
        });
    });
    describe('#hash', () => {
        it('should hash', async () => {
            let contractResult = await hasherInstance.contract.hashLeftRight(10, 10);
            let result = ethers_1.BigNumber.from((0, circomlibjs_1.poseidon)([10, 10]));
            assert.strictEqual(result.toString(), contractResult.toString());
            let zero_values = [];
            let current_zero_value = '21663839004416932945382355908790599225266501822907911457504978515578255421292';
            zero_values.push(current_zero_value);
            for (let i = 0; i < 31; i++) {
                current_zero_value = ethers_1.BigNumber.from((0, circomlibjs_1.poseidon)([i, current_zero_value, current_zero_value])).toString();
                zero_values.push(current_zero_value.toString());
            }
        });
    });
    describe('#insert', () => {
        it('should insert', async () => {
            let rootFromContract;
            for (let i = 1; i < 11; i++) {
                await merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(i), { from: sender });
                await tree.insert(i);
                let { merkleRoot } = await tree.path(i - 1);
                rootFromContract = await merkleTreeWithHistory.getLastRoot();
                assert.strictEqual((0, sdk_core_1.toFixedHex)(merkleRoot), rootFromContract.toString());
            }
        });
        it('should reject if tree is full', async () => {
            const levels = 6;
            const merkleTreeWithHistory = await MerkleTreeWithHistory.new(levels, hasherInstance.contract.address);
            for (let i = 0; i < 2 ** levels; i++) {
                TruffleAssert.passes(await merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(i + 42)));
            }
            await TruffleAssert.reverts(merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(1337)), 'Merkle tree is full. No more leaves can be added');
            await TruffleAssert.reverts(merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(1)), 'Merkle tree is full. No more leaves can be added');
        });
    });
    describe('#isKnownRoot', () => {
        it('should work', async () => {
            let path;
            for (let i = 1; i < 5; i++) {
                TruffleAssert.passes(await merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(i), { from: sender }));
                await tree.insert(i);
                path = await tree.path(i - 1);
                let isKnown = await merkleTreeWithHistory.isKnownRoot((0, sdk_core_1.toFixedHex)(path.merkleRoot));
                assert(isKnown);
            }
            TruffleAssert.passes(await merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(42), { from: sender }));
            // check outdated root
            let isKnown = await merkleTreeWithHistory.isKnownRoot((0, sdk_core_1.toFixedHex)(path.merkleRoot));
            assert(isKnown);
        });
        it('should not return uninitialized roots', async () => {
            TruffleAssert.passes(await merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(42), { from: sender }));
            let isKnown = await merkleTreeWithHistory.isKnownRoot((0, sdk_core_1.toFixedHex)(0));
            assert(!isKnown);
        });
    });
    describe('#insertions using deposit commitments', async () => {
        it('should rebuild root correctly between native and contract', async () => {
            const merkleTreeWithHistory = await MerkleTreeWithHistory.new(levels, hasherInstance.contract.address);
            const commitment = '0x0101010101010101010101010101010101010101010101010101010101010101';
            await tree.insert(commitment);
            const { merkleRoot, pathElements, pathIndices } = await tree.path(0);
            await merkleTreeWithHistory.insert((0, sdk_core_1.toFixedHex)(commitment), { from: sender });
            const rootFromContract = await merkleTreeWithHistory.getLastRoot();
            assert.strictEqual((0, sdk_core_1.toFixedHex)(merkleRoot), rootFromContract.toString());
            let curr = commitment;
            for (var i = 0; i < pathElements.length; i++) {
                let elt = pathElements[i];
                let side = pathIndices[i];
                if (side === 0) {
                    let contractResult = await hasherInstance.contract.hashLeftRight(curr, elt);
                    curr = contractResult.toString();
                }
                else {
                    let contractResult = await hasherInstance.contract.hashLeftRight(elt, curr);
                    curr = contractResult.toString();
                }
            }
            assert.strictEqual(BigInt(curr).toString(), merkleRoot.toString());
        });
    });
});
