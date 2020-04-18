import regeneratorRuntime from "regenerator-runtime";
import { Command } from "../command"

export class DisfakkaCmd extends Command
{
    constructor()
    {
		const help = `
Command usage: \`!disfakka\``;

        super('disfakka', 'This is the hello world of commands.', help);
    }

    async handler(msg)
    {
        msg.channel.send('Disfakkaaaaa!!');
        return Command.EXIT_SUCCESS;
    }
}
