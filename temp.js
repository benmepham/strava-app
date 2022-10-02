import fetch from 'node-fetch';

async function followRedirect(activityUrl, token) {
    // follow link
    console.log("first url", activityUrl)
    let resp = await fetch(activityUrl, {redirect: 'follow'});
    if (!resp.ok) {
        debug("Error:", resp.status);
        return { status: resp.status };
    } else {
        console.log("resp:",resp);
        console.log(resp.headers.get('location'));
        return resp.url;
    }
}
if (activityUrl.startsWith("https://strava.app.link/")) {
            activityUrl = await followRedirect(activityUrl, returned_access_token);
            console.log(activityUrl);
        }