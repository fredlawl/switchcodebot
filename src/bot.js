import regeneratorRuntime from "regenerator-runtime";
import { CommandRegistry } from "./command-registry";
import { Command } from "./command";
import { DisfakkaCmd } from "./commands/disfakka";
import { HelpCmd } from "./commands/help";
import { SwitchCodeCmd } from "./commands/switch-code";
import { TimezoneCmd } from "./commands/timezone";
import { UserRepository } from "./user-repository";
import { TurnipRepository } from "./turnip-repository";
import { AddTurnipCmd } from "./commands/add-turnip";
import { TurnipsCmd } from "./commands/turnips";

const Discord = require('discord.js');
const logger = require('winston');
const auth = require('../auth.json');
const parser = require('./parser');
const path = require('path')

const dbPath = path.resolve(__dirname, 'switchcodebot.db')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath);

const userRepository = new UserRepository(db);
const turnipRepository = new TurnipRepository(db);

db.serialize(function () {
	turnipRepository.setup();
	userRepository.setup();
});

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const commandRegistry = new CommandRegistry();
commandRegistry.register(new HelpCmd(commandRegistry));
commandRegistry.register(new DisfakkaCmd());
commandRegistry.register(new SwitchCodeCmd());
commandRegistry.register(new TimezoneCmd(userRepository));
commandRegistry.register(new AddTurnipCmd(userRepository, turnipRepository));
commandRegistry.register(new TurnipsCmd(userRepository, turnipRepository));

// Initialize Discord Bot
const bot = new Discord.Client();

bot.on('disconnect', function (errorMessage, code) {
	logger.error(`Disconnected from server with message: ${errorMessage} (${code})`);
	db.close();
});

bot.on('ready', () => {
    logger.info('Connected');
});

bot.on('message', async (msg) => {
	const now = new Date();
	const fatalErrorMessage = `something very wrong happened! Please see administrator for help! (${now.getTime()})`

	// Do not handle messages from bots
	if (msg.author.bot) {
		return;
	}

	let parsedMessage = parser.parseMessage(msg.content);
    if (!parsedMessage) {
		return;
	}

	let args = [msg];
	args = args.concat(parsedMessage.args);

	try {
		let cmd = commandRegistry.get(parsedMessage.cmd);
		let executeResult = await commandRegistry.execute(parsedMessage.cmd, args);
		switch (executeResult) {
			case Command.EXIT_HELP:
				msg.reply(cmd.help);
				break;
			case Command.EXIT_GENERAL_ERROR:
				msg.reply(`type, \`!help ${cmd.name}\` to learn more!`);
				break;
			case Command.EXIT_FATAL_ERROR:
				msg.reply(fatalErrorMessage);
				logger.error(`"${parsedMessage.cmd}" failed to execute, but no error message given. (${now.getTime()})`);
				break;
			default: break;
		}
	} catch (e) {
		msg.reply(fatalErrorMessage);
		logger.error(`"${parsedMessage.cmd}" failed to execute. (${now.getTime()}): ${e}`);
	}

});

bot.login(auth.token);
