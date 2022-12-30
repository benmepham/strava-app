const { parseStravaAppLinkUrl } = require("../util/parseStravaAppLinkUrl");
const refreshToken = require("../util/refreshToken");
const runFetch = require("../util/runFetch");
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
        const stravaUrlRegex = /(?!strava.com\/activities\/)([0-9]){10}/;
        const stravaShortUrlRegex = /strava.app.link\/[0-9a-zA-Z]{11}/;
        if (activityUrl.match(stravaUrlRegex))
            activityUrl = activityUrl.match(stravaUrlRegex)[0];
        else if (activityUrl.match(stravaShortUrlRegex)) {
            activityUrl =
                "https://" +
                activityUrl.match(stravaShortUrlRegex)[0];
            activityUrl = await parseStravaAppLinkUrl(activityUrl);
            if (!activityUrl)
                return res.status(400).send("strava.app.link URL is invalid");
        }
        debug(activityUrl);

        if (!/^\d{10}$/.test(activityUrl))
            return res.status(400).send("Activity ID input is invalid");

        run = await runFetch.getActivityData(
            activityUrl,
            returned_access_token
        );

        if (run.status != 200)
            return res
                .status(run.status)
                .send("Can't find a matching activity in your account");

        let runData;
        try {
            runData = runFetch.parseRun(run.data);
        } catch (error) {
            debug(error);
            return res.status(400).send(error);
        }
        return res.send({ runs: [runData] });
    
    }

    // if 
    if (req.query.num < 1 || req.query.num > 5 || req.query.page < 1)
        return res
            .status(400)
            .send("invalid number of activites or page number");

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
        debug(error);
        res.status(500).send(error);
    }
};
