const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mes = require('../mongoose-encrypted-string');

describe('mongoose-encrypted-string test suite', () => {

    const testKey = '9af7d400be4705147dc724db25bfd2513aa11d6013d7bf7bdb2bfe050593bd0f';

    var mongoServer = null;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create({ dbName: 'encryptedstring' });
        await mongoose.connect(mongoServer.getUri());
    });

    afterEach(async () => {
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    it('tests a successful document creation with AES-GCM as default algorithm', async () => {
        mes.registerEncryptedString(mongoose, testKey);
        let Person = mongoose.model('Person', {
            id: { type: String, required: true },
            firstName: { type: mongoose.Schema.Types.EncryptedString },
            lastName: { type: mongoose.Schema.Types.EncryptedString }
        });
        // test doc creation
        let person = new Person();
        person.id = 'id-1';
        person.firstName = 'Hans';
        person.lastName = 'Müller';
        let savedPerson = await person.save();
        expect(savedPerson).toBeDefined();
        expect(savedPerson._id).toBeDefined();
        expect(savedPerson.firstName).toStrictEqual('Hans');
        expect(savedPerson.lastName).toStrictEqual('Müller');
        let savedPersonLean = await Person.findById(savedPerson._id).lean();
        expect(savedPersonLean.firstName).not.toStrictEqual('Hans');
        let firstNameParts = savedPersonLean.firstName.split('|');
        expect(firstNameParts.length).toStrictEqual(3);
        expect(savedPersonLean.lastName).not.toStrictEqual('Müller');
        let lastNameParts = savedPersonLean.firstName.split('|');
        expect(lastNameParts.length).toStrictEqual(3);
        // tear-down
        await Person.deleteMany();
    });

    it('tests an exception because of an unknown algorithm', async () => {
        expect(() => mes.registerEncryptedString(mongoose, testKey, 'fake-algo')).toThrow();
    });

});