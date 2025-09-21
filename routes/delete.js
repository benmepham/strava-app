export async function deleteAccount(req, res) {
    try {
        await deauthorize(req.user.access_token);
        const ret = await deleteUser(req.user.id);
        if (ret) return res.status(200).send();
    } catch (error) {
        console.log(error);
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
        console.log("deauthorize Error:", resp.status);
        throw "Error deauthorizing account: " + resp.status;
    } else {
        const json = await resp.json();
        if (!json.access_token) throw "errow deauthorizing account";
    }
}
