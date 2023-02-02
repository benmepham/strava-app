const MongoClient = require("mongodb").MongoClient;
const debug = require("debug")("strava-app:db");

let collection;

module.exports = {
    loadDb,
    findUser,
    setEmail,
    setToken,
    deserializeUserQuery,
    newUserQuery,
};

function loadDb() {
    const db_url = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOSTNAME}:27017?authSource=admin`;
    const client = new MongoClient(db_url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    try {
        client.connect();
        collection = client.db(process.env.MONGO_DB).collection("users");
        debug("DB Connected");
    } catch (err) {
        debug(err);
    }
}

async function findUser(id) {
    try {
        res = await collection.findOne({ id: id });
        return res;
    } catch (err) {
        return console.log(err);
    }
}

async function setEmail(id, email, sendEmails) {
    try {
        res = await collection.findOneAndUpdate(
            { id: id },
            {
                $set: {
                    email,
                    sendEmails,
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

function deserializeUserQuery(id, done) {
    collection.findOne({ id: id }, (err, doc) => {
        if (err) return debug(err);
        done(null, doc);
    });
}

function newUserQuery(params, done, accessToken, refreshToken) {
    collection.findOneAndUpdate(
        { id: params.athlete.id },
        {
            $setOnInsert: {
                id: params.athlete.id,
                name: params.athlete.firstname + " " + params.athlete.lastname,
                photo: params.athlete.profile,
                created_on: new Date(),
                sendEmails: false,
            },
            $set: {
                last_login: new Date(),
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: params.expires_at,
            },
            $inc: { login_count: 1 },
        },
        { upsert: true, returnDocument: "after" },
        (err, doc) => {
            if (err) return debug(err);
            return done(null, doc.value);
        }
    );
}
