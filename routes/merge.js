import FormData from "form-data";
import { buildGPX, StravaBuilder } from "gpx-builder";
import { getActivityData } from "../util/runFetch.js";
const { Point, Metadata } = StravaBuilder.MODELS;

async function getActivityStreams(id, token, key) {
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
        console.log("getActivityStreams Error:", resp.status);
        throw "Error getting activity streams: " + resp.status;
        // can't throw here
    } else {
        const data = await resp.json();
        return {
            latlong: data[0].data,
            distance: data[1].data,
            altitude: data[2].data,
            time: data[3].data,
        };
    }
}

async function getUpoadStatus(id, token) {
    let resp = await fetch("https://www.strava.com/api/v3/uploads/" + id, {
        method: "get",
        headers: { Authorization: "Bearer " + token },
    });
    if (!resp.ok) {
        console.log("getUpoadStatus Error:", resp.status);
        return resp.json();
    } else {
        return resp.json();
    }
}

async function uploadActivity(formData, token) {
    let resp = await fetch(`https://www.strava.com/api/v3/uploads`, {
        method: "post",
        headers: {
            Authorization: "Bearer " + token,
        },
        body: formData,
    });
    if (!resp.ok) {
        console.log("uploadActivity Error:", resp.status);
        return resp.json();
    } else {
        return resp.json();
    }
}

function delay(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

function genGpx(activityStreams, activityData) {
    const points = [];
    let date;
    for (let i = 0; i < activityStreams.latlong.length; i++) {
        date = new Date(activityData.start_date);
        // Hack to get strava not to flag as duplicate
        date.setSeconds(date.getSeconds() + 60);
        date.setSeconds(date.getSeconds() + activityStreams.time[i]);
        points.push(
            new Point(
                activityStreams.latlong[i][0],
                activityStreams.latlong[i][1],
                {
                    ele: activityStreams.altitude[i],
                    time: date,
                    // distance: activity1Streams.distance[i],
                }
            )
        );
    }
    return points;
}

export async function mergeActivies(req, res) {
    // get json from post request data
    const data = req.body.runs;
    console.log(data);
    const arr = data.split(",");
    console.log(arr);
    let activity1 = arr[0],
        activity2 = arr[1];

    // todo: shuffle into correct order
    // todo: verify same day

    //   try {
    //     activity1 = await parseStravaUrl(activity1);
    //     activity2 = await parseStravaUrl(activity2);
    //   } catch (err) {
    //     console.log(err);
    //     return res.status(400).send("Activity URL invalid");
    //   }

    let activity1Data, activity2Data;
    try {
        activity1Data = await getActivityData(activity1, req.user.access_token);
        activity2Data = await getActivityData(activity2, req.user.access_token);
    } catch (err) {
        console.log(err);
        return res.status(500).send("Unable to fetch activities");
    }

    if (
        new Date(activity2Data.start_date) < new Date(activity1Data.start_date)
    ) {
        return res.status(400).send("wrong activity order");
    }

    // todo: handle if activity times/locations overlap

    let activity1Streams, activity2Streams;

    try {
        activity1Streams = await getActivityStreams(
            activity1,
            req.user.access_token,
            "altitude,latlng,time"
        );
        activity2Streams = await getActivityStreams(
            activity2,
            req.user.access_token,
            "altitude,latlng,time"
        );
    } catch (err) {
        console.log(err);
        return res.status(500).send("Unable to fetch activity streams");
    }

    const points = genGpx(activity1Streams, activity1Data);
    points.push(...genGpx(activity2Streams, activity2Data));

    // console.log(points[0]);
    // console.log(points[points.length - 1]);

    const gpxData = new StravaBuilder();
    gpxData.setSegmentPoints(points);

    const formData = new FormData();
    formData.append(
        "file",
        buildGPX(gpxData.toObject()),
        `${activity1Data.name}-${activity2Data.name}-merge.gpx`
    );
    formData.append("data_type", "gpx");
    formData.append(
        "name",
        `${activity1Data.name} + ${activity2Data.name} merge`
    );
    formData.append("description", "Merged using strava-app");
    formData.append("sport_type", "Run");

    let activityUploadStatus;
    console.log(formData);

    try {
        activityUploadStatus = await uploadActivity(
            formData,
            req.user.access_token
        );
        console.log(activityUploadStatus);
    } catch (err) {
        console.log(err);
        return res.status(500).send("Error uploading merged activity");
    }

    while (
        activityUploadStatus &&
        activityUploadStatus.status == "Your activity is still being processed."
    ) {
        await delay(1000);
        try {
            activityUploadStatus = await getUpoadStatus(
                activityUploadStatus.id,
                req.user.access_token
            );
            console.log(activityUploadStatus);
        } catch (err) {
            console.log(err);
            return res.status(500).send("Error uploading merged activity");
        }
    }

    if (
        !activityUploadStatus ||
        activityUploadStatus.status != "Your activity is ready."
    ) {
        return res
            .status(500)
            .send(
                activityUploadStatus
                    ? activityUploadStatus.error
                    : "upload error"
            );
    }

    return res.status(200).send(activityUploadStatus.activity_id.toString());
}
