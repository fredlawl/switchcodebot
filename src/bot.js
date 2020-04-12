import { CommandRegistry } from "./command-registry";

const Discord = require('discord.io');
const logger = require('winston');
const auth = require('../auth.json');
const cmds = require('./commands.js');
const parser = require('./parser');
const path = require('path')

const dbPath = path.resolve(__dirname, 'switchcodebot.db')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

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
const bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('any', function (event) {
	console.log(event);
});

bot.on('disconnect', function (errorMessage, code) {
	logger.error(`Disconnected from server with message: ${errorMessage} (${code})`);
	db.close();
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
	// Do not handle messages from bots
	if (evt.d.author.bot) {
		return;
	}

    let parsedMessage = parser.parseMessage(message);
    if (!parsedMessage) {
    	/*
    	 * Apparently this event is fired pmer the event makes a message, so we'll just
    	 * prevent further action here until it's figured out how to prevent
    	 * reading the bots own message.
    	 * TODO: Make bot not parse back its own message; possibly use the message nonce field
    	 */
		return;
	}

    if (parsedMessage.cmd.localeCompare('help') === 0) {
    	bot.sendMessage({
			to: channelID,
			message: commandRegistry.help
		});
    	return;
	}

	// Put bot into first argument so that commands can send stuff back
	let args = parsedMessage.args;
	args.unshift({
		discord: bot,
		message: {
			user: user,
			userID: userID,
			serverID: evt.d.guild_id,
			channelID: channelID,
			message: message,
			event: evt
		},
		db: db
	});

	let executeResult = commandRegistry.execute(parsedMessage.cmd, args);
	if (!executeResult) {
		logger.error(`${parsedMessage.cmd} failed to execute`);
	}
});
