const fetch = require("node-fetch");
var refreshToken = require("../util/refreshToken");


async function getActivity(token, page) {
    let resp = await fetch(
        "https://www.strava.com/api/v3/athlete/activities?page=" +
            page +
            "&per_page=1",
        {
            headers: { Authorization: "Bearer " + token },
        }
    );

    if (!resp.ok) {
        return console.error(resp.status);
    } else {
        const data = await resp.json();
        // console.log("single");
        // console.log(data);
        return data;
    }
}

async function getRuns(token, page, num) {
    let pageIter = page;
    let runs = [];
    // console.log("page: ", page, "num: ", num);

    while (runs.length != num) {
        // console.log(runs.length, "length");
        const run = await getActivity(token, pageIter);
        // console.log("Fetched run");
        if (run[0].type == "Run" && run[0].distance >= 5000) {
            // console.log("isRun");
            runs.push(run[0]);
        }
        pageIter++;
    }
    return { runs: runs, page: pageIter };
}

async function getActivityData(rid, token) {
    let resp = await fetch("https://www.strava.com/api/v3/activities/" + rid, {
        headers: { Authorization: "Bearer " + token },
    });
    if (!resp.ok) {
        return console.error(resp.status);
    } else {
        const data = await resp.json();
        return data;
    }
}

exports.view = async function (req, res) {
    const access_token = await refreshToken.refreshToken(req.user.id, req.user.access_token, req.user.refresh_token, req.user.expires_at);
    let runs = await getRuns(access_token, req.query.page, req.query.num);
    let runArray = [];
    let time, run, date, seconds;

    for (let x of runs.runs) {
        // console.log(x.id);
        run = await getActivityData(x.id, access_token);
        // console.log(run.name);
        // console.log(run.start_date);
        // console.log(run.best_efforts[5]);
        date = run.start_date.slice(0, 10);
        seconds = (run.best_efforts[5].moving_time % 60).toString();
        if (seconds.length == 1)
            seconds = "0" + seconds;
        time =
            Math.floor(run.best_efforts[5].moving_time / 60).toString() +
            ":" + seconds;
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
