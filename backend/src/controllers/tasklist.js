const { Tasklist } = require("../models/model"); // schema of the product table
const { validateSchema } = require("../lib/validate");

/**
 * @type {import("jsonschema").Schema}
 */
const createTaskSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
  },
  required: ["title"],
  additionalProperties: false,
};

/**
 * Creates a new Tasklist
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response full of all the public fields from Tasklist
 */
const createTasklist = async (req, res) => {
  const results = validateSchema(req.body, createTaskSchema);

  if (!results.errors.length) {
    const list = new Tasklist({
      title: req.body.title,
      owner: req.user.address,
      order: (await Tasklist.count({ owner: req.user.address })) + 1,
    });

    await list.save();
    return res.status(200).json(list.getPublicFields()).send();
  } else {
    return res.status(400).send("Invalid body");
  }
};

module.exports = {
  createTasklist,
};
