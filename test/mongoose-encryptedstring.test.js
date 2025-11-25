const mongoose = require('mongoose');
const sc = require('@tsmx/string-crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mes = require('../mongoose-encrypted-string');

describe('mongoose-encrypted-string test suite', () => {

    const testKey = '9af7d400be4705147dc724db25bfd2513aa11d6013d7bf7bdb2bfe050593bd0f';

    var mongoServer = null;
    var Person = null;


    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create({ dbName: 'encryptedstring' });
        await mongoose.connect(mongoServer.getUri());
        mes.registerEncryptedString(mongoose, testKey);
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
        expect(savedPerson.firstName).toBe('Hans');
        expect(savedPerson.lastName).toBe('Müller');
        let savedPersonLean = await Person.findById(savedPerson._id).lean();
        expect(savedPersonLean.firstName).not.toBe('Hans');
        let firstNameParts = savedPersonLean.firstName.split('|');
        expect(firstNameParts.length).toBe(2);
        expect(savedPersonLean.lastName).not.toBe('Müller');
        let lastNameParts = savedPersonLean.firstName.split('|');
        expect(lastNameParts.length).toBe(2);
    });

    it('tests a successful document update', async () => {
        let person = await Person.findOne({ id: 'id-test' });
        expect(person).toBeDefined();
        expect(person.firstName).toBe('FirstNameTest');
        expect(person.lastName).toBe('LastNameTest');
        person.firstName = 'NewFirstName';
        await person.save();
        let updatedPerson = await Person.findOne({ id: 'id-test' });
        expect(updatedPerson.firstName).toBe('NewFirstName');
        expect(updatedPerson.lastName).toBe('LastNameTest');
    });

    it('tests a successful manual decryption of a document from a lean query', async () => {
        let person = await Person.findOne({ id: 'id-test' }).lean();
        expect(person).toBeDefined();
        expect(person.firstName).not.toBe('FirstNameTest');
        expect(person.lastName).not.toBe('LastNameTest');
        expect(sc.decrypt(person.firstName, { key: testKey })).toBe('FirstNameTest');
        expect(sc.decrypt(person.lastName, { key: testKey })).toBe('LastNameTest');
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
        expect(savedPerson.lastName).toBe('Müller');
        let retrievedPerson = await Person.findOne({ id: 'id-1' });
        expect(retrievedPerson).toBeDefined();
        expect(retrievedPerson._id).toBeDefined();
        expect(retrievedPerson.firstName).toStrictEqual(null);
        expect(retrievedPerson.lastName).toBe('Müller');
    });

});