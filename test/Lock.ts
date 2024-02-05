import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { Lock } from '../typechain-types';

describe('Lock', () => {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

    const lockedAmount = 1_000_000_000;
    const unlockTime = BigInt((await time.latest()) + ONE_YEAR_IN_SECS);

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const lock: Lock = await hre.ethers.deployContract('Lock', [unlockTime], {
      value: lockedAmount,
      signer: owner,
    });

    return {
      lock,
      unlockTime,
      lockedAmount,
      owner,
      otherAccount,
    };
  }

  describe('Deployment', () => {
    it('Should set the right unlockTime', async () => {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it('Should set the right owner', async () => {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });

    it('Should receive and store the funds to lock', async () => {
      const { lock, lockedAmount } = await loadFixture(deployOneYearLockFixture);
      const lockBalance = await hre.ethers.provider.getBalance(await lock.getAddress());

      expect(lockBalance).to.equal(lockedAmount);
    });

    it('Should fail if the unlockTime is not in the future', async () => {
      // We don't use the fixture here because we want a different deployment
      const latestTime = BigInt(await time.latest());
      await expect(
        hre.ethers.deployContract('Lock', [latestTime], {
          value: 1n,
        }),
      ).to.be.rejectedWith('Unlock time not in future');
    });
  });

  describe('Withdrawals', () => {
    describe('Validations', () => {
      it('Should revert with the right error if called too soon', async () => {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.rejectedWith("You can't withdraw yet");
      });

      it('Should revert with the right error if called from another account', async () => {
        const { lock, unlockTime, otherAccount } = await loadFixture(deployOneYearLockFixture);

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We retrieve the contract with a different account to send a transaction
        const lockAsOtherAccount = await hre.ethers.getContractAt(
          'Lock',
          await lock.getAddress(),
          otherAccount,
        );
        await expect(lockAsOtherAccount.withdraw()).to.be.rejectedWith("You aren't the owner");
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async () => {
        const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.be.fulfilled;
      });
    });

    describe('Events', () => {
      it('Should emit an event on withdrawals', async () => {
        const { lock, unlockTime, lockedAmount } = await loadFixture(deployOneYearLockFixture);

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.emit(lock, 'Withdrawal').withArgs(lockedAmount, anyValue);
      });
    });
  });
});
