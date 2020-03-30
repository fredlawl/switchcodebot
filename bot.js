const Discord = require('discord.io');
const logger = require('winston');
const auth = require('./auth.json');
const cmds = required('./commands.js');
const cmdRegistry = required('./command-registry.js');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
const bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        return;
    }

    var args = message.substring(1).split(' ');
    var cmd = args[0];

    args = args.splice(1);
});
