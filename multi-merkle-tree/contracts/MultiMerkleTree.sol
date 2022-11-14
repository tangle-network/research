/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

pragma solidity ^0.8.0;

import "./MerkleTree.sol";

contract MultiMerkleTree {
    MerkleTree[] public subtrees;
    uint public currTreeIndex;
    constructor(uint32 _levels, IHasher _hasher) {
        require(_levels > 0, "_levels should be greater than zero");
        require(_levels < 5, "_levels should be less than 5"); 
        levels = _levels;
        hasher = _hasher;

        for (uint32 i = 0; i < _levels; i++) {
            filledSubtrees[i] = hasher.zeros(i);
        }

        roots[0] = Root(hasher.zeros(_levels - 1), 0);
    }

    function _insert(bytes32 _leaf) internal returns (uint32 index) {
        subtrees[currTreeIndex].insert(_leaf);
    }

    // Modified to insert pairs of leaves for better efficiency
    // Disclaimer: using this function assumes both leaves are siblings.
    function _insertTwo(bytes32 _leaf1, bytes32 _leaf2) internal returns (uint32 index) {
        subtrees[currTreeIndex].insertTwo(_leaf1, _leaf2);
    }

    /**
        @dev Whether the root is present in the subtrees
    */
    function isKnownRoot(bytes32 _root) public view returns (bool) {
        if (_root == 0) {
            return false;
        }
        for (uint32 i = 0; i < levels; i++) {
            if (_root == subtrees[i].root) {
                return true;
            }
        }
        return false;
    }

    /**
        @dev Returns the last root
    */
    function getSubtreeRoot(uint256 _subtreeId) public view returns (bytes32) {
        return subtrees[_subtreeId].root;
    }

    function _initialize() internal {}
}
