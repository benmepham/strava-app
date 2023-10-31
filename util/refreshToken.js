const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();
const db = require("../util/db");

exports.refreshToken = refreshToken;

async function refreshToken(id, access_token, refresh_token, expires_at) {
    let currentTime = Math.floor(+new Date() / 1000);
    if (expires_at < currentTime + 30) {
        // add 30 secs in case close to expiry time
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
        // don't await to slightly speed up loading
        const db_ret = db.setToken(
            id,
            data.expires_at,
            data.refresh_token,
            data.access_token
        );
        // return db_ret.value.access_token;
        return data.access_token;
    }
    return access_token;
}
