class CommandRegistry {
	constructor() {
		this.registry = {};
		this.regexKeys = [];
	}

	register(commandPattern, commandFunc) {
		if (!this.registry[commandPattern]) {
			this.registry[commandPattern] = commandFunc;
			this.regexKeys.push(commandPattern);
		}

		return true;
	}

	getCommands() {
		return { ...this.registry };
	}

	execute(commandName, args) {
		let commandFunc = null;
		for (let i = 0; i < this.regexKeys.length; i++) {
			let regexPattern = this.regexKeys[i];
			if (commandName.match(regexPattern)) {
				if (!this.registry[regexPattern]) {
					continue;
				}

				commandFunc = this.registry[regexPattern];
			}
		}

		if (!commandFunc) {
			return false;
		}

		return !!(commandFunc.apply(null, args));
	}
}

export { CommandRegistry };
