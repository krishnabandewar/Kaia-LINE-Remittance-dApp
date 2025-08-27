const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Stablecoin", function () {
  it("Should mint initial supply to owner", async function () {
    const [owner] = await ethers.getSigners();
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = await Stablecoin.deploy(1000000);
  await stablecoin.waitForDeployment();
    expect(await stablecoin.balanceOf(owner.address)).to.equal(1000000);
  });

  it("Should transfer tokens", async function () {
    const [owner, addr1] = await ethers.getSigners();
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = await Stablecoin.deploy(1000000);
  await stablecoin.waitForDeployment();
    await stablecoin.transfer(addr1.address, 500000);
    expect(await stablecoin.balanceOf(addr1.address)).to.equal(500000);
  });
});
