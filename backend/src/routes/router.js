const express = require("express");

const task = require("./tasks");
const tasklist = require("./tasklist");

const router = express.Router();

router.use("/task", task);
router.use("/tasklist", tasklist);

module.exports = router;
