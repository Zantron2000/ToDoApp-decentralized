const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("./model/Task");

const { loggedIn, postmanLogin } = require("./lib/auth");
const { SSXServer, SSXExpressMiddleware } = require("@spruceid/ssx-server");

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

  app.use(
    cors({
      credentials: true,
      origin: true,
    })
  );

  app.use(SSXExpressMiddleware(ssx));
  app.use(authFunc);

  app.get("/", (req, res) => {
    console.log(req.user.address);

    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

startServer();
