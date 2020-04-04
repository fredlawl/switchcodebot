import { CommandRegistry } from '../src/command-registry';

test('register registers command', () => {
    const cmdRegistry = new CommandRegistry();
    let func = () => {};
    cmdRegistry.register('doesnt matter', func);
    let registry = cmdRegistry.getCommands();
    expect(registry).toEqual({'doesnt matter': func});
});

test('register only registers duplicate keys once', () => {
	const cmdRegistry = new CommandRegistry();
    let func1 = () => {};
    let func2 = () => {};
    cmdRegistry.register('test1', func1);
    cmdRegistry.register('test1', func2);
    let registry = cmdRegistry.getCommands();
    expect(registry).toEqual({'test1': func1});
    expect(registry).not.toEqual({'test1': func2});
});

test('execute command where pattern does not exist', () => {
	const cmdRegistry = new CommandRegistry();
	expect(cmdRegistry.execute('test', [])).toBe(false);
});

test('execute command where pattern does exist', () => {
	const cmdRegistry = new CommandRegistry();
	cmdRegistry.register('^test$', (args) => {
		return true;
	});

	expect(cmdRegistry.execute('test', [])).toBe(true);
});

test('execute command should always return bool', () => {
	const cmdRegistry = new CommandRegistry();
	cmdRegistry.register('^test$', (args) => {
		return 'something else';
	});

	expect(cmdRegistry.execute('test', [])).toBe(true);
});

test('executing command with paramaters works', () => {
	const cmdRegistry = new CommandRegistry();
	cmdRegistry.register('^test$', (arg1, arg2) => {
		return arg1 === 'test' && arg2 === 'test2';
	});

	expect(cmdRegistry.execute('test', ['test', 'test2'])).toBe(true);
});

test('executing command with parameters, but function doesnt have any', () => {
	const cmdRegistry = new CommandRegistry();
	cmdRegistry.register('^test$', () => {
		return true;
	});

	expect(cmdRegistry.execute('test', ['test', 'test2'])).toBe(true);
})
