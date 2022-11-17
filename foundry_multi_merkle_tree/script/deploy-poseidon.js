import { poseidon_gencontract } from "circomlibjs";
import { ethers } from "ethers";
import { toBuffer } from "ethereumjs-util";
import { strict as assert } from "assert";
import { writeFileSync } from "fs";

const encoder = ethers.utils.defaultAbiCoder;

const signer = process.argv[2];
// assert(sender === "1");
writeFileSync("poseidonLibAddress.txt", signer);

// async function deploy_poseidon_lib() {
    const poseidonBytecode = poseidon_gencontract.createCode(2);
//
//     const PoseidonLibFactory = new ethers.ContractFactory(
//         poseidonABI,
//         poseidonBytecode,
//         signer
//     );
//     // console.log("Deploying PoseidonLib...", PoseidonLibFactory);
//     const poseidonLib = await PoseidonLibFactory.deploy();
//     await poseidonLib.deployed();
//     console.error("Deployed PoseidonLib to", poseidonLib.address);
//     await poseidonLib.deployTransaction.wait();
//     return poseidonLib.address;
// }

process.stdout.write(
    ethers.utils.defaultAbiCoder.encode(["bytes32"], poseidon_gencontract.createCode(2))
);
