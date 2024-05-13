const { Command } = require('cmnd');
const colors = require('colors/safe');
const inquirer = require('inquirer');

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const loadFunct = require('../helpers/load_funct.js');
const fileWriter = require('../helpers/file_writer.js');
const drawBox = require('../helpers/draw_box.js');

const writeInitFiles = (pathname, pkg) => {
  const files = fileWriter.readRecursive(pathname);
  for (const filename in files) {
    if (filename === '/package.json') {
      let json;
      try {
        json = JSON.parse(files[filename].toString());
      } catch (e) {
        throw new Error(`Invalid "package.json" in init files`);
      }
      const scripts = json.scripts || {};
      const mainDeps = json.dependencies || {};
      const devDeps = json.devDependencies || {};
      for (const key in scripts) {
        fileWriter.writeJSON('package.json', `scripts.${key}`, scripts[key]);
      }
      console.log();
      for (const [ deps, devMode ] of [[mainDeps, false], [devDeps, true]]) {
        const depList = [];
        for (const name in deps) {
          depList.push(`${name}@${deps[name]}`);
        }
        if (depList.length) {
          console.log(colors.bold.black(`Installing:`) + ` "${depList.join('", "')}" ...`);
          const installString = `npm i ${depList.join(' ')} --save${devMode ? `-dev` : ``}`;
          childProcess.execSync(installString, {stdio: 'inherit'});
          console.log();
        }
      }
    } else {
      fileWriter.writeFile(filename, files[filename], false);
    }
  }
  fileWriter.writeLine('.gitignore', '.DS_Store');
  fileWriter.writeLine('.gitignore', 'node_modules/');
  fileWriter.writeLine('.gitignore', '.env');
  fileWriter.writeLine('.gitignore', '.env.*');
};

class InitCommand extends Command {

  constructor() {
    super('init');
  }

  help () {
    return {
      description: 'Initialize a new funct.me project with a ["development"]["main"] database',
      args: [],
      flags: {},
      vflags: {
        force: 'overwrites existing project'
      }
    };
  }

  async run (params) {

    const force = ('force' in params.vflags);

    console.log();
    console.log(
      drawBox.center(
        `blue`,
        `Welcome to ${colors.bold.green('🤖 funct.me')}!`,
      )
    );

    const pkgExists = fs.existsSync('package.json');
    const functExists = fs.existsSync('funct.json');

    console.log();
    console.log(`🪄 You are about to initialize ${colors.bold('funct.me')} in the current directory:`)
    console.log(`   📂 ${colors.dim(process.cwd())}`);
    console.log();
    if ((pkgExists || functExists) && !force) {
      throw new Error(
        `You already have a project initialized here.\n` +
        `If you want to overwrite it, use \`$ funct init --force\``
      );
    } else {
      console.log(`✨ We've detected you're starting from scratch`);
      console.log();
      let verifyResult = await inquirer.prompt([
        {
          name: 'verify',
          type: 'confirm',
          message: `Continue with initialization in this directory?`,
          default: true
        }
      ]);
      if (!verifyResult.verify) {
        throw new Error(`Initialization aborted`);
      }
    }

    let Funct = await loadFunct(params);
    if (!Funct) {
      console.log();
      console.log(colors.bold.black(`Installing:`) + ` "@instant.dev/api@latest" (dev) ...`);
      if ('link' in params.vflags) {
        childProcess.execSync(`npm link @instant.dev/api`, {stdio: 'inherit'});
      } else {
        childProcess.execSync(`npm i @instant.dev/api --save-dev`, {stdio: 'inherit'});
      }
    }

    let apiGatewayPackage;
    try {
      apiGatewayPackage = JSON.parse(
        fs.readFileSync(
          path.join(process.cwd(), 'node_modules', '@instant.dev/api', 'package.json')
        ).toString()
      );
    } catch (e) {
      throw new Error(`Could not load @instant.dev/api package`);
    }
    let apiGatewayName = apiGatewayPackage.name || '@instant.dev/api';
    let apiGatewayVersion = apiGatewayPackage.version || 'latest';

    const pkgString = pkgExists
      ? fs.readFileSync('package.json').toString()
      : JSON.stringify({devDependencies: {[apiGatewayName]: `^${apiGatewayVersion}`}});
    let pkg;
    try {
      pkg = JSON.parse(pkgString);
    } catch (e) {
      console.error(e);
      throw new Error(`Invalid JSON in "package.json"`);
    }

    let pathList = process.cwd().split(path.sep);
    let functName = pathList.pop();
    let orgName = pathList.pop();
    if (orgName.startsWith('@')) {
      orgName = orgName.slice(1);
    }

    console.log();
    console.log(`✨ Let's name your project.`);
    console.log();
    let result = await inquirer.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Enter a project name',
        validate: s => {
          if (!s.match(/@[a-z0-9\-]+\/[a-z0-9\-]+/i)) {
            return `must follow format @user/project and can only contain alphanumeric or - characters`;
          } else {
            return true;
          }
        },
        default: [
          '@' + orgName.replace(/[^a-z0-9\-]+/gi, '-'),
          functName.replace(/[^a-z0-9\-]+/gi, '-')
        ].join('/')
      }
    ]);
    functName = result.name;

    const filesRoot = path.join(__dirname, '..', 'src', 'init');
    if (!fs.existsSync(filesRoot)) {
      throw new Error(`No init template files found`);
    }
    writeInitFiles(filesRoot);
    // Write package.json: make sure no publish to npm
    fileWriter.writeJSON('package.json', 'private', true);
    // Write funct.json: default is public
    fileWriter.writeJSON('funct.json', 'name', functName);
    fileWriter.writeJSON('funct.json', 'private', true);

    // Now we reload Funct to verify
    Funct = await loadFunct(null, true);

    console.log();
    console.log(`Project "${colors.bold.blue(functName)}" initialized successfully!`);
    console.log();
    console.log(
      drawBox.left(
        `green`,
        ``,
        colors.bold.green(`Success:`) + ` ${colors.bold(`funct.me`)} initialized!`,
        `Here are some helpful commands to get started:`,
        ``,
        `(1) Create a set of endpoints for a path (create, read, update, destroy):`,
        colors.grey.bold(`     $ funct g:endpoint path/to/endpoint\n`),
        `(2) Run your dev server:`,
        colors.grey.bold(`     $ funct serve`),
        ``,
        `For more information about ${colors.bold(`funct.me`)}:`,
        `     Home    => ${colors.bold.underline.blue('https://funct.me')}`,
        `     GitHub  => ${colors.bold.underline.blue('https://github.com/functme')}`,
        `     Discord => ${colors.bold.underline.blue('https://discord.gg/puVYgA7ZMh')}`,
        `     X       => ${colors.bold.underline.blue('https://x.com/functme')}`,
        ``,
        colors.green.bold(`Happy building! :)`),
        ``
      )
    );
    console.log();

    return void 0;

  }

}

module.exports = InitCommand;
