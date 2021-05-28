const fetch = require("node-fetch");

module.exports = {getActivity, getRuns, getActivityData}

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
    // console.log("TOK gr: " + token);

    let pageIter = page;
    let runs = [];
    // console.log("page: ", page, "num: ", num);

    while (runs.length != num) {
        // console.log(runs.length, "length");
        const getActivity_return = await getActivity(token, pageIter);
        if (getActivity_return.status != 200)
            return {
                error: true,
                status: getActivity_return.status,
            };
        let run = getActivity_return.data;
        // console.log("Fetched run");
        if (run[0].type == "Run" && run[0].distance >= 5000) {
            // console.log("isRun");
            runs.push(run[0]);
        }
        pageIter++;
    }
    return { runs: runs, page: pageIter };
}

async function getActivityData(activityId, token) {
    let resp = await fetch("https://www.strava.com/api/v3/activities/" + activityId, {
        headers: { Authorization: "Bearer " + token },
    });
    if (!resp.ok) {
        console.error("getActivityData Error:", resp.status);
        return { status: resp.status };
    } else {
        const data = await resp.json();
        return { data: data, status: resp.status };
    }
}
