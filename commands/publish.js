const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadFunct = require('../helpers/load_funct.js');

class PublishCommand extends Command {

  constructor() {
    super('publish');
  }

  help () {
    return {
      description: 'Publishes and deploys your project to the funct.me registry',
      args: [],
      flags: {},
      vflags: {
        env: `Environment to publish to`
      }
    };
  }

  async run (params) {

    const Funct = await loadFunct(params, true);

    // do a thing
    throw new Error(`Not implemented`);

    return void 0;

  }

}

module.exports = PublishCommand;
