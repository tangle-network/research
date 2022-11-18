# Cross-Chain Multi-Asset Shielded Pool (MASP) Notes

Recall that a cross-chain multi-asset shielded pool (MASP) consists of Merkle forests, which in turn contain Merkle trees whose leaves are UTXO commitments. We call these Merkle forests as UTXO commitment forests. For now, we will represent a UTXO by the generic `UTXO Data Blob`. The UTXO commitment is then `Poseidon(UTXO Data Blob)`. 

A user spends a UTXO by submitting a valid zero-knowledge proof that the corresponding UTXO commitment is in one-of-many UTXO commitment forests. 

## Private Spending Keys
The first desiderata of our system is that each UTXO has a single owner and only that owner can spend the UTXO. This is the same desiderata of the Bitcoin UTXO system, in which ownership of a UTXO is represented by a private/public key pair.

We can indeed do the same and associate with each UTXO a private/public key pair, known as a private/public spending key. A user can spend a UTXO if and only if it is in possession of its associated private spending key. Note a single spending key pair can be associated with multiple UTXOs.

Next, we discuss how to generate private spending keys. Some desiderata for spending keys are:
- A user may want to control multiple spending key pairs, for instance, if they want to have one MASP account for their WBTC transactions and one MASP account for their WETH transactions.
- It should be possible to recover the spending keys, if they are lost.

The above two desiderata and in general, the desire for a convenient user experience, suggest using [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) and [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki).

- Deterministically generating an extended private key from a seed, from which multiple private spending keys for different accounts can be deterministically generated.
- The seed from which the extended private key is generated can be an Ethereum signature. So, a user's private spending keys can be recovered so long as it does not lose its Ethereum keys.
- Compatibility with existing hardware wallets.

Note: BIP32 generates a tree of private/public key pairs, but we are only interested in the private keys (which we use as the private spending keys). Our formula for deriving public spending keys from private spending keys is different from that of Bitcoin (and described in the section below).

## Public Spending Keys, Verifiable Viewing Keys, Ephemeral Keys, and Nullifiers
Each spending key pair has associated with it a full viewing key pair. A user possessing a private full viewing key can view the details (transaction amount, etc.) of any transaction associated with the corresponding spending key pair. 

So, the question is: how do we compute the full viewing key pair and use it to view transaction details? Let's address the second part of the question first. Suppose we have a private full viewing private key $n$. The associated public full viewing key is $n \cdot G$, where $G$ is a generator of some elliptic curve group.  

Note: a later version of these notes may upgrade to allow for [incoming, outgoing, and full viewing keys](https://protocol.penumbra.zone/main/protocol/addresses_keys/viewing_keys.html). 

Verifiable viewing keys via Poseidon encryption.

## Delegatable Proofs via Spend Authorizing Signatures and Proof Authorizing Key

## `UTXO Data Blob`

## Unshielding, Support Contract Calls, Reshielding 

## Detection, clue keys from Penumbra

## More on `assetId`s

## What Curves to Use?
Check Grumpkin curve.



