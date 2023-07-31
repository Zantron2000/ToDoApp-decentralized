const mongoose = require("mongoose");

const { validateSchema, requireBodyValidation } = require("../lib/validate");
const { Task, Tasklist, DefaultList } = require("../models/model");

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
    listId: {
      type: "string",
      minLength: 24,
      maxLength: 24,
      pattern: "^[0-9a-fA-F]{24}$",
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

/**
 * @type {import("jsonschema").Schema}
 */
const deleteTaskSchema = {
  type: "object",
  properties: {
    listId: {
      type: "string",
      minLength: 1,
    },
    taskId: {
      type: "string",
      minLength: 1,
    },
  },
  required: ["taskId"],
};

/**
 * Creates a task with the given information, sets default values
 * and then adds it to a tasklist
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response that represents what happens and the created task
 * body if successfully made
 */
const createTask = async (req, res) => {
  const owner = req.user.address;
  const { listId, ...schema } = req.body;
  schema.owner = owner;
  const task = new Task(schema);
  await task.save();

  const listCollection = listId ? Tasklist : DefaultList;
  const query = listId
    ? { owner, _id: new mongoose.Types.ObjectId(listId) }
    : { owner };

  await listCollection.findOneAndUpdate(query, {
    $push: { tasks: task._id },
  });

  return res.status(200).json(task.getPublicFields()).send();
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

const deleteTask = async (req, res, next) => {
  try {
    const results = validateSchema(req.body, deleteTaskSchema);

    if (!results.errors.length) {
      const { address: owner } = req.user;
      const { listId, taskId } = req.body;

      const collection = listId ? Tasklist : DefaultList;
      const query = listId
        ? { owner, _id: new mongoose.Types.ObjectId(listId) }
        : { owner };

      const task = await Task.findOneAndDelete({
        owner,
        _id: new mongoose.Types.ObjectId(taskId),
      }).lean();
      const list = await collection
        .findOneAndUpdate(query, {
          $pull: { tasks: new mongoose.Types.ObjectId(taskId) },
        })
        .lean();

      if (task || list) {
        return res.status(204).send();
      } else {
        return res.status(404).send();
      }
    } else {
      return res.status(400).send("Invalid body");
    }
  } catch (err) {
    return res.status(500).send("Server crashed");
  }
};

module.exports = {
  createTask: requireBodyValidation(createTask, createTaskSchema),
  getImportantTasks,
  getMyDayTasks,
  finishTask,
  deleteTask,
};
