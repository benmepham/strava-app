const fetch = require("node-fetch");
const { validateRun } = require("./validateRun");
const debug = require("debug")("strava-app:runFetch");

module.exports = { getRuns, getActivityData, parseRun };

async function getActivityList(token, page) {
    let resp = await fetch(
        "https://www.strava.com/api/v3/athlete/activities?page=" +
            page +
            "&per_page=30",
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

async function getRuns(token, page, num, pagePos) {
    let dict = {
        runs: [],
        page: page,
        status: 200,
        pagePos: pagePos,
    };
    let getActivity_return = await getActivityList(token, dict.page);
    debug(getActivity_return);
    while (dict.runs.length != num) {
        if (dict.pagePos == 29) {
            dict.page++;
            getActivity_return = await getActivityList(token, dict.page);
            dict.pagePos = 0;
            debug(getActivity_return);
        }
        debug(dict.page, dict.pagePos, dict.runs);
        if (getActivity_return.status != 200)
            return { status: getActivity_return.status };
        if (!getActivity_return.data[dict.pagePos]) throw "No more valid runs";
        if (validateRun(getActivity_return.data[dict.pagePos]))
            dict.runs.push(getActivity_return.data[dict.pagePos]);
        dict.pagePos++;
    }
    return dict;
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
    return ret;
}

function parseRun(run) {
    if (!validateRun(run)) throw "Activity is invalid";
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
