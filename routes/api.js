var refreshToken = require("../util/refreshToken");
var runFetch = require("../util/runFetch");

exports.view = async function (req, res) {
    let returned_access_token = await refreshToken.refreshToken(
        req.user.id,
        req.user.access_token,
        req.user.refresh_token,
        req.user.expires_at
    );
    let runs = await runFetch.getRuns(
        returned_access_token,
        req.query.page,
        req.query.num
    );
    if (runs.error) {
        return res.send({ error: true, status: runs.status });
    }
    let runArray = [];
    for (let run of runs.runs) {
        run = await runFetch.getActivityData(run.id, returned_access_token);
        run = run.data;
        runArray.push(runFetch.parseRun(run));
    }
    res.send({ runs: runArray, page: runs.page });
};
