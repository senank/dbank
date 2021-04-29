// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./Token.sol";

contract dBank {

  //assign Token contract to variable
  Token private token;
  //add mappings
  mapping(address => uint) public etherBalanceOf;
  mapping(address => uint) public depositStart;
  mapping(address => uint) public borrowStart;
  mapping(address => uint) public collateralAmount;
  
  mapping(address => bool) public isDeposited;
  mapping(address => bool) public isBorrowed;
  

  //add events
  event Deposit(address indexed user, uint etherAmount, uint timeStart);
  event Withdraw(address indexed user, uint etherAmount, uint timeEnd, uint interest);
  event Borrow(address indexed user, uint collateral, uint borrowAmount, uint timeStart);
  event Cleared(address indexed user, uint collateral, uint fee);
  

  //pass as constructor argument deployed Token contract
  constructor(Token _token) public {
    //assign token deployed contract to a variable
    token = _token;
  }

  function deposit() payable public {
    //check if msg.sender didn't already deposited funds
    require(isDeposited[msg.sender] == false, 'Already deposited');
    //check if msg.value is >= than 0.01 ETH
    require(msg.value >= 1e16, 'Value too small');


    //increase msg.sender ether deposit balance
    etherBalanceOf[msg.sender] = etherBalanceOf[msg.sender] + msg.value;

    //start msg.sender hodling time
    depositStart[msg.sender] = depositStart[msg.sender] + block.timestamp;

    isDeposited[msg.sender] = true; //set msg.sender deposit status to true

    emit Deposit(msg.sender, msg.value, block.timestamp); //emit Deposit event
  }

  function withdraw() public {
    //check if msg.sender deposit status is true
    require(isDeposited[msg.sender] == true, 'No funds to withdraws');
    //assign msg.sender ether deposit balance to variable for event
    uint userBalance = etherBalanceOf[msg.sender];
    
    //check user's hodl time
    uint depositTime = block.timestamp - depositStart[msg.sender];

    //calc interest per second
    
    //    31668017 => interest(10% APY) per second for deposit amount (0.01 ETH), cuz:
    //    1e15(10% of 0.01 ETH) / 31577600 (seconds in 365.25 days)

    //    (etherBalanceOf[msg.sender] / 1e16) - calc. how much higher interest will be (based on deposit), e.g.:
    //    for min. deposit (0.01 ETH), (etherBalanceOf[msg.sender] / 1e16) = 1 (the same, 31668017/s)
    //    for deposit 0.02 ETH, (etherBalanceOf[msg.sender] / 1e16) = 2 (doubled, (2*31668017)/s)
    
    uint interestPerSecond = 31668017 * (userBalance / 1e16);

    //calc accrued interest
    uint interest = interestPerSecond * depositTime;

    msg.sender.transfer(etherBalanceOf[msg.sender]); //send eth to user
    
    token.mint(msg.sender, interest); //send interest in tokens to user


    //reset depositer data
    etherBalanceOf[msg.sender] = 0; 
    depositStart[msg.sender] = 0;
    isDeposited[msg.sender] = false;

    //emit event
    emit Withdraw(msg.sender, userBalance, depositTime, interest);
  }

  function borrow() payable public {
    //check if collateral is >= than 0.01 ETH
    require(msg.value>=1e16, 'Not enough Collateral (min. 0.01 ETH)');
    require(isBorrowed[msg.sender] == false, 'There is already borrowed funds');

    //check if user doesn't have active loan

    //add msg.value to ether collateral
    collateralAmount[msg.sender] = collateralAmount[msg.sender] + msg.value;

    //calc tokens amount to mint, 50% of msg.value
    uint tokens = msg.value / 2;

    //mint&send tokens to user
    token.mint(msg.sender, tokens);

    //activate borrower's loan status
    isBorrowed[msg.sender] = true;
    borrowStart[msg.sender] = borrowStart[msg.sender] + block.timestamp;

    //emit event
    emit Borrow(msg.sender, collateralAmount[msg.sender], tokens, block.timestamp);
  }

  function payOff() public {
    //check if loan is active
    require(isBorrowed[msg.sender] = true, 'No outstanding loans');
    require(token.transferFrom(msg.sender, address(this), collateralAmount[msg.sender]/2), 'Error, cannot receive tokens');

    //transfer tokens from user back to the contract

    //calc fee
    uint base_fee = collateralAmount[msg.sender]/100; //1% fee
    //  5% interest/year
    uint value = (collateralAmount[msg.sender]/2)/1e16;
    uint rate = 3166801783 * 5;
    uint time = (block.timestamp - borrowStart[msg.sender]);
    uint interest = time * value * rate;
    uint totalFee = interest + base_fee;
    //send user's collateral minus fee
    msg.sender.transfer(collateralAmount[msg.sender] - totalFee);
    //reset borrower's data
    uint collateral = collateralAmount[msg.sender];
    collateralAmount[msg.sender] = 0;
    isBorrowed[msg.sender] = false;

    //emit event
    emit Cleared(msg.sender, collateral, totalFee);
  }
}