const { Command } = require('cmnd');
const io = require('io');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const constants = require('../helpers/constants.js');

const LoginCommand = require('./login.js');

class RegisterCommand extends Command {

  constructor() {
    super('register');
  }

  help () {
    return {
      description: 'Registers a new user account with the funct.me registry',
      args: [],
      flags: {},
      vflags: {}
    };
  }

  async run (params) {

    let host = (params.flags.h || [])[0] || constants.BASE_URL;
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = host.startsWith('localhost')
        ? `http://${host}`
        : `https://${host}`
    }

    let registerResult = await inquirer.prompt([
      {
        name: 'email',
        type: 'input',
        message: `E-mail`,
        validate: e => {
          if (!e.match(/^[^@]+@[^@]+\.[a-z0-9\-]+$/gi)) {
            return 'Must be a valid e-mail address';
          } else {
            return true;
          }
        }
      },
      {
        name: 'password',
        type: 'password',
        message: `Password`
      },
      {
        name: 'repeat_password',
        type: 'password',
        message: `Repeat password`
      }
    ]);

    let result = await io.post(
      `${host}/users`,
      null,
      null,
      registerResult
    );

    if (result.statusCode !== 200) {
      const e = result.data.error;
      const message = e.message;
      const details = e.details || {};
      const more = [];
      if (Object.keys(details).length) {
        for (const key in details) {
          more.push(`- ${colors.bold(key)}: ${details[key].message}`);
        }
      }
      throw new Error(
        message +
        (
          more.length
            ? '\n\n' + more.join('\n')
            : ''
        )
      );
    }

    const user = result.data; // grab json {data:}

    console.log();
    console.log(colors.bold(`${colors.blue(`Registered`)} for ${colors.green('funct.me')} successfully!`));
    console.log(`${colors.bold(`email`)}:      ${user.email}`);
    console.log(`${colors.bold(`created at`)}: ${user.created_at}`);

    return LoginCommand.prototype.run.call(
      this,
      {
        args: [],
        flags: {
          h: params.flags.h
        },
        vflags: {
          email: [user.email],
          password: [registerResult.password]
        }
      }
    );

  }

}

module.exports = RegisterCommand;
