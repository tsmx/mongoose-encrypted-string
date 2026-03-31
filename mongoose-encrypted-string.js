const SchemaType = require('mongoose').SchemaType;
const sc = require('@tsmx/string-crypto');

const allowedAlgorithms = ['aes-256-gcm', 'aes-256-cbc'];

class EncryptedString extends SchemaType {
    constructor(key, options) {
        options.get = (v) => {
            return sc.decrypt(v, {
                key: EncryptedString.options.key,
                passNull: true
            });
        };
        options.set = (v) => {
            return sc.encrypt(v, {
                key: EncryptedString.options.key,
                passNull: true,
                algorithm: EncryptedString.options.algorithm
            });
        };
        super(key, options, 'EncryptedString');
    }

    cast(val) {
        return String(val);
    }

    static options = {
        key: null
    };

}

module.exports.registerEncryptedString = function (mongoose, key, algorithm = 'aes-256-gcm') {
    if (!allowedAlgorithms.includes(algorithm)) {
        throw new Error(`Invalid algorithm '${algorithm}'. Allowed: ${allowedAlgorithms.join(', ')}`);
    }
    EncryptedString.options.key = key;
    EncryptedString.options.algorithm = algorithm;
    mongoose.Schema.Types.EncryptedString = EncryptedString;
};