const MongoClient = require("mongodb").MongoClient;
const debug = require("debug")("strava-app:db");

let collection;

module.exports = { loadDb, findUser, setEmail, setAlertOption };

function loadDb(environment) {
    const client = new MongoClient(process.env.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    client.connect((err) => {
        if (err) return console.error(err);
        let dbName = "stravadb_dev";
        if (environment == "production") {
            dbName = "stravadb_prod";
        }
        collection = client.db(dbName).collection("users");
        debug("DB Connected");
        // perform actions on the collection object
        // client.close();
        global.collection = collection;
    });
}

async function findUser(id) {
    try {
        res = await collection.findOne({ id: id });
        return res;
    } catch (err) {
        return console.log(err);
    }
}

async function setEmail(id, email) {
    try {
        res = await collection.findOneAndUpdate(
            { id: id },
            {
                $set: {
                    email: email,
                },
            },
            { upsert: false, returnDocument: "after" }
        );
        return res;
    } catch (err) {
        return console.log(err);
    }
}

async function setAlertOption(id, bool) {
    try {
        res = await collection.findOneAndUpdate(
            { id: id },
            {
                $set: {
                    sendEmails: bool,
                },
            },
            { upsert: false, returnDocument: "after" }
        );
        return res;
    } catch (err) {
        return console.log(err);
    }
}
