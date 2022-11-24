import { ethers } from 'ethers';
import { PoseidonHasher as PoseidonHasherContract } from '@webb-tools/contracts';
export declare class PoseidonHasher {
    contract: PoseidonHasherContract;
    constructor(contract: PoseidonHasherContract);
    static createPoseidonHasher(signer: ethers.Signer): Promise<PoseidonHasher>;
    static connect(hasherAddress: string, signer: ethers.Signer): Promise<PoseidonHasher>;
}
