require("dotenv").config();
const mongoose = require("mongoose");

const { setupApp } = require("./app");

const startServer = async () => {
  await mongoose.connect(process.env.DB_TEST_URL);

  const port = process.env.DB_PORT || 9000;
  const app = await setupApp();

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

startServer();
