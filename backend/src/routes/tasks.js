const express = require("express");
const { task } = require("../controllers/controller");
const router = express.Router();

/**
 * Api Route: /task
 *
 * Creates a task
 */
router.post("/", task.createTask);

/**
 * Api Route: /important
 *
 * Gets all important tasks that belong to an address
 */
router.get("/important", task.getImportantTasks);

/**
 * Api Route: /myDay
 *
 * Gets all tasks that are to be done today that belong to an address
 */
router.get("/myDay", task.getImportantTasks);

module.exports = router;
