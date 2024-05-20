const os = require('os');
const fs = require('fs');
const path = require('path');

const SETTINGS_FILENAME = '~/.functrc';

const parsePathname = (pathname) => {
  if (!pathname) {
    pathname = './';
  }
  if (
    !pathname.startsWith('~/') &&
    !pathname.startsWith('./') &&
    !pathname.startsWith('/')
  ) {
    pathname = './' + pathname;
  }
  if (pathname.startsWith('~/')) {
    pathname = os.homedir().split(path.sep).join('/') + pathname.slice(1);
  } else if (pathname.startsWith('./') || pathname.startsWith('../')) {
    pathname = process.cwd().split(path.sep).join('/') + '/' + pathname;
  }
  return path.resolve(pathname);
}

function readSettings (validate = false) {
  const pathname = parsePathname(SETTINGS_FILENAME);
  if (!fs.existsSync(pathname)) {
    fs.writeFileSync(pathname, '');
  }
  if (fs.statSync(pathname).isDirectory()) {
    throw new Error(`Invalid settings file, is a directory: "${pathname}"`);
  }
  const file = fs.readFileSync(pathname);
  const fileString = file.toString().replace(/\r/gi, '').trim();
  const profileList = [];
  if (fileString) {
    const lines = fileString.split('\n');
    for (const line of lines) {
      if (line === '[profile]') {
        profileList.push({});
      } else if (!profileList.length) {
        throw new Error(`Settings must start with [profile]`);
      } else {
        const values = line.split('=');
        const key = values[0];
        const value = values.slice(1).join('=');
        profileList[profileList.length - 1][key] = value;
      }
    }
  }
  let curProfile;
  let i = 0;
  for (const profile of profileList) {
    if (!profile.email) {
      throw new Error(`Profile index ${i} missing "email"`);
    }
    if (!profile.key) {
      throw new Error(`Profile index ${i} missing "key"`);
    }
    i++;
  }
  if (validate && !profileList[0]) {
    throw new Error(`You are not logged in. Try \`funct login\` to log in first.`);
  }
  return {
    activeProfile: profileList[0],
    profileList
  }
}

function writeSettings (newProfile) {
  if (!newProfile.email) {
    throw new Error(`Must specify newProfile "email"`);
  } else if (!newProfile.key) {
    throw new Error(`Must specify newProfile "key"`);
  }
  const settings = readSettings();
  const activeProfile = newProfile;
  const profileList = [].concat(
    activeProfile,
    settings.profileList.filter(p => p.email !== newProfile.email)
  );
  const pathname = parsePathname(SETTINGS_FILENAME);
  fs.writeFileSync(
    pathname,
    profileList.map(p => {
      return [
        `[profile]`,
        `email=${p.email}`,
        `key=${p.key}`,
        p.host ? `host=${p.host}` : ''
      ].filter(line => !!line.trim()).join('\n');
    }).join('\n') + '\n'
  );
  console.log(`Settings: Set profile(email=${activeProfile.email}) as active in "${pathname}"`);
  console.log(`Settings: Total of ${profileList.length} saved profiles`);
  console.log();
  return {
    activeProfile,
    profileList
  };
}

module.exports = {
  read: readSettings,
  write: writeSettings
};