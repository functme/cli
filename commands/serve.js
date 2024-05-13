const { Command } = require('cmnd');
const colors = require('colors/safe');
const fs = require('fs');
const childProcess = require('child_process');

const loadFunct = require('../helpers/load_funct.js');

class ServeCommand extends Command {

  constructor() {
    super('serve');
  }

  help () {
    return {
      description: 'Starts a development server using package.json["scripts"]["start"]',
      args: [],
      flags: {},
      vflags: {
        port: 'specify a port to run on'
      }
    };
  }

  async run (params) {

    const Funct = await loadFunct(params, true);

    console.log();
    console.log(`Running "${colors.green.bold('funct.me')}" development server ...`);
    const pkgExists = fs.existsSync('package.json');
    if (pkgExists) {
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync('package.json').toString());
      } catch (e) {
        throw new Error(`Could not read "package.json"`);
      }
      if (pkg?.scripts?.start) {
        console.log(`Running script: ${colors.blue.bold(pkg.scripts.start)} ...`);
        console.log();
        childProcess.spawnSync(
          pkg.scripts.start,
          {
            stdio: 'inherit',
            shell: true,
            env: {
              ...process.env,
              PORT: params.vflags.port || process.env.PORT || ''
            }
          }
        );
      } else {
        throw new Error(`Could not find "package.json"["scripts"]["start"]`);
      }
    } else {
      throw new Error(`No "package.json" in this directory`);
    }

    return void 0;

  }

}

module.exports = ServeCommand;
