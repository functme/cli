const { Command } = require('cmnd');
const colors = require('colors/safe');

const loadFunct = require('../../helpers/load_funct.js');
const generateTest = require('../../helpers/generate/test/_index.js');

class GenerateTestCommand extends Command {

  constructor() {
    super('g', 'test');
  }

  help () {
    return {
      description: 'Generates new test',
      args: ['test_name'],
      flags: {},
      vflags: {
        endpoint: 'Generate a test for an endpoint'
      }
    };
  }

  async run (params) {

    const Funct = await loadFunct(params, true);

    let specificity = [params.args[0], params.vflags.endpoint[0]];
    let submitted = specificity.filter(v => v);
    if (!submitted.length) {
      throw new Error(`Must specify one of "test_name" or "--endpoint"`);
    }

    await generateTest(Funct, params);

    return void 0;

  }

}

module.exports = GenerateTestCommand;
