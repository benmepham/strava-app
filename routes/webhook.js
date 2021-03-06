const debug = require("debug")("strava-app:webhook");
var db = require("../util/db");
var refreshToken = require("../util/refreshToken");
var runFetch = require("../util/runFetch");
var email = require("../util/email");

module.exports = { post, get };

async function post(req, res) {
    debug("webhook event received!", req.query, req.body);
    res.status(200).send("EVENT_RECEIVED");
    let body = req.body;
    console.log(body["aspect_type"]);

    if (body["aspect_type"] == "create") {
        debug("create activity running");
        const user = await db.findUser(parseInt(body.owner_id));

        if (!user.sendEmails) {
            return console.log("webhook - user has no email");
        }

        // refresh token Checks
        debug(user);
        let returned_access_token = await refreshToken.refreshToken(
            user.id,
            user.access_token,
            user.refresh_token,
            user.expires_at
        );

        //get run data
        run = await runFetch.getActivityData(
            body.object_id,
            returned_access_token
        );

        if (run.status != 200) {
            return debug("run get error");
        }
        run = run.data;

        if (run.type != "Run" || run.distance <= 5000) {
            return debug("not 5k run");
        }
        const runData = runFetch.parseRun(run);

        debug(runData);

        let emailText =
            "Hello " +
            user.name +
            "\n" +
            "You have completed a run, " +
            runData.name +
            " on " +
            runData.date +
            "\nYour time is " +
            runData.time;
        let emailHtml;

        // send email
        email.sendMail(user.email, runData.name + " Time", emailText, null);
    }
}

async function get(req, res) {
    // Your verify token. Should be a random string.
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    // Parses the query params
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
        // Verifies that the mode and token sent are valid
        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            // Responds with the challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.json({ "hub.challenge": challenge });
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}
