import regeneratorRuntime from "regenerator-runtime";
import { convertUTCTimezoneToLocal } from "./parser";
import { TurnipDateCalculator } from "./turnip-date-calculator";

export class TurnipService
{
	constructor(userRepository)
	{
		this.userRepository = userRepository;
	}

	async getTurnipDateCalculator(date, userId, timezone)
	{
		let now = new Date(date.getTime());

		if (!timezone) {
			const userMeta = await this.userRepository.getUserMeta(userId).catch((err) => {
				console.log(err);
			});

			timezone = null;
			if (userMeta) {
				timezone = userMeta.timezone;
			}
		}

		if (timezone) {
			now = convertUTCTimezoneToLocal(now, timezone);
		}

		return new TurnipDateCalculator(now);
	}
}
