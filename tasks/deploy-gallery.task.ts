import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { Wallet } from 'ethers';
import { task } from 'hardhat/config';
import WAIT from '../utils/wait';

task('deploy:gallery', 'deploy a new instance of the GalleryNFT.sol contract')
  .addParam('owner', 'the owner public key')
  .addOptionalParam('privateKey', 'the private key to be used for deploying the contract')
  .addFlag('verify', 'will send verification request to etherscan')
  .setAction(async (taskArgs, hre) => {
    const { owner, privateKey, verify } = taskArgs;
    const deployer: Wallet | HardhatEthersSigner = privateKey
      ? new hre.ethers.Wallet(privateKey, hre.ethers.provider)
      : (await hre.ethers.getSigners())[0];

    console.log(`Deploying GalleryNFT contract with account ${deployer.address}...`);

    const contract = await hre.ethers.deployContract('GalleryNFT', [owner], deployer);
    const contractAddress = await contract.getAddress();

    console.log(`Contract deployed at ${contractAddress}`);

    if (verify) {
      console.log('Senfing verification request to etherscan...');

      // wait 1 min before sending the verify request
      await WAIT(60000);

      await hre.run('verify:verify', {
        address: contractAddress,
        constructorArguments: [owner],
      });

      console.log('Verification succesfful');
    }
  });
