const { parseStravaUrl } = require("../util/parseStravaUrl");
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
        try {
            activityUrl = await parseStravaUrl(activityUrl);
        } catch (error) {
            debug(error);
            return res.status(400).send("Activity URL invalid");
        }

        let runData;
        try {
            runData = runFetch.parseRun(
                await runFetch.getActivityData(
                    activityUrl,
                    returned_access_token
                )
            );
        } catch (error) {
            debug(error);
            return res.status(400).send(error);
        }
        return res.send({ runs: [runData] });
    }

    if (req.query.num < 1 || req.query.num > 20 || req.query.page < 1)
        return res
            .status(400)
            .send("invalid number of activites or page number");

    try {
        let runs = await runFetch.getRuns(
            returned_access_token,
            req.query.page,
            req.query.num,
            req.query.pagePos
        );
        let runArray = [];
        for (let run of runs.runs) {
            run = await runFetch.getActivityData(run.id, returned_access_token);
            runArray.push(runFetch.parseRun(run));
        }
        res.send({ runs: runArray, page: runs.page, pagePos: runs.pagePos });
    } catch (error) {
        debug(error);
        res.status(500).send(error);
    }
};
