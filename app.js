const createError = require("http-errors");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const passport = require("passport");
const StravaStrategy = require("passport-strava-oauth2").Strategy;
const dotenv = require("dotenv");
const MongoClient = require("mongodb").MongoClient;
const cookieSession = require("cookie-session");

const api = require("./routes/api");
const app = express();
dotenv.config();
const environment = app.get("env");
var logger
if (environment == "development") logger = require("morgan");

let collection;
const client = new MongoClient(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
client.connect((err) => {
    if (err) return console.error(err);
    let dbName = "stravadb_dev";
    if (environment == "production") {
        dbName = "stravadb_prod";
    }
    collection = client.db(dbName).collection("users");
    //console.log("DB Connected");
    // perform actions on the collection object
    // client.close();
    global.collection = collection;
});

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
if (environment == "development") app.use(logger("dev"));
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
            callbackURL: process.env.CALLBACK,
        },
        function (accessToken, refreshToken, params, profile, done) {
            // asynchronous verification, for effect...
            process.nextTick(function () {
                // To keep the example simple, the user's Strava profile is returned to
                // represent the logged-in user.  In a typical application, you would want
                // to associate the Strava account with a user record in your database,
                // and return that user instead.
                // console.log(profile);
                // console.log("Exp", params.expires_in, params.expires_at);
                // console.log("TOKENs:", accessToken, refreshToken);
                collection.findAndModify(
                    { id: profile.id },
                    {},
                    {
                        $setOnInsert: {
                            id: profile.id,
                            name: profile.displayName,
                            photo: profile.photos[0].value,
                            emails: profile.emails || "none",
                            created_on: new Date(),
                        },
                        $set: {
                            last_login: new Date(),
                            access_token: accessToken,
                            refresh_token: refreshToken,
                            expires_at: params.expires_at,
                        },
                        $inc: { login_count: 1 },
                    },
                    { upsert: true, new: true },
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

app.get("/", function (req, res) {
    console.log("NODE_ENV: " + environment);
    res.render("index", {});
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
        approvalPrompt: "auto",
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
        res.redirect("/account");
    }
);

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

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
