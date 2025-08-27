const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserRegistry", function () {
  it("Should register a user and set KYC status", async function () {
    const [owner, user] = await ethers.getSigners();
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const registry = await UserRegistry.deploy();
  await registry.waitForDeployment();
    await registry.registerUser(user.address, "line123");
    let userData = await registry.getUser(user.address);
    expect(userData.wallet).to.equal(user.address);
    expect(userData.lineId).to.equal("line123");
    expect(userData.kycCompleted).to.equal(false);
    await registry.setKYCStatus(user.address, true);
    userData = await registry.getUser(user.address);
    expect(userData.kycCompleted).to.equal(true);
  });
});
