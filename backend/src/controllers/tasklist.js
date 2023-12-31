const { Tasklist, Task } = require("../models/model"); // schema of the product table
const { validateSchema } = require("../lib/validate");
const mongoose = require("mongoose");

/**
 * @type {import("jsonschema").Schema}
 */
const createTasklistSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
  },
  required: ["title"],
  additionalProperties: false,
};

/**
 * @type {"import("jsonschema").Schema}
 */
const deleteTasklistSchema = {
  type: "object",
  properties: {
    tasklistId: {
      type: "String",
      minLength: 24,
      maxLength: 24,
      pattern: "^[0-9a-fA-F]{24}$",
    },
  },
  required: ["tasklistId"],

  additionalProperties: false,
};

/**
 * @type {"import("jsonschema").Schema}
 */
const updateTitleSchema = {
  type: "object",
  properties: {
    tasklistId: {
      type: "String",
      maxLength: 24,
      minLength: 24,
      pattern: "^[0-9a-fA-F]{24}$",
    },
    newTitle: { type: "String" },
  },

  require: ["tasklistId", "newTitle"],
  additionalProperties: false,
  minProperties: 2,
};

/**
 * Creates a new Tasklist
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response full of all the public fields from Tasklist
 */
const createTasklist = async (req, res) => {
  const results = validateSchema(req.body, createTasklistSchema);

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

/**
 * Deletes a given Tasklist and all corresponding tasks
 *
 * @param {*} req The incoming API request
 * @param {*} res The outgoing API response
 * @returns The status code only if request was processed correctly, or the error and status if request failed
 */
const deleteTasklist = async (req, res) => {
  try {
    const results = validateSchema(req.body, deleteTasklistSchema); //checks to see if valid list

    if (!results.errors.length) {
      const id = new mongoose.Types.ObjectId(req.body.tasklistId);

      const list = await Tasklist.findOne({
        _id: id,
        owner: req.user.address,
      });

      if (list === null) {
        return res.status(400).send("tasklist not found");
      }

      for (let i = 0; i < list.tasks.length; i++) {
        await Task.findByIdAndDelete({
          _id: list.tasks[i],
          owner: req.user.address,
        });
      }
      await Tasklist.findOneAndDelete({
        _id: id,
        owner: req.user.address,
      }).lean();

      return res.status(200).send();
    } else {
      return res.status(401).send("Invalid taskbody");
    }
  } catch (Error) {
    console.log(Error);
    return res.status(500).send();
  }
};

/**
 * Deletes a given Tasklist and all corresponding tasks
 *
 * @param {*} req The incoming API request
 * @param {*} res The outgoing API response
 * @returns The status code only if request was processed correctly, or the error and status if request failed
 */
const updateTasklistTitle = async (req, res) => {
  try {
    const results = validateSchema(req.body, updateTitleSchema);

    if (!results.errors.length) {
      const list = await Tasklist.findOneAndUpdate(
        { _id: req.body.tasklistId, owner: req.user.address },
        { title: req.body.newTitle },
        { new: true }
      ).lean();

      if (list) {
        res.status(200).send();
      } else {
        res.status(404).send();
      }
    } else {
      return res.status(400).send();
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
};

module.exports = {
  createTasklist,
  deleteTasklist,
  updateTasklistTitle,
};
