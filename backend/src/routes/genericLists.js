const express = require("express");
const { getImportantTasks } = require("../controllers/genericLists");
const router = express.Router();

/**
 * Api Route: /important
 *
 * Gets all important tasks that belong to an address
 */
router.get("/important", getImportantTasks);

module.exports = router;
