const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');
const io = require('io');

const constants = require('../../helpers/constants.js');
const SettingsManager = require('../../helpers/settings_manager.js');
const loadFunct = require('../../helpers/load_funct.js');

class CreateOrganizationsCommand extends Command {

  constructor() {
    super('organizations', 'create');
  }

  help () {
    return {
      description: 'Creates a new organization for a user',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const settings = SettingsManager.read(true);
    const host = settings.activeProfile.host || constants.BASE_URL;
    const Funct = await loadFunct(params, true);

    console.log();
    console.log(`Creating organization for ${colors.bold(settings.activeProfile.email)} on ${colors.bold(host)} ...`);
    console.log();

    let createParams = await inquirer.prompt([{
      name: 'name',
      message: `Organization name`
    }]);

    const name = createParams.name;
    
    const createResult = await io.post(
      `${host}/v1/organizations`,
      settings.activeProfile.key,
      null,
      {
        name: name,
      }
    );

    if (createResult.statusCode !== 200) {
      if (createResult.data && createResult.data.error && createResult.data.error.message) {
        throw new Error(createResult.data.error.message);
      } else {
        throw new Error(`Invalid response from server: statusCode ${createResult.statusCode}`);
      }
    }

    console.log();
    console.log(`Organization ${colors.bold(name)} created!`);
    console.log();
    return void 0;

  }

}

module.exports = CreateOrganizationsCommand;
