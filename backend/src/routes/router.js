const express = require("express");
const generics = require("./genericLists");
const task = require("./tasks");

const router = express.Router();

router.use(generics);
router.use("/task", task);

module.exports = router;
