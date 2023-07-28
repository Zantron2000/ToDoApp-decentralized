const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const { loggedIn, postmanLogin, isNewUser } = require("./lib/auth");
const { SSXServer, SSXExpressMiddleware } = require("@spruceid/ssx-server");
const router = require("./routes/router");

const app = express();
const port = process.env.DB_PORT || 9000;
const ssx = new SSXServer({
  signingKey: "key",
});

let authFunc = loggedIn;
let authVar = process.argv.find((arg) => arg.startsWith("auth="));
if (authVar) {
  let value = authVar.split("=")[1];

  if (value === "dummy") {
    authFunc = (req, res, next) => next();
  } else if (value === "postman") {
    authFunc = postmanLogin;
  }
}

const startServer = async () => {
  await mongoose.connect(process.env.DB_URL);

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Cookie");
    next();
  });

  app.use(
    cors({
      credentials: true,
      origin: true,
    })
  );

  /**
   * Enforces SSX authentication
   *
   * login endpoint
   *  - endpoint: /ssx-login (default but required for callback)
   *  - callback: Creates a new default task list if new address used
   */
  app.use(
    SSXExpressMiddleware(ssx, {
      login: {
        path: "/ssx-login",
        callback: (req) => {
          isNewUser(req);
        },
      },
    })
  );

  // Enforces a selected authentication function for all endpoints below this code
  app.use(authFunc);

  app.use(router);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

startServer();
