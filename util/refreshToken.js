const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();
const db = require("../util/db");

exports.refreshToken = refreshToken;

async function refreshToken(id, access_token, refresh_token, expires_at) {
    let currentTime = Math.floor(+new Date() / 1000);
    //currentTime = 100;
    console.log("current, expires:", currentTime, expires_at);
    if (expires_at < currentTime + 30) {
        // add 30 secs in case close to expiry time
        console.log("needs refreshing");
        let resp = await fetch(
            "https://www.strava.com/api/v3/oauth/token?" +
                new URLSearchParams({
                    client_id: process.env.STRAVA_CLIENT_ID,
                    client_secret: process.env.STRAVA_CLIENT_SECRET,
                    grant_type: "refresh_token",
                    refresh_token: refresh_token,
                }),
            {
                method: "POST",
            }
        );
        if (!resp.ok) {
            return console.error(resp.status);
        }
        const data = await resp.json();
        console.log("ret code" + data.access_token);
        const db_ret = await db.setToken(
            id,
            data.expires_at,
            data.refresh_token,
            data.access_token
        );
        console.log(db_ret.value);
        return db_ret.value.access_token;
        // return data.access_token;
    }
    console.log("is fine");
    return access_token;
}
