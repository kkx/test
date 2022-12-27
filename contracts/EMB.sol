//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IEMBToken} from "./interfaces/IEMB.sol";

/// @title EMB Token
/// @author kadro
/// @notice A simple ERC20 token that will be distributed by the protocol
contract EMBToken is ERC20, IEMBToken {
    address public owner;
    address public protocol;

    modifier onlyOwner(){
        require(msg.sender == owner, "EMB: only owner");
        _;
    }
    
    modifier onlyProtocol(){
        require(msg.sender == protocol, "EMB: only protocol");
        _;
    }

    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
    {
        owner = msg.sender;
    }

    function setProtocol(address _protocol) onlyOwner external {
        protocol = _protocol;
    }

    function mint(address account, uint256 amount) override onlyProtocol external {
        _mint(account, amount);
    }
}