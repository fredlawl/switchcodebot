var parser = require('../src/parser');

describe('parseMessage', () => {
	test('expect null command if no exclamation mark', () => {
		let result = parser.parseMessage('test');
		expect(result).toBe(null);
	});

	test('expect cmd name to be parsed', () => {
		let result = parser.parseMessage('!test');
		expect(result).toEqual({cmd: 'test', args: []});
	});

	test('expect cmd to give us parsed out arguments', () => {
		let result = parser.parseMessage('!test arg1 arg2');
		expect(result).toEqual({
			cmd: 'test',
			args: ['arg1', 'arg2']
		});
	});

	test('parsed args are trimmed', () => {
		let result = parser.parseMessage('!test             hello          world');
		expect(result).toEqual({
			cmd: 'test',
			args: ['hello', 'world']
		});
	});
});

describe('parseSwitchCode', () => {

	test('switch code matches sw-1234-1234-1234', () => {
		performTest('sw-1234-1234-1234');
	});

	test('switch code matches 1234-1234-1234', () => {
		performTest('1234-1234-1234');
	});

	test('switch code matches sw-123412341234', () => {
		performTest('sw-123412341234');
	});

	test('switch code matches 123412341234', () => {
		performTest('123412341234');
	});

	function performTest (code) {
		let actual = parser.parseSwitchCode(code);
		expect(actual).toBe('SW-1234-1234-1234');
	}

	test('code should fail', () => {
		let actual = parser.parseSwitchCode('test');
		expect(actual).toBe('');
	});
});


describe('convertUTCTimezoneToLocal', () => {
	test('given good timezone, correctly parse date', () => {
		const date = new Date('2020-04-11T15:00:00.000Z');
		const actual = parser.convertUTCTimezoneToLocal(date, 'America/Chicago');
		expect(actual).toEqual(new Date('2020-04-11T15:00:00.000Z'));
	});

	test('given bad timezone, give us null date', () => {
		const actual = parser.convertUTCTimezoneToLocal(new Date(), 'asdfasdfadf');
		expect(actual).toEqual(null);
	});
});
