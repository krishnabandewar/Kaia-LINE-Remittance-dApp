const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityPool", function () {
  it("Should allow deposits and withdrawals", async function () {
    const [owner, provider] = await ethers.getSigners();
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = await Stablecoin.deploy(1000000);
  await stablecoin.waitForDeployment();
    await stablecoin.transfer(provider.address, 500000);
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const pool = await LiquidityPool.deploy();
  await pool.waitForDeployment();
  const stablecoinAddress = await stablecoin.getAddress();
  const poolAddress = await pool.getAddress();
  await pool.connect(owner).setAllowedToken(stablecoinAddress, true);
  await stablecoin.connect(provider).approve(poolAddress, 500000);
  await pool.connect(provider).deposit(stablecoinAddress, 500000);
  expect(await pool.getProviderBalance(provider.address, stablecoinAddress)).to.equal(500000);
  await pool.connect(provider).withdraw(stablecoinAddress, 200000);
  expect(await pool.getProviderBalance(provider.address, stablecoinAddress)).to.equal(300000);
  });
});
