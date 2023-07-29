const express = require("express");
const router = express.Router();

const { tasklist } = require("../controllers/controller");

router.post("/", tasklist.createTasklist);

module.exports = router;
