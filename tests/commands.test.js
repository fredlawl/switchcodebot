const cmds = require('../commands.js');

test('disfakka returns string', () => {
    expect(cmds.disfakka()).toBe('disfakka!!');
});
