const https = require('https');
const path = require('path');
const fs = require('fs');

const verifyPackages = require('./verify_packages.js');

module.exports = async (params = null, validate = false) => {

  if (params) {
    const { name, args, flags, vflags } = params;
    await new Promise(resolve => {
      const req = https.request(
        `https://api.funct.me/v1/cli_requests/`,
        {method: 'POST', headers: {'Content-Type': 'application/json'}},
        res => {
          const buffers = [];
          res.on('data', data => buffers.push(data));
          res.on('end', () => resolve(Buffer.concat(buffers)));
        }
      );
      req.on('error', () => resolve(null));
      req.end(JSON.stringify({_background: true, params: {name, args, flags, vflags}}));
    });
  }

  if (validate) {
    await verifyPackages(true);
  }

  let funct;
  const functPathname = path.join(process.cwd(), 'funct.json');
  if (!fs.existsSync(functPathname)) {
    if (validate) {
      throw new Error(
        `No "funct.json" in this directory. Are you sure you meant to do this?\n` +
        `Run \`$ funct init\` to initialize a project here if you are.`
      );
    }
  } else {
    funct = JSON.parse(fs.readFileSync(functPathname));
  }

  let dotenv;
  const dotenvPathname = path.join(process.cwd(), 'node_modules', 'dotenv');
  if (!fs.existsSync(dotenvPathname)) {
    if (validate) {
      throw new Error(
        `dotenv should be installed in this directory to use funct.me locally.\n` +
        `Run \`$ npm i dotenv --save-dev\` to install the latest version`
      );
    }
  } else {
    dotenv = require(dotenvPathname);
  }

  let InstantAPI;
  const pathname = path.join(process.cwd(), 'node_modules', '@instant.dev/api');
  if (!fs.existsSync(pathname)) {
    if (validate) {
      throw new Error(
        `@instant.dev/api should be installed in this directory to use funct.me locally.\n` +
        `Run \`$ npm i @instant.dev/api --save-dev\` to install the latest version`
      );
    }
  } else {
    InstantAPI = require(pathname);
  }

  if (
    funct &&
    dotenv &&
    InstantAPI
  ) {
    return {funct, dotenv, InstantAPI};
  } else {
    return null;
  }

};
