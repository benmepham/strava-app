exports.main = async function (req, res) {
    console.log("webhook event received!", req.query, req.body);
    res.status(200).send("EVENT_RECEIVED");
};
