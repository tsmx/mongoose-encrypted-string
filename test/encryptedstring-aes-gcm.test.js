const mongoose = require('mongoose');
const sc = require('@tsmx/string-crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mes = require('../mongoose-encrypted-string');

describe('mongoose-encrypted-string AES-256-GCM test suite', () => {

    const testKey = '9af7d400be4705147dc724db25bfd2513aa11d6013d7bf7bdb2bfe050593bd0f';

    var mongoServer = null;
    var Person = null;


    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create({ dbName: 'encryptedstring' });
        await mongoose.connect(mongoServer.getUri());
        mes.registerEncryptedString(mongoose, testKey, 'aes-256-gcm');
        Person = mongoose.model('Person', {
            id: { type: String, required: true },
            firstName: { type: mongoose.Schema.Types.EncryptedString },
            lastName: { type: mongoose.Schema.Types.EncryptedString }
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        let testPerson = new Person();
        testPerson.id = 'id-test';
        testPerson.firstName = 'FirstNameTest';
        testPerson.lastName = 'LastNameTest';
        await testPerson.save();
    });

    afterEach(async () => {
        await Person.deleteMany();
    });

    it('tests a successful document creation', async () => {
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
    });

    it('tests a successful document update', async () => {
        let person = await Person.findOne({ id: 'id-test' });
        expect(person).toBeDefined();
        expect(person.firstName).toStrictEqual('FirstNameTest');
        expect(person.lastName).toStrictEqual('LastNameTest');
        person.firstName = 'NewFirstName';
        await person.save();
        let updatedPerson = await Person.findOne({ id: 'id-test' });
        expect(updatedPerson.firstName).toStrictEqual('NewFirstName');
        expect(updatedPerson.lastName).toStrictEqual('LastNameTest');
    });

    it('tests a successful manual decryption of a document from a lean query', async () => {
        let person = await Person.findOne({ id: 'id-test' }).lean();
        expect(person).toBeDefined();
        expect(person.firstName).not.toStrictEqual('FirstNameTest');
        expect(person.firstName.split('|').length).toStrictEqual(3);
        expect(person.lastName).not.toStrictEqual('LastNameTest');
        expect(person.lastName.split('|').length).toStrictEqual(3);
        expect(sc.decrypt(person.firstName, { key: testKey })).toStrictEqual('FirstNameTest');
        expect(sc.decrypt(person.lastName, { key: testKey })).toStrictEqual('LastNameTest');
    });

    it('tests a successful document creation and retrieval with null values', async () => {
        let person = new Person();
        person.id = 'id-1';
        person.firstName = null;
        person.lastName = 'Müller';
        let savedPerson = await person.save();
        expect(savedPerson).toBeDefined();
        expect(savedPerson._id).toBeDefined();
        expect(savedPerson.firstName).toStrictEqual(null);
        expect(savedPerson.lastName).toStrictEqual('Müller');
        let retrievedPerson = await Person.findOne({ id: 'id-1' });
        expect(retrievedPerson).toBeDefined();
        expect(retrievedPerson._id).toBeDefined();
        expect(retrievedPerson.firstName).toStrictEqual(null);
        expect(retrievedPerson.lastName).toStrictEqual('Müller');
    });

});