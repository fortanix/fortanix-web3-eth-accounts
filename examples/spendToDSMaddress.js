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
