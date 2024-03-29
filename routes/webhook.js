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

    if (body["aspect_type"] != "create")
        return debug("ignore webhooks apart from create events");
    debug("create activity event received");
    const user = await db.findUser(parseInt(body.owner_id));

    if (!user) return debug("user does not exist");
    if (!user.email) return debug("user has no email");
    if (!user.sendEmails) return debug("user has emails disabled");

    // refresh token Checks
    debug(user);
    let returned_access_token = await refreshToken.refreshToken(
        user.id,
        user.access_token,
        user.refresh_token,
        user.expires_at
    );

    //get run data
    let runData;
    try {
        runData = runFetch.parseRun(
            await runFetch.getActivityData(
                body.object_id,
                returned_access_token
            )
        );
    } catch (error) {
        return debug(error);
    }
    debug(runData);

    let emailText =
        `Hello ${user.name}\nWell done, you have uploaded a run, ${runData.name}` +
        "\n--- Stats: ---\n" +
        `Date: ${runData.date}\n` +
        `Distance: ${runData.distance}\nMoving Time: ${runData.timeMoving}\nMoving Pace: ${runData.paceMoving}\n` +
        `5K Time: ${runData.time5k}\n5K Pace: ${runData.pace5k}\n` +
        "Unsubscribe on your account page";
    if (runData.time10k != "")
        emailText += `\n10K Time: ${runData.time10k}\n10K Pace: ${runData.pace10k}`;
    email.sendMail(user.email, runData.name + " Time", emailText, null);
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
    // If query is wrong, return with 400 Bad Request
    res.sendStatus(400);
}
