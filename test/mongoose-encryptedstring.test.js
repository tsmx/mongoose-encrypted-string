const mongoose = require('mongoose');
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
const mes = require('../mongoose-encryptedstring');

describe('mongoose-encryptedstring test suite', () => {

    const testKey = '00000000000000000000000000000000';

    var mongoServer = null;
    var Visitor = null;

    beforeAll(async (done) => {
        tokens = new Map();
        mongoServer = new MongoMemoryServer();
        const dbOptions = {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        };
        mongoServer.getUri('encryptedstring').then((mongoUri) => {
            mongoose.connect(mongoUri, dbOptions);
            var db = mongoose.connection;
            db.once('open', function () {
                done();
            });
        });

        mes.registerEncrpytedString(mongoose, testKey);

        Visitor = mongoose.model('Visitor', {
            firstName: { type: mongoose.Schema.Types.EncryptedString },
            lastName: { type: mongoose.Schema.Types.EncryptedString }
        });
    });

    afterAll(async (done) => {
        await mongoose.connection.close();
        await mongoServer.stop();
        done();
    });

    it('tests a successful insertion', async (done) => {
        var visitor = new Visitor();
        visitor.firstName = 'Hans';
        visitor.lastName = 'Müller';
        let savedVisitor = await visitor.save();
        expect(savedVisitor).toBeDefined();
        expect(savedVisitor._id).toBeDefined();
        expect(savedVisitor.firstName).toBe('Hans');
        expect(savedVisitor.lastName).toBe('Müller');
        let savedVisitorLean = await Visitor.findById(savedVisitor._id).lean();
        expect(savedVisitorLean.firstName).not.toBe('Hans');
        expect(savedVisitorLean.lastName).not.toBe('Müller');
        done();
    });

});