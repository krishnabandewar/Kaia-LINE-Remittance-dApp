// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address,address,uint256) external returns (bool);
    function transfer(address,uint256) external returns (bool);
}

contract LiquidityPool {
    address public owner;
    mapping(address => bool) public allowedTokens;
    mapping(address => mapping(address => uint256)) public providerBalances; // provider => token => amount
    mapping(address => uint256) public totalPoolBalance; // token => amount

    event Deposited(address indexed provider, address indexed token, uint256 amount);
    event Withdrawn(address indexed provider, address indexed token, uint256 amount);
    event TokenAllowed(address indexed token, bool allowed);

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    function deposit(address token, uint256 amount) external {
        require(allowedTokens[token], "token not allowed");
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "deposit failed");
        providerBalances[msg.sender][token] += amount;
        totalPoolBalance[token] += amount;
        emit Deposited(msg.sender, token, amount);
    }

    function withdraw(address token, uint256 amount) external {
        require(providerBalances[msg.sender][token] >= amount, "insufficient balance");
        providerBalances[msg.sender][token] -= amount;
        totalPoolBalance[token] -= amount;
        require(IERC20(token).transfer(msg.sender, amount), "withdraw failed");
        emit Withdrawn(msg.sender, token, amount);
    }

    function getProviderBalance(address provider, address token) external view returns (uint256) {
        return providerBalances[provider][token];
    }

    function getTotalPoolBalance(address token) external view returns (uint256) {
        return totalPoolBalance[token];
    }
}
