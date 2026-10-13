const stripMongoId = (doc) => {
  if (!doc) return null;

  const { _id, ...rest } = doc;
  return rest;
};

const stripMongoIds = (docs) => docs.map(stripMongoId);

const removeUndefined = (fields) => Object.fromEntries(
  Object.entries(fields).filter(([, value]) => value !== undefined)
);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isDuplicateKeyError = (error) => error?.code === 11000;

const getUpdatedDocument = (result) => {
  if (!result) return null;
  return result.value === undefined ? result : result.value;
};

module.exports = {
  getUpdatedDocument,
  isDuplicateKeyError,
  normalizeEmail,
  removeUndefined,
  stripMongoId,
  stripMongoIds
};
