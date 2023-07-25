const mongoose = require("mongoose");

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
    methods: {
      clean: function () {
        const { _id, __v, insertedDateTime, updatedDateTime, ...cleanedTask } =
          this;

        return cleanedTask;
      },
    },
  }
);

const Task = mongoose.model("Task", TaskSchema);

module.exports = Task;
