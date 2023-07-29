const express = require("express");
const { createTask } = require("../controllers/tasks");
const router = express.Router();

/**
 * Api Route: /task
 *
 * Creates a task
 */
router.post("/", createTask);

module.exports = router;
