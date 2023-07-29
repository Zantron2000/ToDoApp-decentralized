const { validateSchema } = require("../lib/validate");
const Task = require("../model/Task");

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

    return res.status(200).json(task).send();
  } else {
    return res.status(400).send("Invalid body");
  }
};

module.exports = {
  createTask,
};
