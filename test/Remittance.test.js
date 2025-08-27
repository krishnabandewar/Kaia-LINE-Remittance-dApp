const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Remittance", function () {
  it("Should remit tokens and collect fee", async function () {
    const [owner, feeCollector, sender, recipient] = await ethers.getSigners();
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = await Stablecoin.deploy(1000000);
  await stablecoin.waitForDeployment();
    await stablecoin.transfer(sender.address, 100000);
  const Remittance = await ethers.getContractFactory("Remittance");
  const remittance = await Remittance.deploy(feeCollector.address, 100); // 1%
  await remittance.waitForDeployment();
  const stablecoinAddress = await stablecoin.getAddress();
  const remittanceAddress = await remittance.getAddress();
  await stablecoin.connect(sender).approve(remittanceAddress, 100000);
  await remittance.connect(owner).setAllowedToken(stablecoinAddress, true);
  await remittance.connect(sender).remit(stablecoinAddress, recipient.address, 100000, "test");
  expect(await stablecoin.balanceOf(feeCollector.address)).to.equal(1000);
  expect(await stablecoin.balanceOf(recipient.address)).to.equal(99000);
  });
});
