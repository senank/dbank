const Token = artifacts.require("Token");
const dBank = artifacts.require("dBank");
// importing smart contracts as javascript
// these would be converted into the abis (better called artifacts)
// moves smartcontract from computer to blockchain
// file ordered for running orders

module.exports = async function(deployer) {
	//deploy Token - truffle deployer
	await deployer.deploy(Token)
	//assign token into variable to get it's address
	const token = await Token.deployed()
	
	//pass token address for dBank contract(for future minting)
	await deployer.deploy(dBank, token.address)

	//assign dBank contract into variable to get it's address
	const dbank = await dBank.deployed()

	//change token's owner/minter from deployer to dBank
	await token.passMinterRole(dbank.address)
};