const { Command } = require('cmnd');
const io = require('io');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const constants = require('../../helpers/constants.js');
const SettingsManager = require('../../helpers/settings_manager.js');
const DrawTable = require('../../helpers/draw_table.js');

class DomainsRemoveCommand extends Command {

  constructor() {
    super('domains', 'remove');
  }

  help () {
    return {
      description: 'Remove domains from your packages',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const settings = SettingsManager.read(true);
    const host = settings.activeProfile.host || constants.BASE_URL;

    const result = await io.get(
      `${host}/v1/custom_domains`,
      settings.activeProfile.key,
      null,
      {invalidated: false}
    );

    if (result.statusCode !== 200) {
      const message = result.data?.error?.message || `Invalid statusCode: ${result.statusCode}`;
      throw new Error(message);
    }

    const customDomains = result.data.data;

    const columns = [
      'hostname',
      'package',
      'environment',
      'verified_at'
    ];

    const rows = customDomains.map(customDomain => {
      const packageName = `@${customDomain.package.organization.name}/${customDomain.package.name}`;
      const environment = customDomain.environment;
      return {
        hostname: customDomain.hostname,
        package: packageName,
        environment: environment,
        verified_at: customDomain.verified_at
      }
    });

    console.log();
    const index = await DrawTable.selectIndexFromTable('Choose a domain to remove', columns, rows);

    if (index === -1) {
      console.log();
      return;
    }
    
    const removeParams = {};
    removeParams.hostname = rows[index].hostname;
    removeParams.name = rows[index].package;
    removeParams.environment = rows[index].environment;

    const removeResult = await io.del(
      `${host}/v1/custom_domains`,
      settings.activeProfile.key,
      null,
      removeParams
    );

    if (removeResult.statusCode !== 200) {
      const message = removeResult.data?.error?.message || `Invalid statusCode: ${removeResult.statusCode}`;
      throw new Error(message);
    }

    console.log();
    console.log(`${colors.bold.green('Success!')} Domain ${colors.bold(removeParams.hostname)} removed.`);
    console.log();

    return void 0;

  }

}

module.exports = DomainsRemoveCommand;
