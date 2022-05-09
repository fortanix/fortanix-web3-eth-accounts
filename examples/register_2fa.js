require('dotenv').config();
const Accounts = require('../src');

const walletName = 'alice@acme.com';

const run = async () => {

	var accounts = new Accounts(process.env.providerUrl);

	const res_2fa = await accounts.register2fa(walletName);
	console.log(res_2fa);

};

run();
