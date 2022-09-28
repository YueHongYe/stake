import { initGemFarm } from "./gemfarm";
import { initGemBank } from './gemBank';
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import env from "react-dotenv";
import { fetchFarn, fetchFarmer, beginStaking } from "./staker";
import { sendTransactionWithRetry } from "./connection";

export async function superUnstakeMover(nfts, connection, wallet) {
    try {
        let gf = await initGemFarm(connection, wallet)
        let gb = await initGemBank(connection, wallet)
        const farm = new PublicKey(env.farm_id);
        const farmAcc = await fetchFarn(connection, wallet)
        const bank = farmAcc.bank
        console.log("bank: ", bank)
        const farmerAcc = await fetchFarmer(connection, wallet)
        const vault = farmerAcc.farmerAcc.vault
        console.log("vault: ", vault)
        console.log("gemsStaked number:", farmerAcc.farmerAcc.gemsStaked.toString())
        console.log("farmerState:", farmerAcc.farmerState)
        console.log("nfts:", nfts)

        if (Number(farmerAcc.farmerAcc.gemsStaked) === nfts.length) {
            const instructions = [];

            instructions.push(await gf.endStakeInstruction(farm, wallet.publicKey))
            instructions.push(await gf.endStakeInstruction(farm, wallet.publicKey))
            for (const nft of nfts) {
                instructions.push(await gb.withdrawGemWalletInstructions(bank, vault, new BN(1), nft.mint, wallet.publicKey))
            }
            const instructions_transaction = await sendTransactionWithRetry(connection, wallet, instructions, [])

            console.log("instructions transaction :", instructions_transaction)
            console.log("ended staking for: ", nfts)
        }
        else if (Number(farmerAcc.farmerAcc.gemsStaked) != nfts.length && farmerAcc.farmerState === "staked" && Number(farmerAcc.farmerAcc.gemsStaked) > nfts.length) {
            console.log("farmer has more than 1 gem staked. Pausing stake")
            // const endStakeResult = await endStaking(gf,gb,wallet,connection,bank,vault)
            // const withdrawResult = await withdrawNftsOnChain(nfts, gb, bank, vault)
            const instructions = [];

            instructions.push(await gf.endStakeInstruction(farm, wallet.publicKey))
            instructions.push(await gf.endStakeInstruction(farm, wallet.publicKey))
            for (const nft of nfts) {
                instructions.push(await gb.withdrawGemWalletInstructions(bank, vault, new BN(1), nft.mint, wallet.publicKey))
            }
            instructions.push(await gf.getStakeInstruction(farm, wallet.publicKey))
            const instructions_transaction = await sendTransactionWithRetry(connection, wallet, instructions, [])

            console.log("instructions transaction :", instructions_transaction)
            console.log("resuming stake.")
            // const stakeResult = await beginStaking(gf)
        }
        else if (farmerAcc.farmerState === "pendingCooldown") {
            const instructions = [];
            instructions.push(await gf.endStakeInstruction(farm, wallet.publicKey))
            for (const nft of nfts) {
                instructions.push(await gb.withdrawGemWalletInstructions(bank, vault, new BN(1), nft.mint, wallet.publicKey))
            }
            const instructions_transaction = await sendTransactionWithRetry(connection, wallet, instructions, [])

            console.log("instructions transaction :", instructions_transaction)
            console.log("end pendingCooldown for:", nfts)
        }
        else {
            console.log("farmer stake amount not equal to 1")
            console.log("stake amount: ", farmerAcc.farmerAcc.gemsStaked.toString())
        }
    } catch (e) {
        console.log(e);
    }
}

export async function endStaking(gf) {
    const endStakeResults_1 = await gf.unstakeWallet(new PublicKey(env.farm_id));
    //calling a second time ends cooldown period
    const endStakeResults_2 = await gf.unstakeWallet(new PublicKey(env.farm_id));
}


const withdrawGem = async (mint, bank, vault, gb) => {
    const { txSig } = await gb.withdrawGemWallet(
        bank,
        vault,
        new BN(1),
        mint
    );
    console.log('withdrawal done', txSig);
};

export async function withdrawNftsOnChain(nft, gb, bank, vault) {

    // const gemsResult = await addGems(nftArray, gf)
    // console.log("gemsResult: ", gemsResult)


    await withdrawGem(nft.mint, bank, vault, gb);

}