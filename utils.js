const validateProperties = (schemaArray, object) =>
  schemaArray.every(prop => {
    return object.hasOwnProperty(prop);
  });

module.exports = {
  validateProperties
};
