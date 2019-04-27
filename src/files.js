const { readJson } = require('fs-extra');

module.exports = {
  readJsonSafe
};

async function readJsonSafe(file, defaultValue = null) {
  try {
    return await readJson(file);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    return defaultValue;
  }
}
