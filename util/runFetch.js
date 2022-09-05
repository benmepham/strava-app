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

function parseRun(run) {
    try {
        let date = run.start_date.slice(0, 10);
        console.log(run.best_efforts);
        let seconds = (run.best_efforts[5].moving_time % 60).toString();
        if (seconds.length == 1) seconds = "0" + seconds;
        let time =
            Math.floor(run.best_efforts[5].moving_time / 60).toString() +
            ":" +
            seconds;

        return {
            name: run.name,
            date: date,
            time: time,
            id: run.id,
        };
    } catch (error) {
        console.error(error);
        throw "Run data invalid";
    }
}
