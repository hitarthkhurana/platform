const router = require("express").Router();
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const recaptcha = require("../../lib/recaptcha");
const logs = require("../../lib/logs");

const client = new PrismaClient();

router.use("/verification", require("./verification"));
router.post("/register", ...require("./register"));
// TODO: password resets

router.post("/login", recaptcha.verify(), (req, res, next) =>
  passport.authenticate("local", (error, user, info) => {
    if (error) {
      return res.json({ success: false, message: error });
    }

    if (user) {
      return req.logIn(user, (err) => {
        if (err) {
          return res.json({ success: false, message: err });
        }

        return res.status(200).json({
          success: true,
          message: "User authenticated",
          user,
        });
      });
    }

    return res.json({ success: false, message: info.message });
  })(req, res, next)
);

router.post("/me", async (req, res, next) =>
  res.json({
    success: true,
    authenticated: req.isAuthenticated(),
    user: req.user,
  })
);

router.get("/logout", (req, res) => {
  req.logOut();
  res.json({
    success: true,
    message: "Logged out",
  });
});

module.exports = router;
