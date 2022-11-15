/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

pragma solidity ^0.8.0;

import "./MerkleTree.sol";

contract MultiMerkleTree is MerkleTree {
    MerkleTree[] public subtrees;

    uint public currTreeIndex;
    mapping(uint256 => bytes32) public filledSubtrees;

    IHasher public hasher;

    constructor(uint32 _group_levels, uint32 _tree_leaves, IHasher _hasher) 
		MerkleTree (_group_levels, _hasher)
    {
        require(_tree_leaves > 0, "_levels should be greater than zero");
        require(_tree_leaves < 32, "_levels should be less than 32"); 
        levels = _group_levels;
        hasher = _hasher;

        for (uint32 i = _tree_leaves; i < _tree_leaves + _group_levels; i++) {
            filledSubtrees[i] = hasher.zeros(i);
        }
        subtrees.push(MerkleTree(_tree_leaves, _hasher));
        currTreeIndex = 0;

        roots[0] = Root(hasher.zeros(_group_levels + _tree_levels - 1), 0);
    }

    function _insert(bytes32 _leaf) internal returns (uint32 index) {
        _insert(currTreeIndex, _leaf);
        return currTreeIndex;
    }
    function _insert(uint32 _subtreeId, bytes32 _leaf) internal {
    // function _insert(uint32 _subtreeId, bytes32 _leaf) internal returns (uint32 index) {
        subtrees[_subtreeId].insert(_leaf);
        _update(_subtreeId, _leaf);
        // return _subtreeId;
    }

    // // Modified to insert pairs of leaves for better efficiency
    // // Disclaimer: using this function assumes both leaves are siblings.
    // function _insertTwo(bytes32 _leaf1, bytes32 _leaf2) internal returns (uint32 index) {
    //     subtrees[currTreeIndex].insertTwo(_leaf1, _leaf2);
    // }

    /**
        @dev Whether the root is present in the subtrees
    */
    function isKnownMerkleTree(bytes32 _subtreeRoot) public view returns (bool) {
        if (_subtreeRoot == 0) {
            return false;
        }
        for (uint32 i = 0; i < levels; i++) {
            if (_subtreeRoot == subtrees[i].root) {
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
