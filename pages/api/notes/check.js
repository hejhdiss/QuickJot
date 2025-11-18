import mysql from 'mysql2/promise';

const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
};

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id)
        return res.status(400).json({ message: "Missing ID" });

    try {
        const conn = await mysql.createConnection(DB_CONFIG);

        const [rows] = await conn.execute(
            "SELECT id FROM notes WHERE id = ?", [id]
        );

        await conn.end();

        if (rows.length > 0) {
            return res.status(200).json({ exists: true });
        } else {
            return res.status(200).json({ exists: false });
        }

    } catch (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
    }
}

