const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');

const fileWriter = require('../../file_writer.js');

const generateTest = require('../test/_index.js');

module.exports = async (Funct, params) => {

  let writePathname = params.args[0] || '';
  writePathname = writePathname.split('/').filter(v => !!v).join('/');

  let newFilename;

  const pathname = path.join(__dirname, '..', '..', '..', 'src', 'endpoint');
  if (!fs.existsSync(pathname)) {
    throw new Error(`No endpoint template found.`);
  }

  console.log();
  console.log(colors.bold.black(`Generating:`) + ` Endpoint file ...`);
  console.log();

  const files = fileWriter.readRecursive(pathname);
  for (const filename in files) {
    newFilename = filename;
    newFilename = newFilename.replace(/^\/functions\//gi, $0 => $0 + (writePathname ? `${writePathname}/` : ``));
    let fileData = files[filename];
    fileWriter.writeFile(newFilename, fileData, false);
  }

  console.log();
  console.log(colors.bold.green(`Success!`) + ` Created blank endpoint at "${newFilename}"!`);
  console.log();

  if (!params.vflags.hasOwnProperty('no-tests')) {
    await generateTest(Funct, {args: [], flags: {}, vflags: {endpoint: [newFilename]}});
  }

  return true;

};
