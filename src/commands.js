import regeneratorRuntime from "regenerator-runtime";
import { TurnipDateCalculator } from "./turnip-date-calculator";
import { convertUTCTimezoneToLocal, parseSwitchCode, parseMessage } from "./parser";

function getUserMeta(db, userId)
{
	return new Promise((resolve, reject) => {
		db.get(`SELECT * FROM userMeta WHERE userId = ?`, [
			userId
		], function (err, row) {
			if (err) {
				reject(err);
			}

			resolve(row);
		});
	});
}

module.exports.disfakka = function (app) {
	app.message.channel.send('Disfakkaaaaa!!');
	return true;
};

module.exports.switchcode = function (app, code) {
	let parsedSwitchCode = parseSwitchCode(code);

	if (parsedSwitchCode.length <= 0) {
		app.message.reply('the switch code must be in the correct format: SW-1234-1234-1234');
		return true;
	}

	app.message.channel.send(`${app.message.author.username}: ${parsedSwitchCode}`).then((msg) => {
		msg.pin();
	});

	return true;
};

module.exports.addturnip = async function (app, amount, userdaytime) {
	const helpMessage = `Command usage: \`!addturnip amount [day[am | pm]]\`:
		\tamount - Must be a positive integer.
		\tdaytime (optional) - Format: abbreviated day + cycle. eg. monam/pm for monday.\nIf you make a mistake, you can always change your logged numbers at any time throughout the week.`

	const userId = app.message.author.id;
	const user = app.message.author.username;
	let now = new Date(app.message.createdAt.getTime());
	let turnipDateCalc;

	let parsedAmount = parseInt(amount);
	if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
		app.message.channel.send(helpMessage);
		return;
	}

	const userMeta = await getUserMeta(app.db, userId).catch((err) => {
		console.log(now.getTime(), err);
	});

	if (typeof userMeta !== 'undefined') {
		now = convertUTCTimezoneToLocal(now, userMeta.timezone);
	}

	if (typeof userdaytime !== 'undefined') {
		userdaytime = userdaytime.toLowerCase();
		now = TurnipDateCalculator.convertDaystringToDate(now, userdaytime);

		if (!now) {
			app.message.channel.send(helpMessage);
			return;
		}
	}

	turnipDateCalc = new TurnipDateCalculator(now);
	const week = turnipDateCalc.week;
	const year = turnipDateCalc.year;
	const formattedDay = turnipDateCalc.formattedAbbreviation;
	let column = turnipDateCalc.fullAbbreviation;
	if (turnipDateCalc.isSunday) {
		column = 'buy';
	}

	app.db.run(`INSERT INTO turnipRecords (userId, username, week, year, ${column}) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId, week, year) DO UPDATE SET ${column} = ?;`, [
		userId, user, week, year, amount, amount
	], function (err) {
		if (!err) {
			app.message.reply(`I added the price ${amount} to the ${week} week of ${year} - ${formattedDay}.`);
			return;
		}

		console.log(now.getTime(), err);
		app.message.reply(`sorry! I couldn't log your turnip price! Ask the bot admin for help! (${now.getTime()})`);
	});

	return true;
}

module.exports.turnips = async function (app, username) {
	const userId = app.message.author.id;
	let now = new Date(app.message.createdAt.getTime());

	const userMeta = await getUserMeta(app.db, userId).catch((err) => {
		console.log(now.getTime(), err);
	});

	if (typeof userMeta !== 'undefined') {
		now = convertUTCTimezoneToLocal(now, userMeta.timezone);
	}

	const turnipDateCalc = new TurnipDateCalculator(now);
	const year = turnipDateCalc.year;
	const week = turnipDateCalc.week;
	const today = turnipDateCalc.todayAbbreviation;
	let turnipPredictionLink = 'https://turnipprophet.io/index.html?first-time=false&prices='

	let usernameClause = '';
	if (username) {
		usernameClause = 'AND username = ?'
	}

	let primaryOrderColumn = `${turnipDateCalc.fullAbbreviation} DESC`;
	if (turnipDateCalc.isSunday) {
		primaryOrderColumn = 'buy ASC'
	}

	let orderClause = `ORDER BY ${primaryOrderColumn}, buy ASC, username ASC`;
	app.db.all(`
		SELECT
			tr.*,
			um.timezone
		FROM turnipRecords tr
		LEFT JOIN userMeta um ON um.userId = tr.userId
		WHERE
			year = ?
			AND week = ?
			${usernameClause}
			${orderClause}`, [
		year, week, username
	], function (err, rows) {
		if (err) {
			console.log(now.getTime(), err);
			app.message.reply(`sorry! I couldn't show peoples prices! Ask the bot admin for help! (${now.getTime()})`);
			return;
		}

		if (username && !err && rows.length <= 0) {
			console.log(now.getTime(), err);
			app.message.reply(`sorry! I don't have prices for ${username}!`);
			return;
		}

		if (!err && rows.length <= 0) {
			app.message.channel.send(`sorry! I don't have prices for anyone this week :(`);
			return;
		}

		let predictionUrls = [];
		let stats = [
			'User'.padEnd(13) + 'Buy'.padEnd(7) + 'AM/PM'.padEnd(10) + 'Time'.padEnd(4)
		];
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let time = new Date(app.message.createdAt.getTime());
			if (row.timezone) {
				time = convertUTCTimezoneToLocal(time, row.timezone);
			}

			let calc = new TurnipDateCalculator(time);
			let rowturnipPredictionLink = turnipPredictionLink
				+       (row.buy ?? 0) + '.' + (row.monam ?? 0) + '.' + (row.monpm ?? 0)
				+ '.' + (row.tueam ?? 0) + '.' + (row.tuepm ?? 0) + '.' + (row.wedam ?? 0)
				+ '.' + (row.wedpm ?? 0) + '.' + (row.thuam ?? 0) + '.' + (row.thupm ?? 0)
				+ '.' + (row.friam ?? 0) + '.' + (row.fripm ?? 0) + '.' + (row.satam ?? 0)
				+ '.' + (row.satpm ?? 0);
			let formattedLink = `[${row.username}](${rowturnipPredictionLink})`
			predictionUrls.push(formattedLink);
			let sunamnt = (row.buy ?? '0') + '';
			let ampmamnt = `${row[today + 'am'] ?? '0'}/${row[today + 'pm'] ?? '0'}`;
			stats.push(`${row.username.padEnd(13)}${sunamnt.padEnd(7)}${ampmamnt.padEnd(10)}${calc.timeAbbreviation.toUpperCase().padEnd(4)}`);
		}

		app.message.channel.send(`Yeah you! Oh yeah! Put it in your mouth!\`\`\`${stats.join('\n')}\`\`\``, {
			embed: {
				title: `Week ${week} of ${year} Turnip Prices`,
				fields: [
					{
						name: 'Predictions',
						value: predictionUrls.join(', ')
					}
				],
				footer: {
					text: 'Brought to you by fredlawl'
				}
			}
		});

	});

	return true;
}

module.exports.timezone = async function (app, timezone)
{
	const now = new Date(app.message.createdAt.getTime());;
	const userId = app.message.author.id;
	const helpUsage = `Command usage: \`!timezone [help | timezone]\`:
		\thelp (optional) - Shows this message.
		\ttimezone (optional) - Set your timezone; eg. America/Chicago for U.S. Central timezone (see below for full list).\nWhen not specifying options, this will list your current set timezone.`
	const helpOptions = {
		embed: {
			title: 'List of timezones',
			url: 'https://en.wikipedia.org/wiki/List_of_tz_database_time_zones'
		}
	};

	if (timezone && timezone.toLowerCase().localeCompare('help') === 0) {
		app.message.channel.send(helpUsage, helpOptions);
		return true;
	} else if (timezone) {
		if (!convertUTCTimezoneToLocal(now, timezone)) {
			app.message.channel.send(helpUsage, helpOptions);
			return true;
		}
	} else {
		timezone = null;
	}

	if (!timezone) {

		let userMeta = await getUserMeta(app.db, userId).catch((err) => {
			console.log(now.getTime(), err);
		});

		if (userMeta) {
			app.message.reply(`your timezone is: ${userMeta.timezone}`);
		} else {
			app.message.reply(`sorry! I don't have a timezone for you. Type \`!timezone help\` to learn how to set it!`);
		}

		return;
	}

	app.db.run(`INSERT INTO userMeta (userId, timezone) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET timezone = ?;`, [
		userId, timezone, timezone
	], function (err) {
		if (err) {
			console.log(now.getTime(), err);
			app.message.reply(`sorry! I couldn't set your timezone! Ask the bot admin for help! (${now.getTime()})`);
			return;
		}

		app.message.reply(`your timezone is now set to: ${timezone}`);
	});

	return true;
}
