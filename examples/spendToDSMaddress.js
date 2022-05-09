const Web3 = require('web3');

//From Ganache
const privKeyFrom = '20d0c626aa6e63a945e6836494ba5285c9ca1d379a32cd7fb6171fb4048f95ee';
const addressFrom = '0x41Eb3c13b07E32b7D23218272bd28926219D7ce7';

//Use getAddress.js to generate a DSM address
const addressTo = '0x3593f9ae876b2971e9352ed183eed283c6f65111';

const web3 = new Web3('http://127.0.0.1:7545/');


// Create transaction
const deploy = async () => {
	console.log(
		`Attempting to make transaction from ${addressFrom} to ${addressTo}`
	);

	const createTransaction = await web3.eth.accounts.signTransaction(
		{
			from: addressFrom,
			to: addressTo,
			value: web3.utils.toWei('10', 'ether'),
			gas: '21000',
		},
		privKeyFrom
	);

	// Deploy transaction
	const createReceipt = await web3.eth.sendSignedTransaction(
		createTransaction.rawTransaction
	);
	console.log(
		`Transaction successful with hash: ${createReceipt.transactionHash}`
	);
};

deploy();
