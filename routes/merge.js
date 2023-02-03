const fetch = require("node-fetch");
var FormData = require("form-data");
const debug = require("debug")("strava-app:merge_api");
const { StravaBuilder, buildGPX } = require("gpx-builder");
const { getActivityData } = require("../util/runFetch");
const { Point, Metadata } = StravaBuilder.MODELS;

async function getData(id, token, key) {
    let resp = await fetch(
        "https://www.strava.com/api/v3/activities/" +
            id +
            "/streams?keys=" +
            key,
        {
            method: "get",
            headers: { Authorization: "Bearer " + token },
        }
    );
    if (!resp.ok) {
        debug("getData Error:", resp.status);
        throw "Error deauthorizing account: " + resp.status;
        // can't throw here
    } else {
        return resp.json();
    }
}

async function getUpoadStatus(id, token) {
    let resp = await fetch("https://www.strava.com/api/v3/uploads/" + id, {
        method: "get",
        headers: { Authorization: "Bearer " + token },
    });
    if (!resp.ok) {
        debug("getData Error:", resp.status);
        throw "Error deauthorizing account: " + resp.status;
        // can't throw here
    } else {
        return resp.json();
    }
}

async function uploadActivity(formData, token) {
    try {
        let resp = await fetch(`https://www.strava.com/api/v3/uploads`, {
            method: "post",
            headers: {
                Authorization: "Bearer " + token,
            },
            body: formData,
        });
        if (!resp.ok) {
            debug(await resp.json());

            debug("getData Error:", resp.status);
            throw "Error account: " + resp.status;
        } else {
            return resp.json();
        }
    } catch (err) {
        debug(err);
    }
}

function delay(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

async function mergeActivies(req, res) {
    console.log(req.user.access_token);
    let activity = req.query.id;
    let data = await getActivityData(activity, req.user.access_token);
    let latlong = await getData(activity, req.user.access_token, "latlng");
    let time_list = await getData(activity, req.user.access_token, "time");
    let altitude = await getData(activity, req.user.access_token, "altitude");
    // console.log(latlong);
    // console.log(time_list);
    // console.log(altitude);
    // console.log(data);
    const dataParsed = {
        start_date: data.start_date,
        start_data_local: data.start_date_local,
        name: data.name,
        start_latlng: data.start_latlng,
        end_latlng: data.end_latlng,
        external_id: data.external_id,
        moving_time: data.moving_time,
        elapsed_time: data.elapsed_time,
        distance: data.distance,
    };
    console.log(dataParsed);
    latlong = latlong[0].data;
    time_list = time_list[1].data;
    console.log(time_list[time_list.length - 1]);
    altitude = altitude[1].data;
    const points = [];

    let currentDate = new Date();
    for (let i = 0; i < latlong.length; i++) {
        currentDate = new Date(dataParsed.start_date);
        // currentDate.setHours(currentDate.getHours() - 4);
        currentDate.setSeconds(currentDate.getSeconds() + time_list[i]);
        points.push(
            new Point(latlong[i][0], latlong[i][1], {
                ele: altitude[i],
                time: currentDate,
            })
        );
    }
    console.log(points[0]);

    const gpxData = new StravaBuilder();
    // const metadata = new Metadata();
    // gpxData.setMetadata(metadata);
    gpxData.setSegmentPoints(points);
    console.log(buildGPX(gpxData.toObject()).slice(0, 1000));
    console.log(buildGPX(gpxData.toObject()).slice(-1000));

    var formData = new FormData();
    formData.append("file", buildGPX(gpxData.toObject()), "name.gpx");
    formData.append("data_type", "gpx");
    formData.append("name", "activity1 + activity2 merge");
    formData.append("description", "Merged using strava-app");
    formData.append("sport_type", "Run");

    let activityUploadStatus = await uploadActivity(
        formData,
        req.user.access_token
    );
    while (
        activityUploadStatus.status == "Your activity is still being processed."
    ) {
        await delay(1000);
        activityUploadStatus = await getUpoadStatus(
            activityUploadStatus.id,
            req.user.access_token
        );
        console.log(activityUploadStatus);
    }

    res.status(200).send();
}

module.exports = { mergeActivies };
