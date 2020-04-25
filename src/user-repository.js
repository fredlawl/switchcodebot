export class UserRepository
{
	constructor(db)
	{
		this.db = db;
	}

	async setup()
	{
		const tableName = 'userMeta';
		const createTable = `
CREATE TABLE IF NOT EXISTS ${tableName} (
	userId UNSIGNED BIG INT NOT NULL,
	timezone VARCHAR(128) NULL,
	switchCode VARCHAR(128) NULL,
	PRIMARY KEY(userId)
)`;
		const migration = `
INSERT INTO ${tableName} (userId, timezone, switchCode)
SELECT userId, timezone, switchCode
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
				this.db.run(`ALTER TABLE ${tableName} ADD COLUMN switchCode VARCHAR(128) NULL`, [], (err) => {});
				this.db.run(`ALTER TABLE ${tableName} ADD COLUMN testNewCol VARCHAR(128) NULL`, [], (err) => {});
				this.db.run(`ALTER TABLE ${tableName} RENAME TO ${tableName}_bak`);
				this.db.run(createTable);
				this.db.run(migration);
				this.db.run(`DROP TABLE IF EXISTS ${tableName}_bak`);
			});
		} else {
			this.db.run(createTable);
		}
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
