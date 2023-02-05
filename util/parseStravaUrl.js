const fetch = require("node-fetch");
const debug = require("debug")("strava-app:parseStravaUrl");

async function parseStravaAppLinkUrl(activityUrl) {
    let resp = await fetch(activityUrl);
    if (!resp.ok) {
        debug("Error:", resp.status);
    } else {
        const data = await resp.text();
        const dataMatch = data.match(
            /(?<=strava.com\/activities\/)([0-9]){10}/g
        );
        return dataMatch && dataMatch[0];
    }
}
async function parseStravaUrl(activityUrlIn) {
    let activityUrl = activityUrlIn;
    const stravaUrlRegex = /(?!strava.com\/activities\/)([0-9]){10}/;
    const stravaShortUrlRegex = /strava.app.link\/[0-9a-zA-Z]{11}/;
    if (activityUrl.match(stravaUrlRegex))
        activityUrl = activityUrl.match(stravaUrlRegex)[0];
    else if (activityUrl.match(stravaShortUrlRegex)) {
        activityUrl = "https://" + activityUrl.match(stravaShortUrlRegex)[0];
        activityUrl = await parseStravaAppLinkUrl(activityUrl);
        if (!activityUrl)
            return res.status(400).send("strava.app.link URL is invalid");
    }
    debug(activityUrl);

    if (!/^\d{10}$/.test(activityUrl))
        return res.status(400).send("Activity ID input is invalid");

    return activityUrl;
}

module.exports = { parseStravaUrl };
