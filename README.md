# [**@tsmx/mongoose-encryptedstring**](https://github.com/tsmx/mongoose-encryptedstring)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![npm (scoped)](https://img.shields.io/npm/v/@tsmx/mongoose-encryptedstring)
![node-current (scoped)](https://img.shields.io/node/v/@tsmx/mongoose-encryptedstring)
[![Build Status](https://travis-ci.com/tsmx/mongoose-encryptedstring.svg?branch=master)](https://travis-ci.org/tsmx/mongoose-encryptedstring)
[![Coverage Status](https://coveralls.io/repos/github/tsmx/mongoose-encryptedstring/badge.svg?branch=master)](https://coveralls.io/github/tsmx/mongoose-encryptedstring?branch=master)

> `EncryptedString` type for Mongoose schemas.

AES-256-CBC encryption-at-rest for strings.

## Usage

```js
var mongoose = require('mongoose');
const encryptedString = require('../mongoose-encryptedstring');
const key = 'YOUR KEY HERE';

// register the new type EncryptedString
encryptedString.registerEncryptedString(mongoose, key);

// use EncryptedString in your schemas
Person = mongoose.model('Person', {
    id: { type: String, required: true },
    firstName: { type: mongoose.Schema.Types.EncryptedString },
    lastName: { type: mongoose.Schema.Types.EncryptedString }
});

let testPerson = new Person();
testPerson.id = 'id-test';
testPerson.firstName = 'Hans'; // stored encrypted
testPerson.lastName = 'Müller'; // stored encrypted
await testPerson.save();


let queriedPerson = await Person.findOne({ id: 'id-test' });
console.log(queriedPerson.firstName); // 'Hans', decrypted automatically
console.log(queriedPerson.lastName); // 'Müller, decrypted automatically
```
Directly querying the MongoDB will return the encrypted data.
```bash
> db.persons.findOne({ id: 'id-test' });
{
        "_id" : ObjectId("5f8576cc0a6ca01d8e5c479c"),
        "id" : "id-test",
        "firstName" : "66db1589b5c0de7f98f5260092e6799f|a6cb74bc05a52d1244addb125352bb0d",
        "lastName" : "2b85f4ca2d98ad1234da376a6d0d9128|d5b0257d3797da7047bfea6dfa62e19c",
        "__v" : 0
}
```

## API

### registerEncryptedString(mongoose, key)

Registers the new type `EncryptedString` in the `mongoose` instance's schema types. Encryption/decryption is done using the given `key`. After calling this funtion you can start using the new type via `mongoose.Schema.Types.EncryptedString` in your schemas.

#### mongoose

The mongoose instance where `EncryptedString` should be registered.

#### key

The key used for encryption/decryption. Length must be 32 bytes. See [notes](#notes) for details.

## Notes

- Encryption/decryption is done via the package [@tsmx/string-crypto](https://www.npmjs.com/package/@tsmx/string-crypto).
- Key length must be 32 bytes. The key can be provided as
    - a string of 32 characters length, or
    - a hexadecimal value of 64 characters length (= 32 bytes)
- Don't override getters/setter for `EncryptedString` class or schema elements of this type. This would break the encryption.
