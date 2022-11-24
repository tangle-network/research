/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

pragma solidity ^0.8.0;

import "./MerkleTreeWithHistory.sol";
import "./MerkleTree.sol";
import "./Verifier.sol";
import "hardhat/console.sol";

contract MultiMerkleTree is MerkleTreeWithHistory {
    MerkleTree[] public subtrees;
    Verifier public verifier;
    // bytes32[] public leaves;
    constructor(uint32 _group_levels, uint32 _subtree_levels, IHasher _hasher, Verifier _verifier) {
        require(_group_levels > 0, "_group_levels should be greater than zero");
        require(_subtree_levels > 0, "_subtree_levels should be greater than zero");
        require(_group_levels + _subtree_levels < 32, "_group_levels +_subtree_levels should be less than 32");
        levels = _group_levels;
        hasher = _hasher;
        verifier = _verifier;

        for (uint32 i = 0; i < _group_levels; i++) {
            filledSubtrees[i] = hasher.zeros(i);
        }
        for (uint32 i = 0; i <  _group_levels; i++) {
            subtrees.push(new MerkleTree(_subtree_levels, _hasher));
        }

        roots[0] = Root(hasher.zeros(_group_levels - 1), 0);
    }

    /**
        @dev Hash 2 tree leaves
    */
    function hashLeftRight(
        IHasher _hasher,
        bytes32 _left,
        bytes32 _right
    ) override public view returns (bytes32) {
        return bytes32(_hasher.hashLeftRight(uint256(_left), uint256(_right)));
    }

    function insertSubtree(uint32 _subtreeId, bytes32 _leaf) public returns (bytes32) {
        subtrees[_subtreeId]._insert(_leaf);
        bytes32 newRoot = subtrees[_subtreeId].getLastRoot();
        _update(_subtreeId, newRoot);
        return getLastRoot();
        // if (leaves.length <= _subtreeId) {
        //     leaves.push(newRoot);
        // } else {
        //     leaves[_subtreeId] = newRoot;
        // }
    }
    /**
        @dev Whether the root is present in any of the subtree's history
    */
    function isKnownSubtreeRoot(bytes32 _root) public view returns (bool) {
        if (_root == 0) {
            return false;
        }
        for (uint32 i = 0; i < levels; i++) {
            if (subtrees[i].isKnownRoot(_root)) {
                return true;
            }
        }
        return false;
    }

    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) public view returns (bool) {
        return verifier.verifyProof(a, b, c, input);
    }

    // function getLeaf(uint256 _leafId) public view returns (bytes32) {
    //     if (_leafId >= leavesolength) {
    //         return hasher.zeros(0);
    //     }
    //     else {
    //         return leaves[_leafId];
    //     }
    // }

    /**
        @dev Whether the root is present in any of the subtree's history
    */
    function getLastSubtreeRoot(uint256 _subtreeId) public view returns (bytes32) {
        return subtrees[_subtreeId].getLastRoot();
    }
}
