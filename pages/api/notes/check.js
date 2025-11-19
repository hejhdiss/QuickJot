// Copyright (c) 2025 Jernialo, Hejhdiss
// Licensed under the GNU GPLv3: https://www.gnu.org/licenses/gpl-3.0.html

import mysql from 'mysql2/promise';
import fs from "fs";
import path from "path";

export async function connectDB() {
  let sslConfig = false;

  if (process.env.DB_USE_SSL === "true") {

    // IF USING CA CERTIFICATE
    if (process.env.DB_SSL_CA) {
      let caPath = process.env.DB_SSL_CA;

      // Vercel: write cert to /tmp if content is stored in env
      if (process.env.DB_SSL_CA.startsWith("-----BEGIN CERTIFICATE-----")) {
        caPath = path.join("/tmp", "ca.pem");

        if (!fs.existsSync(caPath)) {
          fs.writeFileSync(caPath, process.env.DB_SSL_CA);
        }
      }

      sslConfig = {
        ca: fs.readFileSync(caPath),
      };

    } else {
      // SSL without certificate (Aiven supports this)
      sslConfig = {
        rejectUnauthorized: false,
      };
    }
  }
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

