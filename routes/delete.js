const { deleteUser } = require("../util/db");
const debug = require("debug")("strava-app:delete_api");

async function deleteAccount(req, res) {
    // do some stuff
    debug(req.user);
    try {
        const ret = await deleteUser(req.user.id);
        if (ret) return res.status(200).send();
    } catch (error) {
        debug(error);
    }
    res.status(500).send(
        "An error occured deleting the account, please try again"
    );
}

module.exports = { deleteAccount };
