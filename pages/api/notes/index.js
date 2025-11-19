// Copyright (c) 2025 Jernialo, Hejhdiss
// Licensed under the GNU GPLv3: https://www.gnu.org/licenses/gpl-3.0.html

import mysql from 'mysql2/promise';

// NOTE: You MUST set these as environment variables (e.g., in a .env.local file or Vercel settings)
const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
};

export default async function handler(req, res) {
    // Only handle POST requests for creating new notes
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { id, content } = req.body;

    if (!id || !content) {
        return res.status(400).json({ message: 'Missing ID or content in request body.' });
    }

    let connection;
    try {
        // 1. Establish MySQL Connection
        connection = await mysql.createConnection(DB_CONFIG);

        // 2. Initialize the table if it doesn't exist (Idempotent check)
        // Note: The DATETIME type is used for created_at and last_edited_at
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notes (
                id VARCHAR(6) PRIMARY KEY,
                content VARCHAR(400) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_edited_at DATETIME NULL
            );
        `);

        // 3. Insert the new note
        await connection.execute(
            'INSERT INTO notes (id, content) VALUES (?, ?)',
            [id, content]
        );

        return res.status(201).json({ id, message: 'Note created successfully.' });

    } catch (error) {
        console.error('Database Operation Error (POST):', error);
        return res.status(500).json({ message: 'Internal Server Error during note creation.', error: error.message });
    } finally {
        if (connection) {
            await connection.end(); // Close the connection
        }
    }
}
