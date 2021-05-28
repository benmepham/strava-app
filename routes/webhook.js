var db = require("../util/db");
var refreshToken = require("../util/refreshToken");
var runFetch = require("../util/runFetch");

exports.main = async function (req, res) {
    console.log("webhook event received!", req.query, req.body);
    res.status(200).send("EVENT_RECEIVED");


    const user = await db.findUser(parseInt(req.query.owner_id));


    // refresh token Checks
    await console.log(user);
    let returned_access_token = await refreshToken.refreshToken(
        user.id,
        user.access_token,
        user.refresh_token,
        user.expires_at
    );

    //get run data
    run = await runFetch.getActivityData(req.query.object_id, returned_access_token);
    console.log(run);

    // send email
};
