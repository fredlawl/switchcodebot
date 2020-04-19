import regeneratorRuntime from "regenerator-runtime";
import { Command } from '../command';

export class ProfitCmd extends Command
{
	constructor(turnipService, turnipRepository)
	{
		const help =`
Command usage: \`!profit [turnipsbought]\`:
\tturnipsbought (optional) - Set the number of turnips you bought for the week. Cannot be less than 0.
This command will report on how much profit you can make compared to other users current prices.`;

		super('profit', 'Based on # of turnips bought, compare with peoples current prices.', help);
		this.turnipService = turnipService;
		this.userRepository = turnipService.userRepository;
		this.turnipRepository = turnipRepository;
	}

	async handler(msg, amount)
	{
		const userId = msg.author.id;
		const username = msg.author.username;
		const turnipDateCalc =
			await this.turnipService.getTurnipDateCalculator(msg.createdAt, userId);
		const year = turnipDateCalc.year;
		const week = turnipDateCalc.week;

		if (typeof amount === 'undefined') {
			return this.report(msg, userId, turnipDateCalc);
		}

		const parsedAmount = parseInt(amount);
		if (Number.isNaN(parsedAmount)) {
			msg.reply(`only numbers are allowed for the amount!`);
			return Command.EXIT_GENERAL_ERROR;
		}

		if (parsedAmount < 0) {
			msg.reply(`the amount cannot be less than zero.`);
			return Command.EXIT_GENERAL_ERROR;
		}

		const recordsModified = await this.turnipRepository.addBuy(
			userId,
			username,
			year,
			week,
			parsedAmount
		).catch((err) => {
			console.log(err);
		});

		if (!recordsModified) {
			msg.reply(`I was not able to add the amount **${parsedAmount}** to your week.`)
			return Command.EXIT_GENERAL_ERROR;
		}

		msg.reply(`I set **${parsedAmount}** of turnips purchased to the ${week} week of ${year}.`);
		return Command.EXIT_SUCCESS;
	}

	async report(msg, userId, turnipDateCalc)
	{
		const rows = await this.turnipRepository.all(
			turnipDateCalc.year,
			turnipDateCalc.week
		).catch((err) => {
			console.log(err);
		});

		if (!rows) {
			msg.reply(`sorry, it looks like no one has added any turnips. You should be the first! Type \`!help addturnip\` for more details.`);
			return Command.EXIT_GENERAL_ERROR;
		}

		let numPurchased = 0;
		let buyPrice = 0;
		for (let i = 0; i < rows.length; i++) {
			if (rows[i].username !== msg.author.username) {
				continue;
			}

			numPurchased = rows[i].numPurchased;
			buyPrice = rows[i].buy ?? 0;
		}

		let usernamePad = 13;
		let tableRows = [
			[
				'Username'.padEnd(usernamePad),
				'Cur. Price'.padEnd(10),
				'Cur. Time'.padEnd(9),
				'Total'.padEnd(10),
				'% Gain'.padEnd(6),
				'Profit'.padEnd(6)
			].join(' ')
		];

		for (let i = 0; i < rows.length; i++) {
			let row = rows[i];
			let userTurnipCalc =
				await this.turnipService.getTurnipDateCalculator(msg.createdAt, userId, row.timezone);
			let curDaytime = userTurnipCalc.fullAbbreviation;
			let curFormattedDaytime = userTurnipCalc.formattedAbbreviation;
			let curPrice = row[curDaytime] ?? 0;

			if (userTurnipCalc.isSunday) {
				curPrice = row.buy ?? 0;
			}

			let total = curPrice * numPurchased;
			let profit = total - (buyPrice * numPurchased);
			let pGain = 0.0;

			if (profit > 0.0) {
				pGain = total / (buyPrice * numPurchased);
			}

			curPrice += '';
			total += '';
			profit += '';
			pGain = pGain.toFixed(2) + '%';
			tableRows.push(
				[
					row.username.substr(0, usernamePad).padEnd(usernamePad),
					curPrice.padEnd(10),
					curFormattedDaytime.padEnd(9),
					total.padEnd(10),
					pGain.padEnd(6),
					profit.padEnd(6)
				].join(' ')
			);
		}

		msg.reply(`you bought **${numPurchased}** turnips this week, this is your gains if you buy from these users:\`\`\`${tableRows.join('\n')}\`\`\``);

		return Command.EXIT_SUCCESS;
	}

}
