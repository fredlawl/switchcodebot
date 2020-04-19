import regeneratorRuntime from "regenerator-runtime";
import { Command } from '../command';
import { convertUTCTimezoneToLocal } from "../parser";
import { TurnipDateCalculator } from "../turnip-date-calculator";

export class TurnipsCmd extends Command
{
	constructor(userRepository, turnipRepository)
	{
		const help = `
Command usage: \`!turnips [username]\`:
\tusername (optional) - Shows a report specifically for this user.
By default, this command will provide a turnip report for everyone that recorded their prices with \`!addturnip\`.`;

		super('turnips', 'Gives a turnip report.', help);
		this.userRepository = userRepository;
		this.turnipRepository = turnipRepository;
	}

	async handler(msg, username)
	{
		const userId = msg.author.id;
		let now = new Date(msg.createdAt.getTime());

		const userMeta = await this.userRepository.getUserMeta(userId).catch((err) => {
			console.log(err);
		});

		if (userMeta) {
			now = convertUTCTimezoneToLocal(now, userMeta.timezone);
		}

		const turnipDateCalc = new TurnipDateCalculator(now);
		const year = turnipDateCalc.year;
		const week = turnipDateCalc.week;
		const today = turnipDateCalc.todayAbbreviation;
		let turnipPredictionLink = 'https://turnipprophet.io/index.html?first-time=false&prices='
		let daytime = turnipDateCalc.fullAbbreviation;
		if (turnipDateCalc.isSunday) {
			daytime = 'buy'
		}

		const rows = await this.turnipRepository.report(year, week, daytime, username).catch((err) => {
			console.log(err);
		});

		if (rows.length <= 0) {
			if (username) {
				msg.reply(`sorry, we don't have any results for ${username}.`);
			} else {
				msg.reply(`sorry, it looks like no one has added any turnips. You should be the first! Type \`!help addturnip\` for more details.`);
			}

			return Command.EXIT_GENERAL_ERROR;
		}

		let predictionUrls = [];
		let stats = [
			'User'.padEnd(13) + 'Buy'.padEnd(7) + 'AM/PM'.padEnd(10) + 'Time'.padEnd(4)
		];
		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let time = new Date(msg.createdAt.getTime());
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

		msg.channel.send(`**Week ${week} of ${year} Turnip Prices:**\`\`\`${stats.join('\n')}\`\`\``, {
			embed: {
				title: `Predictions`,
				description: predictionUrls.join(', '),
				footer: {
					text: 'Brought to you by fredlawl'
				}
			}
		});

		return Command.EXIT_SUCCESS;
	}
}
