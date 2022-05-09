require('dotenv').config();
const Accounts = require('../src');

const totp = '005300';
const walletName = 'cat@acme.com';
const keyIndex = 0;

const run = async () => {

	const accounts = new Accounts(process.env.providerUrl);

	const message = 'hello';
	const signature = await accounts.sign(message, walletName, keyIndex, totp);
	const messageHash = accounts.hashMessage(message);

	// There are three methods of recovering the address used to sign data

	// Method 1
	let recover = accounts.recover({
		messageHash: messageHash,
		v: signature.v,
		r: signature.r,
		s: signature.s
	});

	console.log('Recover (Method 1):', recover);

	// Method 2
	recover = accounts.recover(message, signature.signature);
	console.log('Recover (Method 2):', recover);

	// Method 3
	recover = accounts.recover(message, signature.v, signature.r, signature.s);
	console.log('Recover (Method 3):', recover);

	console.log('Done!');
};

run();
