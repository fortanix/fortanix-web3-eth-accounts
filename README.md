# Overview

`fortanix-web3-eth-accounts` is a drop in replacement for `web3.eth.accounts`. It extends the capability of applications that use `web3.js` to support an external HSM based signer with built in second factor authentication.  

# Contributing

We gratefully accept bug reports and contributions from the community.
By participating in this community, you agree to abide by [Code of Conduct](./CODE_OF_CONDUCT.md).
All contributions are covered under the Developer's Certificate of Origin (DCO).

## Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
have the right to submit it under the open source license
indicated in the file; or

(b) The contribution is based upon previous work that, to the best
of my knowledge, is covered under an appropriate open source
license and I have the right under that license to submit that
work with modifications, whether created in whole or in part
by me, under the same open source license (unless I am
permitted to submit under a different license), as indicated
in the file; or

(c) The contribution was provided directly to me by some other
person who certified (a), (b) or (c) and I have not modified
it.

(d) I understand and agree that this project and the contribution
are public and that a record of the contribution (including all
personal information I submit with it, including my sign-off) is
maintained indefinitely and may be redistributed consistent with
this project or the open source license(s) involved.

# License

This project is primarily distributed under the terms of the GNU Lesser General Public License (LGPL) 3.0, see [LICENSE](./LICENSE) for details.


# Brief description of the functions

`fortanix-web3-eth-accounts` contains functions to generate Ethereum accounts and sign transactions and data.

```
const Accounts = require('fortanix-web3-eth-accounts');

// Passing in the eth or web3 package is necessary to allow retrieving chainId,
// gasPrice and nonce automatically for accounts.signTransaction().

const accounts = new Accounts('ws://localhost:8546');
```

### register2fa

```
accounts.register2fa(walletName)
```

Generates a TOTP secret for wallet.

#### Parameters

- `walletName` - `string`: Name of the wallet.

#### Returns

`Promise` returning `object`: The signature object

- `url` - `string`: The otpauth url.
- `secret` - `string`: The secret.
- `issuer` - `string`: The issuer.
- `period` - `string`: The time period.
- `digits` - `string`: Number of digits of totp code.
- `algorithm` - `string`: The algorithm.
- `walletName` - `string`: The wallet name.

#### Example

```
accounts.register2fa('frank@acme.com')
> {
  url: 'otpauth://totp/Fortanix%20DSM:frank%40acme.com?secret=HH5BZOWZAVZGVNQ35IACKCBV&issuer=Fortanix%20DSM&period=30&digits=6&algorithm=SHA1',
  secret: 'HH5BZOWZAVZGVNQ35IACKCBV',
  issuer: 'Fortanix DSM',
  period: '30',
  digits: '6',
  algorithm: 'SHA1',
  walletName: 'frank@acme.com'
}
```


### sign

```
accounts.sign(data, walletName, keyIndex [, totpCode])
```

Signs arbitrary data.

#### Parameters

- `data` - `string`: The data to sign.
- `walletName` - `string`: Name of the wallet.
- `keyIndex` - `number`: Key index within that wallet.
- `totpCode` - `number`: TOTP code generated by authenticator app. Only to be provided if `walletName` has been registered with for 2FA using `register2fa`.

#### Returns

`Promise` returning `object`: The signature object

- `message` - `string`: The given message.
- `messageHash` - `string`: The hash of the given message.
- `r` - `string`: First 32 bytes of the signature
- `s` - `string`: Next 32 bytes of the signature
- `v` - `string`: Recovery value + 27

#### Example

```
accounts.sign('Some data', 'alice@acme.com', 0);
> {
    message: 'Some data',
    messageHash: '0x1da44b586eb0729ff70a73c326926f6ed5a25f5b056e7f47fbc6e58d86871655',
    v: '0x1c',
    r: '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd',
    s: '0x6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a029',
    signature: '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c'
}
```

### recover

```
accounts.recover(signatureObject);
accounts.recover(message, signature [, preFixed]);
accounts.recover(message, v, r, s [, preFixed]);
```

Recovers the Ethereum address which was used to sign the given data.

### Parameters

1. `message|signatureObject` - `string|object`: Either signed message or hash, or the signature object as following values:

    - `messageHash` - `string`: The hash of the given message already prefixed with "\x19Ethereum Signed Message:\n" + message.length + message.
    - `r` - `string`: First 32 bytes of the signature
    - `s` - `string`: Next 32 bytes of the signature
    - `v` - `string`: Recovery value + 27

2. `signature` - `string`: The raw RLP encoded signature, OR parameter 2-4 as v, r, s values.

3. `preFixed` - `boolean` (optional, default: false): If the last parameter is true, the given message will NOT automatically be prefixed with "\x19Ethereum Signed Message:\n" + message.length + message, and assumed to be already prefixed.

### Returns

`string`: The Ethereum address used to sign this data.

### Example

```
accounts.recover({
    messageHash: '0x1da44b586eb0729ff70a73c326926f6ed5a25f5b056e7f47fbc6e58d86871655',
    v: '0x1c',
    r: '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd',
    s: '0x6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a029'
})
> "0x2c7536E3605D9C16a7a3D7b1898e529396a65c23"

// message, signature
accounts.recover('Some data', '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c');
> "0x2c7536E3605D9C16a7a3D7b1898e529396a65c23"

// message, v, r, s
accounts.recover('Some data', '0x1c', '0xb91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd', '0x6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a029');
> "0x2c7536E3605D9C16a7a3D7b1898e529396a65c23"
```

### signTransaction

```
accounts.signTransaction(tx, walletName, keyIndex [, totpCode]);
```

Signs an Ethereum transaction with a given `walletName` and `keyIndex`.

#### Parameters

1. `tx` - `object`: The transaction object as follows:

    - `nonce` - `string`: (optional) The nonce to use when signing this transaction. Default will use web3.eth.getTransactionCount().
    - `chainId` - `string`: (optional) The chain id to use when signing this transaction. Default will use web3.eth.net.getId().
    - `to` - `string`: (optional) The recevier of the transaction, can be empty when deploying a contract.
    - `data` - `string`: (optional) The call data of the transaction, can be empty for simple value transfers.
    - `value` - `string`: (optional) The value of the transaction in wei.
    - `gasPrice` - `string`: (optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice()
    - `gas` - `string`: The gas provided by the transaction.
    - `chain` - `string`: (optional) Defaults to mainnet.
    - `hardfork` - `string`: (optional) Defaults to petersburg.
    - `common` - `object`: (optional) The common object
    - `customChain` - `object`: The custom chain properties
    - `name` - `string`: (optional) The name of the chain
    - `networkId` - `number`: Network ID of the custom chain
    - `chainId` - `number`: Chain ID of the custom chain
    - `baseChain` - `string`: (optional) mainnet, goerli, kovan, rinkeby, or ropsten
    - `hardfork` - `string`: (optional) chainstart, homestead, dao, tangerineWhistle, spuriousDragon, byzantium, constantinople, petersburg, or istanbul

2. `walletName` - `string`: The wallet name.

3. `keyIndex` - `number`: The key index.

4. `totpCode` - `number`: TOTP code generated by authenticator app. Only to be provided if `walletName` has been registered with for 2FA using `register2fa`.

#### Returns

1. `Promise` returning `object`: The signed data RLP encoded transaction.

    - `messageHash` - `string`: The hash of the given message.
    - `r` - `string`: First 32 bytes of the signature
    - `s` - `string`: Next 32 bytes of the signature
    - `v` - `string`: Recovery value + 27
    - `rawTransaction` - `string`: The RLP encoded transaction, ready to be send using web3.eth.sendSignedTransaction.
    - `transactionHash` - `string`: The transaction hash for the RLP encoded transaction.

#### Example

```
accounts.signTransaction({
    to: '0xF0109fC8DF283027b6285cc889F5aA624EaC1F55',
    value: '1000000000',
    gas: 2000000
}, 'alice@acme.com', 0)
.then(console.log);
> {
    messageHash: '0x31c2f03766b36f0346a850e78d4f7db2d9f4d7d54d5f272a750ba44271e370b1',
    v: '0x25',
    r: '0xc9cf86333bcb065d140032ecaab5d9281bde80f21b9687b3e94161de42d51895',
    s: '0x727a108a0b8d101465414033c3f705a9c7b826e596766046ee1183dbc8aeaa68',
    rawTransaction: '0xf869808504e3b29200831e848094f0109fc8df283027b6285cc889f5aa624eac1f55843b9aca008025a0c9cf86333bcb065d140032ecaab5d9281bde80f21b9687b3e94161de42d51895a0727a108a0b8d101465414033c3f705a9c7b826e596766046ee1183dbc8aeaa68'
    transactionHash: '0xde8db924885b0803d2edc335f745b2b8750c8848744905684c20b987443a9593'
}

accounts.signTransaction({
    to: '0xF0109fC8DF283027b6285cc889F5aA624EaC1F55',
    value: '1000000000',
    gas: 2000000,
    gasPrice: '234567897654321',
    nonce: 0,
    chainId: 1
}, 'alice@acme.com', 0)
.then(console.log);
> {
    messageHash: '0x6893a6ee8df79b0f5d64a180cd1ef35d030f3e296a5361cf04d02ce720d32ec5',
    r: '0x9ebb6ca057a0535d6186462bc0b465b561c94a295bdb0621fc19208ab149a9c',
    s: '0x440ffd775ce91a833ab410777204d5341a6f9fa91216a6f3ee2c051fea6a0428',
    v: '0x25',
    rawTransaction: '0xf86a8086d55698372431831e848094f0109fc8df283027b6285cc889f5aa624eac1f55843b9aca008025a009ebb6ca057a0535d6186462bc0b465b561c94a295bdb0621fc19208ab149a9ca0440ffd775ce91a833ab410777204d5341a6f9fa91216a6f3ee2c051fea6a0428'
    transactionHash: '0xd8f64a42b57be0d565f385378db2f6bf324ce14a594afc05de90436e9ce01f60'
}

// or with a common
accounts.signTransaction({
    to: '0xF0109fC8DF283027b6285cc889F5aA624EaC1F55',
    value: '1000000000',
    gas: 2000000
    common: {
      baseChain: 'mainnet',
      hardfork: 'petersburg',
      customChain: {
        name: 'custom-chain',
        chainId: 1,
        networkId: 1
      }
    }
}, 'alice@acme.com', 0)
.then(console.log);
```

### recoverTransaction

```
accounts.recoverTransaction(rawTransaction);
```

Recovers the Ethereum address which was used to sign the given RLP encoded transaction.

#### Parameters

1. `signature` - `string`: The RLP encoded transaction.

#### Returns

`string`: The Ethereum address used to sign this transaction.

#### Example

```
accounts.recoverTransaction('0xf86180808401ef364594f0109fc8df283027b6285cc889f5aa624eac1f5580801ca031573280d608f75137e33fc14655f097867d691d5c4c44ebe5ae186070ac3d5ea0524410802cdc025034daefcdfa08e7d2ee3f0b9d9ae184b2001fe0aff07603d9');
> "0xF0109fC8DF283027b6285cc889F5aA624EaC1F55"
```

### hashMessage

```
accounts.hashMessage(message);
```

Hashes the given message to be passed to accounts.recover() function. The data will be UTF-8 HEX decoded and enveloped as follows: `"\x19Ethereum Signed Message:\n" + message.length + message` and hashed using keccak256.

#### Parameters

`message` - `string`: A message to hash, if its HEX it will be UTF8 decoded before.

#### Returns

`string`: The hashed message

#### Example

```
accounts.hashMessage("Hello World")
> "0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2"

// the below results in the same hash
web3.eth.accounts.hashMessage(web3.utils.utf8ToHex("Hello World"))
> "0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2"
```

### getAddress

```
accounts.getAddress(walletName, keyIndex);
```

Returns the unique Ethereum address given a `walletName` and a `keyIndex`.

#### Parameters

- `walletName` - `string`: The name of the wallet.
- `keyIndex` - `number`: The index of the key.


#### Returns

`string`: The Ethereum address.

#### Example

```
accounts.getAddress(walletName, keyIndex)
> "0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2"
```

## Setting variables in the .env file

- `signerUrl`: This is the URL of the signer.
- `signerId`: UUID of Ethereum Signer Plugin.
- `masterKeyId`: UUID of master key.
- `signerAccessToken`: App API key.
- `providerUrl`: URL of the node provider.  

#### Example

Example .env file:

```
signerUrl='https://sdkms.fortanix.com/sys/'
signerId='4211ab3a-2fc2-42ec-a5fe-86e1ae0023e1'
masterKeyId='856e17d5-2e12-f2e1-b3fe-90f1a2113a0e'
signerAccessToken='M3M0OWJiYzYtNGM5NC00ZDgxLTk3MGYtODg0YTYwODAwNGU0OlJpQ0xzMzRUcEZpenU0dnlJelRQUnBPRE0kSn0CRUttYkFUOVpSQ3Y4cFBXYkV3R1lpcmlhZElHbS0CU1J0N3lpN2FhLXh0TUZqMUlsdmJhelJPdzNR'
providerUrl='http://127.0.0.1:7545/'
```
