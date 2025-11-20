// Copyright (c) 2025 Jernialo, Hejhdiss
// Licensed under the GNU GPLv3: https://www.gnu.org/licenses/gpl-3.0.html

import mysql from 'mysql2/promise';
import fs from "fs";
import path from "path";
let sslConfig = false;

function loadSSL() {
    if (process.env.DB_USE_SSL !== "true") return false;

    // Normalize certificate (fixes Vercel escaping)
    const rawCA = process.env.DB_SSL_CA;
    const cert = rawCA?.replace(/\\n/g, '\n').trim();

    // CASE 1: CA cert is inside ENV variable
    if (cert && cert.includes("BEGIN CERTIFICATE")) {
        return { ca: cert };
    }

    // CASE 2: CA path provided (local or /tmp)
    if (process.env.DB_SSL_CA && fs.existsSync(process.env.DB_SSL_CA)) {
        const caContent = fs.readFileSync(process.env.DB_SSL_CA, "utf8");
        return { ca: caContent };
    }

    // CASE 3: no CA (Aiven)
    return { rejectUnauthorized: false };
}

sslConfig = loadSSL();
// NOTE: Uses the same DB_CONFIG setup
const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    ssl: sslConfig,
    
};

export default async function handler(req, res) {
    const { id } = req.query; // This captures the [id] from the URL path
    const { method } = req;
    
    if (!id || id.length !== 6) {
        return res.status(400).json({ message: 'Invalid or missing 6-character note ID.' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);

        switch (method) {
            case 'GET': // Retrieve a note
                const [rows] = await connection.execute(
                    'SELECT id, content, created_at, last_edited_at FROM notes WHERE id = ?',
                    [id]
                );
                
                if (rows.length === 0) {
                    return res.status(404).json({ message: 'Note not found.' });
                }

                // Return data with fields matching the client expectations (e.g., camelCase)
                const note = rows[0];
                return res.status(200).json({ 
                    id: note.id,
                    content: note.content,
                    createdAt: note.created_at,
                    lastEditedAt: note.last_edited_at,
                });

            case 'PUT': // Update a note
                const { content } = req.body;
                if (!content) {
                    return res.status(400).json({ message: 'Missing content for update.' });
                }

                const [result] = await connection.execute(
                    'UPDATE notes SET content = ?, last_edited_at = NOW() WHERE id = ?',
                    [content, id]
                );

                if (result.affectedRows === 0) {
                    // This could mean the ID wasn't found, or the content was the same
                    return res.status(404).json({ message: 'Note not found or no changes were required.' });
                }
                return res.status(200).json({ id, message: 'Note updated successfully.' });

            default:
                res.setHeader('Allow', ['GET', 'PUT']);
                return res.status(405).json({ message: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error(`Database Operation Error (${method}):`, error);
        return res.status(500).json({ message: `Internal Server Error during ${method} operation.`, error: error.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
