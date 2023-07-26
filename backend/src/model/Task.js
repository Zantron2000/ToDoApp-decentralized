const mongoose = require("mongoose");

/**
 * @typedef {Object} Step
 *
 * @property {Number} order The number of the step, or order of completion compared to other steps
 *
 * @property {Boolean} complete Whether the task is complete or not
 *
 * @property {String} title The title of the step
 */

/**
 * @typedef {Object} Repeat
 *
 * @property {Number} amount The amount of time units that the task repeats
 *
 * @property {String} unit The unit of which it repeats, an enum of days, weeks or months
 *
 * @property {Object} dueEvery The information on when the task is due relative to when it repeats
 *
 * @property {Number} dueEvery.amount The amount of time units that the due date is from the moment the task repeats
 *
 * @property {String} dueEvery.unit The unit of which it repeats, an enum of days, weeks or months
 */

/**
 * @typedef {Object} Task
 *
 * @property {String} title The title of the task, required and can't be just white space
 *
 * @property {Date} dueDate The date which the task is due
 *
 * @property {Boolean} important Whether the task is marked as important
 *
 * @property {Boolean} myDay Whether the task is added to user's day to complete
 *
 * @property {Boolean} done Whether the task is complete or not
 *
 * @property {String} owner The address of the user that created the task
 *
 * @property {Repeat} repeat Information on how often the task repeats if it does
 *
 * @property {Step[]} steps The extra steps involved to complete the task
 */

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minLength: 1,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    important: {
      type: Boolean,
      default: false,
    },
    myDay: {
      type: Boolean,
      default: false,
    },
    done: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: String,
      required: true,
    },
    repeat: {
      type: {
        amount: {
          type: Number,
          min: 1,
          required: true,
        },
        unit: {
          type: String,
          required: true,
          enum: ["DAY", "WEEK", "MONTH"],
        },
        dueEvery: {
          type: {
            amount: {
              type: Number,
              min: 1,
              required: true,
            },
            unit: {
              type: String,
              required: true,
              enum: ["DAY", "WEEK", "MONTH"],
            },
          },
          required: false,
        },
      },
      required: false,
    },
    steps: {
      type: [
        {
          order: {
            type: Number,
            min: 0,
            required: true,
          },
          complete: {
            type: Boolean,
            default: false,
          },
          title: {
            type: String,
            required: true,
            minLength: 1,
            trim: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "insertedDateTime", updatedAt: "updatedDateTime" },
  }
);

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;
