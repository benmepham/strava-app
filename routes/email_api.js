const { setEmail } = require("../util/db");
const debug = require("debug")("strava-app:email_api");

async function saveEmailToDb(req, res) {
    debug(req.query);
    debug(req.user);

    const mailformat =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    // Email validation regex from: https://tutorial.eyehunts.com/js/email-regex-javascript-validation-example-code/
    if (!req.query.email.match(mailformat))
        return res.status(400).send("email invalid");

    const db_res = await setEmail(
        req.user.id,
        req.query.email,
        req.query.enabled == "true"
    );
    debug(db_res);

    db_res && db_res.ok == 1
        ? res.status(200).send("ok")
        : res.status(500).send("db error");
}

module.exports = { saveEmailToDb };
