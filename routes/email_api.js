module.exports = { email_db };
function email_db(req, res) {
    console.log(req.query);

    const mailformat =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    // Email validation regex from: https://tutorial.eyehunts.com/js/email-regex-javascript-validation-example-code/

    if (!email.match(mailformat)) {
        console.log("error")
    }

    //save to db
    res.status(200).send("ok");
}
