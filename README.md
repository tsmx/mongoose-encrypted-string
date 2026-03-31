# [**@tsmx/mongoose-encrypted-string**](https://github.com/tsmx/mongoose-encrypted-string)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![npm (scoped)](https://img.shields.io/npm/v/@tsmx/mongoose-encrypted-string)
![node-current (scoped)](https://img.shields.io/node/v/@tsmx/mongoose-encrypted-string)
[![Build Status](https://img.shields.io/github/actions/workflow/status/tsmx/mongoose-encrypted-string/git-build.yml?branch=master)](https://img.shields.io/github/actions/workflow/status/tsmx/mongoose-encrypted-string/git-build.yml?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/tsmx/mongoose-encrypted-string/badge.svg?branch=master)](https://coveralls.io/github/tsmx/mongoose-encrypted-string?branch=master)

> `EncryptedString` type for Mongoose schemas. Provides AES-256-GCM and AES-256-CBC encryption-at-rest for strings.

The AES-256-GCM algorithm provides a cryptographic tamper-safety of the encrypted data and should be preferred over AES-256-CBC. See also the [migration guide](#migrating-from-aes-cbc-to-aes-gcm) if you are already using AES-256-CBC.

## Usage

```js
var mongoose = require('mongoose');
const mes = require('@tsmx/mongoose-encrypted-string');
const key = 'YOUR KEY HERE';

// register the new type EncryptedString
mes.registerEncryptedString(mongoose, key);

// use EncryptedString in your schemas
Person = mongoose.model('Person', {
    id: { type: String, required: true },
    firstName: { type: mongoose.Schema.Types.EncryptedString },
    lastName: { type: mongoose.Schema.Types.EncryptedString }
});

let testPerson = new Person();
testPerson.id = 'id-test';
testPerson.firstName = 'Hans'; // stored AES-256-GCM encrypted
testPerson.lastName = 'Müller'; // stored AES-256-GCM encrypted
await testPerson.save();


let queriedPerson = await Person.findOne({ id: 'id-test' });
console.log(queriedPerson.firstName); // 'Hans', decrypted automatically
console.log(queriedPerson.lastName); // 'Müller', decrypted automatically
```
Directly querying the MongoDB will return the encrypted data. With the default AES-256-GCM algorithm, each encrypted field is stored as a 3-part string (`iv|authTag|ciphertext`). AES-256-CBC produces a 2-part string (`iv|ciphertext`).
```bash
> db.persons.findOne({ id: 'id-test' });
{
        "_id" : ObjectId("5f8576cc0a6ca01d8e5c479c"),
        "id" : "id-test",
        "firstName" : "66db1589b5c0de7f98f5260092e6799f|a3f1c2e4b5d6789012345678abcdef01|a6cb74bc05a52d1244addb125352bb0d",
        "lastName" : "2b85f4ca2d98ad1234da376a6d0d9128|9f8e7d6c5b4a3210fedcba9876543210|d5b0257d3797da7047bfea6dfa62e19c",
        "__v" : 0
}
```

## API

### registerEncryptedString(mongoose, key[, algorithm])

Registers the new type `EncryptedString` in the `mongoose` instance's schema types. Encryption/decryption is done using the given `key` and `algorithm` (default: `aes-256-gcm`). After calling this function you can start using the new type via `mongoose.Schema.Types.EncryptedString` in your schemas.

#### mongoose

The mongoose instance where `EncryptedString` should be registered.

#### key

The key used for encryption/decryption. Length must be 32 bytes. See [notes](#notes) for details.

#### algorithm

Optional. The encryption algorithm to use. Accepted values: `aes-256-gcm`, `aes-256-cbc`. Default: `aes-256-gcm`. Throws an `Error` if an unsupported value is passed.

## Use with lean() queries

For performance reasons it may be useful to use Mongoose's `lean()` queries. Doing so, the query will return the raw JSON objects from the MongoDB database where all properties of type `EncryptedString` are encrypted.

To get the clear text values back you can directly use [@tsmx/string-crypto](https://www.npmjs.com/package/@tsmx/string-crypto) which is also used internally in this package for encryption and decryption.

```js
const key = 'YOUR KEY HERE';
const sc = require('@tsmx/string-crypto');

// query raw objects with encrypted string values, either AES-256-GCM or AES-256-CBC
let person = await Person.findOne({ id: 'id-test' }).lean();

// decrypt using string-crypto (algorithm is detected automatically)
let firstName = sc.decrypt(person.firstName, { key: key });
let lastName = sc.decrypt(person.lastName, { key: key });
```

## Notes

- Encryption/decryption is done via the package [@tsmx/string-crypto](https://www.npmjs.com/package/@tsmx/string-crypto).
- Key length must be 32 bytes. The key can be provided as
    - a string of 32 characters length, or
    - a hexadecimal value of 64 characters length (= 32 bytes)
- Don't override getters/setter for `EncryptedString` class or schema elements of this type. This would break the encryption.

## Migrating from AES-CBC to AES-GCM

Switching the algorithm after data has already been stored will break decryption of existing documents. To safely migrate existing CBC-encrypted data to GCM, follow these steps:

1. Keep calling `registerEncryptedString(mongoose, key, 'aes-256-cbc')` until migration is complete.
2. Run a one-off migration script: query affected documents via `.lean()` to get raw encrypted values, then for each `EncryptedString` field decrypt with `sc.decrypt(value, { key })` and re-encrypt with `sc.encrypt(value, { key, algorithm: 'aes-256-gcm' })`, and write back using `collection.updateOne(...)` directly (bypassing Mongoose to avoid double-encryption).
3. Once all documents are migrated, switch to `registerEncryptedString(mongoose, key)` (GCM default).
