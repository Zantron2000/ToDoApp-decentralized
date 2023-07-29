const { default: mongoose } = require("mongoose");
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

/**
 * @type {import("jsonschema").Schema}
 */
const finishTaskSchema = {
  type: "object",
  properties: {
    taskId: {
      type: "string",
      minLength: 24,
      maxLength: 24,
      pattern: "^[0-9a-fA-F]{24}$",
    },
  },
  required: ["taskId"],
  additionalItems: false,
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

/**
 * Marks a task as either finished or unfinished, depending on it's current state of
 * being done. Identifies the task by the provided task id
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response that indicates whether the task was marked as done or not
 */
const finishTask = async (req, res) => {
  try {
    const results = validateSchema(req.body, finishTaskSchema);

    if (!results.errors.length) {
      const { address: owner } = req.user;
      const { taskId } = req.body;

      const task = await Task.findOne({
        owner,
        _id: new mongoose.Types.ObjectId(taskId),
      });

      if (!task) {
        return res.status(404).send();
      }

      task.done = !task.done;
      await task.save();

      return res.status(200).send();
    } else {
      return res.status(400).send();
    }
  } catch (err) {
    return res.status(500).send();
  }
};

module.exports = {
  createTask,
  getImportantTasks,
  getMyDayTasks,
  finishTask,
};
