import { refreshToken } from "../util/refreshToken.js";
import { getRuns, parseRun } from "../util/runFetch.js";

export async function view(req, res) {
    let returned_access_token = await refreshToken(
        req.user.id,
        req.user.access_token,
        req.user.refresh_token,
        req.user.expires_at
    );
    console.log("api access token " + returned_access_token);

    if (req.query.num < 1 || req.query.num > 20 || req.query.page < 1) {
        return res
            .status(400)
            .send("invalid number of activites or page number");
    }

    try {
        let runs = await getRuns(
            returned_access_token,
            req.query.page,
            req.query.num,
            req.query.pagePos
        );
        let runArray = [];
        for (let run of runs.runs) {
            runArray.push(parseRun(run));
        }
        res.send({ runs: runArray, page: runs.page, pagePos: runs.pagePos });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}
