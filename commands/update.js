const { Command } = require('cmnd');

const childProcess = require('child_process');
const colors = require('colors/safe');
const semver = require('semver');

const loadFunct = require('../helpers/load_funct.js');
const verifyPackages = require('../helpers/verify_packages.js');

class UpdateCommand extends Command {

  constructor() {
    super('update');
  }

  help () {
    return {
      description: 'Updates all installed dependencies to latest version',
      args: [],
      flags: {},
      vflags: {
        'force-local': 'Forces a re-installation of all local dependencies',
        'force': 'Forces a re-installation of all dependencies (includes the CLI)'
      }
    };
  }

  async run (params) {

    console.log();
    console.log(colors.black.bold(`Info:`) + ` Retrieving current package details...`);
    console.log();

    const verifiedPackages = await verifyPackages();

    console.log(verifiedPackages);

    const updatePackages = verifiedPackages.filter(pkg => pkg.latest && semver.gt(pkg.latest, pkg.version));
    const globalPackages = (params.vflags['force'])
      ? verifiedPackages.filter(pkg => pkg.global)
      : updatePackages.filter(pkg => pkg.global);
    const localDevPackages = (params.vflags['force'] || params.vflags['force-local'])
      ? verifiedPackages.filter(pkg => pkg.dev)
      : updatePackages.filter(pkg => pkg.dev);
    const localPackages = (params.vflags['force'] || params.vflags['force-local'])
      ? verifiedPackages.filter(pkg => !pkg.global && !pkg.dev)
      : updatePackages.filter(pkg => !pkg.global && !pkg.dev);

    if (globalPackages.length) {
      const result = childProcess.spawnSync(`npm i ${globalPackages.map(pkg => `${pkg.name}@latest`).join(' ')} -g`, {stdio: 'inherit', shell: true});
      if (result.status !== 0) {
        throw new Error(`Error installing global dependencies`);
      }
      console.log();
      console.log(colors.bold.green(`Installed:`) + ` ${globalPackages.length} global packages\n${globalPackages.map(pkg => ` - ${pkg.name}@${pkg.latest}`).join('\n')}`);
    }
    if (localDevPackages.length) {
      const result = childProcess.spawnSync(`npm i ${localDevPackages.map(pkg => `${pkg.name}@latest`).join(' ')} --save-dev`, {stdio: 'inherit', shell: true});
      if (result.status !== 0) {
        throw new Error(`Error installing local devDependencies`);
      }
      console.log();
      console.log(colors.bold.green(`Installed:`) + ` ${localPackages.length} local devDependencies\n${localPackages.map(pkg => ` - ${pkg.name}@${pkg.latest}`).join('\n')}`);
    }
    if (localPackages.length) {
      const result = childProcess.spawnSync(`npm i ${localPackages.map(pkg => `${pkg.name}@latest`).join(' ')}`, {stdio: 'inherit', shell: true});
      if (result.status !== 0) {
        throw new Error(`Error installing local dependencies`);
      }
      console.log();
      console.log(colors.bold.green(`Installed:`) + ` ${localPackages.length} local dependencies\n${localPackages.map(pkg => ` - ${pkg.name}@${pkg.latest}`).join('\n')}`);
    }

    console.log();
    console.log(colors.bold.green(`Up to date!`) + ` All of your ${colors.bold.green('funct.me')} dependencies are up to date.`);
    console.log();

    return void 0;

  }

}

module.exports = UpdateCommand;
