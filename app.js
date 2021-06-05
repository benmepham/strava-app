const createError = require("http-errors");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const passport = require("passport");
const StravaStrategy = require("passport-strava-oauth2").Strategy;
// const dotenv = require("dotenv");
const cookieSession = require("cookie-session");
const debug = require("debug")("strava-app:appjs");

const api = require("./routes/api");
const email_api = require("./routes/email_api");

const webhook = require("./routes/webhook");
const db = require("./util/db");

const app = express();
// dotenv.config();
const environment = app.get("env");
// debug("NODE_ENV: " + environment);
console.log(environment);

var logger;
// if (environment == "development") logger = require("morgan");
// if (environment == "development") app.use(logger("dev"));
logger = require("morgan");
app.use(logger("dev"));

db.loadDb(environment);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": [
                "'self'",
                "cdn.jsdelivr.net",
                "stackpath.bootstrapcdn.com",
                "code.jquery.com",
            ],
            "style-src": ["'self'", "stackpath.bootstrapcdn.com"],
        },
    })
);

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        keys: [process.env.SECRET],
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Strava profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
    // console.log("Serialize");
    // console.log(user);
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    //console.log("DESERIALIZE:");
    //console.log(obj);
    collection.findOne({ id: obj.id }, (err, doc) => {
        //console.log("FOUND-----");
        //console.log(doc);
        done(null, doc);
    });
});

passport.use(
    new StravaStrategy(
        {
            clientID: process.env.STRAVA_CLIENT_ID,
            clientSecret: process.env.STRAVA_CLIENT_SECRET,
            callbackURL: process.env.CALLBACKURL,
        },
        function (accessToken, refreshToken, params, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {
                // console.log(profile);

                collection.findOneAndUpdate(
                    { id: profile.id },
                    {
                        $setOnInsert: {
                            id: profile.id,
                            name: profile.displayName,
                            photo: profile.photos[0].value,
                            email: profile.emails[0].value,
                            created_on: new Date(),
                            sendEmails: false,
                        },
                        $set: {
                            last_login: new Date(),
                            access_token: accessToken,
                            refresh_token: refreshToken,
                            expires_at: params.expires_at,
                        },
                        $inc: { login_count: 1 },
                    },
                    { upsert: true, returnDocument: "after" },
                    (err, doc) => {
                        if (err) return console.error(err);
                        //console.log(doc.value);
                        return done(null, doc.value);
                    }
                );
            });
        }
    )
);

app.get("/api/activities", ensureAuthenticated, api.view);

app.post("/api/email", email_api.email_db);

app.get("/", function (req, res) {
    res.render("index", { user: req.user });
});

app.get("/account", ensureAuthenticated, function (req, res) {
    res.render("account", { user: req.user });
});

// GET /auth/strava
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Strava authentication will involve
//   redirecting the user to strava.com.  After authorization, Strava
//   will redirect the user back to this application at /auth/strava/callback
app.get(
    "/auth/strava",
    passport.authenticate("strava", {
        // scope: ["activity:read_all,activity:read"],
        scope: ["activity:read"],
        // approvalPrompt: "auto",
    })
);

// GET /auth/strava/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
    "/auth/strava/callback",
    passport.authenticate("strava", { failureRedirect: "/" }),
    function (req, res) {
        if (req.user.login_count <= 1) {
            return res.redirect("/account?new=true");
        }
        res.redirect("/account");
    }
);

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

// webhooks

app.post("/webhook", webhook.post);

// Adds support for GET requests to our webhook
app.get("/webhook", webhook.get);

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
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
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
