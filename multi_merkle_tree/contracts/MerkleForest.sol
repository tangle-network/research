/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

pragma solidity ^0.8.0;

import "./Verifier.sol";
import "./LinkableIncrementalBinaryTree.sol";

contract MerkleForest {
    using LinkableIncrementalBinaryTree for LinkableIncrementalTreeData;

    /// @dev Gets a group id and returns the group/tree data.
    mapping(uint256 => LinkableIncrementalTreeData) internal subtrees;
    LinkableIncrementalTreeData internal merkleForest;


    // MerkleTree[] public subtrees;
    Verifier public verifier;

    // bytes32[] public leaves;
    constructor(uint32 _group_levels, uint32 _subtree_levels, Verifier _verifier) {
        require(_group_levels > 0, "_group_levels should be greater than zero");
        require(_subtree_levels > 0, "_subtree_levels should be greater than zero");
        require(_group_levels < 32, "_group_levels should be less than 32");
        require(_subtree_levels < 32, "_subtree_levels should be less than 32");
        verifier = _verifier;

        for (uint32 i = 0; i <  _group_levels; i++) {
            subtrees[i].init(_subtree_levels);
        }
        merkleForest.init(_group_levels);
    }

    function insertSubtree(uint32 _subtreeId, bytes32 _leaf) public returns (uint) {
        subtrees[_subtreeId].insert(uint(_leaf));
        uint newLeaf = subtrees[_subtreeId].getLastRoot();
        merkleForest.update(_subtreeId, newLeaf);
        return merkleForest.getLastRoot();
    }
    /**
        @dev Whether the root is present in any of the subtree's history
    */
    function isKnownSubtreeRoot(bytes32 _root, uint _subtreeId) public view returns (bool) {
        return subtrees[_subtreeId].isKnownRoot(uint(_root));
    }

    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) public returns (bool) {
        return verifier.verifyProof(a, b, c, input);
    }

    /**
        @dev Whether the root is present in any of the subtree's history
    */
    function getLastSubtreeRoot(uint256 _subtreeId) public view returns (uint) {
        return subtrees[_subtreeId].getLastRoot();
    }
}
