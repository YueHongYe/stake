import { initGemFarm } from "./gemfarm";
import { initGemBank } from './gemBank';
import { BN } from '@project-serum/anchor';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import env from "react-dotenv";
import { stringifyPKsAndBNs } from '@gemworks/gem-farm-ts';
import {
    GemFarmClient
} from '@gemworks/gem-farm-ts';
import * as anchor from "@project-serum/anchor";
import { sendTransactionWithRetry } from "./connection";

// const network = "https://api.devnet.solana.com";
// const connection = new Connection(network, "confirmed");
// async function getProvider() {
//     /* create the provider and return it to the caller */
//     /* network set to local network for now */
//     const network = "https://api.devnet.solana.com";
//     const connection = new Connection(network, opts.preflightCommitment);

//     const provider = new Provider(
//         connection, wallet, opts.preflightCommitment,
//     );
//     return provider;
// }
// const provider = await getProvider()
// let gb = await initGemBank(connection, provider)
// const bank = ref < PublicKey > ();
// const vault = ref < PublicKey > ();
// const vaultAcc = ref < any > ();
// const gdrs = ref < PublicKey[] > ([]);
// const vaultLocked = ref < boolean > (false);


export async function fetchFarn(connection, wallet) {
    console.log("constructing farm")
    // console.log("received wallet ", wallet.publicKey.toBase58())
    let gf = await initGemFarm(connection, wallet)
    console.log("gf is: ", gf)
    const farmAcc = await gf.fetchFarmAcc(new PublicKey(env.farm_id));
    console.log(
        `farm found at ${env.farm_id}:`,
        stringifyPKsAndBNs(farmAcc)
    );
    return farmAcc
};

export async function fetchFarmer(connection, wallet) {
    let gf = await initGemFarm(connection, wallet);
    const [farmerPDA] = await gf.findFarmerPDA(
        new PublicKey(env.farm_id),
        wallet.publicKey
    );
    const farmer = {}
    farmer.farmerIdentity = wallet.publicKey?.toBase58();
    try {
        farmer.farmerAcc = await gf.fetchFarmerAcc(farmerPDA);
    } catch (e) {
        console.log(e)
    }
    farmer.farmerState = gf.parseFarmerState(farmer.farmerAcc);
    //await updateAvailableRewards();
    console.log(
        `farmer found at ${farmer.farmerIdentity}:`,
        stringifyPKsAndBNs(farmer.farmerAcc)
    );
    return farmer
};

export async function getFarmerDeets(connection, wallet) {
    let payload = []
    const farmDeets = await fetchFarn(connection, wallet)
    payload.push(farmDeets)
    const farmerDeets = await fetchFarmer(connection, wallet)
    payload.push(farmerDeets)
    console.log("payload: ", payload)
    return payload
}

export async function stakerMover(nfts, connection, wallet) {
    try {
        console.log("nfts:", nfts)
        const farm = new PublicKey(env.farm_id);
        let gb = await initGemBank(connection, wallet)
        let gf = await initGemFarm(connection, wallet)
        const farmAcc = await fetchFarn(connection, wallet)
        const bank = farmAcc.bank
        const [farmerPDA] = await gf.findFarmerPDA(
            new PublicKey(env.farm_id),
            wallet.publicKey
        );
        const farmerAcc = {}
        farmerAcc.farmerIdentity = wallet.publicKey?.toBase58();
        try {
            farmerAcc.farmerAcc = await gf.fetchFarmerAcc(farmerPDA);
        } catch (e) {
            console.log(e)
            if (e.toString().search("Error: Account does not exist") === 0) {
                console.log("initFarmerWallet")
                await gf.initFarmerWallet(new PublicKey(env.farm_id))
                farmerAcc.farmerAcc = await gf.fetchFarmerAcc(farmerPDA);
            }
        }
        farmerAcc.farmerState = gf.parseFarmerState(farmerAcc.farmerAcc);
        // const farmerAcc = await fetchFarmer(connection, wallet)
        const vault = farmerAcc.farmerAcc.vault

        const farmerState = farmerAcc.farmerState
        const gemsStaked = Number(farmerAcc.farmerAcc.gemsStaked)

        if (farmerState === "unstaked") {
            console.log("first staked")
            console.log("stake nfts:", nfts)
            const instructions = [];
            for (const nft of nfts) {
                const creator = new PublicKey(
                    //todo currently simply taking the 1st creator
                    nft.onchainMetadata.data.creators[0].address
                );
                instructions.push(await gf.getDepositGemInstruction(bank, vault, wallet.publicKey, new BN(1), nft.mint, nft.pubkey, creator))
            }
            instructions.push(await gf.getStakeInstruction(farm, wallet.publicKey))

            const instructions_transaction = await sendTransactionWithRetry(connection, wallet, instructions, [])

            console.log("stakerMover instructions transaction :", instructions_transaction)
        } else if (farmerState === "staked" && gemsStaked > 0) {
            console.log("other staked")
            const instructions = [];
            console.log("nft num:", nfts.length)
            for (const nft of nfts) {
                const creator = new PublicKey(
                    //todo currently simply taking the 1st creator
                    nft.onchainMetadata.data.creators[0].address
                );

                instructions.push(await gf.flashDepositWalletInstruction(farm, wallet.publicKey, new BN('1'), nft.mint, nft.pubkey, creator))
            }
            // instructions.push(await gf.getStakeInstruction(farm,wallet.publicKey))
            console.log("instructions:", instructions)
            const instructions_transaction = await sendTransactionWithRetry(connection, wallet, instructions, [])
            console.log("stakerMoreMover instructions transaction :", instructions_transaction)
            // const gemsResult = await addGems(nfts, gf,connection,wallet)
            // console.log("gemsResult: ", gemsResult)
            // const stakeResult = await beginStaking(gf)

        }
    }catch(e){
        console.log(e);
    }


    // const stakeResult = await beginStaking(gf)
    // return stakeResult
}

// export async function stakerMoreMover(nft, connection, wallet) {
//     let nftArray = []
//     nftArray.push(nft)
//
//     const farm = new PublicKey(env.farm_id);
//     console.log("selectedNfts: ", nft.mint.toBase58())
//     let gb = await initGemBank(connection, wallet)
//     console.log("gb: ", gb)
//     let gf = await initGemFarm(connection, wallet)
//
//
//
//
// }

const depositGem = async (mint, creator, source, gb, bank, vault) => {
    const { txSig } = await gb.depositGemWallet(
        bank,
        vault,
        new BN(1),
        mint,
        source,
        creator
    );
    console.log('deposit done', txSig);
};


export async function depositNftsOnChain(nfts, gb, bank, vault) {
    for (const nft of nfts) {
        console.log(nft);
        const creator = new PublicKey(
            //todo currently simply taking the 1st creator
            nft.onchainMetadata.data.creators[0].address
        );
        console.log('creator is', creator.toBase58());
        const depositResult = await depositGem(nft.mint, creator, nft.pubkey, gb, bank, vault);
        return depositResult
    }


};


const addSingleGem = async (
    gemMint,
    gemSource,
    creator, gf, connection, wallet
) => {
    console.log("flash depost: ", gemMint.toBase58())
    await gf.flashDepositWallet(
        new PublicKey(env.farm_id),
        '1',
        gemMint,
        gemSource,
        creator
    );
    await fetchFarmer(connection, wallet);
};
const addGems = async (selectedNFTs, gf, connection, wallet) => {
    console.log("selected NFTs: ", selectedNFTs[0].mint.toBase58())
    await Promise.all(
        selectedNFTs.map((nft) => {
            const creator = new PublicKey(
                //todo currently simply taking the 1st creator
                nft.onchainMetadata.data.creators[0].address
            );
            console.log('creator is', creator.toBase58());
            addSingleGem(nft.mint, nft.pubkey, creator, gf, connection, wallet);
        })
    );
    console.log(
        `added another ${selectedNFTs.length} gems into staking vault`
    );
};

// const addGems = async () => {
//     await Promise.all(
//         selectedNFTs.value.map((nft) => {
//             const creator = new PublicKey(
//                 //todo currently simply taking the 1st creator
//                 (nft.onchainMetadata as any).data.creators[0].address
//         );
//             console.log('creator is', creator.toBase58());
//
//             addSingleGem(nft.mint, nft.pubkey!, creator);
//         })
//     );
//     console.log(
//         `added another ${selectedNFTs.value.length} gems into staking vault`
//     );
// };

export async function beginStaking(gf) {
    const stakeResult = await gf.stakeWallet(new PublicKey(env.farm_id));
    return stakeResult
    // const farmerResult = await fetchFarmer();
    // return farmerResult

};


// export async function depositNftsOnChain(nft) {

//     console.log(nft);
//     const creator = new PublicKey(
//         //todo currently simply taking the 1st creator
//         nft.onchainMetadata.data.creators[0].address
//     );
//     console.log('creator is', creator.toBase58());
//     await depositGem(nft.mint, creator, nft.pubkey);


// };
// export async function freshStart(wallet, connection) {
//     if (wallet && connection) {
//         const gf = await initGemFarm(connection, wallet);
//         farmerIdentity.value = wallet.publicKey?.toBase58();
//         //reset stuff
//         farmAcc.value = undefined;
//         farmerAcc.value = undefined;
//         farmerState.value = undefined;
//         availableA.value = undefined;
//         availableB.value = undefined;
//         try {
//             await fetchFarn();
//             await fetchFarmer(wallet);
//         } catch (e) {
//             console.log(`farm with PK ${env.farm_id} not found :(`);
//         }
//     }
// };


// const depositGem = async (mint, creator, source) => {
//     const { txSig } = await gb.depositGemWallet(
//         bank.value,
//         vault.value,
//         new BN(1),
//         mint,
//         source,
//         creator
//     );
//     console.log('deposit done', txSig);
// };

// const addSingleGem = async (
//     gemMint,
//     gemSource,
//     creator
// ) => {
//     await gf.flashDepositWallet(
//         new PublicKey(env.farm_id),
//         '1',
//         gemMint,
//         gemSource,
//         creator
//     );
//     await fetchFarmer();
// };
