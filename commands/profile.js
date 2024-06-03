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

    const index = await DrawTable.selectIndexFromTable(
      'Choose your active profile',
      columns,
      rows
    );

    console.log();
    if (index !== -1) {
      SettingsManager.write(profiles[index]);
    }

    return void 0;

  }

}

module.exports = ProfileCommand;
