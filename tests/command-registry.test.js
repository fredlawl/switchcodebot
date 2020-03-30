test('register registers command', () => {
    const cmdRegistry = require('../command-registry.js');
    let func = () => {};
    cmdRegistry.register('doesnt matter', func);
    let registry = cmdRegistry.getCommands();
    expect(registry).toEqual({'doesnt matter': func});
});

test('register only registers duplicate keys once', () => {
    const cmdRegistry = require('../command-registry.js');
    let func1 = () => {};
    let func2 = () => {};
    cmdRegistry.register('test1', func1);
    cmdRegistry.register('test1', func2);
    let registry = cmdRegistry.getCommands();
    expect(registry).toEqual({'test1': func1});
    expect(registry).not.toEqual({'test1': func2});
});
