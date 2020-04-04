const Discord = require('discord.io');
const logger = require('winston');
const auth = require('../auth.json');
const cmds = require('./commands.js');
const parser = require('./parser');
import { CommandRegistry } from "./command-registry";

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const commandRegistry = new CommandRegistry();
commandRegistry.register('^disfakka$', cmds.disfakka);
commandRegistry.register('^sw$', cmds.switchcode);

// Initialize Discord Bot
const bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('disconnect', function (event) {
	logger.error(`Disconnected from server with message: ${event}`);
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
    	 * Apparently this event is fired after the event makes a message, so we'll just
    	 * prevent further action here until it's figured out how to prevent
    	 * reading the bots own message.
    	 * TODO: Make bot not parse back its own message; possibly use the message nonce field
    	 */
		return;
	}

    // Put bot into first argument so that commands can send stuff back
	let args = parsedMessage.args;
	args.unshift({
		bot: bot,
		user: user,
		userID: userID,
		channelID: channelID,
		message: message,
		event: evt
	});

    let executeResult = commandRegistry.execute(parsedMessage.cmd, args);
    if (!executeResult) {
    	logger.error(`${parsedMessage.cmd} failed to execute`);
	}
});
