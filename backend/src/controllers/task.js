const { validateSchema } = require("../lib/validate");
const { Task } = require("../models/model");

/**
 * @type {import("jsonschema").Schema}
 */
const createTaskSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    dueDate: {
      type: "string",
      format: "date",
    },
    repeat: {
      type: "object",
      properties: {
        amount: {
          type: "integer",
        },
        unit: {
          type: "string",
          enum: ["DAY", "WEEK", "MONTH"],
        },
      },
      required: ["amount", "unit"],
    },
  },
  required: ["title"],
};

const createTask = async (req, res, next) => {
  const results = validateSchema(req.body, createTaskSchema);

  if (!results.errors.length) {
    req.body.owner = req.user.address;
    const task = new Task(req.body);
    await task.save();

    return res.status(200).json(task.getPublicFields()).send();
  } else {
    return res.status(400).send("Invalid body");
  }
};

/**
 * Gets all tasks that an address owns that are marked as important
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response full of all the tasks marked important
 */
const getImportantTasks = async (req, res) => {
  const { address: owner } = req.user;

  const tasks = await Task.find({ owner, important: true })
    .select("-__v -insertedDateTime -updatedDateTime")
    .lean();

  return res.status(200).json(tasks).send();
};

/**
 * Gets all tasks that an address owns that are marked to be done today
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response full of all the tasks marked to be done today
 */
const getMyDayTasks = async (req, res) => {
  const { address: owner } = req.user;

  const tasks = await Task.find({ owner, myDay: true })
    .select("-__v -insertedDateTime -updatedDateTime")
    .lean();

  return res.status(200).json(tasks).send();
};

module.exports = {
  createTask,
  getImportantTasks,
  getMyDayTasks,
};
