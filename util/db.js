const MongoClient = require("mongodb").MongoClient;
const debug = require("debug")("strava-app:db");

let collection;

module.exports = { loadDb, findUser };

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
    // await collection.findOne({ id: id }, async (err, doc) => {
    //     if (err) return console.error(err);
    //     return await doc;
    // });

    try {
        res = await collection.findOne({ id: id });
        console.log(res);
        return res;
    } catch (err) {
        console.log(err);
    }
}
