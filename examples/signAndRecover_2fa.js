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
