export class CommandRegistry
{
	constructor() {
		this.registry = {};
		this.regexKeys = [];
		this.commandNames = [];
	}

	register(commandName, commandFunc) {
		const commandPattern = `^${commandName}$`;
		if (!this.registry[commandName]) {
			this.registry[commandName] = commandFunc;
			this.regexKeys.push(commandPattern);
			this.commandNames.push(commandName);
		}

		return true;
	}

	get commands()
	{
		return { ...this.registry };
	}

	execute(commandName, args)
	{
		let commandFunc = null;
		for (let i = 0; i < this.regexKeys.length; i++) {
			let regexPattern = this.regexKeys[i];
			if (commandName.match(regexPattern)) {
				if (!this.registry[commandName]) {
					continue;
				}

				commandFunc = this.registry[commandName];
			}
		}

		if (!commandFunc) {
			return false;
		}

		return !!(commandFunc.apply(null, args));
	}

	get help()
	{
		const cmds = this.commandNames;
		const message = [
			`Switch Code Bot commands:`
		];

		for (let i = 0; i < cmds.length; i++) {
			message.push(`!${cmds[i]}`);
		}

		return message.join('\n');
	}
}
