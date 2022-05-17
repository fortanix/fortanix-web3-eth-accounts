// This module was modified from https://github.com/ChainSafe/web3.js/blob/1.x/packages/web3-eth-accounts/src/index.js

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

/*
* [LICENSE of original code]
* 
* web3.js is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* web3.js is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
* 
* You should have received a copy of the GNU Lesser General Public License
* along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/

const core = require('web3-core');
const Method = require('web3-core-method');
const utils = require('web3-utils');
const axios = require('axios');
const ethereumjsUtil = require('ethereumjs-util');
const helpers = require('web3-core-helpers');
const {TransactionFactory} = require('@ethereumjs/tx');
const Common = require('@ethereumjs/common').default;
const HardForks = require('@ethereumjs/common').Hardfork;
const Account = require('eth-lib/lib/account');
const rsvSig = require('rsv-signature');
const publicKeyToAddress = require('ethereum-public-key-to-address');


function isNullish(value) {
	return (typeof value === 'undefined') || value === null;
}


//------------------------------------------------------------------------------
//-----------------------------Fortanix DSM-------------------------------------
//------------------------------------------------------------------------------

async function connectDSM() {

	let token;

	const config = {
		method: 'post',
		url: `${process.env.signerUrl  }v1/session/auth`,
		headers: {
			'Authorization': `Basic ${process.env.signerAccessToken}`
		}
	};

	try {
		const response = await axios(config);
		token = response.data.access_token;
	} catch (error) {
		console.log(error);
	}

	return { token };
}

async function registerDSM(walletName) {

	let url, secret, issuer, period, digits, algorithm;
	const ret = await connectDSM();

	const dataobj = {
		operation: 'register',
		walletName: walletName
	};

	const config = {
		method: 'post',
		url: `${process.env.signerUrl}v1/plugins/${process.env.signerId}`,
		headers: {
			'Authorization': `Bearer ${ret.token}`,
			'Content-Type': 'text/plain'
		},
		data : JSON.stringify(dataobj)
	};

	try {
		const response = await axios(config);
		url = response.data.url;

		const currentUrl = new URL(url);
		const searchParams = currentUrl.searchParams;

		secret = searchParams.get('secret');
		issuer = searchParams.get('issuer');
		period = searchParams.get('period');
		digits = searchParams.get('digits');
		algorithm = searchParams.get('algorithm');

	} catch (error) {
		console.log(error);
	}

	return {
		url: url,
		secret: secret,
		issuer: issuer,
		period: period,
		digits: digits,
		algorithm: algorithm,
		walletName: walletName
	};
}


async function signDSM(walletName, keyIndex, hash, totp) {

	const ret = await connectDSM();

	if (totp !== undefined) {
		totp = totp.toString();
	}

	const dataobj = {
		operation: 'sign',
		walletName: walletName,
		keyIndex: keyIndex.toString(),
		msgHash: hash,
		code: totp
	};

	let r, s, xpub;
	const config = {
		method: 'post',
		url: `${process.env.signerUrl}v1/plugins/${process.env.signerId}`,
		headers: {
			'Authorization': `Bearer ${ret.token}`,
			'Content-Type': 'text/plain'
		},
		data : JSON.stringify(dataobj)
	};

	try {
		const response = await axios(config);
		r = response.data.r;
		s = response.data.s;
		xpub = response.data.xpub;
	} catch (error) {
		console.log(error);
	}

	return {
		r: r,
		s: s,
		xpub: xpub
	};

}


//------------------------------------------------------------------------------
//---------------------------------Accounts-------------------------------------
//------------------------------------------------------------------------------

class Accounts {
	constructor() {
	
		core.packageInit(this, arguments);

		// remove unecessary core functions
		delete this.BatchRequest;
		delete this.extend;

		const _ethereumCall = [
			new Method({
				name: 'getNetworkId',
				call: 'net_version',
				params: 0,
				outputFormatter: parseInt
			}),
			new Method({
				name: 'getChainId',
				call: 'eth_chainId',
				params: 0,
				outputFormatter: utils.hexToNumber
			}),
			new Method({
				name: 'getGasPrice',
				call: 'eth_gasPrice',
				params: 0
			}),
			new Method({
				name: 'getTransactionCount',
				call: 'eth_getTransactionCount',
				params: 2,
				inputFormatter: [(address) => {
					if (utils.isAddress(address)) {
						return address;
					} else {
						throw new Error(`Address ${address} is not a valid address to get the 'transactionCount'.`);
					}
				}, () => 'latest' ]
			}),
			new Method({
				name: 'getBlockByNumber',
				call: 'eth_getBlockByNumber',
				params: 2,
				inputFormatter: [(blockNumber) => blockNumber ? utils.toHex(blockNumber) : 'latest', () => false ]
			}),
		];
		// attach methods to this._ethereumCall
		this._ethereumCall = {};
		_ethereumCall.forEach((method) => {
			method.attachToObject(this._ethereumCall);
			method.setRequestManager(this._requestManager);
		});

	}
	async getAddress(walletName, keyIndex) {

		let address;
		const ret = await connectDSM();

		const dataobj = {
			operation: 'getPubKey',
			walletName: walletName,
			keyIndex: keyIndex.toString()
		};

		const config = {
			method: 'post',
			url: `${process.env.signerUrl}v1/plugins/${process.env.signerId}`,
			headers: {
				'Authorization': `Bearer ${ret.token}`,
				'Content-Type': 'text/plain'
			},
			data: JSON.stringify(dataobj)
		};


		try {
			const response = await axios(config);
			address = publicKeyToAddress(response.data.xpub).toLowerCase();
		} catch (error) {
			console.log(error);
		}

		return address;
	}
	//signTransaction
	async signTransaction(tx, walletName, keyIndex, totp) {
		const hasTxSigningOptions = !!(tx && ((tx.chain && tx.hardfork) || tx.common));

		let error = false;
		let transactionOptions = {};

		if (!tx) {
			throw new Error('No transaction object given!');
		}


		if (!isNullish(tx.common) && isNullish(tx.common.customChain)) {
			throw new Error('If tx.common is provided it must have tx.common.customChain');
		}

		if (!isNullish(tx.common) && isNullish(tx.common.customChain.chainId)) {
			throw new Error('If tx.common is provided it must have tx.common.customChain and tx.common.customChain.chainId');
		}


		if (!isNullish(tx.common) && !isNullish(tx.common.customChain.chainId) && !isNullish(tx.chainId) && tx.chainId !== tx.common.customChain.chainId) {
			throw new Error('Chain Id doesnt match in tx.chainId tx.common.customChain.chainId');
		}


		async function signed(tx) {
			const error = _validateTransactionForSigning(tx);

			if (error) {
				return Promise.reject(error);
			}

			try {
				let transaction = helpers.formatters.inputCallFormatter(Object.assign({}, tx));
				transaction.data = transaction.data || '0x';
				transaction.value = transaction.value || '0x';
				transaction.gasLimit = transaction.gasLimit || transaction.gas;
				if (transaction.type === '0x1' && transaction.accessList === undefined)
					transaction.accessList = [];

				// Because tx has no @ethereumjs/tx signing options we use fetched vals.
				if (!hasTxSigningOptions) {
					transactionOptions.common = Common.forCustomChain(
						'mainnet',
						{
							name: 'custom-network',
							networkId: transaction.networkId,
							chainId: transaction.chainId
						},
						transaction.hardfork || HardForks.London
					);

					delete transaction.networkId;
				} else {
					if (transaction.common) {
						transactionOptions.common = Common.forCustomChain(
							transaction.common.baseChain || 'mainnet',
							{
								name: transaction.common.customChain.name || 'custom-network',
								networkId: transaction.common.customChain.networkId,
								chainId: transaction.common.customChain.chainId
							},
							transaction.common.hardfork || HardForks.London
						);

						delete transaction.common;
					}

					if (transaction.chain) {
						transactionOptions.chain = transaction.chain;
						delete transaction.chain;
					}

					if (transaction.hardfork) {
						transactionOptions.hardfork = transaction.hardfork;
						delete transaction.hardfork;
					}
				}
				const ethTx = TransactionFactory.fromTxData(transaction, transactionOptions);

				//sign
				let r, s, v;
				const hash = ethTx.getMessageToSign(true).toString('hex');

				const ret = await signDSM(walletName, keyIndex, hash, totp);
				r = ret.r;
				s = ret.s;

				//fix v
				const pub = (0, ethereumjsUtil.ecrecover)(Buffer.from(hash, 'hex'), 27, Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
				const recoveredAddress = `0x${ethereumjsUtil.pubToAddress(pub).toString('hex')}`;

				if (tx.from == recoveredAddress) {
					v = 27;
				} else {
					v = 28;
				}

				const signedTx = ethTx._processSignature(v, Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
				const validationErrors = signedTx.validate(true);

				if (validationErrors.length > 0) {
					let errorString = 'Signer Error: ';
					for (const validationError of validationErrors) {
						errorString += ` ${validationError}.`;
					}
					throw new Error(errorString);
				}

				const rlpEncoded = signedTx.serialize().toString('hex');
				const rawTransaction = `0x${rlpEncoded}`;
				const transactionHash = utils.keccak256(rawTransaction);

				const result = {
					messageHash: `0x${Buffer.from(signedTx.getMessageToSign(true)).toString('hex')}`,
					v: `0x${signedTx.v.toString('hex')}`,
					r: `0x${signedTx.r.toString('hex')}`,
					s: `0x${signedTx.s.toString('hex')}`,
					rawTransaction: rawTransaction,
					transactionHash: transactionHash
				};

				return result;

			} catch (e) {
				return Promise.reject(e);
			}
		}

		tx.type = _handleTxType(tx);

		// Resolve immediately if nonce, chainId, price and signing options are provided
		if (tx.nonce !== undefined &&
			tx.chainId !== undefined &&
			(tx.gasPrice !== undefined ||
				(tx.maxFeePerGas !== undefined &&
					tx.maxPriorityFeePerGas !== undefined
				)
			) &&
			hasTxSigningOptions) {
			return Promise.resolve(signed(tx));
		}

		// Otherwise, get the missing info from the Ethereum Node
		return Promise.all([
			((isNullish(tx.common) || isNullish(tx.common.customChain.chainId)) ? //tx.common.customChain.chainId is not optional inside tx.common if tx.common is provided
				(isNullish(tx.chainId) ? this._ethereumCall.getChainId() : tx.chainId)
				: undefined),
			isNullish(tx.nonce) ? this._ethereumCall.getTransactionCount(tx.from) : tx.nonce,
			isNullish(hasTxSigningOptions) ? this._ethereumCall.getNetworkId() : 1,
			_handleTxPricing(this, tx)
		]).then((args) => {
			const [txchainId, txnonce, txnetworkId, txgasInfo] = args;

			if ((isNullish(txchainId) && isNullish(tx.common) && isNullish(tx.common.customChain.chainId)) || isNullish(txnonce) || isNullish(txnetworkId) || isNullish(txgasInfo)) {
				throw new Error(`One of the values 'chainId', 'networkId', 'gasPrice', or 'nonce' couldn't be fetched: ${JSON.stringify(args)}`);
			}

			return signed({
				...tx,
				...((isNullish(tx.common) || isNullish(tx.common.customChain.chainId)) ? { chainId: txchainId } : {}),
				nonce: txnonce,
				networkId: txnetworkId,
				...txgasInfo // Will either be gasPrice or maxFeePerGas and maxPriorityFeePerGas
			});
		});

	}
	//recoverTransaction
	/* jshint ignore:start */
	//Accounts.prototype.recoverTransaction = function recoverTransaction(rawTx, txOptions = {}) {
	recoverTransaction(rawTx) {
		// Rely on EthereumJs/tx to determine the type of transaction
		const data = Buffer.from(rawTx.slice(2), 'hex');
		const tx = TransactionFactory.fromSerializedData(data);
		//update checksum
		return utils.toChecksumAddress(tx.getSenderAddress().toString('hex'));
	}
	/* jshint ignore:end */
	//recover
	recover(message, signature, preFixed) {
		const args = [].slice.apply(arguments);

		if (!!message && typeof message === 'object') {
			return this.recover(message.messageHash, Account.encodeSignature([message.v, message.r, message.s]), true);
		}

		if (!preFixed) {
			message = this.hashMessage(message);
		}

		if (args.length >= 4) {
			preFixed = args.slice(-1)[0];
			preFixed = typeof preFixed === 'boolean' ? !!preFixed : false;

			return this.recover(message, Account.encodeSignature(args.slice(1, 4)), preFixed); // v, r, s
		}
		return Account.recover(message, signature);
	}
	//hashMessage
	hashMessage(data) {
		const messageHex = utils.isHexStrict(data) ? data : utils.utf8ToHex(data);
		const messageBytes = utils.hexToBytes(messageHex);
		const messageBuffer = Buffer.from(messageBytes);
		const preamble = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
		const preambleBuffer = Buffer.from(preamble);
		const ethMessage = Buffer.concat([preambleBuffer, messageBuffer]);
		return ethereumjsUtil.bufferToHex(ethereumjsUtil.keccak256(ethMessage));
	}
	//sign
	async sign(data, walletName, keyIndex, totp) {

		//sign
		let r, s, v, signature, recoveryParam;
		const hash = this.hashMessage(data).slice(2);

		const ret = await signDSM(walletName, keyIndex, hash, totp);
		r = ret.r;
		s = ret.s;
		const xpub = ret.xpub;

		const address = publicKeyToAddress(xpub).toLowerCase();

		//fix v
		const pub = (0, ethereumjsUtil.ecrecover)(Buffer.from(hash, 'hex'), 27, Buffer.from(r, 'hex'), Buffer.from(s, 'hex'));
		const recoveredAddress = `0x${ethereumjsUtil.pubToAddress(pub).toString('hex')}`;

		if (address == recoveredAddress) {
			v = 27;
			recoveryParam = 0;
		} else {
			v = 28;
			recoveryParam = 1;
		}

		//compute signature here from r, s, recoveryParam
		signature = rsvSig.serializeSignature({ r: r, s: s, recoveryParam: recoveryParam });

		//return
		return {
			message: data,
			messageHash: hash,
			v: `0x${v.toString(16)}`,
			r: `0x${r}`,
			s: `0x${s}`,
			signature: signature
		};

	}
	//sign
	async register2fa(walletName) {
		return await registerDSM(walletName);
	}
}




function _validateTransactionForSigning(tx) {

	if (tx.common && (tx.chain && tx.hardfork)) {
		throw new Error(
			'Please provide the @ethereumjs/common object or the chain and hardfork property but not all together.'
		);
	}

	if ((tx.chain && !tx.hardfork) || (tx.hardfork && !tx.chain)) {
		throw new Error(
			'When specifying chain and hardfork, both values must be defined. ' +
            `Received 'chain': ${tx.chain}, 'hardfork': ${tx.hardfork}`
		);
	}

	if (
		(!tx.gas && !tx.gasLimit) &&
        (!tx.maxPriorityFeePerGas && !tx.maxFeePerGas)
	) {
		throw new Error('\'gas\' is missing');
	}

	if (tx.gas && tx.gasPrice) {
		if (tx.gas < 0 || tx.gasPrice < 0) {
			throw new Error('Gas or gasPrice is lower than 0');
		}
	} else {
		if (tx.maxPriorityFeePerGas < 0 || tx.maxFeePerGas < 0) {
			throw new Error('maxPriorityFeePerGas or maxFeePerGas is lower than 0');
		}
	}

	if (tx.nonce < 0 || tx.chainId < 0) {
		throw new Error('Nonce or chainId is lower than 0');
	}


	return;
}

function _handleTxType(tx) {
	// Taken from https://github.com/ethers-io/ethers.js/blob/2a7ce0e72a1e0c9469e10392b0329e75e341cf18/packages/abstract-signer/src.ts/index.ts#L215
	const hasEip1559 = (tx.maxFeePerGas !== undefined || tx.maxPriorityFeePerGas !== undefined);

	let txType;

	if (tx.type !== undefined) {
		txType = utils.toHex(tx.type);
	} else if (tx.type === undefined && hasEip1559) {
		txType = '0x2';
	}

	if (tx.gasPrice !== undefined && (txType === '0x2' || hasEip1559))
		throw Error('eip-1559 transactions don\'t support gasPrice');
	if ((txType === '0x1' || txType === '0x0') && hasEip1559)
		throw Error('pre-eip-1559 transaction don\'t support maxFeePerGas/maxPriorityFeePerGas');

	if (
		hasEip1559 ||
        ((tx.common && tx.common.hardfork && tx.common.hardfork.toLowerCase() === HardForks.London) ||
            (tx.hardfork && tx.hardfork.toLowerCase() === HardForks.London)
        )
	) {
		txType = '0x2';
	} else if (
		tx.accessList ||
        ((tx.common && tx.common.hardfork && tx.common.hardfork.toLowerCase() === HardForks.Berlin) ||
            (tx.hardfork && tx.hardfork.toLowerCase() === HardForks.Berlin)
        )
	) {
		txType = '0x1';
	}

	return txType;
}


function _handleTxPricing(_this, tx) {
	return new Promise((resolve, reject) => {
		try {
			if (
				(tx.type === undefined || tx.type < '0x2')
                && tx.gasPrice !== undefined
			) {
				// Legacy transaction, return provided gasPrice
				resolve({ gasPrice: tx.gasPrice });
			} else {
				Promise.all([
					_this._ethereumCall.getBlockByNumber(),
					_this._ethereumCall.getGasPrice()
				]).then(responses => {
					const [block, gasPrice] = responses;
					if (
						(tx.type === '0x2') &&
                        block && block.baseFeePerGas
					) {
						// The network supports EIP-1559

						// Taken from https://github.com/ethers-io/ethers.js/blob/ba6854bdd5a912fe873d5da494cb5c62c190adde/packages/abstract-provider/src.ts/index.ts#L230
						let maxPriorityFeePerGas, maxFeePerGas;

						if (tx.gasPrice) {
							// Using legacy gasPrice property on an eip-1559 network,
							// so use gasPrice as both fee properties
							maxPriorityFeePerGas = tx.gasPrice;
							maxFeePerGas = tx.gasPrice;
							delete tx.gasPrice;
						} else {
							maxPriorityFeePerGas = tx.maxPriorityFeePerGas || '0x9502F900'; // 2.5 Gwei
							maxFeePerGas = tx.maxFeePerGas ||
                                utils.toHex(utils.toBN(block.baseFeePerGas).mul(utils.toBN(2)).add(utils.toBN(maxPriorityFeePerGas))
                                );
						}
						resolve({ maxFeePerGas, maxPriorityFeePerGas });
					} else {
						if (tx.maxPriorityFeePerGas || tx.maxFeePerGas)
							throw Error('Network doesn\'t support eip-1559');
						resolve({ gasPrice });
					}
				});
			}
		} catch (error) {
			reject(error);
		}
	});
}


module.exports = Accounts;
