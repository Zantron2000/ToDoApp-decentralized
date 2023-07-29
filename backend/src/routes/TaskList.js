const express = require("express");
const router = express.Router();

const TaskListController = require("../controllers/TaskList");

router.post("/post", TaskListController.create_TaskList);

module.exports = router;
