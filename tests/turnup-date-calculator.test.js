import { TurnupDateCalculator } from '../src/turnup-date-calculator';
import { getISOWeek } from 'date-fns'

describe('convertDayToTime', () => {
	test('given daytime sunam we get last monday date', () => {
		const now = new Date('2020-04-11 00:00:00.000');
		const daytime = 'sunam';

		const expected = new Date('2020-04-05 08:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given daytime sunpm we get last monday date', () => {
		const now = new Date('2020-04-11 00:00:00.000');
		const daytime = 'sunpm';

		const expected = new Date('2020-04-05 12:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given daytime monam we get last monday date', () => {
		const now = new Date('2020-04-11 00:00:00.000');
		const daytime = 'monam';

		const expected = new Date('2020-04-06 08:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given daytime tueam we get last monday date', () => {
		const now = new Date('2020-04-11 00:00:00.000');
		const daytime = 'tueam';

		const expected = new Date('2020-04-07 08:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given todayAbbreviation as saturday and daytime satam we get todayAbbreviation am', () => {
		const now = new Date('2020-04-11 00:00:00.000');
		const daytime = 'satam';

		const expected = new Date('2020-04-11 08:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given todayAbbreviation as saturday and daytime satpm we get todayAbbreviation am', () => {
		const now = new Date('2020-04-11 00:00:00.000');
		const daytime = 'satpm';

		const expected = new Date('2020-04-11 12:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given todayAbbreviation as sunday and daytime sunam we get sunam', () => {
		const now = new Date('2020-04-12 00:00:00.000');
		const daytime = 'sunam';

		const expected = new Date('2020-04-12 08:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given todayAbbreviation as sunday and daytime sunpm we get sunam', () => {
		const now = new Date('2020-04-12 00:00:00.000');
		const daytime = 'sunpm';

		const expected = new Date('2020-04-12 12:00:00.000');
		const actual = TurnupDateCalculator.convertDaystringToDate(now, daytime);

		expect(actual).toEqual(expected);
	});

	test('given bad user supplied daytime, return null date', () => {
		const now = new Date();
		const actual = TurnupDateCalculator.convertDaystringToDate(now, 'bad');
		expect(actual).toEqual(null);
	});
});

describe('isMorning', () => {
	test('given a morning, we get true', () => {
		const date = new Date('2020-04-11 00:00:00.000');
		const calc = new TurnupDateCalculator(date);

		expect(calc.isMorning).toEqual(true);
		expect(calc.isAfternoon).toEqual(false);
	});

	test('given an afternoon, we get false', () => {
		const date = new Date('2020-04-11 12:00:00.000');
		const calc = new TurnupDateCalculator(date);

		expect(calc.isMorning).toEqual(false);
		expect(calc.isAfternoon).toEqual(true);
	});
});

describe('isSunday', () => {
	test('given a sunday, we get true', () => {
		const date = new Date('2020-04-12 00:00:00.000');
		const calc = new TurnupDateCalculator(date);

		expect(calc.isSunday).toEqual(true);
	});

	test('given not sunday, we get false', () => {
		const date = new Date('2020-04-11 00:00:00.000');
		const calc = new TurnupDateCalculator(date);

		expect(calc.isSunday).toEqual(false);
	});
});

describe('week', () => {
	test('given todayAbbreviation, check iso week is same', () => {
		const date = new Date('2020-04-11 00:00:00.000');
		const thisweek = getISOWeek(date);
		const calc = new TurnupDateCalculator(date);

		expect(calc.week).toEqual(thisweek);
	});

	test('given sunday, check iso week is greater than now', () => {
		const date = new Date('2020-04-12 00:00:00.000');
		const thisweek = getISOWeek(date);
		const calc = new TurnupDateCalculator(date);

		expect(calc.week).toEqual(thisweek + 1);
	});
});

describe('turn of the year', () => {
	test('given new year, the correct week & year match', () => {
		const date = new Date('2020-01-01 00:00:00');
		const calc = new TurnupDateCalculator(date);

		expect(calc.week).toEqual(1);
		expect(calc.year).toEqual(2020);
	});

	test('given turn of the year, the correct week & year match', () => {
		const date = new Date('2019-12-31 00:00:00');
		const calc = new TurnupDateCalculator(date);

		expect(calc.week).toEqual(1);
		expect(calc.year).toEqual(2020);
	});
});

describe('abbreviation', () => {
	test('given a date, we get correct daytime fullAbbreviation', () => {
		const date = new Date('2020-04-11 00:00:00');
		const calc = new TurnupDateCalculator(date);

		expect(calc.fullAbbreviation).toEqual('satam');
	});

	test('given a date, we get a fancy fullAbbreviation', () => {
		const date = new Date('2020-04-11 00:00:00');
		const calc = new TurnupDateCalculator(date);

		expect(calc.formattedAbbreviation).toEqual('Sat. AM');
	});
});
