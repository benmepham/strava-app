import { parseStravaUrl } from "../util/parseStravaUrl.js";
import { refreshToken } from "../util/refreshToken.js";
import { getActivityData, getRuns, parseRun } from "../util/runFetch.js";

export async function view(req, res) {
    let returned_access_token = await refreshToken(
        req.user.id,
        req.user.access_token,
        req.user.refresh_token,
        req.user.expires_at
    );
    console.log("api access token " + returned_access_token);

    let activityUrl = req.query.url;
    if (activityUrl) {
        try {
            activityUrl = await parseStravaUrl(activityUrl);
        } catch (error) {
            console.log(error);
            return res.status(400).send("Activity URL invalid");
        }

        let runData;
        try {
            runData = parseRun(
                await getActivityData(activityUrl, returned_access_token)
            );
        } catch (error) {
            console.log(error);
            return res.status(400).send(error);
        }
        return res.send({ runs: [runData] });
    }

    if (req.query.num < 1 || req.query.num > 20 || req.query.page < 1)
        return res
            .status(400)
            .send("invalid number of activites or page number");

    try {
        let runs = await getRuns(
            returned_access_token,
            req.query.page,
            req.query.num,
            req.query.pagePos
        );
        let runArray = [];
        for (let run of runs.runs) {
            run = await getActivityData(run.id, returned_access_token);
            runArray.push(parseRun(run));
        }
        res.send({ runs: runArray, page: runs.page, pagePos: runs.pagePos });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}
