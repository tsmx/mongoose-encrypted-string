const SchemaType = require('mongoose').SchemaType;
const sc = require('@tsmx/string-crypto');

class EncryptedString extends SchemaType {
    constructor(key, options) {
        options.get = (v) => { return sc.decrypt(v, { key: EncryptedString.options.key, passNull: true }); };
        options.set = (v) => { return sc.encrypt(v, { key: EncryptedString.options.key, passNull: true }); };
        super(key, options, 'EncryptedString');
    }

    cast(val) {
        return String(val);
    }

    static options = {
        key: null
    };

}

module.exports.registerEncryptedString = function (mongoose, key) {
    EncryptedString.options.key = key;
    mongoose.Schema.Types.EncryptedString = EncryptedString;
};