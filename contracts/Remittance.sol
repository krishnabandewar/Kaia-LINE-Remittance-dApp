// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address,address,uint256) external returns (bool);
}

contract Remittance {
    address public owner;
    address public feeCollector;
    uint16 public feeBps; // 100 = 1%
    mapping(address => bool) public allowedTokens;

    event Remitted(address indexed from, address indexed to, address indexed token, uint256 gross, uint256 fee, string memo);

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    constructor(address _feeCollector, uint16 _feeBps) {
        owner = msg.sender;
        feeCollector = _feeCollector;
        feeBps = _feeBps;
    }

    function setAllowedToken(address token, bool ok) external onlyOwner {
        allowedTokens[token] = ok;
    }

    function setFee(uint16 bps) external onlyOwner {
        require(bps <= 200, "fee too high");
        feeBps = bps;
    }

    function remit(address token, address to, uint256 amount, string calldata memo) external {
        require(allowedTokens[token], "token not allowed");
        uint256 fee = amount * feeBps / 10000;
        uint256 net = amount - fee;
        require(IERC20(token).transferFrom(msg.sender, feeCollector, fee), "fee xfer fail");
        require(IERC20(token).transferFrom(msg.sender, to, net), "net xfer fail");
        emit Remitted(msg.sender, to, token, amount, fee, memo);
    }
}
