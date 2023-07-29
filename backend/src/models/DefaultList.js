const mongoose = require("mongoose");

/**
 * @typedef {Object} DefaultList
 *
 * @property {String} title The title of the default list
 *
 * @property {String} owner The address of the user who owns the default list
 *
 * @property {mongoose.Schema.Types.ObjectId} tasks The ids of all tasks that belong to the list
 */

const DefaultListSchema = new mongoose.Schema(
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
      unique: true,
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

DefaultListSchema.methods.getPublicFields = function () {
  const { _id, title, owner, tasks } = this;
  return { _id, title, owner, tasks };
};

const DefaultList = mongoose.model("DefaultList", DefaultListSchema);

module.exports = DefaultList;
