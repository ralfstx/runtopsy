const {readFitFile} = require('./fit');

if (process.argv.length != 3) {
  console.error('expected 1 argument');
}

processFile(process.argv[2]).catch(console.error);

async function processFile(file) {
  let data = await readFitFile(file);
  console.log(JSON.stringify(data, null, 2));
}
