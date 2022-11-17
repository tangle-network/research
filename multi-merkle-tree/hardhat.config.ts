import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { subtask } from 'hardhat/config';

import poseidonContract from 'circomlibjs/src/poseidon_gencontract.js';

const buildPoseidon = async (numInputs: number) => {
    //@ts-ignore
    await overwriteArtifact(`PoseidonT${numInputs + 1}`, poseidonContract.createCode(numInputs));
};

subtask('typechain-generate-types', async (taskArgs, hre, runSuper) => {
    // overwrite the artifact before generating types
    await buildPoseidon(2);
    await runSuper();
});

const config: HardhatUserConfig = {
    solidity: "0.8.17",
};

export default config;
