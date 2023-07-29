const express = require("express");
const { getImportantTasks } = require("../controllers/genericLists");
const router = express.Router();

/**
 * Api Route: /important
 *
 * Gets all important tasks that belong to an address
 */
router.get("/important", getImportantTasks);

/**
 * Api Route: /myDay
 *
 * Gets all tasks that are to be done today that belong to an address
 */
router.get("/myDay", getImportantTasks);

module.exports = router;
