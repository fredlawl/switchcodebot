import regeneratorRuntime from "regenerator-runtime";
import { Command } from "../command";

export class HelpCmd extends Command
{
    constructor(registry)
    {
		const help = `
Command usage: \`!help [command]\`:
\tcommand (optional) - Gives specific help information for given command.
By default this command shows all available commands.`;

        super('help', 'Provides help information for commands, and shows this message.', help);
        this.registry = registry;
    }

    async handler(msg, command)
    {
    	if (typeof command !== 'undefined') {
    		return this.command(msg, command);
		}

    	return this.default(msg);
    }

    async default(msg)
	{
		const cmds = Object.values(this.registry.commands);
		const message = [
			`Switch Code Bot commands:`
		];

		for (let i = 0; i < cmds.length; i++) {
			message.push(`\`!${cmds[i].name}\`: ${cmds[i].description}`);
		}

		msg.channel.send(message.join('\n'));
		return Command.EXIT_SUCCESS;
	}

	async command(msg, command)
	{
		if (command.length <= 0) {
			return Command.EXIT_HELP;
		}

		const cmd = this.registry.get(command);
		if (!cmd) {
			msg.reply(`the command "${command}" does not exist.`);
			return Command.EXIT_GENERAL_ERROR;
		}

		msg.channel.send(cmd.help);

		return Command.EXIT_SUCCESS;
	}
}
