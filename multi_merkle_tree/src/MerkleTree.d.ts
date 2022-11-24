import { BigNumber, BigNumberish } from 'ethers';
declare function poseidonHash(left: BigNumberish, right: BigNumberish): BigNumber;
export type MerkleProof = {
    element: BigNumber;
    merkleRoot: BigNumber;
    pathElements: BigNumber[];
    pathIndices: number[];
};
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
export declare class MerkleTree {
    levels: number;
    capacity: number;
    _hash: (left: BigNumberish, right: BigNumberish) => BigNumber;
    zeroElement: BigNumber;
    _zeros: BigNumber[];
    _layers: BigNumber[][];
    /**
     * Constructor
     * @param levels - Number of levels in the tree
     * @param elements - BigNumberish[] of initial elements
     * @param options - Object with the following properties:
     *    hashFunction - Function used to hash 2 leaves
     *    zeroElement - Value for non-existent leaves
     */
    constructor(levels: number | string, elements?: BigNumberish[], { hashFunction, zeroElement }?: {
        hashFunction?: typeof poseidonHash;
        zeroElement?: BigNumberish;
    });
    _rebuild(): void;
    /**
     * Get tree root
     * @returns
     */
    root(): BigNumber;
    /**
     * Insert new element into the tree
     * @param element - Element to insert
     */
    insert(element: BigNumberish): void;
    bulkRemove(elements: BigNumberish[]): void;
    remove(element: BigNumberish): void;
    removeByIndex(index: number): void;
    /**
     * Insert multiple elements into the tree.
     * @param elements - Elements to insert
     */
    bulkInsert(elements: BigNumberish[]): void;
    /**
     * Change an element in the tree
     * @param index - Index of element to change
     * @param element - Updated element value
     */
    update(index: number, element: BigNumberish): void;
    /**
     * Get merkle path to a leaf
     * @param index - Leaf index to generate path for
     * @returns pathElements: Object[], pathIndex: number[] - An object containing adjacent elements and left-right index
     */
    path(index: number): MerkleProof;
    /**
     * Find an element in the tree
     * @param element - An element to find
     * @returns number - Index if element is found, otherwise -1
     */
    indexOf(element: BigNumberish): number;
    /**
     * Returns a copy of non-zero tree elements
     * @returns Object[]
     */
    elements(): BigNumber[];
    /**
     * Returns a copy of n-th zero elements array
     * @returns Object[]
     */
    zeros(): BigNumber[];
    /**
     * Serialize entire tree state including intermediate layers into a plain object
     * Deserializing it back will not require to recompute any hashes
     * Elements are not converted to a plain type, this is responsibility of the caller
     */
    serialize(): {
        _layers: BigNumber[][];
        _zeros: BigNumber[];
        levels: number;
    };
    number_of_elements(): number;
    getIndexByElement(element: BigNumberish): number;
    /**
     * Deserialize data into a MerkleTree instance
     * Make sure to provide the same hashFunction as was used in the source tree,
     * otherwise the tree state will be invalid
     */
    static deserialize(data: any, hashFunction: any): any;
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
    static createTreeWithRoot(levels: number, leaves: string[], targetRoot: string): MerkleTree | undefined;
    /**
     * This function calculates the desired index given the pathIndices
     *
     * @param pathIndices - an array of (0, 1) values representing (left, right) selection
     * of nodes for each level in the merkle tree. The leaves level of the tree is at index 0
     * and the root of the tree is at index 'levels'
     */
    static calculateIndexFromPathIndices(pathIndices: number[]): number;
}
export {};
