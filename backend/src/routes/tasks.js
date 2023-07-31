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
 * Api Route: /task/important
 *
 * Gets all important tasks that belong to an address
 */
router.get("/important", task.getImportantTasks);

/**
 * Api Route: /task/myDay
 *
 * Gets all tasks that are to be done today that belong to an address
 */
router.get("/myDay", task.getMyDayTasks);

/**
 * Api Route: /task/mark
 *
 * Gets all tasks that are to be done today that belong to an address
 */
router.put("/mark", task.finishTask);

/**
 * Api Route: /task
 *
 * Deletes a task and it's reference in its tasklist
 */
router.delete("/", task.deleteTask);

module.exports = router;
