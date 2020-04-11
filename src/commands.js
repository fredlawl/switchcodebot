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
			message: `<@${app.message.userID}> the switch code must be in the correct format: SW-1234-1234-1234`
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
		\tdaytime (optional) - Format: abbreviated day + cycle. eg. monam/pm for monday.\nIf you make a mistake, you can always change your logged numbers at any time throughout the week.`

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

	const isSunday = now.getDay() === 0;
	let today = dayLookupTable[now.getDay()];
	let isMorning =
		(isAfter(now, (new Date().setHours(7, 59, 59, 0)))
		&& isBefore(now, (new Date().setHours(11, 59, 59, 0)))) * 1;

	let parsedDaytime = 'sunam';
	if (!isSunday) {
		parsedDaytime = today + timeLookupTable[isMorning];
	}

	if (typeof daytime !== 'undefined') {
		daytime = daytime.toLowerCase();
		if (typeof daytimeLookup[daytime] !== 'undefined') {
			parsedDaytime = daytime;
		} else if (!isSunday) {
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

	app.db.serialize(function () {
		app.db.run(`INSERT INTO turnupRecords (userId, username, week, year, ${parsedDaytime}) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId, week, year) DO UPDATE SET ${parsedDaytime} = ?;`, [
			userId, user, week, year, amount, amount
		], function (err) {
			if (!err) {
				app.discord.sendMessage({
					to: app.message.channelID,
					message: `<@${userId}> I added the price ${amount} to the ${week} week of ${year} - ${formattedDay}.`
				});
				return;
			}

			console.log(now.getTime(), err);
			app.discord.sendMessage({
				to: app.message.channelID,
				message: `Sorry! I couldn't log your turnup price! Ask the bot admin for help! (${now.getTime()})`
			});
		});
	});

	return true;
}

module.exports.yeahyou = function (app, username) {
	const userId = app.message.userID;
	const now = (new Date());
	const year = now.getFullYear();
	const week = getISOWeek(now);
	let turnupPredictionLink = 'https://turnipprophet.io/index.html?first-time=false&prices='

	const dayLookupTable = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

	let today = dayLookupTable[now.getDay()];

	app.db.serialize(function () {
		let usernameClause = '';
		if (username) {
			usernameClause = 'AND username = ?'
		}

		app.db.all(`SELECT * FROM turnupRecords WHERE year = ? AND week = ? ${usernameClause}`, [
			year, week, username
		], function (err, rows) {
			if (err) {
				console.log(now.getTime(), err);
				app.discord.sendMessage({
					to: app.message.channelID,
					message: `Sorry! I show peoples prices! Ask the bot admin for help! (${now.getTime()})`
				});
				return;
			}

			if (username && !err && rows.length <= 0) {
				console.log(now.getTime(), err);
				app.discord.sendMessage({
					to: app.message.channelID,
					message: `Sorry! I don't have prices for ${username}!`
				});
				return;
			}

			if (!err && rows.length <= 0) {
				app.discord.sendMessage({
					to: app.message.channelID,
					message: `Sorry! I don't have prices for anyone this week :(`
				});
				return;
			}

			let predictionUrls = [];
			let stats = [
				'User'.padEnd(13) + 'Buy'.padEnd(7) + 'AM/PM'.padEnd(10)
			];
			for (let i = 0; i < rows.length; i++) {
				let row = rows[i];
				let rowturnupPredictionLink = turnupPredictionLink
					+       (row.sunam ?? 0) + '.' + (row.monam ?? 0) + '.' + (row.monpm ?? 0)
					+ '.' + (row.tueam ?? 0) + '.' + (row.tuepm ?? 0) + '.' + (row.wedam ?? 0)
					+ '.' + (row.wedpm ?? 0) + '.' + (row.thuam ?? 0) + '.' + (row.thupm ?? 0)
					+ '.' + (row.friam ?? 0) + '.' + (row.fripm ?? 0) + '.' + (row.satam ?? 0)
					+ '.' + (row.satpm ?? 0);
				let formattedLink = `[${row.username}](${rowturnupPredictionLink})`
				predictionUrls.push(formattedLink);
				let sunamnt = (row.sunam ?? '0') + '';
				let ampmamnt = `${row[today + 'am'] ?? '0'}/${row[today + 'pm'] ?? '0'}`;
				stats.push(`${row.username.padEnd(13)}${sunamnt.padEnd(7)}${ampmamnt.padEnd(10)}`);
			}

			app.discord.sendMessage({
				to: app.message.channelID,
				message: 'Yeah you! Oh yeah! Put it in your mouth!',
				embed: {
					title: `Week ${week} of ${year} Turnup Prices`,
					fields: [
						{
							name: 'Predictions',
							value: predictionUrls.join(', ')
						},
						{
							name: 'Today Prices',
							value: `\`\`\`${stats.join('\n')}\`\`\``
						}
					],
					footer: {
						text: 'Brought to you buy fredlawl'
					}
				},
			});
		});
	});

	return true;
}