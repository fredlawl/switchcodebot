import regeneratorRuntime from "regenerator-runtime";
import { Command } from '../command';
import { convertUTCTimezoneToLocal } from "../parser";
import { TurnipDateCalculator } from "../turnip-date-calculator";

export class AddTurnipCmd extends Command
{
	constructor(userRepository, turnipRepository)
	{
		const help = `
Command usage: \`!addturnip amount [daytime]\`:
\tamount - The price the raccoons are buying turnips at.
\tdaytime (optional) - The abbreviated day with am/pm. eg. monam/monpm for Monday AM/Monday PM.
If you make a mistake, you can always change your sell prices at any time throughout the week.
> **NOTE:** This command may not work correctly without having a timezone set. Type \`!help timezone\` for more information.`;

		super('addturnip', 'Sets your daily turnip sell amount.', help);
		this.userRepository = userRepository;
		this.turnipRepository = turnipRepository;
	}

	async handler(msg, amount, userdaytime)
	{
		const userId = msg.author.id;
		const user = msg.author.username;
		let now = new Date(msg.createdAt.getTime());
		let turnipDateCalc;

		let parsedAmount = parseInt(amount);
		if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
			return Command.EXIT_GENERAL_ERROR;
		}

		const userMeta = await this.userRepository.getUserMeta(userId).catch((err) => {
			console.log(err);
		});

		if (userMeta) {
			now = convertUTCTimezoneToLocal(now, userMeta.timezone);
		}

		if (typeof userdaytime !== 'undefined') {
			userdaytime = userdaytime.toLowerCase();
			now = TurnipDateCalculator.convertDaystringToDate(now, userdaytime);

			if (!now) {
				return Command.EXIT_GENERAL_ERROR;
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

		const inserted = await this.turnipRepository.insert(userId, user, week, year, amount, column).catch((err) => {
			console.log(err);
		});

		if (inserted && inserted <= 0) {
			return Command.EXIT_GENERAL_ERROR;
		}

		msg.reply(`I logged ${amount} to the ${week} week of ${year} - ${formattedDay}.`);

		return Command.EXIT_SUCCESS;
	}
}
