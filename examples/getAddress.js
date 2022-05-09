require('dotenv').config();
const Accounts = require('../src');

const walletName = 'alice@acme.com';
const keyIndex = 0;

const run = async () => {
	const accounts = new Accounts(process.env.providerUrl);
	console.log('Address: ', await accounts.getAddress(walletName, keyIndex));
};

run();
