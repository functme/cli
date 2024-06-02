const { Command } = require('cmnd');
const io = require('io');
const colors = require('colors/safe');

const constants = require('../helpers/constants.js');
const SettingsManager = require('../helpers/settings_manager.js');

class MeCommand extends Command {

  constructor() {
    super('me');
  }

  help () {
    return {
      description: 'Retrieve your currently logged in user data',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const settings = SettingsManager.read(true);

    const host = settings.activeProfile.host || constants.BASE_URL;

    console.log();
    console.log(`Retrieving data for ${colors.bold(settings.activeProfile.email)} via ${colors.bold(host)}`);
    console.log();

    const result = await io.get(
      `${host}/users/me`,
      settings.activeProfile.key,
      null,
      {},
    );

    if (result.statusCode !== 200) {
      const message = result.data?.error?.message || `Invalid statusCode: ${result.statusCode}`;
      throw new Error(message);
    }

    const user = result.data;

    console.log(JSON.stringify(user, null, 2));

    return void 0;

  }

}

module.exports = MeCommand;
