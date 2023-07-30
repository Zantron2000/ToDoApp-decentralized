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

module.exports = {
  createTask: requireBodyValidation(createTask, createTaskSchema),
  getImportantTasks,
  getMyDayTasks,
};
