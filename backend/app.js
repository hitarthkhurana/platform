const express = require("express");
const pino = require("pino-http");
const logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const helmet = require("helmet");
const compression = require("compression");
const redis = require("redis");
const connectRedis = require("connect-redis");
const crypto = require("crypto");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const Sentry = require("@sentry/node");
const app = express();

Sentry.init({ dsn: process.env.SENTRY_DSN });
const RedisStore = connectRedis(session);
const client = redis.createClient(process.env.REDIS_URL);

app.use(
  process.env.NODE_ENV === "production"
    ? pino({ prettyPrint: process.env.NODE_ENV !== "production" })
    : logger("dev")
);
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    req.log = {};
    req.log.info = console.log;
  }

  next();
});

if (process.env.NODE_ENV === "production") {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, "react_build")));
app.use(cookieParser());
// app.use(
//   rateLimit({
//     windowMs: 1 * 60 * 1000, // 15 minutes
//     max: 30, // limit each IP to 100 requests per windowMs
//     handler: (req, res) =>
//       res.json({ status: "error", message: "Your IP has been rate limited" }),
//   })
// );
app.use(
  session({
    store: new RedisStore({ client }),
    secret: process.env.SECRET || crypto.randomBytes(20).toString("hex"),
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);

require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", require("./api"));
app.use("/", require("./backlinks"));

app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname + "/react_build/index.html"))
);

app.use((err, req, res, next) => {
  req.log.info(err);

  // Set statusCode to 500 if it isn't already there
  err.statusCode = err.statusCode || err.status || 500;
  err.message = err.message || err.name || "Internal Server Error";
  err.code = err.code || err.name || "500_INTERNAL_SERVER_ERR";

  res.locals.authenticated = req.isAuthenticated() || false;
  res.locals.user = req.user;
  res.json({ success: false, code: err.statusCode, message: err.message });
  return;
});

module.exports = app;
