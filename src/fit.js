const EasyFit = require('easy-fit').default;
const {readFile} = require('fs-extra');

exports.readFitFile = readFitFile;

const easyFit = new EasyFit({
  mode: 'cascade',
  lengthUnit: 'km',
  temperatureUnit: 'celsius',
  speedUnit: 'km/h',
  force: true,
  elapsedRecordField: true,
});

async function readFitFile(file) {
  let content = await readFile(file);
  return new Promise((resolve, reject) => {
    easyFit.parse(content, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
