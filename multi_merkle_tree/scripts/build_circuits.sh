#!/bin/bash
#
ptau=./powersOfTau28_hez_final_22.ptau

compile () {
    local outdir="$1" circuit="$2" size="$3"
    mkdir -p build/$outdir
    mkdir -p artifacts/circuits/$outdir
    echo ./circuits/"$circuit"_"$size".circom
    echo circuits/"$circuit"_"$size".circom;
    circom --r1cs --wasm --sym \
        -o artifacts/circuits/"$circuit"_"$size" \
        circuits/"$circuit"_"$size".circom;
    echo -e "Done!\n"
}
compile_phase2 () {
    local outdir="$1" circuit="$2" pathToCircuitDir="$3"
    echo $outdir;
    mkdir -p $outdir;

    echo "Setting up Phase 2 ceremony for $circuit"
    echo "Outputting circuit_final.zkey and verifier.sol to $outdir"

    npx snarkjs groth16 setup "$pathToCircuitDir/$circuit.r1cs" $ptau "$outdir/circuit_0000.zkey"
    echo "test" | npx snarkjs zkey contribute "$outdir/circuit_0000.zkey" "$outdir/circuit_0001.zkey" --name"1st Contributor name" -v
    npx snarkjs zkey verify "$pathToCircuitDir/$circuit.r1cs" $ptau "$outdir/circuit_0001.zkey"
    npx snarkjs zkey beacon "$outdir/circuit_0001.zkey" "$outdir/circuit_final.zkey" 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"
    npx snarkjs zkey verify "$pathToCircuitDir/$circuit.r1cs" $ptau "$outdir/circuit_final.zkey"
    npx snarkjs zkey export verificationkey "$outdir/circuit_final.zkey" "$outdir/verification_key.json"  

    npx snarkjs zkey export solidityverifier "$outdir/circuit_final.zkey" $outdir/verifier.sol
    echo "Done!\n"
}

move_verifier() {
    local indir="$1"
    cp $indir/verifier.sol contracts/"Verifier.sol"
}

for i in 1 2 # 3 4 5 10 20 30 40 50 75 100
do
    echo "compiling multi-merkle-tree $i"
    compile merkle_proof_test_$i merkle_proof_test $i
    compile_phase2 ./build/merkle_proof_test_$i/ merkle_proof_test_$i ./artifacts/circuits/merkle_proof_test_$i/
    move_verifier ./build/merkle_proof_test_$i
done
#

