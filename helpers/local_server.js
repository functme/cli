const colors = require('colors/safe');
const fs = require('fs');
const childProcess = require('child_process');

module.exports = {
  run: ({port = null, isBackground = false} = {}) => {
    const consoleLog = (...args) => !isBackground && console.log(...args);
    consoleLog();
    consoleLog(`Running ${colors.green.bold('Funct')} development server ...`);
    const pkgExists = fs.existsSync('package.json');
    if (pkgExists) {
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync('package.json').toString());
      } catch (e) {
        throw new Error(`Could not read "package.json"`);
      }
      if (pkg?.scripts?.start) {
        consoleLog(`Running script: ${colors.blue.bold(pkg.scripts.start)} ...`);
        const envVars = {...process.env};
        if (!fs.existsSync('.env')) {
          consoleLog(
            colors.bold.yellow(`Warn: `) +
            `No envFile found in ".env", no environment variables loaded ...`
          );
        } else {
          const lines = fs.readFileSync(`.env`)
            .toString()
            .split('\n')
            .filter(line => !!line.trim() && !line.trim().startsWith('#'));
          for (const line of lines) {
            const key = line.split('=')[0];
            const value = line.split('=').slice(1).join('=');
            envVars[key] = value;
            consoleLog(`Loading environment variable: ${colors.grey.bold(key)} ...`);
          }
        }
        consoleLog();
        if (isBackground) {
          return childProcess.spawn(
            pkg.scripts.start,
            {
              stdio: 'pipe',
              shell: true,
              env: {
                ...envVars,
                PORT: port || envVars.PORT || ''
              }
            }
          );
        } else {
          return childProcess.spawnSync(
            pkg.scripts.start,
            {
              stdio: 'inherit',
              shell: true,
              env: {
                ...envVars,
                PORT: port || envVars.PORT || ''
              }
            }
          );
        }
      } else {
        throw new Error(`Could not find "package.json"["scripts"]["start"]`);
      }
    } else {
      throw new Error(`No "package.json" in this directory`);
    }
  }
};