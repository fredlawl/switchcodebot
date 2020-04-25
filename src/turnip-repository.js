export class TurnipRepository
{
	constructor(db)
	{
		this.db = db;
	}

	async setup()
	{
		const tableName = 'turnipRecords';
		const createTable = `
CREATE TABLE IF NOT EXISTS ${tableName} (
	userId UNSIGNED BIG INT NOT NULL,
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
	numPurchased INT(11) DEFAULT 0 NOT NULL,
	PRIMARY KEY(userId, week, year)
)`;
		const migration = `
INSERT INTO ${tableName} (userId, username, week, year, buy, monam, monpm, tueam, tuepm, wedam, wedpm, thuam, thupm, friam, fripm, satam, satpm, numPurchased)
SELECT userId, username, week, year, buy, monam, monpm, tueam, tuepm, wedam, wedpm, thuam, thupm, friam, fripm, satam, satpm, numPurchased
FROM ${tableName}_bak`;

		const tableExists = await new Promise((resolve, reject) => {
			this.db.get(`SELECT COUNT(1) AS cnt FROM sqlite_master WHERE type='table' AND name=?`, [
				tableName
			], (err, row) => {
				if (err) {
					reject(err);
					return
				}

				resolve(row.cnt);
			});
		});

		if (tableExists === 1) {
			this.db.serialize(() => {
				this.db.run(`DROP TABLE IF EXISTS ${tableName}_bak`);
				this.db.run(`ALTER TABLE ${tableName} ADD COLUMN numPurchased INT(11) DEFAULT 0 NOT NULL`, [], (err) => {});
				this.db.run(`ALTER TABLE ${tableName} RENAME TO ${tableName}_bak`);
				this.db.run(createTable);
				this.db.run(migration);
				this.db.run(`DROP TABLE IF EXISTS ${tableName}_bak`);
			});
		} else {
			this.db.run(createTable);
		}
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

	addBuy(userId, username, year, week, amount)
	{
		return new Promise((resolve, reject) => {
			this.db.run(`INSERT INTO turnipRecords (userId, username, week, year, numPurchased) VALUES (?, ?, ?, ?, ?) ON CONFLICT(userId, week, year) DO UPDATE SET numPurchased = ?;`, [
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

	all(year, week)
	{
		const sql = `
SELECT
	t.*,
	um.timezone
FROM turnipRecords t
LEFT JOIN userMeta um ON um.userId = t.userId
WHERE t.year = ? AND t.week = ?
`;
		return new Promise((resolve, reject) => {
			this.db.all(sql, [year, week], function (err, rows) {
				if (err) {
					reject(err);
				}

				resolve(rows ?? []);
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
