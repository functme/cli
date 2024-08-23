const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const io = require('io');
const tar = require('tar-stream');
const { minimatch } = require('minimatch');

const { Command } = require('cmnd');
const colors = require('colors/safe');

const constants = require('../helpers/constants.js');
const SettingsManager = require('../helpers/settings_manager.js');
const loadFunct = require('../helpers/load_funct.js');
const SUPPORTED_ENVS = ['development', 'staging', 'production'];
const DEFAULT_IGNORE = [
  'node_modules/',      // modules installed on deploy
  'test/',              // tests not relevent for deploy
  '.git',               // do not deploy git history
  '.DS_Store',          // do not deploy macOS files
  'package-lock.json',  // deps installed from package.json
  'serve.funct.mjs'     // not used by funct.me registry; irrelevant
];

function formatSize (size) {
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];
  let curUnit = 0;
  while (size > 1024) {
    size = size / 1024;
    curUnit++;
  }
  let strSize = size.toFixed(2);
  const intSize = strSize.split('.')[0];
  let decSize = strSize.split('.')[1];
  while (decSize.endsWith('0')) {
    decSize = decSize.slice(0, -1);
  }
  return intSize + (decSize ? `.${decSize}` : '') + (units[curUnit] || 'overflowB');
}

function readFiles (base, properties, dir, data) {

  dir = dir || '/';
  data = data || [];
  properties = properties || {};

  let ignore = properties.ignore || [];

  return fs.readdirSync(path.join(base, dir)).reduce((data, f) => {

    let pathname = path.join(dir, f);
    let fullpath = path.join(base, pathname);

    for (let i = 0; i < ignore.length; i++) {
      let filename = pathname.split(path.sep).join('/').slice(1);
      let pattern = ignore[i];
      if (minimatch(filename, pattern, {matchBase: true, dot: true})) {
        return data;
      }
    }

    if (fs.statSync(fullpath).isDirectory()) {
      return readFiles(base, properties, pathname, data);
    } else {
      let filename = pathname[0] === path.sep ? pathname.substr(1) : pathname;
      let buffer = fs.readFileSync(fullpath);
      filename = filename.split(path.sep).join('/'); // Windows
      data.push({filename: filename, buffer: buffer});
      return data;
    }

  }, data);

};

class UpCommand extends Command {

  constructor() {
    super('up');
  }

  help () {
    return {
      description: 'Deploys your project to the funct.me registry',
      args: [],
      flags: {
        v: 'Verbose mode; print full details of packaging'
      },
      vflags: {
        env: `Deployment environment; defaults to "development"`
      }
    };
  }

  async run (params) {

    const settings = SettingsManager.read(true);
    const Funct = await loadFunct(params, true);

    const isVerbose = params.flags.hasOwnProperty('v');
    const env = (params.vflags.env || [])[0] || 'development';
    if (!SUPPORTED_ENVS.includes(env)) {
      throw new Error(`env must be one of: "${SUPPORTED_ENVS.join('", "')}"`);
    }

    let functJSON;
    let packageJSON;

    try {
      functJSON = require(path.join(process.cwd(), 'funct.json'));
    } catch (e) {
      console.error(e);
      console.error(new Error('Invalid "funct.json" in this directory'));
      process.exit(1);
    }

    // override name from CLI
    const name = (params.flags.n || [''])[0].trim() || functJSON.name;

    try {
      packageJSON = require(path.join(process.cwd(), 'package.json'));
    } catch (e) {
      console.error(e);
      console.error(new Error('Invalid "package.json" in this directory'));
      process.exit(1);
    }

    console.log();
    console.log(`Packaging "${colors.bold(name)}" (${colors.bold.grey(env)})...`);
    console.log();

    !fs.existsSync('/tmp') && fs.mkdirSync('/tmp');
    !fs.existsSync('/tmp/funct') && fs.mkdirSync('/tmp/funct', 0o777);
    const tmpName = name.replace(/\//g, '.');
    const tmpPath = `/tmp/funct/${tmpName}.${new Date().valueOf()}.tar.gz`;

    const t0 = new Date().valueOf();

    const tarball = fs.createWriteStream(tmpPath, {mode: 0o777});
    const pack = tar.pack();

    let ignore = DEFAULT_IGNORE.slice();
    if (fs.existsSync(path.join(process.cwd(), '.functignore'))) {
      ignore = ignore.concat(
        fs.readFileSync(path.join(process.cwd(), '.functignore')).toString()
          .split('\n')
          .map(line => line.trim())
          .filter(line => !!line && !line.trim().startsWith('#'))
      );
    }
    ignore = ignore.map(v => v.endsWith('/') ? `${v}*` : v);
    const data = readFiles(process.cwd(), {ignore: ignore});

    // pipe the pack stream to your file
    pack.pipe(tarball);

    // Run everything in parallel...
    let fileCount = 0;
    let fileSize = 0;
    await Promise.all(data.map(file => {
      return new Promise((resolve, reject) => {
        isVerbose && console.log(`Packaging: "${file.filename}" (${formatSize(file.buffer.byteLength)}) ...`);
        fileSize += file.buffer.byteLength;
        fileCount++;
        pack.entry(
          {name: file.filename},
          file.buffer,
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        )
      });
    }));
    isVerbose && console.log();

    pack.finalize();
    const result = await new Promise(resolve => {
      tarball.on('close', () => {
        const buffer = fs.readFileSync(tmpPath);
        fs.unlinkSync(tmpPath);
        const result = zlib.gzipSync(buffer);
        resolve(result);
      });
    });

    const packageSize = result.byteLength;
    const t = new Date().valueOf() - t0;
    console.log(`Packaged ${fileCount} files (${formatSize(fileSize)}) in ${t} ms!`);
    console.log(`Final tarball: ${formatSize(packageSize)} (${((packageSize / fileSize) * 100).toFixed(2)}% compression ratio, lower is better)`);
    console.log();

    const host = settings.activeProfile.host || constants.BASE_URL;
    console.log(`Deploying to ${colors.bold(host)} ...`);
    console.log();
    const upResult = await new Promise(async (resolve) => {
      await io.post(
        `${host}/v1/packages`,
        settings.activeProfile.key,
        null,
        {
          name: name,
          environment: env,
          timeout: Math.max(1, Math.min(parseInt(functJSON.timeout) || 0), 900),
          tarball: {_base64: result.toString('base64')},
          _stream: true
        },
        ({event, data, id}) => {
          if (event === '@response') {
            let json;
            try {
              json = JSON.parse(data.body);
              data.data = json;
            } catch (e) {
              // do nothing;
            }
            resolve(data);
          } else if (event === 'log') {
            console.log(`${colors.bold.grey(`Deploy:`)} ${data}`);
          }
        }
      );
    });

    if (upResult.statusCode !== 200) {
      if (upResult.data && upResult.data.error && upResult.data.error.message) {
        throw new Error(upResult.data.error.message);
      } else {
        throw new Error(`Invalid response from server: statusCode ${upResult.statusCode}`);
      }
    } else if (upResult.data?.packageVersions?.[0]?.packageDeployments?.[0]?.error_json) {
      const errorJSON = upResult.data?.packageVersions[0].packageDeployments[0].error_json;
      const error = new Error(errorJSON.message);
      if (errorJSON.details) {
        error.details = errorJSON.details;
      }
      throw error;
    }

    const url = upResult.data.version_urls[env];
    const time = new Date().valueOf() - t0;

    console.log();
    console.log(`${colors.bold.green('Success:')} ${colors.bold(name)} deployed to ${colors.bold.grey(env)} in ${time} ms!`);
    console.log(` => ${colors.bold.blue(url)}`);
    console.log();

    return void 0;

  }

}

module.exports = UpCommand;
