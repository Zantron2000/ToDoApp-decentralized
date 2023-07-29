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

module.exports = {
  validateSchema,
  formatErrors,
};
