export class UserRepository
{
	constructor(db)
	{
		this.db = db;
	}

	setup()
	{
		this.db.run(`
			CREATE TABLE IF NOT EXISTS userMeta (
				userId INT(11) NOT NULL,
				timezone VARCHAR(128) NULL,
				PRIMARY KEY(userId)
			)
		`);
	}

	getUserMeta(userId)
	{
		return new Promise((resolve, reject) => {
			this.db.get(`SELECT * FROM userMeta WHERE userId = ?`, [
				userId
			], function (err, row) {
				if (err) {
					reject(err);
				}

				resolve(row ?? null);
			});
		});
	}

	setTimezone(userId, timezone)
	{
		return new Promise((resolve, reject) => {
			this.db.run(`INSERT INTO userMeta (userId, timezone) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET timezone = ?;`, [
				userId, timezone, timezone
			], function (err) {
				if (err) {
					reject(err);
					resolve(null);
					return;
				}

				resolve(timezone);
			});
		});
	}
}
