#!/usr/bin/env node

const { CommandLineInterface } = require('cmnd');
const CLI = new CommandLineInterface('Funct CLI');

CLI.load(__dirname, './commands');
CLI.run(process.argv.slice(2));
