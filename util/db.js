import { DatabaseSync } from "node:sqlite";

export function initDB() {
    const db = new DatabaseSync("test.db");
    db.exec(
        `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            athlete_id INTEGER UNIQUE,
            name TEXT,
            photo TEXT,
            created_on TEXT,
            last_login TEXT,
            access_token TEXT,
            refresh_token TEXT,
            expires_at INTEGER
          );
        `
    );
    console.log("Database initialized");
}

export async function findUser(id) {
    const db = new DatabaseSync("test.db");
    const query = db.prepare("SELECT * FROM users WHERE id = ?");
    const output = query.all(id);
    if (output.length) return output[0];
    return null;
}

export async function setToken(id, time, refresh, access) {
    console.log("setting token", id, time, refresh, access);
    // todo
}

export async function deleteUser(id) {
    console.log("deleting account", id);
    // todo
}

export function deserializeUserQuery(id, done) {
    const db = new DatabaseSync("test.db");
    const output = db
        .prepare("SELECT * FROM users WHERE athlete_id = ?")
        .all(id);
    console.log("deserializing", id, output);
    done(null, output[0]);
}

export function newUserQuery(params, done, accessToken, refreshToken) {
    const db = new DatabaseSync("test.db");
    console.log("new user", params.athlete.id, params.athlete.firstname);
    const query = db.prepare("SELECT * FROM users WHERE athlete_id = ?");
    const output = query.all(params.athlete.id);
    console.log(output);
    if (output) {
        const update = db.prepare(
            `UPDATE users SET last_login = ?, access_token = ?, refresh_token = ?, expires_at = ? WHERE athlete_id = ?`
        );
        update.run(
            new Date().toISOString(),
            accessToken,
            refreshToken,
            params.expires_at,
            params.athlete.id
        );
        const output = db
            .prepare("SELECT * FROM users WHERE athlete_id = ?")
            .all(params.athlete.id);
        console.log(output);
        return done(null, output[0]);
    }

    const insert = db.prepare(
        `INSERT INTO users (athlete_id, name, photo, created_on, last_login, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insert.run(
        params.athlete.id,
        params.athlete.firstname + " " + params.athlete.lastname,
        params.athlete.profile,
        new Date().toISOString(),
        new Date().toISOString(),
        accessToken,
        refreshToken,
        params.expires_at
    );
    const output2 = db
        .prepare("SELECT * FROM users WHERE athlete_id = ?")
        .all(params.athlete.id);

    return done(null, output2[0]);
}
