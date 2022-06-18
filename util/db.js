const MongoClient = require("mongodb").MongoClient;
const debug = require("debug")("strava-app:db");

let collection;

module.exports = { loadDb, findUser, setEmail, setAlertOption, setToken };

function loadDb(environment) {
    const db_url = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOSTNAME}:27017/${process.env.MONGO_DB}?authSource=admin`;
    const client = new MongoClient(db_url, {
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
                    sendEmails: String(bool),
                },
            },
            { upsert: false, returnDocument: "after" }
        );
        return res;
    } catch (err) {
        return console.log(err);
    }
}

async function setToken(id, time, refresh, access) {
    try {
        res = await collection.findOneAndUpdate(
            { id: id },
            {
                $set: {
                    access_token: access,
                    refresh_token: refresh,
                    expires_at: time,
                },
            },
            { upsert: false, returnDocument: "after" }
        );
        console.log("db done" + res.value.access_token);
        return res;
    } catch (err) {
        return console.log(err);
    }
}
