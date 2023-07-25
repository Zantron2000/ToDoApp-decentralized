const mongoose = require("mongoose");
require("dotenv").config();

const Task = require("../../src/model/Task");
const TaskList = require("../../src/model/TaskList");

const execute = async () => {
  await mongoose.connect(process.env.DB_TEST_URL);
  await Task.collection.drop();
  await TaskList.collection.drop();
  await mongoose.connection.close();
};

module.exports = execute;
