// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract UserRegistry {
    address public owner;
    struct User {
        address wallet;
        string lineId;
        bool kycCompleted;
        uint256 registeredAt;
    }
    mapping(address => User) public users;
    mapping(string => address) public lineIdToWallet;

    event UserRegistered(address indexed wallet, string lineId);
    event KYCUpdated(address indexed wallet, bool kycCompleted);

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerUser(address wallet, string calldata lineId) external onlyOwner {
        require(wallet != address(0), "Invalid wallet");
        require(bytes(lineId).length > 0, "Invalid LINE ID");
        require(users[wallet].registeredAt == 0, "Already registered");
        users[wallet] = User(wallet, lineId, false, block.timestamp);
        lineIdToWallet[lineId] = wallet;
        emit UserRegistered(wallet, lineId);
    }

    function setKYCStatus(address wallet, bool status) external onlyOwner {
        require(users[wallet].registeredAt != 0, "User not registered");
        users[wallet].kycCompleted = status;
        emit KYCUpdated(wallet, status);
    }

    function getUser(address wallet) external view returns (User memory) {
        return users[wallet];
    }

    function getWalletByLineId(string calldata lineId) external view returns (address) {
        return lineIdToWallet[lineId];
    }
}
