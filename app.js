import express from "express";
import session from "express-session";
import passport from "passport";
import OAuth2Strategy from "passport-oauth2";
import { view } from "./routes/api.js";
import { deleteAccount } from "./routes/delete.js";
import { mergeActivies } from "./routes/merge.js";
import { deserializeUserQuery, initDB, newUserQuery } from "./util/db.js";

const app = express();
const environment = Deno.env.get("ENVIRONMENT") || "development";
const version_env = Deno.env.get("VERSION");

initDB();

// version number from GitHub actions
let version = "dev";
if (version_env) {
    if (version_env.startsWith("refs/heads/main"))
        version = version_env.match(/(?!-)([\w\d]){7}/)[0];
    else version = version_env.substring(10, version_env.indexOf("-"));
}
console.log(
    "strava-app, env: " +
        environment +
        ", version: " +
        version +
        ", analytics: " +
        Deno.env.get("ANALYTICS_URL")
);

// view engine setup
app.set("views", "./views");
app.set("view engine", "pug");

// helmet setup
// app.use(helmet());
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             "script-src": [
//                 "'self'",
//                 "cdnjs.cloudflare.com",

//                 `${Deno.env.get("ANALYTICS_CSP")}`,
//             ],
//             "style-src": ["'self'", "cdnjs.cloudflare.com"],
//             "connect-src": ["'self'", `${Deno.env.get("ANALYTICS_CSP")}`],
//             "img-src": ["'self'", `${Deno.env.get("ANALYTICS_CSP")}`],
//         },
//     }),
//     helmet.crossOriginEmbedderPolicy({ policy: "credentialless" })
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));
app.use(
    session({
        secret: Deno.env.get("SECRET"),
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);
if (environment == "production") {
    app.set("trust proxy", 1); // trust first proxy
    sessionSetup.cookie.secure = true; // serve secure cookies
}

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    deserializeUserQuery(obj.athlete_id, done);
});

passport.use(
    new OAuth2Strategy(
        {
            clientID: Deno.env.get("STRAVA_CLIENT_ID"),
            clientSecret: Deno.env.get("STRAVA_CLIENT_SECRET"),
            callbackURL: Deno.env.get("STRAVA_CALLBACK_URL"),
            authorizationURL: "https://www.strava.com/oauth/authorize",
            tokenURL: "https://www.strava.com/oauth/token",
        },
        function (accessToken, refreshToken, params, profile, done) {
            newUserQuery(params, done, accessToken, refreshToken);
        }
    )
);

app.get("/api/activities", ensureAuthenticatedApi, view);

app.delete("/api/delete", ensureAuthenticatedApi, deleteAccount);

app.post("/api/merge", ensureAuthenticatedApi, mergeActivies);

app.get("/", function (req, res) {
    res.render("index", {
        user: req.user,
        version,
        analyticsUrl: Deno.env.get("ANALYTICS_URL"),
        analyticsImgUrl: Deno.env.get("ANALYTICS_IMG_URL"),
    });
});

app.get("/account", ensureAuthenticated, function (req, res) {
    res.render("account", {
        user: req.user,
        version,
        analyticsUrl: Deno.env.get("ANALYTICS_URL"),
        analyticsImgUrl: Deno.env.get("ANALYTICS_IMG_URL"),
    });
});

// GET /auth/strava
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Strava authentication will involve
//   redirecting the user to strava.com.  After authorization, Strava
//   will redirect the user back to this application at /auth/strava/callback
app.get(
    "/auth/strava",
    passport.authenticate("oauth2", {
        scope: ["activity:read_all,activity:read,activity:write"],
    })
);

// GET /auth/strava/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
    "/auth/strava/callback",
    passport.authenticate("oauth2", { failureRedirect: "/failoauth" }),
    function (req, res) {
        // On first login, show the welcome message
        if (req.user.login_count <= 1) return res.redirect("/account?new");
        res.redirect("/account");
    }
);

app.get("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) return next(err);
        res.redirect("/");
    });
});

// webhooks
// app.post("/webhook", webhook.post);
// app.get("/webhook", webhook.get);

// Simple route middleware to ensure user is authenticatec
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/");
}

function ensureAuthenticatedApi(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(403).send();
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = environment === "development" ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

app.listen(Deno.env.get("PORT") || 3000, () => {
    console.log("Listening on port " + (Deno.env.get("PORT") || 3000));
});
