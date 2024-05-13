const colors = require('colors/safe');
const semver = require('semver');

const path = require('path');
const https = require('https');

const drawBox = require('./draw_box.js');

module.exports = async (print = false) => {

  const pkgs = {self: require('../package.json')};
  try {
    pkgs.api = require(path.join(process.cwd(), '/node_modules/@instant.dev/api/package.json'));
  } catch (e) {
    // do nothing:
    // @instant.dev/api not installed locally
  }
  const packages = [
    {
      title: 'Funct.me CLI',
      name: pkgs.self.name,
      version: pkgs.self.version,
      global: true
    },
    {
      title: 'Funct.me Gateway (Instant API)',
      name: pkgs.api ? pkgs.api.name : null,
      version: pkgs.api ? pkgs.api.version : null,
      dev: true
    }
  ];
  const checkPackages = packages.filter(pkg => !!pkg.name);
  const verifiedPackages = await Promise.all(
    checkPackages.map(pkg => {
      return (async () => {
        try {
          const response = await new Promise((resolve, reject) => {
            const req = https.request(`https://registry.npmjs.org/${pkg.name}/latest`, res => {
              const buffers = [];
              res.on('data', data => buffers.push(data));
              res.on('end', () => resolve(Buffer.concat(buffers)));
            })
            req.on('error', err => reject(err));
            req.end();
          });
          const json = JSON.parse(response.toString());
          pkg.latest = json.version;
          return pkg;
        } catch (e) {
          // we want to be able to use CLI offline
          // or if NPM is down / returning bad data
          // so just set latest equal to version
          pkg.latest = pkg.version;
          return pkg;
        }
      })();
    })
  );
  const updatePackages = verifiedPackages.filter(pkg => pkg.latest && semver.gt(pkg.latest, pkg.version));
  if (updatePackages.length && print) {
    console.log();
    console.log(
      drawBox.center(
        `yellow`,
        ``,
        `Updates are available for ${colors.bold('funct.me')}:`,
        ``,
        ...updatePackages.map(pkg => {
          return [
            pkg.title,
            `${pkg.version} -> ${colors.bold.green(pkg.latest)}`,
            `${colors.bold.grey(`npm i ${pkg.name}@latest${pkg.dev ? ' --save-dev' : ''}${pkg.global ? ' -g' : ''}`)}`,
            ``
          ].join('\n')
        }),
        `Install all with:`,
        `${colors.bold.grey(`funct update`)}`,
        ``
      )
    );
  }

  return verifiedPackages;

};
