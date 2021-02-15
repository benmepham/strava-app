const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();

exports.refreshToken = refreshToken;

async function refreshToken(id, access_token, refresh_token, expires_at) {
    let currentTime = Math.floor(+new Date() / 1000);
    //currentTime = 100;
    console.log("current, expires:", currentTime, expires_at);
    if (expires_at < currentTime + 30) { // add 30 secs in case close to expiry time
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
        } else {
            const data = await resp.json();
            console.log(data);
            collection.findAndModify(
                { id: id },
                {},
                {
                    $set: {
                        access_token: data.access_token,
                        refresh_token: data.refresh_token,
                        expires_at: data.expires_at,
                    },
                },
                { upsert: true, new: true },
                (err, doc) => {
                    if (err) return console.error(err);
                    console.log(doc.value);
                    //return doc.value.access_token;
                }
            );
            return data.access_token;
        }
    } else {
        console.log("is fine");
        return access_token;
    }
}
