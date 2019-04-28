const { createImporter: createFileImporter } = require('./importer-file');
const { createImporter: createStravaImporter } = require('./importer-strava');

module.exports = {
  createImporter
};

function createImporter(model) {

  let fileImporter = createFileImporter(model);
  let stravaImporter = createStravaImporter(model);

  return {
    importFiles
  };

  async function importFiles(callback) {

    let config = await model.getConfig();
    let importers = config.importers || {};
    if ('file' in importers && importers.file.enabled) {
      fileImporter.importFiles(callback);
    }
    if ('strava' in importers && importers.strava.enabled) {
      stravaImporter.importFiles(callback);
    }
  }

}
