const { Validator } = require("jsonschema");

const validator = new Validator();

const validateSchema = (instance, request) => {
  return validator.validate(instance, request);
};

const formatErrors = (errors) => {
  return errors.map(() => {
    return "TBD";
  });
};

/**
 * Wraps a function to first check the request body schema, and if it passes the given
 * schema, continues with the funciton. Otherwise it returns a bad request response.
 *
 * @param {function} func The function that requires req body validation
 * @param {import("jsonschema").Schema} schema The schema the body must match to continue the function
 * @returns The response value of either a failed validation or the executed function
 */
const requireBodyValidation = (func, schema) => {
  return (req, res, next) => {
    const results = validateSchema(req.body, schema);

    if (results.errors.length) {
      return res.status(400).send("Invalid Body");
    } else {
      return func(req, res, next);
    }
  };
};

module.exports = {
  validateSchema,
  formatErrors,
  requireBodyValidation,
};
