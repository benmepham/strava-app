const fetch = require("node-fetch");

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
        console.error("getActivity Error:", resp.status);
        return { status: resp.status };
    } else {
        const data = await resp.json();
        return { data: data, status: resp.status };
    }
}

async function getRuns(token, page, num) {
    try {
        // console.log("TOK gr: " + token);

        let pageIter = page;
        let runs = [];
        // console.log("page: ", page, "num: ", num);

        while (runs.length != num) {
            // console.log(runs.length, "length");
            const getActivity_return = await getActivity(token, pageIter);
            if (getActivity_return.status != 200)
                return { status: getActivity_return.status };
            let run = getActivity_return.data;
            // console.log("Fetched run");
            if (run[0].type == "Run" && run[0].distance >= 5000)
                runs.push(run[0]);
            pageIter++;
        }
        return { runs: runs, page: pageIter, status: 200 };
    } catch (error) {
        console.error(error);
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
        console.error("getActivityData Error:", resp.status);
        return { status: resp.status };
    } else {
        const data = await resp.json();
        return { data: data, status: resp.status };
    }
}

function secondsToString(time) {
    let mins = Math.floor(time / 60);
    let secs = time - mins * 60;
    let ret;
    ret = mins + ":" + (secs < 10 ? "0" : "") + secs;
    // ret += "" + secs;
    return ret;
}

function parseRun(run) {
    try {
        let time10k = "", time5k = secondsToString(run.best_efforts[5].moving_time);
        try {

            time10k = secondsToString(run.best_efforts[6].moving_time);
        } catch {}
        return {
            name: run.name,
            date: run.start_date.slice(0, 10),
            time5k,
            id: run.id,
            time10k,
            distance: (run.distance / 1000).toFixed(2).toString() + " km",
            timeMoving: secondsToString(run["moving_time"]),
        };
    } catch (error) {
        console.error(error);
        throw "Run data invalid";
    }
}
