const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("./model/Task");
const TaskListRoute = require("./routes/TaskList");

const { SSXServer, SSXExpressMiddleware } = require("@spruceid/ssx-server");

const app = express();
const port = process.env.DB_PORT || 9000;
const ssx = new SSXServer({
  signingKey: "key",
});

const startServer = async () => {
  await mongoose.connect(process.env.DB_TEST_URL);

  app.use(
    cors({
      credentials: true,
      origin: true,
    })
  );

  app.use(SSXExpressMiddleware(ssx));

  app.use("/TaskList", TaskListRoute);

  app.get("/", (req, res) => {
    console.log(req);

    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

startServer();
