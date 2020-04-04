const parser = require('./parser');

module.exports.disfakka = function (message) {
	message.bot.sendMessage({
		to: message.channelID,
		message: 'Disfakkaaaaa!!'
	});
	return true;
};

module.exports.switchcode = function (message, code) {
	let parsedSwitchCode = parser.parseSwitchCode(code);

	if (parsedSwitchCode.length <= 0) {
		message.bot.sendMessage({
			to: message.channelID,
			message: `@${message.user} the switch code must be in the correct format: SW-1234-1234-1234`
		});
		return true;
	}

	message.bot.sendMessage({
		to: message.channelID,
		message: `${message.user}: ${parsedSwitchCode}`
	}, function (error, response) {
		message.bot.pinMessage({
			channelID: message.channelID,
			messageID: response.id
		});
	});

	return true;
};
