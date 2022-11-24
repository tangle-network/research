"use strict";
// Copyright (C) 2022 Tornado Cash.
// SPDX-License-Identifier: Apache-2.0
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerkleTree = void 0;
// Copyright 2022 Webb Technologies Inc.
// SPDX-License-Identifier: Apache-2.0
// This file has been modified by Webb Technologies Inc.
var circomlibjs_1 = require("circomlibjs");
var ethers_1 = require("ethers");
var sdk_core_1 = require("@webb-tools/sdk-core");
var DEFAULT_ZERO = '21663839004416932945382355908790599225266501822907911457504978515578255421292';
function poseidonHash(left, right) {
    return ethers_1.BigNumber.from((0, circomlibjs_1.poseidon)([ethers_1.BigNumber.from(left), ethers_1.BigNumber.from(right)]));
}
/**
      * hash(h1, h2)
                 /  \
hash(left1, right1) | hash(left2, right2)
  /  \                   /     \
left1 right1       |   left2 right2

  */
/**
 * Merkle tree
 */
var MerkleTree = /** @class */ (function () {
    /**
     * Constructor
     * @param levels - Number of levels in the tree
     * @param elements - BigNumberish[] of initial elements
     * @param options - Object with the following properties:
     *    hashFunction - Function used to hash 2 leaves
     *    zeroElement - Value for non-existent leaves
     */
    function MerkleTree(levels, elements, _a) {
        if (elements === void 0) { elements = []; }
        var _b = _a === void 0 ? {} : _a, _c = _b.hashFunction, hashFunction = _c === void 0 ? poseidonHash : _c, _d = _b.zeroElement, zeroElement = _d === void 0 ? DEFAULT_ZERO : _d;
        levels = Number(levels);
        this.levels = levels;
        this.capacity = Math.pow(2, levels);
        if (elements.length > this.capacity) {
            throw new Error('Tree is full');
        }
        this._hash = hashFunction;
        this.zeroElement = ethers_1.BigNumber.from(zeroElement);
        this._zeros = [];
        this._zeros[0] = ethers_1.BigNumber.from(zeroElement);
        for (var i = 1; i <= levels; i++) {
            this._zeros[i] = this._hash(this._zeros[i - 1], this._zeros[i - 1]);
        }
        this._layers = [];
        this._layers[0] = elements.slice().map(function (e) { return ethers_1.BigNumber.from(e); });
        this._rebuild();
    }
    MerkleTree.prototype._rebuild = function () {
        for (var level = 1; level <= this.levels; level++) {
            this._layers[level] = [];
            for (var i = 0; i < Math.ceil(this._layers[level - 1].length / 2); i++) {
                this._layers[level][i] = this._hash(this._layers[level - 1][i * 2], i * 2 + 1 < this._layers[level - 1].length
                    ? this._layers[level - 1][i * 2 + 1]
                    : this._zeros[level - 1]);
            }
        }
    };
    /**
     * Get tree root
     * @returns
     */
    MerkleTree.prototype.root = function () {
        return this._layers[this.levels].length > 0 ? this._layers[this.levels][0] : this._zeros[this.levels - 1];
    };
    /**
     * Insert new element into the tree
     * @param element - Element to insert
     */
    MerkleTree.prototype.insert = function (element) {
        if (this._layers[0].length >= this.capacity) {
            throw new Error('Tree is full');
        }
        this.update(this._layers[0].length, ethers_1.BigNumber.from(element));
    };
    MerkleTree.prototype.bulkRemove = function (elements) {
        var e_1, _a;
        try {
            for (var elements_1 = __values(elements), elements_1_1 = elements_1.next(); !elements_1_1.done; elements_1_1 = elements_1.next()) {
                var elem = elements_1_1.value;
                this.remove(elem);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (elements_1_1 && !elements_1_1.done && (_a = elements_1.return)) _a.call(elements_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    MerkleTree.prototype.remove = function (element) {
        var index = this.indexOf(element);
        if (index === -1) {
            throw new Error('Element is not in the merkle tree');
        }
        this.removeByIndex(index);
    };
    MerkleTree.prototype.removeByIndex = function (index) {
        this.update(index, this.zeroElement);
    };
    /**
     * Insert multiple elements into the tree.
     * @param elements - Elements to insert
     */
    MerkleTree.prototype.bulkInsert = function (elements) {
        if (this._layers[0].length + elements.length > this.capacity) {
            throw new Error('Tree is full');
        }
        // First we insert all elements except the last one
        // updating only full subtree hashes (all layers where inserted element has odd index)
        // the last element will update the full path to the root making the tree consistent again
        for (var i = 0; i < elements.length - 1; i++) {
            this._layers[0].push(ethers_1.BigNumber.from(elements[i]));
            var level = 0;
            var index = this._layers[0].length - 1;
            while (index % 2 === 1) {
                level++;
                index >>= 1;
                this._layers[level][index] = this._hash(this._layers[level - 1][index * 2], this._layers[level - 1][index * 2 + 1]);
            }
        }
        this.insert(elements[elements.length - 1]);
    };
    /**
     * Change an element in the tree
     * @param index - Index of element to change
     * @param element - Updated element value
     */
    MerkleTree.prototype.update = function (index, element) {
        if (isNaN(Number(index)) || index < 0 || index > this._layers[0].length || index >= this.capacity) {
            throw new Error('Insert index out of bounds: ' + index);
        }
        this._layers[0][index] = ethers_1.BigNumber.from(element);
        for (var level = 1; level <= this.levels; level++) {
            index >>= 1;
            this._layers[level][index] = this._hash(this._layers[level - 1][index * 2], index * 2 + 1 < this._layers[level - 1].length
                ? this._layers[level - 1][index * 2 + 1]
                : this._zeros[level - 1]);
        }
    };
    /**
     * Get merkle path to a leaf
     * @param index - Leaf index to generate path for
     * @returns pathElements: Object[], pathIndex: number[] - An object containing adjacent elements and left-right index
     */
    MerkleTree.prototype.path = function (index) {
        if (isNaN(Number(index)) || index < 0 || index >= this._layers[0].length) {
            throw new Error('Index out of bounds: ' + index);
        }
        var pathElements = [];
        var pathIndices = [];
        for (var level = 0; level < this.levels; level++) {
            pathIndices[level] = index % 2;
            pathElements[level] =
                (index ^ 1) < this._layers[level].length ? this._layers[level][index ^ 1] : this._zeros[level];
            index >>= 1;
        }
        return {
            element: this._layers[0][index],
            merkleRoot: this.root(),
            pathElements: pathElements,
            pathIndices: pathIndices
        };
    };
    /**
     * Find an element in the tree
     * @param element - An element to find
     * @returns number - Index if element is found, otherwise -1
     */
    MerkleTree.prototype.indexOf = function (element) {
        return this._layers[0].findIndex(function (el) { return el.eq(ethers_1.BigNumber.from(element)); });
    };
    /**
     * Returns a copy of non-zero tree elements
     * @returns Object[]
     */
    MerkleTree.prototype.elements = function () {
        return this._layers[0].slice();
    };
    /**
     * Returns a copy of n-th zero elements array
     * @returns Object[]
     */
    MerkleTree.prototype.zeros = function () {
        return this._zeros.slice();
    };
    /**
     * Serialize entire tree state including intermediate layers into a plain object
     * Deserializing it back will not require to recompute any hashes
     * Elements are not converted to a plain type, this is responsibility of the caller
     */
    MerkleTree.prototype.serialize = function () {
        return {
            _layers: this._layers,
            _zeros: this._zeros,
            levels: this.levels
        };
    };
    MerkleTree.prototype.number_of_elements = function () {
        return this._layers[0].length;
    };
    MerkleTree.prototype.getIndexByElement = function (element) {
        return this.indexOf(element);
    };
    /**
     * Deserialize data into a MerkleTree instance
     * Make sure to provide the same hashFunction as was used in the source tree,
     * otherwise the tree state will be invalid
     */
    MerkleTree.deserialize = function (data, hashFunction) {
        var instance = Object.assign(Object.create(this.prototype), data);
        instance._hash = hashFunction || circomlibjs_1.poseidon;
        instance.capacity = Math.pow(2, instance.levels);
        instance.zeroElement = instance._zeros[0];
        return instance;
    };
    /**
     * Create a merkle tree with the target root by inserting the given leaves
     * one-by-one.
     * If the root matches after an insertion, return the tree.
     * Else, return undefined.
     *
     * @param leaves - An array of ordered leaves to be inserted in a merkle tree
     * @param targetRoot - The root that the caller is trying to build a tree against
     * @returns MerkleTree | undefined
     */
    MerkleTree.createTreeWithRoot = function (levels, leaves, targetRoot) {
        if (leaves.length > Math.pow(2, levels)) {
            return undefined;
        }
        var tree = new MerkleTree(levels, []);
        for (var i = 0; i < leaves.length; i++) {
            tree.insert(leaves[i]);
            var nextRoot = tree.root();
            if ((0, sdk_core_1.toFixedHex)(nextRoot) === targetRoot) {
                return tree;
            }
        }
        return undefined;
    };
    /**
     * This function calculates the desired index given the pathIndices
     *
     * @param pathIndices - an array of (0, 1) values representing (left, right) selection
     * of nodes for each level in the merkle tree. The leaves level of the tree is at index 0
     * and the root of the tree is at index 'levels'
     */
    MerkleTree.calculateIndexFromPathIndices = function (pathIndices) {
        return pathIndices.reduce(function (value, isRight, level) {
            var addedValue = value;
            if (isRight) {
                addedValue = value + (Math.pow(2, level));
            }
            return addedValue;
        });
    };
    return MerkleTree;
}());
exports.MerkleTree = MerkleTree;
