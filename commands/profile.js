const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const SettingsManager = require('../helpers/settings_manager.js');
const DrawTable = require('../helpers/draw_table.js');

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

    const columns = ['email', 'host', 'active'];
    const rows = profiles.map((p, i) => {
      return {
        email: p.email,
        host: p.host || '',
        active: i === 0
          ? colors.bold.green('yes')
          : ''
      };
    });

    let result = await inquirer.prompt([
      {
        name: 'profileIndex',
        type: 'list',
        message: 'Choose your active profile',
        loop: false,
        pageSize: 100,
        choices: [].concat(
          new inquirer.Separator(
            DrawTable.renderLine(columns, rows, 'top', 'grey')
          ),
          rows.map((_, i) => {
            return {
              name: DrawTable.renderLine(columns, rows, i, 'grey'),
              value: i
            }
          }),
          new inquirer.Separator(
            DrawTable.renderLine(columns, rows, 'bottom', 'grey')
          )
        )
      }
    ]);

    console.log();
    SettingsManager.write(profiles[result.profileIndex]);

    return void 0;

  }

}

module.exports = ProfileCommand;
