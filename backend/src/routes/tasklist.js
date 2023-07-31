const express = require("express");
const router = express.Router();

const { tasklist } = require("../controllers/controller");

/**
 * API route "/tasklist"
 *
 * Creates a new tasklist
 */
router.post("/", tasklist.createTasklist);

/**
 * API route "/tasklist/remove"
 *
 * Removes a given tasklist by the given tasklist id
 */
router.delete("/remove", tasklist.deleteTasklist);

module.exports = router;
