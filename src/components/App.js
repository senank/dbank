import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../abis/dBank.json'
import React, { Component } from 'react';
import Token from '../abis/Token.json'
import dbank from '../dbank.png';
import Web3 from 'web3';
import './App.css';

//h0m3w0rk - add new tab to check accrued interest

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum!=='undefined'){ // checking if metamask exists
      const web3 = new Web3(window.ethereum) // assigning metamask 'cookie' to var
      const netId = await web3.eth.net.getId() // assign networkID
      const accts = await web3.eth.getAccounts() // assigning wallet addresses from account
      
      if(typeof accts[0]!=='undefined'){ //check if account is detected, then load balance&setStates, elsepush alert
        const balance = await web3.eth.getBalance(accts[0])
        this.setState({account: accts[0], balance: balance, web3: web3})
      } else {
        window.alert('Please login with metamask')
      }
    
    //in try block load contracts
      try {
      // bank
        const dBankAddress = dBank.networks[netId].address
        const dbank = new web3.eth.Contract(dBank.abi, dBankAddress)
        // token
        const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address)
        this.setState({token, dbank, dBankAddress})
      } catch(e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }
    } else { //if MetaMask not exists push alert
      window.alert('Please install metamask')
    }
    
  }

  async deposit(amount) {
    //check if this.state.dbank is ok
    console.log(amount)
    console.log(this.state.dbank)
    //in try block call dBank deposit();
    if(this.state.dbank!=='undefined'){
      try {
        await this.state.dbank.methods.deposit().send({value: amount.toString(), from: this.state.account})
        window.alert('Successfully deposited')
      } catch(e) {
        console.log('Error, deposit: ', e)
      }
    } else {
      console.log('error fadfasfa')
    }
  }

  async withdraw(e) {
    //prevent button from default click
    e.preventDefault()
    if(this.state.dbank!=='undefined'){
      try{
        await this.state.dbank.methods.withdraw().send({from: this.state.account})
        window.alert('Successfully withdrawn')
      } catch (e) {
        console.log('Error, withdraw ', e)
      }
    } else {
      console.log('Nothing to withdraw from this account')
    }
    //check if this.state.dbank is ok
    //in try block call dBank withdraw();
  }

  async borrow(amount) {
    if(this.state.dbank!=='undefined'){
      try{
        await this.state.dbank.methods.borrow().send({value: amount.toString(), from: this.state.account})
      } catch (e) {
        console.log('Error, borrow: ', e)
      }
    }
  }

  async payOff(e) {
    e.preventDefault()
    if(this.state.dbank!=='undefined'){
      try{
        const collateralAmount = await this.state.dbank.methods.collateralAmount(this.state.account).call({from: this.state.account})
        const tokenBorrowed = collateralAmount/2
        await this.state.token.methods.approve(this.state.dBankAddress, tokenBorrowed.toString()).send({from: this.state.account})
        await this.state.dbank.methods.payOff().send({from: this.state.account})
      } catch(e) {
        console.log('Error, pay off: ', e)
      }
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      dBankAddress: null
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
        <img src={dbank} className="App-logo" alt="logo" height="32"/>
          <b>dBank</b>
        </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome to My Decentralized Bank</h1>
          <h2>{this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
                <Tab eventKey="deposit" title="Deposit">
                  <div>
                    <br></br>
                    How much would you like to deposit
                    <br></br>
                    (min. amount is 0.01 ETH)
                    <br></br>
                    (1 active deposit possible at a time)
                    <br></br>
                    <form onSubmit={(e) => {
                      /* prevent page from refreshing*/
                      e.preventDefault()
                      /* converting ETH to wei */
                      let amount = this.depositAmount.value
                      amount = Web3.utils.toWei(amount)
                      /* pass amount to deposit function*/
                      this.deposit(amount)
                    }}>
                      <div className = 'form-group mr-sm-2'>
                        <br></br>
                        <input
                          id='depositAmount'
                          step='0.01'
                          type='number'
                          className='form-control form-control-md'
                          placeholder='amount'
                          required
                          ref={(input) => {this.depositAmount = input}}
                        />
                      </div>
                      <button type='submit' className='btn btn-primary'>DEPOSIT</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="withdraw" title="Withdraw">
                  <div>
                    <br></br>
                    Do you want to withdraw with current accrued interest
                  </div>
                  <button type='submit' className='btn btn-primary' 
                  onClick={(e) => this.withdraw(e)}
                  >Withdraw</button>
                </Tab>
                <Tab eventKey="borrow" title="Borrow">
                  <div>

                  <br></br>
                    Do you want to borrow tokens?
                    <br></br>
                    (You'll get 50% of collateral, in Tokens)
                    <br></br>
                    Type collateral amount (in ETH)
                    <br></br>
                    <br></br>
                    <form onSubmit={(e) => {

                      e.preventDefault()
                      let amount = this.borrowAmount.value
                      amount = amount * 10 **18 //convert to wei
                      this.borrow(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='borrowAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.borrowAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>BORROW</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="payOff" title="Payoff">
                  <div>

                  <br></br>
                    Do you want to payoff the loan?
                    <br></br>
                    (You'll receive your collateral - fee)
                    <br></br>
                    <br></br>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.payOff(e)}>PAYOFF</button>
                  </div>
                </Tab>
              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;