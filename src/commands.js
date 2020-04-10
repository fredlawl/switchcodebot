const parser = require('./parser');

module.exports.disfakka = function (app) {
	app.discord.sendMessage({
		to: app.message.channelID,
		message: 'Disfakkaaaaa!!'
	});
	return true;
};

module.exports.switchcode = function (app, code) {
	let parsedSwitchCode = parser.parseSwitchCode(code);

	if (parsedSwitchCode.length <= 0) {
		app.discord.sendMessage({
			to: app.message.channelID,
			message: `@${app.message.user} the switch code must be in the correct format: SW-1234-1234-1234`
		});
		return true;
	}

	app.discord.sendMessage({
		to: app.message.channelID,
		message: `${app.message.user}: ${parsedSwitchCode}`
	}, function (error, response) {
		app.discord.pinMessage({
			channelID: app.message.channelID,
			messageID: response.id
		});
	});

	return true;
};
