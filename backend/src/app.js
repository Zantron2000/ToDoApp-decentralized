const express = require("express");
const cors = require("cors");
const { SSXServer, SSXExpressMiddleware } = require("@spruceid/ssx-server");

const app = express();
const port = 9000;

const ssx = new SSXServer({
  signingKey: "key",
});

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

console.log(SSXExpressMiddleware);

app.use(SSXExpressMiddleware(ssx));

app.get("/", (req, res) => {
  console.log(req);

  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
