const { deleteUser } = require("../util/db");
const fetch = require("node-fetch");

const debug = require("debug")("strava-app:delete_api");

async function deleteAccount(req, res) {
    try {
        await deauthorize(req.user.access_token);
        const ret = await deleteUser(req.user.id);
        if (ret) return res.status(200).send();
    } catch (error) {
        debug(error);
    }
    res.status(500).send(
        "An error occured deleting the account, please try again"
    );
}

async function deauthorize(token) {
    let resp = await fetch("https://www.strava.com/oauth/deauthorize", {
        method: "post",
        headers: { Authorization: "Bearer " + token },
    });
    if (!resp.ok) {
        debug("deauthorize Error:", resp.status);
        throw "Error deauthorizing account: " + resp.status;
    } else {
        const json = await resp.json();
        if (!json.access_token) throw "errow deauthorizing account";
    }
}

module.exports = { deleteAccount };
