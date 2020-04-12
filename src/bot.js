import { CommandRegistry } from "./command-registry";

const Discord = require('discord.js');
const logger = require('winston');
const auth = require('../auth.json');
const cmds = require('./commands.js');
const parser = require('./parser');
const path = require('path')

const dbPath = path.resolve(__dirname, 'switchcodebot.db')
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(dbPath);

db.serialize(function () {
	/*
	 * TODO: Figure out a way to handle multiple servers such that
	 *  a user logs a record once, but only the servers the user
	 *  belongs to can see that users stats. Right now, if this
	 *  were on multiple servers, everyone would be listed.
	 *  Maybe that's okay?
	 */
	db.run(`
		CREATE TABLE IF NOT EXISTS turnipRecords (
			userId INT(11) NOT NULL,
			username VARCHAR(255) NOT NULL,
			week INT(11) NOT NULL,
			year INT(11) NOT NULL,
			buy INT(11) NULL,
			monam INT(11) NULL,
			monpm INT(11) NULL,
			tueam INT(11) NULL,
			tuepm INT(11) NULL,
			wedam INT(11) NULL,
			wedpm INT(11) NULL,
			thuam INT(11) NULL,
			thupm INT(11) NULL,
			friam INT(11) NULL,
			fripm INT(11) NULL,
			satam INT(11) NULL,
			satpm INT(11) NULL,
			PRIMARY KEY(userId, week, year)
		)
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS userMeta (
			userId INT(11) NOT NULL,
			timezone VARCHAR(128) NULL,
			PRIMARY KEY(userId)
		)
	`);
});

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const commandRegistry = new CommandRegistry();
commandRegistry.register('disfakka', cmds.disfakka);
commandRegistry.register('sw', cmds.switchcode);
commandRegistry.register('addturnip', cmds.addturnip);
commandRegistry.register('turnips', cmds.turnips);
commandRegistry.register('timezone', cmds.timezone);

// Initialize Discord Bot
const bot = new Discord.Client();

bot.on('disconnect', function (errorMessage, code) {
	logger.error(`Disconnected from server with message: ${errorMessage} (${code})`);
	db.close();
});

bot.on('ready', () => {
    logger.info('Connected');
});

bot.on('message', (msg) => {
	// Do not handle messages from bots
	if (msg.author.bot) {
		return;
	}

	let parsedMessage = parser.parseMessage(msg.content);
    if (!parsedMessage) {
		return;
	}

	if (parsedMessage.cmd.localeCompare('help') === 0) {
		msg.channel.send(commandRegistry.help);
    	return;
	}

	// 	// Put bot into first argument so that commands can send stuff back
	let args = parsedMessage.args;
	args.unshift({
		message: msg,
		db: db
	});

	let executeResult = commandRegistry.execute(parsedMessage.cmd, args);
	if (!executeResult) {
		logger.error(`${parsedMessage.cmd} failed to execute`);
	}

});

bot.login(auth.token);
