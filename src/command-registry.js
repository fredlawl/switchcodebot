export class CommandRegistry
{
	constructor() {
		this.registry = {};
		this.regexKeys = [];
	}

	register(command) {
		const commandPattern = `^${command.name}$`;
		if (!this.registry[command.name]) {
			this.registry[command.name] = command;
			this.regexKeys.push(commandPattern);
		}

		return true;
	}

	get commands()
	{
		return { ...this.registry };
	}

	async execute(commandName, args)
	{
		const command = this.get(commandName);

		if (!command) {
			return Command.EXIT_FATAL_ERROR;
		}

		return await command.handler.apply(command, args)
	}

	get(commandName)
	{
		let command = null;
		for (let i = 0; i < this.regexKeys.length; i++) {
			let regexPattern = this.regexKeys[i];
			if (commandName.match(regexPattern)) {
				if (!this.registry[commandName]) {
					continue;
				}

				command = this.registry[commandName];
			}
		}

		return command;
	}
}
