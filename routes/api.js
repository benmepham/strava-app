var refreshToken = require("../util/refreshToken");
var runFetch = require("../util/runFetch");

exports.view = async function (req, res) {
    let returned_access_token = await refreshToken.refreshToken(
        req.user.id,
        req.user.access_token,
        req.user.refresh_token,
        req.user.expires_at
    );
    console.log("api access token" +returned_access_token);
    let runs = await runFetch.getRuns(
        returned_access_token,
        req.query.page,
        req.query.num
    );
    if (runs.error) {
        return res.status(runs.status).send();
    }
    let runArray = [];
    for (let run of runs.runs) {
        run = await runFetch.getActivityData(run.id, returned_access_token);
        if (run.status != 200) {
            return res.status(run.status).send();
        }
        run = run.data;
        runArray.push(runFetch.parseRun(run));
    }
    res.send({ runs: runArray, page: runs.page });
};
