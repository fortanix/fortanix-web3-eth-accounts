require('dotenv').config();
const Web3 = require('web3');
const Accounts = require('../src');


const run = async () => {

	const web3 = new Web3(process.env.providerUrl);
	const accounts = new Accounts(process.env.providerUrl);

	const address_alice = await accounts.getAddress('alice@acme.com', 0);
	const address_bob = await accounts.getAddress('bob@acme.com', 0);


	console.log(
		`Attempting to make a transaction from ${address_alice} to ${address_bob}`
	);

	// Compose the transaction
	const tx = {
		from: address_alice,
		to: address_bob,
		value: web3.utils.toWei('0.01', 'ether'),
		gas: '21000'
	};

	// Sign transaction
	const createTransaction = await accounts.signTransaction(tx, 'alice@acme.com', 0);

	// Send signed transaction
	const createReceipt = await web3.eth.sendSignedTransaction(
		createTransaction.rawTransaction
	);
	console.log(
		`Transaction successful with hash: ${createReceipt.transactionHash}`
	);

	// Recover the address used to sign the transaction
	console.log('Recovered Address:', accounts.recoverTransaction(createTransaction.rawTransaction));

	console.log('Done!');

};

run();
