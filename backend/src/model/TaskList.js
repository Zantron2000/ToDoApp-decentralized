const mongoose = require("mongoose");

/**
 * @typedef {Object} TaskList
 *
 * @property {String} title The title of the list
 *
 * @property {String} owner The address of the user who created the list
 *
 * @property {Number} order The order of which the list appears compared to other lists
 *
 * @property {mongoose.Schema.Types.ObjectId} tasks The ids of all tasks that belong to the list
 */

const TaskListSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
    },
    owner: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      min: 0,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "Must be an integer",
      },
    },
    tasks: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "insertedDateTime", updatedAt: "updatedDateTime" },
  }
);

TaskListSchema.methods.getPublicFields = function () {
  const { _id, title, owner, order, tasks } = this;
  return { _id, title, owner, order, tasks };
};

const TaskList = mongoose.model("TaskList", TaskListSchema);

module.exports = TaskList;
