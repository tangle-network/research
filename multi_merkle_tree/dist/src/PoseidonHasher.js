"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoseidonHasher = void 0;
const contracts_1 = require("@webb-tools/contracts");
class PoseidonHasher {
    constructor(contract) {
        this.contract = contract;
    }
    static async createPoseidonHasher(signer) {
        const poseidonT3LibraryFactory = new contracts_1.PoseidonT3__factory(signer);
        const poseidonT3Library = await poseidonT3LibraryFactory.deploy();
        await poseidonT3Library.deployed();
        const poseidonT4LibraryFactory = new contracts_1.PoseidonT4__factory(signer);
        const poseidonT4Library = await poseidonT4LibraryFactory.deploy();
        await poseidonT4Library.deployed();
        const poseidonT6LibraryFactory = new contracts_1.PoseidonT6__factory(signer);
        const poseidonT6Library = await poseidonT6LibraryFactory.deploy();
        await poseidonT6Library.deployed();
        const libraryAddresses = {
            ['contracts/hashers/Poseidon.sol:PoseidonT3']: poseidonT3Library.address,
            ['contracts/hashers/Poseidon.sol:PoseidonT4']: poseidonT4Library.address,
            ['contracts/hashers/Poseidon.sol:PoseidonT6']: poseidonT6Library.address,
        };
        const factory = new contracts_1.PoseidonHasher__factory(libraryAddresses, signer);
        const contract = await factory.deploy();
        await contract.deployed();
        const hasher = new PoseidonHasher(contract);
        return hasher;
    }
    static async connect(hasherAddress, signer) {
        const hasherContract = contracts_1.PoseidonHasher__factory.connect(hasherAddress, signer);
        const hasher = new PoseidonHasher(hasherContract);
        return hasher;
    }
}
exports.PoseidonHasher = PoseidonHasher;
