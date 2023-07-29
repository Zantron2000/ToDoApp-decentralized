const express = require("express");
const generics = require("./genericLists");

const router = express.Router();

router.use(generics);

module.exports = router;
