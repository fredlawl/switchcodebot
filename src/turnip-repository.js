export class TurnipRepository
{
	constructor(db)
	{
		this.db = db;
	}

	setup()
	{
		/*
		 * TODO: Figure out a way to handle multiple servers such that
		 *  a user logs a record once, but only the servers the user
		 *  belongs to can see that users stats. Right now, if this
		 *  were on multiple servers, everyone would be listed.
		 *  Maybe that's okay?
		 */
		this.db.run(`
			CREATE TABLE IF NOT EXISTS turnipRecords (
				userId INT(11) NOT NULL,
				username VARCHAR(255) NOT NULL,
				week INT(11) NOT NULL,
				year INT(11) NOT NULL,
				buy INT(11) NULL,
				monam INT(11) NULL,
				monpm INT(11) NULL,
				tueam INT(11) NULL,
				tuepm INT(11) NULL,
				wedam INT(11) NULL,
				wedpm INT(11) NULL,
				thuam INT(11) NULL,
				thupm INT(11) NULL,
				friam INT(11) NULL,
				fripm INT(11) NULL,
				satam INT(11) NULL,
				satpm INT(11) NULL,
				PRIMARY KEY(userId, week, year)
			)
		`);
	}

	insert(userId, username, week, year, amount, column)
	{
		return new Promise((resolve, reject) => {
			this.db.run(`INSERT INTO turnipRecords (userId, username, week, year, ${column}) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId, week, year) DO UPDATE SET ${column} = ?;`, [
				userId, username, week, year, amount, amount
			], function (err) {
				if (err) {
					reject(err);
					return;
				}

				resolve(this.changes);
			});
		});
	}

	report(year, week, daytime, username)
	{
		let usernameClause = '';
		if (username) {
			usernameClause = 'AND username = ?'
		}

		const sql = `
SELECT
	tr.*,
	um.timezone
	FROM turnipRecords tr
LEFT JOIN userMeta um ON um.userId = tr.userId
WHERE
	year = ?
	AND week = ?
	${usernameClause}
ORDER BY ${daytime} DESC, tr.username ASC`;

		return new Promise((resolve, reject) => {
			this.db.all(sql, [year, week, username], function (err, rows) {
				if (err) {
					reject(err);
				}

				resolve(rows ?? []);
			});
		});
	}
}
