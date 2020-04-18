import { HelpCmd } from "../../src/commands/help";
import {CommandRegistry} from "../../src/command-registry";

describe('construction', () => {
	test('expect object constructs', () => {
		const registry = new CommandRegistry();
		const helpcmd = new HelpCmd(registry);

		registry.register(helpcmd);
		registry.execute('help');
	});
});
