// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
  //add minter variable
  address public minter;

  //add minter changed event for logging
  event MinterChanged(address indexed from, address to);
  //can be used for specific use cases such as push notifications under
  //certain events

  constructor() public payable ERC20("Decentralized Bank Currency", "DBC") {
    //asign initial minter
    minter = msg.sender;
  }

  //Add pass minter role function
  function passMinterRole(address dBank) public returns (bool) {
    require(msg.sender == minter, "Error, not minter");
    minter = dBank;

    // event type allocation
    emit MinterChanged(msg.sender, dBank);
    return true;
  }

  function mint(address account, uint256 amount) public {
    //check if msg.sender have minter role
    require(msg.sender == minter, "Error: msg.sender not minter");
		_mint(account, amount);
	}
}

// contract Token {
//   string public name = "my token";
// }