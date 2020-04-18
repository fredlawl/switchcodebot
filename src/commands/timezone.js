import regeneratorRuntime from "regenerator-runtime";
import { Command } from '../command';
import { convertUTCTimezoneToLocal } from "../parser";

export class TimezoneCmd extends Command
{
	constructor(userRepository)
	{
		const help = `
Command usage: \`!timezone [timezone]\`:
\ttimezone (optional) - Set your timezone; eg. America/Chicago for U.S. Central timezone (see below for full list).
When not specifying options, this will list your currently set timezone.
https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`;

		super('timezone', 'Get or set your timezone.', help);

		this.userRepository = userRepository;
	}

	async handler(msg, timezone)
	{
		const now = new Date(msg.createdAt.getTime());
		const userId = msg.author.id;

		timezone = timezone ?? null;
		if (timezone) {
			if (!convertUTCTimezoneToLocal(now, timezone)) {
				return Command.EXIT_HELP;
			}
		}

		if (!timezone) {
			return this.default(msg);
		}

		// TODO: figure out how to return EXIT_FATAL_ERROR on catch
		let tz = await this.userRepository.setTimezone(userId, timezone).catch((err) => {
			console.log(err);
		});

		if (!tz) {
			msg.reply(`sorry! I couldn't set your timezone!`);
			return Command.EXIT_GENERAL_ERROR;
		}

		msg.reply(`your timezone is now set to: ${tz}`);
		return Command.EXIT_SUCCESS;
	}

	async default(msg)
	{
		const userId = msg.author.id;

		// TODO: figure out how to return EXIT_FATAL_ERROR on catch
		let userMeta = await this.userRepository.getUserMeta(userId).catch((err) => {
			console.log(err);
		});

		if (!userMeta) {
			msg.reply(`sorry! I don't have a timezone for you.`);
			return Command.EXIT_GENERAL_ERROR;
		}

		msg.reply(`your timezone is: ${userMeta.timezone}`);
		return Command.EXIT_SUCCESS;
	}
}
