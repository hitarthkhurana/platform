const express = require("express");
const router = express.Router();
const fs = require("fs");

router.get("/lethifold", (_, res) =>
  res.redirect("https://i.imgur.com/VyK9oDn.png")
);

router.get("/discord.gg", (_, res) => {
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Disposition": 'attachements; filename="WYkPG9E.png"',
    "X-PAY-ATTENTION": "WYkPG9E",
  });
  fs.createReadStream("./assets/WYkPG9E.png").pipe(res);
});

router.get("/slash", (_, res) => {
  res.writeHead(200, {
    "Content-Type": "image/png",
  });
  fs.createReadStream("./assets/sme.png").pipe(res);
});

router.get("/dbz", (_, res) =>
  res.redirect("http://chall.cryptichunt.com:8080/fivethousand.tar.gz")
);

router.use("/KILLSHOT", express.static("./killshot"));

module.exports = router;
