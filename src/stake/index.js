
import './index.scss'
import { getNFTsByOwner, getNFTMetadataForMany } from './common/getNfts';
import { fetchFarn, fetchFarmer, stakerMover } from './common/staker';
import { populateVaultNFTs } from './common/getVaultNfts';
import { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Provider } from '@project-serum/anchor';
import env from "react-dotenv";
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { superUnstakeMover } from './common/unstaker';
import { claim, getRewards, refreshFarmerWallet } from './common/claimer';
require('@solana/wallet-adapter-react-ui/styles.css');



const wallets = [
    /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
    new PhantomWalletAdapter(),
]
const opts = {
    preflightCommitment: "processed"
}
const programID = new PublicKey(env.farm_id);




function Stake() {
    const wallet = useWallet();
    const [farmerState, setFarmerState] = useState(null)
    const [rewardValue, setRewardValue] = useState('0')//质押奖励
    const [showstk, setshow] = useState([])//已质押展示数组
    let [arrow, setarrow] = useState(-1)//展示数组的索引
    const [already, setAlready] = useState([])//存放要质押的数组（不用于展示）
    const [down, setDown] = useState([])//存放要解除质押的（不用于展示）
    const imgRef = []
    const [stake, setStake] = useState([
        // {
        //     img: './img/stake/1.png',
        //     id: '111'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '222'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '333'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '444'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '555'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '666'
        // }
    ])//质押中
    const [unstake, setUnstake] = useState([
        // {
        //     img: './img/stake/1.png',
        //     id: '1'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '2'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '3'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '4'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '5'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '6'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '7'
        // },
        // {
        //     img: './img/stake/1.png',
        //     id: '8'
        // }
    ])//非质押中
    useEffect(() => {
        if (wallet && wallet != null && stake != undefined && stake != []) {
            if (stake.length <= 4) {
                setarrow(-1)
                setshow(stake)
            } else if (arrow >= 0) {
                let a = arrToTwoDim(stake, 4)
                setshow(a[arrow])
            } else {
                setarrow(0)
            }
        }
    }, [wallet, stake])
    useEffect(() => {
        if (wallet && stake && stake != []) {
            let bb = [...stake]
            bb.map((item) => {
                item['className'] = ''
                return item
            })
            setStake(bb)
        }
        if (wallet && unstake && unstake != []) {
            let bbb = [...unstake]
            bbb.map((item) => {
                item['className'] = ''
                return item
            })
            setUnstake(bbb)
        }
    }, [])
    useEffect(() => {
        let a = arrToTwoDim(stake, 4)
        if (arrow < 0) {
            return;
        } else {
            setshow(a[arrow])
        }
    }, [arrow])

    useEffect(() => {
        for (let i = 0; i < showstk.length; i++) {
            for (let j = 0; j < down.length; j++) {
                if (showstk[i].externalMetadata.image == down[j].externalMetadata.image) {

                } else {
                    switch (i) {
                        case 0:
                            imgRef[0].style.transform = 'translate(-50%, -50%) rotate(-15deg)'
                            break;
                        case 1:
                            imgRef[1].style.transform = 'translate(-50%, -50%) rotate(-5deg)'
                            break;
                        case 2:
                            imgRef[2].style.transform = 'translate(-50%, -50%) rotate(5deg)'
                            break;
                        case 3:
                            imgRef[3].style.transform = 'translate(-50%, -50%) rotate(10deg)'
                            break;
                    }
                }
            }
        }
    }, [showstk])
    function arrToTwoDim(arr, n = 4) {
        var arr2 = []
        for (var i = 0, j = 0; i < arr.length; i += n) {
            arr2[j] = []
            for (var k = 0; k < n; k++) {
                if (i + k < arr.length)
                    arr2[j].push(arr[i + k])
            }
            j++
        }
        return arr2
    }
    const leftI = () => {
        if (arrow == 0) {
            return
        } else {
            setarrow(--arrow)
        }
    }
    const rightI = () => {
        let a = arrToTwoDim(stake, 4)
        if (arrow > a.length - 2) {
            return
        } else {
            setarrow(++arrow)
        }
    }

    const isYou = (index) => {
        let aa = [...already]
        if (unstake[index].className == 'select') {
            for (let i = 0; i < aa.length; i++) {
                if (aa[i].id == unstake[index].id) {
                    aa.splice(i, 1)
                    unstake[index].className = ''
                }
            }
        } else {
            if (aa != [] && aa.length <= 1) {
                let cc = [...unstake]
                cc[index].className = 'select'
                setUnstake(cc)
                aa.push(unstake[index])
            }
        }
        setAlready(aa)
    }
    
    const isMe = (index) => {
        let aa = [...down]
        if (showstk[index].className == `select${index}`) {
            for (let i = 0; i < aa.length; i++) {
                if (aa[i].externalMetadata.image == showstk[index].externalMetadata.image) {
                    aa.splice(i, 1)
                    let cc = [...stake]
                    for (let i = 0; i < cc.length; i++) {
                        if (cc[i].externalMetadata.image == showstk[index].externalMetadata.image) {
                            cc[i].className = ''
                        }
                    }
                    setStake(cc)
                }
            }
        } else {
            if (aa != [] && aa.length <= 1) {
                let cc = [...stake]
                for (let i = 0; i < cc.length; i++) {
                    if (cc[i].externalMetadata.image == showstk[index].externalMetadata.image) {
                        cc[i].className = `select${index}`
                    }
                }
                setStake(cc)
                aa.push(showstk[index])
            }
        }
        setDown(aa)
    }



    // useEffect(async () => {
    //     if (wallet && wallet.publicKey != null) {
    //         console.log("refreshAll")
    //         await refreshAll()
    //         const timer = window.setInterval(async () => {
    //             await refreshFarmer()
    //         }, 1000 * 60);

    //         return () => {
    //             clearInterval(timer);
    //         };
    //     } else {
    //         setStake([])
    //         setUnstake([])
    //     }
    // }, [wallet])

    useEffect(() => {
        if (wallet && wallet.publicKey != null) {
            console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<', wallet);
            console.log(wallet.publicKey);
            refreshAll()
            refreshFarmer()
        } else {
            console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', wallet);
            console.log(wallet.publicKey);
            setStake([])
            setUnstake([])
        }
    }, [wallet])

    async function getProvider() {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        // const network = "https://api.devnet.solana.com";
        const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
        const provider = new Provider(
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    async function claimRewards() {
        // const network = "https://api.devnet.solana.com";
        const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
        const farm = await fetchFarn(connection, wallet)
        const claimResults = await claim(farm, connection, wallet)
        await refreshFarmer()
    }

    async function refreshAll() {
        // await getUnstakedNfts()
        // await getStakedNfts()
        // await getRewardA()
        const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
        const farm = await fetchFarn(connection, wallet)
        console.log("farm value:", farm)
        console.log("staked farmer count:", Number(farm.stakedFarmerCount))
        //getUnstakedNfts
        const provider = await getProvider()
        const providerPublicKey = new PublicKey(provider.wallet.publicKey)
        // console.log("providerPublicKey:",JSON.stringify(providerPublicKey))
        const nfts = await getNFTsByOwner(providerPublicKey, connection)
        const nftdata = await getNFTMetadataForMany(nfts, connection)
        // for (let nft of nfts) {
        //   console.log(nft.onchainMetadata.data.name)
        // }
        console.log("nfts:", nftdata)
        setUnstake(nftdata)

        //getStakedNfts and RewardA
        const farmer = await fetchFarmer(connection, wallet)
        // console.log("farmer: ", farmer)
        setFarmerState(farmer.farmerState)

        const gdrs = await populateVaultNFTs(connection, wallet)
        setStake(gdrs)

        const diff = farmer.farmerAcc.rewardA.accruedReward - farmer.farmerAcc.rewardA.paidOutReward
        // console.log("reward amount: ", diff.toString())
        const rewardA = diff.toString()
        setRewardValue(rewardA)
    }

    async function getRewardA() {
        // const network = "https://api.devnet.solana.com";
        const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);

        const farmerAcc = await fetchFarmer(connection, wallet)
        // console.log("farmerAcc: ", farmerAcc)
        const diff = farmerAcc.farmerAcc.rewardA.accruedReward - farmerAcc.farmerAcc.rewardA.paidOutReward
        // console.log("reward amount: ", diff.toString())
        const rewardA = diff.toString()
        setRewardValue(rewardA)
    }

    async function getUnstakedNfts() {
        const provider = await getProvider()
        // const network = "https://api.devnet.solana.com";
        const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
        const providerPublicKey = new PublicKey(provider.wallet.publicKey)
        // console.log("providerPublicKey:",JSON.stringify(providerPublicKey))
        const nfts = await getNFTsByOwner(providerPublicKey, connection)
        const nftdata = await getNFTMetadataForMany(nfts, connection)
        // for (let nft of nfts) {
        //   console.log(nft.onchainMetadata.data.name)
        // }
        setUnstake(nftdata)
    }

    async function getStakedNfts() {
        // console.log("viewing staked nfts")
        // console.log(wallet.publicKey.toBase58())
        const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
        const farm = await fetchFarn(connection, wallet)
        // console.log("farm: ", farm)
        // console.log("farm gemsStaked: ", Number(farm.gemsStaked))
        const farmer = await fetchFarmer(connection, wallet)
        // console.log("farmer: ", farmer)
        setFarmerState(farmer.farmerState)
        const gdrs = await populateVaultNFTs(connection, wallet)
        setStake(gdrs)
    }

    async function stakeNft() {
        if (wallet && already && already.length > 0) {
            const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
            document.querySelector('.dask').style.display = 'block'
            const stakeResult = await stakerMover(already, connection, wallet)
            setAlready([])
            const farmerStarted = await fetchFarmer(connection, wallet)
            setFarmerState(farmerStarted.farmerState)
            await refreshAll()
            document.querySelector('.dask').style.display = 'none'
        }
    }

    async function refreshFarmer() {
        console.log("refresh farmer")
        const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
        const interval = refreshFarmerWallet(new PublicKey(env.farm_id), wallet.publicKey, connection, wallet)
        const farmerAcc = await fetchFarmer(connection, wallet)
        // console.log("farmerAcc: ", farmerAcc)
        const diff = farmerAcc.farmerAcc.rewardA.accruedReward - farmerAcc.farmerAcc.rewardA.paidOutReward
        // console.log("reward amount: ", diff.toString())
        const rewardA = diff.toString()
        setRewardValue(rewardA)
    }

    async function withdrawStake() {
        if (wallet && down && down.length > 0) {
            // const network = "https://api.devnet.solana.com";
            document.querySelector('.dask').style.display = 'flex'
            const connection = new Connection(clusterApiUrl(env.solana_network), opts.preflightCommitment);
            const endStakeResults = await superUnstakeMover(down, connection, wallet)
            await refreshAll()
            setDown([])
            document.querySelector('.dask').style.display = 'none'
        }
    }

    return (
        <div className='stake'>
            <div className='stake_top'>
                <img src='./img/stake/wo.png'></img>
                <img src='./img/stake/black.png'></img>
                <div>Staking<img src='./img/stake/bb.png'></img></div>
                <div className='nostake'><span onClick={withdrawStake}>unstake</span></div>
                <div className='claim' onClick={claimRewards}>claim
                    <img src='./img/stake/egtop.svg'></img>
                    <img src='./img/stake/egbottom.svg'></img>
                </div>
                <div className='staking'>
                    <div className='left' style={arrow == -1 ? { display: 'none' } : { display: 'block' }} onClick={leftI}><img src='./img/stake/left.svg'></img></div>
                    <div className='right' style={arrow == -1 ? { display: 'none' } : { display: 'block' }} onClick={rightI}><img src='./img/stake/right.svg'></img></div>
                    {
                        showstk.map((item, index) => {
                            return (
                                <img className={item.className} src={item.externalMetadata.image} key={index} onClick={() => isMe(index)}></img>
                            )
                        })
                    }
                </div>
                {
                    wallet.publicKey ? <WalletMultiButton /> : <WalletMultiButton>Connect Wallet</WalletMultiButton>
                }
            </div>

            <div className='stake_bottom'>
                <div className='stake_bottom_left'>
                    <div className='sss'>
                        {
                            unstake.map((item, index) => {
                                return (
                                    <div className={`unstake ${item.className}`} key={index} onClick={() => isYou(index)}>
                                        <img src={item.externalMetadata.image}></img>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className='tostake'><span onClick={stakeNft}>stake</span></div>
                </div>
                <div className='stake_bottom_right'>
                    <div>
                        <img src='./img/stake/blackboard.png'></img>
                        <div>EARNINGS</div>
                        <div>{rewardValue}</div>
                        <div>soc</div>
                        <div><span>{'20'}</span>&nbsp;<span>soc / day</span></div>
                    </div>
                </div>
            </div>

            <div className='dask'>
                <div className="wavy">
                    <span className='span1'>w</span>
                    <span className='span2'>a</span>
                    <span className='span3'>i</span>
                    <span className='span4'>t</span>
                    <span className='span5'>.</span>
                    <span className='span6'>.</span>
                    <span className='span7'>.</span>
                </div>
            </div>
        </div>
    )
}

const AppWithProvider = () => (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <Stake />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
)

export default AppWithProvider;
