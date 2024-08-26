const { Command } = require('cmnd');
const io = require('io');
const colors = require('colors/safe');

const constants = require('../../helpers/constants.js');
const SettingsManager = require('../../helpers/settings_manager.js');
const DrawTable = require('../../helpers/draw_table.js');

class DomainsListCommand extends Command {

  constructor() {
    super('domains', 'list');
  }

  help () {
    return {
      description: 'List all custom domains',
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
      {invalidated: false},
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
      const packageName = `${customDomain.package.is_private ? `private/` : ``}@${customDomain.package.organization.name}/${customDomain.package.name}`;
      const environment = customDomain.environment;
      return {
        hostname: customDomain.hostname,
        package: packageName,
        environment: environment,
        verified_at: customDomain.verified_at
      }
    });

    console.log();
    DrawTable.render(columns, rows);
    console.log();

    return void 0;

  }

}

module.exports = DomainsListCommand;
