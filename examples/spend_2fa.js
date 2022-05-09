require('dotenv').config();
const Web3 = require('web3');
const Accounts = require('../src');

const totp = '627420';


const run = async () => {

	const web3 = new Web3(process.env.providerUrl);
	var accounts = new Accounts(process.env.providerUrl);

	var address_alice = await accounts.getAddress('alice@acme.com', 0);
	var address_bob = await accounts.getAddress('bob@acme.com', 0);

	// Compose the transaction
	const tx = {
		from: address_alice,
		to: address_bob,
		value: web3.utils.toWei('0.01', 'ether'),
		gas: '21000'
	};

	// Sign transaction
	const createTransaction = await accounts.signTransaction(tx, 'alice@acme.com', 0, totp);

	// Send signed transaction
	const createReceipt = await web3.eth.sendSignedTransaction(
		createTransaction.rawTransaction
	);
	console.log(
		`Transaction successful with hash: ${createReceipt.transactionHash}`
	);

	console.log('Done!');
};

run();
