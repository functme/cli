const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');

const fileWriter = require('../../file_writer.js');

module.exports = async (Funct, params) => {

  let testName = params.args[0] || '';
  testName = testName.split('/').filter(v => !!v).join('/');
  testName = testName.replace(/\.m?js$/gi, '');

  let endpointFor = ((params.vflags.endpoint || [])[0] || '');

  if (testName) {

    const pathname = path.join(__dirname, '..', '..', '..', 'src', 'test', 'blank.mjs');
    if (!fs.existsSync(pathname)) {
      throw new Error(`No test template found for model.`);
    }

    let fileString = fs.readFileSync(pathname).toString();
    fileString = fileString.replaceAll('Name', testName);

    let newFilename = `test/tests/${testName}.mjs`;
    const fileData = Buffer.from(fileString);
    fileWriter.writeFile(newFilename, fileData, false);

    console.log();
    console.log(colors.bold.green(`Success!`) + ` Created tests for "${colors.bold.green(testName)}"!`);
    console.log();

  } else if (endpointFor) {

    const pathname = path.join(__dirname, '..', '..', '..', 'src', 'test', 'endpoint.mjs');
    if (!fs.existsSync(pathname)) {
      throw new Error(`No test template found for endpoint.`);
    }
    if (!endpointFor.startsWith('/')) {
      endpointFor = `/${endpointFor}`;
    }
    if (endpointFor.startsWith('/functions/')) {
      endpointFor = endpointFor.slice('/functions'.length);
    }
    endpointFor = endpointFor.replace(/\.m?js$/, '');
    let functionPathname = path.join(process.cwd(), `functions`, `${endpointFor}.mjs`);
    if (!fs.existsSync(functionPathname)) {
      functionPathname = path.join(process.cwd(), `functions`, `${endpointFor}.js`);
      if (!fs.existsSync(functionPathname)) {
        throw new Error(`Could not find matching endpoint "${endpointFor}" in "./functions" directory`);
      }
    }

    let methods = [];
    let endpointPath;
    if (endpointFor.endsWith('/index')) {
      endpointPath = endpointFor.slice(0, -('/index').length) + '/';
    } else if (endpointFor.endsWith('/__main__')) {
      endpointPath = endpointFor.slice(0, -('/__main__').length) + '/';
    } else if (endpointFor.endsWith('/__notfound__')) {
      endpointPath = endpointFor.slice(0, -('/__notfound__').length) + '/*/';
    } else if (endpointFor.endsWith('/404')) {
      endpointPath = endpointFor.slice(0, -('/404').length) + '/*/';
    } else {
      endpointPath = endpointFor + '/';
    }

    const file = fs.readFileSync(pathname);
    let fileString = file.toString();
    let template = '';
    fileString = fileString.replaceAll('Pathname', endpointPath);
    fileString = fileString.replace(/(\n)([ \t]*)\/\/ Method Begin\s*?\n([\s\S]*?)\/\/ Method End[ \t]*(\n)/gi, ($0, $1, $2, $3, $4) => {
      template = $2 + $3.trim();
      return `${$1}/* *** */${$4}`;
    });

    const dotenv = require(path.join(process.cwd(), `node_modules`, `dotenv`));
    dotenv.config();
    const endpoint = await import(functionPathname);

    if ('default' in endpoint) {
      methods.push('POST');
    } else {
      ('GET' in endpoint) && methods.push('GET');
      ('POST' in endpoint) && methods.push('POST');
      ('PUT' in endpoint) && methods.push('PUT');
      ('DELETE' in endpoint) && methods.push('DELETE');
    }

    fileString = fileString.replace(
      '/* *** */',
      methods.map(method => {
        return template
          .replaceAll('Method', method)
          .replaceAll('__method__', method === `DELETE` ? `del` : method.toLowerCase());
      }).join('\n\n')
    );

    let newFilename = `test/tests/functions${endpointFor}.mjs`;
    const fileData = Buffer.from(fileString);
    fileWriter.writeFile(newFilename, fileData, false);

    console.log();
    console.log(colors.bold.green(`Success!`) + ` Created tests for "${colors.bold.green(endpointFor)}"!`);
    console.log();

  }

  return true;

};
