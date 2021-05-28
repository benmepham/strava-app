var db = require("../util/db");
var refreshToken = require("../util/refreshToken");
var runFetch = require("../util/runFetch");
var email = require("../util/email");

exports.main = async function (req, res) {
    console.log("webhook event received!", req.query, req.body);
    res.status(200).send("EVENT_RECEIVED");

    if (req.query["aspect-type"] == "create") {
        const user = await db.findUser(parseInt(req.query.owner_id));

        // refresh token Checks
        console.log(user);
        let returned_access_token = await refreshToken.refreshToken(
            user.id,
            user.access_token,
            user.refresh_token,
            user.expires_at
        );

        //get run data
        run = await runFetch.getActivityData(
            req.query.object_id,
            returned_access_token
        );
        run = run.data;

        if (run.type != "Run" || run.distance <= 5000) {
            return console.log("not 5k run");
        }
        const runData = runFetch.parseRun(run);

        console.log(runData);

        let emailText =
            "Hello " +
            user.name +
            "\n" +
            "You have completed a run, " +
            runData.name +
            " on " +
            runData.date +
            " at " +
            runData.time +
            "\nYour time is " +
            runData.time;
        let emailHtml;

        // send email
        email.sendMail(
            "ben@bjm.me.uk",
            runData.name + " Time",
            emailText,
            null
        );
    }
};
