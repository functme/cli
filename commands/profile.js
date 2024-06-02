const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const SettingsManager = require('../helpers/settings_manager.js');

class ProfileCommand extends Command {

  constructor() {
    super('profile');
  }

  help () {
    return {
      description: 'Change your active profile',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const settings = SettingsManager.read(true);
    const profiles = settings.profileList;

    console.log();

    let result = await inquirer.prompt([
      {
        name: 'profileIndex',
        type: 'list',
        message: 'Choose your active profile',
        choices: profiles.map((profile, i) => {
          return {
            name: (
                profile.email +
                (profile.host ? ` (host: ${profile.host})` : ``) +
                (!i ? colors.bold.green(` [active]`) : ``)
              ),
            value: i
          }
        })
      }
    ]);

    console.log();
    SettingsManager.write(profiles[result.profileIndex]);

    return void 0;

  }

}

module.exports = ProfileCommand;
