const { Command } = require('cmnd');
const io = require('io');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const constants = require('../../helpers/constants.js');
const SettingsManager = require('../../helpers/settings_manager.js');
const DrawTable = require('../../helpers/draw_table.js');

class DomainsVerifyCommand extends Command {

  constructor() {
    super('domains', 'verify');
  }

  help () {
    return {
      description: 'Verify any pending domains',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const settings = SettingsManager.read(true);
    const host = settings.activeProfile.host || constants.BASE_URL;

    const verifyParams = {};

    const result = await io.get(
      `${host}/v1/custom_domains`,
      settings.activeProfile.key,
      null,
      {verified: false, invalidated: false},
    );

    if (result.statusCode !== 200) {
      const message = result.data?.error?.message || `Invalid statusCode: ${result.statusCode}`;
      throw new Error(message);
    }

    const customDomains = result.data.data;

    if (!customDomains.length) {
      console.log();
      console.log(`Looks like all your domains are verified!`);
      console.log();
      return;
    }

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
    const index = await DrawTable.selectIndexFromTable('Choose a domain to verify', columns, rows);
    const customDomain = customDomains[index];

    if (index === -1) {
      console.log();
      return;
    }

    const tld = customDomain.hostname.split('.').slice(-2).join('.');
    const subdomain = customDomain.hostname.split('.').length > 2
      ? customDomain.hostname.split('.').slice(0, -2).join('.')
      : '@';

    console.log();
    console.log(`In order to verify ${colors.bold(customDomain.hostname)},`);
    console.log(`you must add the following TXT record to the domain ${colors.bold(tld)}:`);
    console.log();
    console.log(colors.bold('Type:'));
    console.log('TXT');
    console.log();
    console.log(colors.bold('Name:'));
    console.log(subdomain);
    console.log();
    console.log(colors.bold('Content:'));
    console.log(customDomain.txt_record);
    console.log();

    const confirmResult = await inquirer.prompt({type: 'confirm', name: 'ok'});
    if (!confirmResult.ok) {
      throw new Error(`Aborted`);
    }
    
    verifyParams.hostname = rows[index].hostname;
    verifyParams.name = rows[index].package;
    verifyParams.environment = rows[index].environment;

    const verifyResult = await io.post(
      `${host}/v1/custom_domains/verify`,
      settings.activeProfile.key,
      null,
      verifyParams
    );

    if (verifyResult.statusCode !== 200) {
      const message = verifyResult.data?.error?.message || `Invalid statusCode: ${verifyResult.statusCode}`;
      throw new Error(message);
    }

    console.log();
    console.log(`${colors.bold.green('Success!')} Domain ${colors.bold(verifyParams.hostname)} verified.`);
    console.log();

    return void 0;

  }

}

module.exports = DomainsVerifyCommand;
