import { isBefore, isAfter, getISOWeek  } from 'date-fns'

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
	const helpMessage = `Command usage: \`!addturnup amount [day[am | pm]]\`:
		\tamount -  is required, and must be a positive integer.
		\tdaytime (optional) - Format: abbreviated day + cycle. eg. monam/pm for monday.`

	const daytimeLookup = {
		['sunam']: 0,
		['monam']: 1,
		['monpm']: 1,
		['tueam']: 2,
		['tuepm']: 2,
		['wedam']: 3,
		['wedpm']: 3,
		['thuram']: 4,
		['thurpm']: 4,
		['friam']: 5,
		['fripm']: 5,
		['satam']: 6,
		['satpm']: 6,
	}

	const dayLookupTable = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
	const timeLookupTable = ['pm', 'am'];

	const userId = app.message.userID;
	const user = app.message.user;
	const now = (new Date());
	const year = now.getFullYear();
	const week = getISOWeek(now);

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
		(isAfter(now, (new Date().setHours(7, 59, 59, 0)))
		&& isBefore(now, (new Date().setHours(11, 59, 59, 0)))) * 1;
	let parsedDaytime = today + timeLookupTable[isMorning];

	if (typeof daytime !== 'undefined') {
		daytime = daytime.toLowerCase();
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

	const formattedDay = parsedDaytime.slice(0, 3).charAt(0).toUpperCase()
		+ parsedDaytime.slice(1, 3)
		+ '. ' + parsedDaytime.slice(3).toUpperCase();

	let postfix = 'th';
	if (week === 1) {
		postfix = 'st';
	} else if (week === 2) {
		postfix = 'nd';
	} else if (week === 3) {
		postfix = 'rd';
	}

	app.db.serialize(function () {
		app.db.run(`INSERT INTO turnupRecords (userId, username, week, year, ${parsedDaytime}) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId, week, year) DO UPDATE SET ${parsedDaytime} = ?;`, [
			userId, user, week, year, amount, amount
		], function (err) {
			if (!err) {
				app.discord.sendMessage({
					to: app.message.channelID,
					message: `@${user} I added the price ${amount} to the ${week}${postfix} week of ${year} - ${formattedDay}.`
				});
				return;
			}

			console.log(now.getTime(), err);
			app.discord.sendMessage({
				to: app.message.channelID,
				message: `Sorry! I couldn't log your turnup price! Ask @fredlawl#0879 for help! (${now.getTime()})`
			});
		});
	});

	return true;
}