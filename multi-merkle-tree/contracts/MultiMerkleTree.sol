/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

pragma solidity ^0.8.0;

import "./MerkleTree.sol";
import "./Verifier.sol";

contract MultiMerkleTree is MerkleTree {
    MerkleTree[] public subtrees;

    uint32 public currTreeIndex;

    Verifier public verifier;

    constructor(uint32 _group_levels, uint32 _tree_levels, IHasher _hasher, Verifier _verifier) 
		MerkleTree (_group_levels, _hasher)
    {
        require(_tree_levels > 0, "_levels should be greater than zero");
        require(_tree_levels < 32, "_levels should be less than 32"); 
        levels = _group_levels;
        verifier = _verifier;

        for (uint32 i = _tree_levels; i < _tree_levels + _group_levels; i++) {
            filledSubtrees[i] = hasher.zeros(i);
        }
        subtrees.push(new MerkleTree(_tree_levels, _hasher));
        currTreeIndex = 0;

        roots[0] = Root(hasher.zeros(_group_levels + _tree_levels - 1), 0);
    }

    function _insertSubtree(bytes32 _leaf) internal returns (uint32 index) {
        _insertSubtree(currTreeIndex, _leaf);
        return currTreeIndex;
    }
    function _insertSubtree(uint32 _subtreeId, bytes32 _leaf) internal {
    // function _insert(uint32 _subtreeId, bytes32 _leaf) internal returns (uint32 index) {
        subtrees[_subtreeId]._insert(_leaf);
        _update(_subtreeId, _leaf);
        // return _subtreeId;
    }

    /**
        @dev Whether the root is present in the subtrees
    */
    function isKnownMerkleTree(bytes32 _subtreeRoot) public view returns (bool) {
        if (_subtreeRoot == 0) {
            return false;
        }
        for (uint32 i = 0; i < levels; i++) {
            if (_subtreeRoot == subtrees[i].getLastRoot()) {
                return true;
            }
        }
        return false;
    }

    /**
        @dev Returns the last root
    */
    function getSubtreeRoot(uint256 _subtreeId) public view returns (bytes32) {
        return subtrees[_subtreeId].getLastRoot();
    }

    function verifyProof(
            uint[2] memory _a,
            uint[2][2] memory _b,
            uint[2] memory _c,
            uint[2] memory _input
    ) public view returns (bool) {
        // TODO: check if roots are valid inside contract
        bool is_valid = verifier.verifyProof(_a, _b, _c, _input);
        return is_valid;
    }
    /**
        @dev Verifies zk circuit generated proof
    */
    function getSubtreeRoot(uint256 _subtreeId) public view returns (bytes32) {
        return subtrees[_subtreeId].getLastRoot();
    }
}
