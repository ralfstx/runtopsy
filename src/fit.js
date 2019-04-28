const EasyFit = require('easy-fit').default;
const {readFile} = require('fs-extra');

module.exports = {
  readFitFile
};

const easyFit = new EasyFit({
  mode: 'cascade',
  lengthUnit: 'm',
  temperatureUnit: 'celsius',
  speedUnit: 'm/s',
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
