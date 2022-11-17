/**
 * Copyright 2021 Webb Technologies
 * SPDX-License-Identifier: GPL-3.0-or-later-only
 */

pragma solidity ^0.8.0;

/*
 * Hasher interface for hashing 2 uint256 elements.
 */
interface IHasher {
    function poseidon(
        uint256[2] memory
    ) external view returns (uint256);
}
