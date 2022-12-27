var refreshToken = require("../util/refreshToken");
var runFetch = require("../util/runFetch");
const debug = require("debug")("strava-app:api");

exports.view = async function (req, res) {
    let returned_access_token = await refreshToken.refreshToken(
        req.user.id,
        req.user.access_token,
        req.user.refresh_token,
        req.user.expires_at
    );
    debug("api access token " + returned_access_token);

    let activityUrl = req.query.url;
    if (activityUrl) {
        if (activityUrl.startsWith("https://www.strava.com/activities/")) {
            activityUrl = activityUrl.match(/(?!\/activities\/)([0-9]){10}/)[0];
        } else if (!/^\d{10}$/.test(activityUrl))
            return res.status(500).send("invalid input");

        run = await runFetch.getActivityData(
            activityUrl,
            returned_access_token
        );
        if (run.status != 200) return res.status(run.status).send();
        return res.send({ runs: [runFetch.parseRun(run.data)] });
    }

    if (req.query.num < 1 || req.query.num > 5 || req.query.page < 1)
        return res.status(500).send("invalid input");

    try {
        let runs = await runFetch.getRuns(
            returned_access_token,
            req.query.page,
            req.query.num
        );
        if (runs.status != 200) return res.status(runs.status).send();
        let runArray = [];
        for (let run of runs.runs) {
            run = await runFetch.getActivityData(run.id, returned_access_token);
            if (run.status != 200) return res.status(run.status).send();
            run = run.data;
            runArray.push(runFetch.parseRun(run));
        }
        res.send({ runs: runArray, page: runs.page });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};
