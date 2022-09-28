import { initGemFarm } from "./gemfarm";
import {Keypair, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import { fetchFarmer } from "./staker";
import env from "react-dotenv";
import {isKp} from "@gemworks/gem-farm-ts";
import {sendTransaction, sendTransactionWithRetry} from "./connection";
import * as bs58 from "bs58";

export async function claim(farm, connection, wallet) {
    // console.log("farm: ", farm)
    let gf = await initGemFarm(connection, wallet)
    //console.log("gf is: ", gf)
    const farmAcc = await gf.fetchFarmAcc(new PublicKey(env.farm_id));
    await gf.claimWallet(
        new PublicKey(env.farm_id),
        new PublicKey(farmAcc.rewardA.rewardMint),
        new PublicKey(farmAcc.rewardB.rewardMint)
    );
    //await fetchFarmer();
};

export async function refreshFarmerWallet(farm,farmerIdentity,connection, wallet) {
    let gf = await initGemFarm(connection, wallet)
    // let instructions = []
    const instruction = await gf.refreshFarmerWalletInstruction(farm,farmerIdentity)

    //
    let transaction = new  Transaction();

    transaction.add(instruction);



    const keypair = Keypair.fromSecretKey(
        bs58.decode(env.refresh_farmer_wallet_secretKey)
    );
    // const keypair1 = Keypair.generate();
    const publicKey = new PublicKey(env.refresh_farmer_wallet_publicKey);
    if(keypair.publicKey.toBase58() === publicKey.toBase58()){
       return await connection.sendTransaction(transaction,[keypair])
    }else{
        console.log(keypair.publicKey.toBase58())
        console.log( publicKey.toBase58())
        throw new Error(`keypair != publicKey`);
    }



    // console.log("发送交易")
    // return instructions_transaction

}
