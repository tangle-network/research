/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

pragma solidity ^0.8.0;

import "./MerkleTreeWithHistory.sol";
import "./MerkleTree.sol";
import "hardhat/console.sol";

contract MultiMerkleTree is MerkleTreeWithHistory {
    MerkleTree[] public subtrees;
    constructor(uint32 _group_levels, uint32 _subtree_levels, IHasher _hasher) {
        require(_group_levels > 0, "_group_levels should be greater than zero");
        require(_subtree_levels > 0, "_subtree_levels should be greater than zero");
        require(_group_levels + _subtree_levels < 32, "_group_levels +_subtree_levels should be less than 32");
        levels = _group_levels;
        hasher = _hasher;
        // console.log("levels: %s", levels);
        // console.log("hasher: %s", address(hasher));
        // console.log("hasher zeros(0): %d", uint256(hasher.zeros(0)));
        // console.log("hasher zeros(1): %d", uint256(hasher.zeros(1)));

        for (uint32 i = 0; i < _group_levels; i++) {
            filledSubtrees[i] = hasher.zeros(i+_subtree_levels);
            // console.log("%d: filledSubtrees(i): %d", i, uint256(filledSubtrees[i]));
            // console.log("%d: zeros(i): %d", i,  uint256(hasher.zeros(i)));
        }
        // console.log("filledSubtrees(0): %d", uint256(filledSubtrees[0]));
        // console.log("filledSubtrees(1): %d", uint256(filledSubtrees[1]));
        for (uint32 i = 0; i <  _group_levels; i++) {
            subtrees.push(new MerkleTree(_subtree_levels, _hasher));
        }

        roots[0] = Root(hasher.zeros(_subtree_levels + _group_levels - 1), 0);
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

    function insertSubtree(uint32 _subtreeId, bytes32 _leaf) public returns (uint32 index) {
        subtrees[_subtreeId]._insert(_leaf);
        _update(_subtreeId, subtrees[_subtreeId].getLastRoot());
    }
    /**
        @dev Whether the root is present in any of the subtree's history
    */
    function isKnownSubtreeRoot(bytes32 _root) public view returns (bool) {
        if (_root == 0) {
            return false;
        }
        uint32 _currentRootIndex = currentRootIndex;
        for (uint32 i = 0; i < levels; i++) {
            if (subtrees[i].isKnownRoot(_root)) {
                return true;
            }
        }
        return false;
    }

    /**
        @dev Whether the root is present in any of the subtree's history
    */
    function getLastSubtreeRoot(uint256 _subtreeId) public view returns (bytes32) {
        return subtrees[_subtreeId].getLastRoot();
    }
}
