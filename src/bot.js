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
	db.run(`
		CREATE TABLE IF NOT EXISTS turnupRecords (
			userId INT(11) NOT NULL,
			username VARCHAR(255) NOT NULL,
			week INT(11) NOT NULL,
			year INT(11) NOT NULL,
			sunam INT(11) NULL,
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
});

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const commandRegistry = new CommandRegistry();
commandRegistry.register('^disfakka$', cmds.disfakka);
commandRegistry.register('^sw$', cmds.switchcode);
commandRegistry.register('^addturnup$', cmds.addturnup);

// Initialize Discord Bot
const bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('disconnect', function (event) {
	logger.error(`Disconnected from server with message: ${event}`);
	db.close();
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
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

    // Put bot into first argument so that commands can send stuff back
	let args = parsedMessage.args;
	args.unshift({
		discord: bot,
		message: {
			user: user,
			userID: userID,
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
