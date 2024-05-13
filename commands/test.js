const { Command } = require('cmnd');
const colors = require('colors/safe');
const fs = require('fs');
const childProcess = require('child_process');

const loadFunct = require('../helpers/load_funct.js');

class TestCommand extends Command {

  constructor() {
    super('test');
  }

  help () {
    return {
      description: 'Runs tests using package.json["scripts"]["test"]',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const Funct = await loadFunct(params, true);

    console.log();
    console.log(`Running tests ...`);
    const pkgExists = fs.existsSync('package.json');
    if (pkgExists) {
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync('package.json').toString());
      } catch (e) {
        throw new Error(`Could not read "package.json"`);
      }
      if (pkg?.scripts?.test) {
        console.log(`Running script: ${colors.blue.bold(pkg.scripts.test)} ...`);
        console.log();
        const result = childProcess.spawnSync(
          `${pkg.scripts.test} ${params.args.join(' ')}`,
          {
            stdio: 'inherit',
            shell: true,
            env: {...process.env, PATH: process.env.PATH + ':./node_modules/.bin'}
          }
        );
        if (result.status === 0) {
          console.log(colors.bold.green(`Success!`) + ` All tests passed.`);
          console.log();
        } else {
          console.log(colors.bold.red(`Failure:`) + ` One or more of your tests failed.`);
          console.log();
        }
      } else {
        throw new Error(`Could not find "package.json"["scripts"]["test"]`);
      }
    } else {
      throw new Error(`No "package.json" in this directory`);
    }

    return void 0;

  }

}

module.exports = TestCommand;
