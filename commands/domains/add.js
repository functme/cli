const { Command } = require('cmnd');
const io = require('io');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const constants = require('../../helpers/constants.js');
const SettingsManager = require('../../helpers/settings_manager.js');

class DomainsAddCommand extends Command {

  constructor() {
    super('domains', 'add');
  }

  help () {
    return {
      description: 'Add a custom domain to a package',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const settings = SettingsManager.read(true);
    const host = settings.activeProfile.host || constants.BASE_URL;

    let addResult = await inquirer.prompt([
      {
        name: 'hostname',
        type: 'input',
        message: `Hostname`,
        validate: e => {
          if (!e.match(/^([a-z0-9\-].)+[a-z0-9\-]$/gi)) {
            return 'Must be a valid hostname'
          } else {
            return true;
          }
        }
      },
      {
        name: 'name',
        type: 'input',
        message: `Package name`,
        validate: v => {
          if (
            v.match(/@[a-z][a-z0-9\-]*[a-z0-9]\/[a-z][a-z0-9\-]*[a-z0-9]/i) &&
            v.indexOf('--') === -1
          ) {
            return true;
          } else {
            return 'must be a valid package name in format "@org/package"';
          }
        }
      },
      {
        name: 'environment',
        type: 'list',
        message: 'Environment',
        choices: [
          'development',
          'staging',
          'production'
        ]
      }
    ]);

    const postParams = {...addResult};

    const result = await io.post(
      `${host}/v1/custom_domains`,
      settings.activeProfile.key,
      null,
      postParams
    );

    if (result.statusCode !== 200) {
      const message = result.data?.error?.message || `Invalid statusCode: ${result.statusCode}`;
      throw new Error(message);
    }

    const customDomain = result.data;
    const packageName = `@${customDomain.packageVersion.package.organization.name}/${customDomain.packageVersion.package.name}`;
    const environment = customDomain.packageVersion.environment;

    console.log();
    console.log(`${colors.bold.green('Success!')} Custom domain created.`);
    console.log(`${colors.bold(`hostname`)}:     ${customDomain.hostname}`);
    console.log(`${colors.bold(`package`)}:      ${packageName}`);
    console.log(`${colors.bold(`environment`)}:  ${environment}`);
    console.log(`${colors.bold(`verified at`)}:  ${customDomain.verified_at || '(unverified)'}`);
    console.log(`${colors.bold(`created`)}:      ${customDomain.created_at}`);
    console.log();

    return void 0;

  }

}

module.exports = DomainsAddCommand;
