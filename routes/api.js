var refreshToken = require("../util/refreshToken");
var runFetch = require("../util/runFetch");

exports.view = async function (req, res) {
    let returned_access_token = await refreshToken.refreshToken(
        req.user.id,
        req.user.access_token,
        req.user.refresh_token,
        req.user.expires_at
    );

    // console.log(returned_access_token);
    let runs = await runFetch.getRuns(
        returned_access_token,
        req.query.page,
        req.query.num
    );

    if (runs.error) {
        return res.send({ error: true, status: runs.status });
    }
    let runArray = [];
    let time, run, date, seconds;

    for (let x of runs.runs) {
        // console.log(x.id);
        run = await runFetch.getActivityData(x.id, returned_access_token);
        run = run.data;

        // console.log(run.name);
        // console.log(run.start_date);
        // console.log(run.best_efforts[5]);
        date = run.start_date.slice(0, 10);
        seconds = (run.best_efforts[5].moving_time % 60).toString();
        if (seconds.length == 1) seconds = "0" + seconds;
        time =
            Math.floor(run.best_efforts[5].moving_time / 60).toString() +
            ":" +
            seconds;
        runArray.push({
            name: run.name,
            date: date,
            time: time,
            id: x.id,
        });
    }
    res.send({ runs: runArray, page: runs.page });

    // .then((runs) => res.send(runs))
    // .catch((e) => console.error(e));
};
