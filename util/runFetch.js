const fetch = require("node-fetch");
const debug = require("debug")("strava-app:runFetch");

module.exports = { getActivity, getRuns, getActivityData, parseRun };

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
        debug("getActivity Error:", resp.status);
        return { status: resp.status };
    } else {
        const data = await resp.json();
        return { data: data, status: resp.status };
    }
}

async function getRuns(token, page, num) {
    try {
        let pageIter = page;
        let runs = [];
        while (runs.length != num) {
            const getActivity_return = await getActivity(token, pageIter);
            if (getActivity_return.status != 200)
                return { status: getActivity_return.status };
            let run = getActivity_return.data;
            if (run[0].type == "Run" && run[0].distance >= 5000 && !run[0].manual)
                runs.push(run[0]);
            pageIter++;
        }
        return { runs: runs, page: pageIter, status: 200 };
    } catch (error) {
        debug(error);
        throw "No more valid runs";
    }
}

async function getActivityData(activityId, token) {
    let resp = await fetch(
        "https://www.strava.com/api/v3/activities/" + activityId,
        {
            headers: { Authorization: "Bearer " + token },
        }
    );
    if (!resp.ok) {
        debug("getActivityData Error:", resp.status);
        return { status: resp.status };
    } else {
        const data = await resp.json();
        return { data: data, status: resp.status };
    }
}

function secondsToString(time) {
    let mins = Math.floor(time / 60);
    let secs = Math.round(time - mins * 60);
    let ret;
    ret = mins + ":" + (secs < 10 ? "0" : "") + secs;
    // ret += "" + secs;
    return ret;
}

function parseRun(run) {
    if (run.type != 'Run')
        throw 'Activity is not a run'
    try {
        let time10k = "",
            pace10k = "",
            time5k = secondsToString(run.best_efforts[5].moving_time);
        if (run.best_efforts[6]) {
            time10k = secondsToString(run.best_efforts[6].moving_time);
            pace10k = secondsToString(run.best_efforts[6].moving_time / 10);
        }
        return {
            name: run.name,
            date: run.start_date.slice(0, 10),
            time5k,
            pace5k: secondsToString(run.best_efforts[5].moving_time / 5),
            id: run.id,
            time10k,
            pace10k,
            distance: (run.distance / 1000).toFixed(2).toString() + " km",
            timeMoving: secondsToString(run["moving_time"]),
        };
    } catch (error) {
        debug(error);
        throw "Error parsing run data";
    }
}
