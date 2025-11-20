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
const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    ssl: sslConfig,
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

