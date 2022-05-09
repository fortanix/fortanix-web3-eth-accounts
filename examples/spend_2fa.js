/*
* Copyright (c) Fortanix, Inc.
* 
* This program is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 3 of the License, or (at your option) any later version.
* 
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
* 
* You should have received a copy of the GNU Lesser General Public License
* along with this program; if not, write to the Free Software Foundation,
* Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

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
