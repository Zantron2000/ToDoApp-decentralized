const mongoose = require("mongoose");

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

const TaskList = mongoose.model("TaskList", TaskListSchema);

module.exports = TaskList;
