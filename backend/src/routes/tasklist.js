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

/**
 * API route "tasklist/allTasklists"
 *
 * Gets the titles of all the tasklists of a given owner
 */
router.get("/allTasklists", tasklist.getAllTasklists);

module.exports = router;
