const createError = require("http-errors");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const debug = require("debug")("strava-app:app");

const api = require("./routes/api");
const webhook = require("./routes/webhook");
const { saveEmailToDb } = require("./routes/email_api");
const { loadDb, deserializeUserQuery, newUserQuery } = require("./util/db");

const app = express();
const environment = app.get("env");
const version_env = process.env.VERSION_ENV;

loadDb();

// version number from GitHub actions
let version = "dev";
if (version_env) {
    if (version_env.startsWith("refs/heads/main"))
        version = version_env.match(/(?!-)([\w\d]){7}/)[0];
    else version = version_env.substring(10, version_env.indexOf("-"));
}
console.log("strava-app, env: " + environment + ", version: " + version);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// helmet setup
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            "script-src": ["'self'", "cdnjs.cloudflare.com"],
            "style-src": ["'self'", "cdnjs.cloudflare.com"],
        },
    })
);

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
let sessionSetup = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 * 24 * 90 },
    store: MongoStore.create({
        mongoUrl: `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOSTNAME}:27017/${process.env.MONGO_DB}?authSource=admin`,
    }),
};
if (environment == "production") {
    app.set("trust proxy", 1); // trust first proxy
    sessionSetup.cookie.secure = true; // serve secure cookies
}
app.use(session(sessionSetup));

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    deserializeUserQuery(obj.id, done);
});

passport.use(
    new OAuth2Strategy(
        {
            clientID: process.env.STRAVA_CLIENT_ID,
            clientSecret: process.env.STRAVA_CLIENT_SECRET,
            callbackURL: process.env.CALLBACKURL,
            authorizationURL: "https://www.strava.com/oauth/authorize",
            tokenURL: "https://www.strava.com/oauth/token",
        },
        function (accessToken, refreshToken, params, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {
                newUserQuery(params, done, accessToken, refreshToken);
            });
        }
    )
);

app.get("/api/activities", ensureAuthenticated, api.view);

app.post("/api/email", saveEmailToDb);

app.get("/", function (req, res) {
    res.render("index", { user: req.user, version });
});

app.get("/account", ensureAuthenticated, function (req, res) {
    res.render("account", { user: req.user, version });
});

// GET /auth/strava
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Strava authentication will involve
//   redirecting the user to strava.com.  After authorization, Strava
//   will redirect the user back to this application at /auth/strava/callback
app.get(
    "/auth/strava",
    passport.authenticate("oauth2", {
        scope: ["activity:read_all,activity:read"],
    })
);

// GET /auth/strava/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
    "/auth/strava/callback",
    passport.authenticate("oauth2", { failureRedirect: "/" }),
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
app.post("/webhook", webhook.post);
app.get("/webhook", webhook.get);

// Simple route middleware to ensure user is authenticatec
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/");
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

module.exports = app;
