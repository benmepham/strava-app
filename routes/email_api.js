module.exports = { email_db };

var db = require("../util/db");

async function email_db(req, res) {
    console.log(req.query);
    console.log(req.user);

    const mailformat =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    // Email validation regex from: https://tutorial.eyehunts.com/js/email-regex-javascript-validation-example-code/

    if (!req.query.email.match(mailformat)) {
        console.log("error");
        return res.status(400).send("email invalid");
    }
    let db_res2;
    if (req.query.enabled != null) {
        db_res2 = await db.setAlertOption(req.user.id, req.query.enabled);
    } else {
        db_res2 = await db.setAlertOption(req.user.id, true);
    }

    //save to db
    const db_res = await db.setEmail(req.user.id, req.query.email);
    if (db_res.ok == 1 && db_res2.ok == 1) {
        res.status(200).send("ok");
    } else {
        res.status(500).send("db error");
    }
}
