import { isBefore, getISOWeek, addWeeks, setISOWeek, getISOWeekYear } from 'date-fns'

export class TurnupDateCalculator
{
	/**
	 * Look
	 */
	static abbreviatedDayLookupTable = {
		['sun']: 0,
		['mon']: 1,
		['tue']: 2,
		['wed']: 3,
		['thu']: 4,
		['fri']: 5,
		['sat']: 6
	};

	static reverseAbbreviatedDayLookupTable = [
		'sun',
		'mon',
		'tue',
		'wed',
		'thu',
		'fri',
		'sat'
	]

	/**
	 * Convert a passed in daytime to a date time relative to passed in date.
	 * The result will always be last weeks date.
	 * @param {Date} date
	 * @param {string} daytime An abbreviated day with am/pm. eg. monam, monpm
	 * @return {null | Date} Null if date could not be parsed
	 */
	static convertDaystringToDate(date, daytime)
	{
		const newDate = new Date(date.getTime());
		const day = daytime.slice(0, 3);
		const isMorning = daytime.slice(3).localeCompare('am') === 0;
		if (isMorning) {
			newDate.setHours(8, 0, 0, 0);
		} else {
			newDate.setHours(12, 0, 0, 0);
		}

		if (typeof this.abbreviatedDayLookupTable[day] === 'undefined') {
			return null;
		}

		let nextDay = newDate.getDate() - (newDate.getDay() - this.abbreviatedDayLookupTable[day]) % 7;
		newDate.setDate(nextDay);
		return newDate;
	}

	constructor(date) {
		this.now = new Date(date.getTime());
	}

	/**
	 * @returns {boolean}
	 */
	get isMorning()
	{
		const afternoon = (new Date(this.now.getTime()))
			.setHours(12, 0, 0, 0);
		return isBefore(this.now, afternoon);
	}

	/**
	 * @returns {boolean}
	 */
	get isAfternoon()
	{
		return !this.isMorning;
	}

	/**
	 * ISO weeks start on monday, not sunday, so we have to add a week here
	 * to get the correct tracking week.
	 * @return {number}
	 */
	get week()
	{
		let now = new Date(this.now.getTime());
		if (this.isSunday) {
			now = addWeeks(now, 1);
		}

		return getISOWeek(now);
	}

	/**
	 * Because week() will produce a week in the future, our year could be off.
	 * Therefore, this function correctly fetches the turnup year.
	 * @return {number}
	 */
	get year()
	{
		let now = new Date(this.now.getTime());
		now = setISOWeek(now, this.week);
		return getISOWeekYear(now);
	}

	/**
	 * @returns {boolean}
	 */
	get isSunday()
	{
		return this.now.getDay() === 0;
	}

	get todayAbbreviation()
	{
		return TurnupDateCalculator.reverseAbbreviatedDayLookupTable[this.now.getDay()];
	}

	get timeAbbreviation()
	{
		return this.isMorning ? 'am' : 'pm';
	}

	/**
	 * Gets the abbreviated daytime.
	 * @returns {string}
	 */
	get fullAbbreviation()
	{
		return this.todayAbbreviation + this.timeAbbreviation;
	}

	/**
	 * A nicer way to show the daytime fullAbbreviation.
	 * @returns {string}
	 */
	get formattedAbbreviation()
	{
		let daytime = this.todayAbbreviation;
		daytime = daytime.charAt(0).toUpperCase() + daytime.slice(1) + '.';
		daytime += ' ' + this.timeAbbreviation.toUpperCase();
		return daytime;
	}
}
