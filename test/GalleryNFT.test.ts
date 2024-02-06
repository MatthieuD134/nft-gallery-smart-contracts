import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { assert, expect } from 'chai';
import hre from 'hardhat';

describe('GalleryNFT', () => {
  async function deployContractFixture() {
    const [deployer, owner, buyer, random] = await hre.ethers.getSigners();
    const galleryContractAsDeployer = await hre.ethers.deployContract(
      'GalleryNFT',
      [owner.address],
      {
        signer: deployer,
      },
    );
    const galleryContract = await hre.ethers.getContractAt(
      'GalleryNFT',
      await galleryContractAsDeployer.getAddress(),
      owner,
    );

    return {
      galleryContract,
      owner,
      buyer,
      random,
    };
  }

  async function setUpTemplateFixture() {
    const { galleryContract, owner, buyer, random } = await loadFixture(deployContractFixture);
    const nftTemplate1 = {
      id: BigInt(1),
      maxSupply: BigInt(10),
      price: hre.ethers.parseEther('0.01'),
      url: 'https://template1',
    };
    const nftTemplate2 = {
      id: BigInt(2),
      maxSupply: BigInt(10),
      price: hre.ethers.parseEther('0.01'),
      url: 'https://template2',
    };

    const tx = await galleryContract.setUpModel(
      nftTemplate1.id,
      nftTemplate1.maxSupply,
      nftTemplate1.price,
      nftTemplate1.url,
    );
    await tx.wait();

    return { galleryContract, owner, buyer, random, nftTemplate1, nftTemplate2 };
  }

  describe('Deployment', () => {
    it('Should have set the owner', async () => {
      const { galleryContract, owner } = await loadFixture(deployContractFixture);

      expect(await galleryContract.owner()).to.be.eql(owner.address);
    });
  });

  describe('Setting up models', () => {
    it('Should have initialized the template', async () => {
      const { galleryContract, nftTemplate1 } = await loadFixture(setUpTemplateFixture);

      expect(await galleryContract.getModel(nftTemplate1.id)).to.be.eql([
        nftTemplate1.maxSupply,
        BigInt(0),
        nftTemplate1.price,
        nftTemplate1.url,
      ]);
    });

    it('Should not allow owner to set-up template with model id of 0', async () => {
      const { galleryContract, nftTemplate1 } = await loadFixture(setUpTemplateFixture);

      await expect(
        galleryContract.setUpModel(0, nftTemplate1.maxSupply, nftTemplate1.price, nftTemplate1.url),
      ).to.be.revertedWithCustomError(galleryContract, 'ModelAlreadyExists');
    });

    it('Should not allow owner to set-up template if model already set-up', async () => {
      const { galleryContract, nftTemplate1 } = await loadFixture(setUpTemplateFixture);

      await expect(
        galleryContract.setUpModel(
          nftTemplate1.id,
          nftTemplate1.maxSupply,
          nftTemplate1.price,
          nftTemplate1.url,
        ),
      ).to.be.revertedWithCustomError(galleryContract, 'ModelAlreadyExists');
    });

    it('Should not allow non-owner to set-up models', async () => {
      const { galleryContract, random, nftTemplate2 } = await loadFixture(setUpTemplateFixture);
      const galleryContractForRandom = await hre.ethers.getContractAt(
        'GalleryNFT',
        await galleryContract.getAddress(),
        random,
      );

      await expect(
        galleryContractForRandom.setUpModel(
          nftTemplate2.id,
          nftTemplate2.maxSupply,
          nftTemplate2.price,
          nftTemplate2.url,
        ),
      ).to.be.revertedWithCustomError(galleryContractForRandom, 'OwnableUnauthorizedAccount');
    });

    it('Should revert when accessing a model that does not exist', async () => {
      const { galleryContract, nftTemplate2 } = await loadFixture(setUpTemplateFixture);

      await expect(galleryContract.getModel(nftTemplate2.id)).to.be.revertedWithCustomError(
        galleryContract,
        'ModelDoesNotExist',
      );
    });
  });

  describe('Mint NFT', () => {
    it('should allow users to buy NFT', async () => {
      const { galleryContract, buyer, nftTemplate1 } = await loadFixture(setUpTemplateFixture);
      const galleryContractForBuyer = await hre.ethers.getContractAt(
        'GalleryNFT',
        await galleryContract.getAddress(),
        buyer,
      );

      const tx = await galleryContractForBuyer.mint(nftTemplate1.id, 1, {
        value: nftTemplate1.price,
      });
      await tx.wait();
    });

    it("Should not allow user to mint if they don't send enough funds", async () => {
      const { galleryContract, buyer, nftTemplate1 } = await loadFixture(setUpTemplateFixture);
      const galleryContractForBuyer = await hre.ethers.getContractAt(
        'GalleryNFT',
        await galleryContract.getAddress(),
        buyer,
      );

      await expect(
        galleryContractForBuyer.mint(nftTemplate1.id, nftTemplate1.maxSupply, {
          value: nftTemplate1.price * nftTemplate1.maxSupply - BigInt(1),
        }),
      ).to.be.revertedWithCustomError(galleryContractForBuyer, 'InsufficientMsgValue');
    });

    it('Should not allow user to mint using a model that does not exist', async () => {
      const { galleryContract, buyer, nftTemplate1 } = await loadFixture(setUpTemplateFixture);
      const galleryContractForBuyer = await hre.ethers.getContractAt(
        'GalleryNFT',
        await galleryContract.getAddress(),
        buyer,
      );

      await expect(
        galleryContractForBuyer.mint(2, nftTemplate1.maxSupply, {
          value: nftTemplate1.price * nftTemplate1.maxSupply,
        }),
      ).to.be.revertedWithCustomError(galleryContractForBuyer, 'ModelDoesNotExist');
    });

    it('Should not allow user to mint if they want to mint more than the supply allows', async () => {
      const { galleryContract, buyer, nftTemplate1 } = await loadFixture(setUpTemplateFixture);
      const galleryContractForBuyer = await hre.ethers.getContractAt(
        'GalleryNFT',
        await galleryContract.getAddress(),
        buyer,
      );

      await expect(
        galleryContractForBuyer.mint(nftTemplate1.id, nftTemplate1.maxSupply + BigInt(1), {
          value: nftTemplate1.price * (nftTemplate1.maxSupply + BigInt(1)),
        }),
      ).to.be.revertedWithCustomError(galleryContractForBuyer, 'InsufficientSupply');
    });

    describe('Withdrawal', () => {
      it('should allow owner to withdraw the funds after some NFTs have been minted', async () => {
        const { galleryContract, owner, buyer, nftTemplate1 } =
          await loadFixture(setUpTemplateFixture);
        const galleryContractForBuyer = await hre.ethers.getContractAt(
          'GalleryNFT',
          await galleryContract.getAddress(),
          buyer,
        );

        const mintTx = await galleryContractForBuyer.mint(nftTemplate1.id, 1, {
          value: nftTemplate1.price,
        });
        await mintTx.wait();

        const initialBalance = await hre.ethers.provider.getBalance(owner);
        const tx = await galleryContract.withdrawFunds();
        const receipt = await tx.wait();

        assert(receipt);
        const gasUsed = receipt.cumulativeGasUsed;

        expect(await hre.ethers.provider.getBalance(owner)).to.be.eql(
          initialBalance - gasUsed + nftTemplate1.price,
        );
      });

      it('should not allow non-=owner to withdraw the funds', async () => {
        const { galleryContract, random, buyer, nftTemplate1 } =
          await loadFixture(setUpTemplateFixture);
        const galleryContractForBuyer = await hre.ethers.getContractAt(
          'GalleryNFT',
          await galleryContract.getAddress(),
          buyer,
        );
        const galleryContractForRandom = await hre.ethers.getContractAt(
          'GalleryNFT',
          await galleryContract.getAddress(),
          random,
        );

        const mintTx = await galleryContractForBuyer.mint(nftTemplate1.id, 1, {
          value: nftTemplate1.price,
        });
        await mintTx.wait();

        await expect(galleryContractForRandom.withdrawFunds()).to.be.revertedWithCustomError(
          galleryContractForRandom,
          'OwnableUnauthorizedAccount',
        );
      });
    });

    describe('Token Uri', () => {
      it('Should not return anything for token that have not yet be minted', async () => {
        const { galleryContract } = await loadFixture(setUpTemplateFixture);
        await expect(galleryContract.tokenURI(0)).to.be.revertedWithCustomError(
          galleryContract,
          'URIQueryForNonexistentToken',
        );
      });

      it('Should return the right tokenUri corresponding to the uri set in the model used to mint', async () => {
        const { galleryContract, buyer, nftTemplate1 } = await loadFixture(setUpTemplateFixture);
        const galleryContractForBuyer = await hre.ethers.getContractAt(
          'GalleryNFT',
          await galleryContract.getAddress(),
          buyer,
        );

        const tx = await galleryContractForBuyer.mint(nftTemplate1.id, 1, {
          value: nftTemplate1.price,
        });
        await tx.wait();

        expect(await galleryContract.tokenURI(0)).to.be.eql(nftTemplate1.url);
      });
    });
  });
});
