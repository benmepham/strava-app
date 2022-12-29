const fetch = require("node-fetch");
const debug = require("debug")("strava-app:parseStravaAppLinkUrl");

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

module.exports = { parseStravaAppLinkUrl };
