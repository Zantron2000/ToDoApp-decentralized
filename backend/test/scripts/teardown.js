const mongoose = require("mongoose");
require("dotenv").config();

const { Task, Tasklist, DefaultList } = require("../../src/models/model");

const execute = async () => {
  await mongoose.connect(process.env.DB_TEST_URL);
  await Task.collection.drop();
  await Tasklist.collection.drop();
  await DefaultList.collection.drop();
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
};

module.exports = execute;
