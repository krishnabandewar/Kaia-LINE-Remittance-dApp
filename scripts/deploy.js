const { ethers } = require("hardhat");

async function main() {
  // Deploy Stablecoin
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = await Stablecoin.deploy(1000000000); // 1,000,000 USDT (6 decimals)
    await stablecoin.waitForDeployment();
  console.log("Stablecoin deployed to:", await stablecoin.getAddress());

  // Deploy UserRegistry
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();
  console.log("UserRegistry deployed to:", await userRegistry.getAddress());

  // Deploy Remittance
  const Remittance = await ethers.getContractFactory("Remittance");
  const [deployer] = await ethers.getSigners();
  const remittance = await Remittance.deploy(await deployer.getAddress(), 50); // feeCollector=deployer, feeBps=0.5%
    await remittance.waitForDeployment();
  console.log("Remittance deployed to:", await remittance.getAddress());

  // Deploy LiquidityPool
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy();
    await liquidityPool.waitForDeployment();
  console.log("LiquidityPool deployed to:", await liquidityPool.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
