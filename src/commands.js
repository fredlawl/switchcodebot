import { isBefore, isAfter  } from 'date-fns'

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

module.exports.addturnup = function (app, amount, daytime) {
	const user = app.message.user;
	const helpMessage = `Correct command useage: \`!addturnup amount [daytime]\`:
						\tamount is required, and must be a positive integer.
						\tdaytime is optional, and in the format of a abbreviated day + cycle. eg. monmorn, monaft for morning & afternoon.`
	const daytimeLookup = {
		['sunmorn']: 0,
		['monmorn']: 1,
		['monaft']: 1,
		['tuemorn']: 2,
		['tueaft']: 2,
		['wedmorn']: 3,
		['wedaft']: 3,
		['thurmorn']: 4,
		['thuraft']: 4,
		['frimorn']: 5,
		['friaft']: 5,
		['satmorn']: 6,
		['sataft']: 6,
	}

	const now = (new Date());

	const dayLookupTable = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
	const timeLookupTable = ['aft', 'morn'];

	let parsedAmount = parseInt(amount);
	if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
		app.discord.sendMessage({
			to: app.message.channelID,
			message: helpMessage
		});
		return;
	}

	let today = dayLookupTable[now.getDay()];
	let isMorning =
		isAfter(now, (new Date().setHours(7, 59, 59, 0)))
		&& isBefore(now, (new Date().setHours(11, 59, 59, 0)));
	let parsedDaytime = today + timeLookupTable[isMorning * 1];

	if (typeof daytime !== 'undefined') {
		if (!!daytimeLookup[daytime]) {
			parsedDaytime = daytime;
		} else {
			app.discord.sendMessage({
				to: app.message.channelID,
				message: helpMessage
			});
			return;
		}
	}

	app.discord.sendMessage({
		to: app.message.channelID,
		message: `amount: ${amount}; daytime: ${parsedDaytime}`
	});
}