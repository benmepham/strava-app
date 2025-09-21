import { validateRun } from "./validateRun.js";

export async function getActivityList(token, page) {
    let resp = await fetch(
        "https://www.strava.com/api/v3/athlete/activities?page=" +
            page +
            "&per_page=30",
        {
            headers: { Authorization: "Bearer " + token },
        }
    );
    if (!resp.ok) {
        console.log("getActivity Error:", resp.status);
        throw "Error getting activities list: " + resp.status;
    } else {
        return await resp.json();
    }
}

export async function getRuns(token, page, num, pagePos) {
    let dataToReturn = {
        runs: [],
        page: page,
        status: 200,
        pagePos: pagePos,
    };
    let activities = await getActivityList(token, dataToReturn.page);
    console.log(activities);
    while (dataToReturn.runs.length != num) {
        if (dataToReturn.pagePos == 29) {
            dataToReturn.page++;
            activities = await getActivityList(token, dataToReturn.page);
            dataToReturn.pagePos = 0;
            console.log(activities);
        }
        console.log(dataToReturn.page, dataToReturn.pagePos, dataToReturn.runs);
        if (!activities[dataToReturn.pagePos]) throw "Not enough valid runs";
        if (validateRun(activities[dataToReturn.pagePos]))
            dataToReturn.runs.push(activities[dataToReturn.pagePos]);
        dataToReturn.pagePos++;
    }
    return dataToReturn;
}

export async function getActivityData(activityId, token) {
    let resp = await fetch(
        "https://www.strava.com/api/v3/activities/" + activityId,
        {
            headers: { Authorization: "Bearer " + token },
        }
    );
    if (!resp.ok) {
        console.log("getActivityData Error:", resp.status);
        throw "getActivityData Error: " + resp.status;
    } else {
        return await resp.json();
    }
}

export function secondsToString(seconds) {
    const h = Math.floor(seconds / 3600),
        m = Math.floor((seconds % 3600) / 60),
        s = Math.floor((seconds % 3600) % 60);
    let hDisp = "";
    if (h != 0) hDisp = ("0" + h).slice(-2) + ":";
    return hDisp + ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
}

export function parseRun(run) {
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
        console.log(error);
        throw "Error parsing run data";
    }
}
