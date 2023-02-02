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
        throw "Error getting activities list: " + resp.status;
    } else {
        return await resp.json();
    }
}

async function getRuns(token, page, num, pagePos) {
    let dataToReturn = {
        runs: [],
        page: page,
        status: 200,
        pagePos: pagePos,
    };
    let activities = await getActivityList(token, dataToReturn.page);
    debug(activities);
    while (dataToReturn.runs.length != num) {
        if (dataToReturn.pagePos == 29) {
            dataToReturn.page++;
            activities = await getActivityList(token, dataToReturn.page);
            dataToReturn.pagePos = 0;
            debug(activities);
        }
        debug(dataToReturn.page, dataToReturn.pagePos, dataToReturn.runs);
        if (!activities[dataToReturn.pagePos]) throw "Not enough valid runs";
        if (validateRun(activities[dataToReturn.pagePos]))
            dataToReturn.runs.push(activities[dataToReturn.pagePos]);
        dataToReturn.pagePos++;
    }
    return dataToReturn;
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
        throw "getActivityData Error: " + resp.status;
    } else {
        return await resp.json();
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
        return {
            name: run.name,
            date: run.start_date.slice(0, 10),
            time5k: secondsToString(run.best_efforts[5].moving_time),
            pace5k: secondsToString(run.best_efforts[5].moving_time / 5),
            id: run.id,
            time10k: run.best_efforts[6]
                ? secondsToString(run.best_efforts[6].moving_time)
                : "",
            pace10k: run.best_efforts[6]
                ? secondsToString(run.best_efforts[6].moving_time / 10)
                : "",
            distance: (run.distance / 1000).toFixed(2).toString() + " km",
            timeMoving: secondsToString(run["moving_time"]),
            paceMoving: secondsToString(
                run["moving_time"] / (run.distance / 1000)
            ),
        };
    } catch (error) {
        debug(error);
        throw "Error parsing run data";
    }
}
