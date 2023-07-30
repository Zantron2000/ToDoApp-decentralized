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
const updateTaskSchema = {
  type: "object",
  properties: {
    taskId: {
      type: "string",
      pattern: "^[0-9a-fA-F]{24}$",
      minLength: 24,
      maxLength: 24,
    },
    title: {
      type: "string",
      minLength: 1,
      pattern: "\\S",
    },
    dueDate: {
      type: "string",
      format: "date",
    },
    important: {
      type: "boolean",
    },
    myDay: {
      type: "boolean",
    },
    done: {
      type: "boolean",
    },
    repeat: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          minimum: 1,
        },
        unit: {
          type: "string",
          enum: ["DAY", "WEEK", "MONTH"],
        },
        dueEvery: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              minimum: 1,
            },
            unit: {
              type: "string",
              enum: ["DAY", "WEEK", "MONTH"],
            },
          },
          required: ["amount", "unit"],
        },
      },
      required: ["unit", "amount"],
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          order: {
            type: "number",
            minimum: 0,
          },
          complete: {
            type: "boolean",
          },
          title: {
            type: "string",
            minLength: 1,
            pattern: "\\S",
          },
        },
        required: ["order", "complete", "title"],
      },
    },
  },
  required: ["taskId"],
  additionalProperties: false,
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
 * Updates a given task with new schema information
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response with a status code to represent if the data was modified
 */
const updateTask = async (req, res) => {
  try {
    const results = validateSchema(req.body, updateTaskSchema);

    if (!results.errors.length) {
      const { taskId: _id, ...updates } = req.body;
      const { address: owner } = req.user;

      const task = await Task.findOneAndUpdate(
        { _id, owner },
        { $set: updates },
        { new: true }
      ).lean();

      if (task) {
        return res.status(200).send();
      } else {
        return res.status(404).send();
      }
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
  updateTask,
};
