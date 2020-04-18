import regeneratorRuntime from "regenerator-runtime";
import { Command } from "../command";
import { parseSwitchCode } from "../parser";

export class SwitchCodeCmd extends Command
{
	constructor()
	{
		const help = `
Command usage: \`!sw code\`:
\tcode - Must be your switch code in this format: SW-1234-1234-1234.`;

		super('sw', 'Registers your Nintendo Switch code to the bot.', help);
	}

	async handler(msg, code)
	{
		const parsedSwitchCode = parseSwitchCode(code);

		if (parsedSwitchCode.length <= 0) {
			msg.reply('the switch code must be in the correct format: SW-1234-1234-1234');
			return Command.EXIT_GENERAL_ERROR;
		}

		msg.channel.send(`${msg.message.author.username}: ${parsedSwitchCode}`).then((thisMessage) => {
			thisMessage.pin();
		});

		return Command.EXIT_SUCCESS;
	}
}
