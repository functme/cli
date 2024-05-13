const { Command } = require('cmnd');

const verifyPackages = require('../helpers/verify_packages.js');

class VersionCommand extends Command {

  constructor() {
    super('version');
  }

  help () {
    return {
      description: 'Retrieves the current version of installed dependencies',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    const verifiedPackages = await verifyPackages();
    console.log(verifiedPackages);

    return void 0;

  }

}

module.exports = VersionCommand;
