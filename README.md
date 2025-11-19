# QuickJot: A Micro-Note Network

QuickJot is a simple, full-stack application designed for quickly saving and retrieving short, temporary notes. It uses a clean, modern UI inspired by Apple and Notion design language. Notes are stored in a MySQL database and accessed via a unique, 6-character ID.

## ✨ Features

* **Quick Save**: Easily publish a new note (up to 400 characters).
* **Unique IDs**: Every note is assigned a unique, 6-character alphanumeric ID, automatically copied to the clipboard upon creation.
* **Search & Retrieval**: Instantly retrieve any note using its 6-character ID.
* **Editing**: Update existing notes via the same ID.
* **Responsive UI**: A clean, mobile-friendly interface built with modern React patterns and custom CSS.

## 🛠️ Technology Stack

**Frontend (Client):**
* React (with Next.js for routing)
* JavaScript
* Custom CSS (for an Apple/Notion aesthetic)

**Backend (API Routes):**
* Next.js API Routes (`/api/notes`)
* Node.js

**Database:**
* MySQL (Requires a connection via the `mysql2/promise` library)

## 🚀 Getting Started

Follow these instructions to set up and run the QuickJot application locally.

### 1. Prerequisites

You will need the following installed:
* Node.js and npm
* A running MySQL database instance

### 2. Project Setup

**Install Dependencies:**

Use npm to install all necessary packages, including `next`, `react`, and `mysql2`.

```bash
npm install
```

### 3. Environment Variables

QuickJot connects to your MySQL database using environment variables. Create a file named `.env.local` in the project root directory and populate it with your database connection details:

**.env.local**
```
MYSQL_HOST=localhost
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_db_name
MYSQL_PORT=your_port
DB_USE_SSL=true/false
DB_SSL_CA=-----BEGIN CERTIFICATE-----
...........................................
...........................................
...........................................
-----END CERTIFICATE-----

```

### 4. Database Schema

The API routes are configured to automatically create the `notes` table if it doesn't exist upon the first successful POST request to create a new note.

The table structure is:

| Column Name      | Data Type     | Description                                    |
|------------------|---------------|------------------------------------------------|
| `id`             | VARCHAR(6)    | Primary Key. The unique 6-character ID for the note. |
| `content`        | VARCHAR(400)  | The content of the note.                       |
| `created_at`     | DATETIME      | Timestamp of note creation.                    |
| `last_edited_at` | DATETIME      | Timestamp of the last edit.                    |

### 5. Running the Application

Start the Next.js development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000` (or the port specified by Next.js).

## 📂 Project Structure Overview

The key functional files are:

| Filepath                      | Description                                                                                                                                      |
|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `pages/index.jsx`             | Frontend. The main React component (`QuickJotApp`) handling all UI, state management, and client-side logic for saving, searching, and editing notes. |
| `pages/api/notes/index.js`    | Backend (POST). Handles creating a new note and inserting it into the MySQL database. It also handles the initial table creation.               |
| `pages/api/notes/[id].js`     | Backend (GET/PUT). Handles retrieving a specific note (GET) and updating a note's content (PUT) based on the ID provided in the URL path.       |
| `pages/api/notes/check.js`    | Backend (GET). Utility endpoint to check for ID collision during new note creation.                                                              |
| `package.json`                | Defines project dependencies, notably `next`, `react`, and `mysql2`.                                                                             |
| `.env.local`                  | Configuration file for database connection credentials.                                                                                          |

## ✍️ Author & Concept

* **Developer**: Muhammed Shafin P ([@hejhdiss](https://github.com/hejhdiss))
* **Concept/Idea Creator**: Vazeerudheen (Instagram: [@vazeerudheen_](https://instagram.com/vazeerudheen_))

## ⚖️ License

This project is licensed under the GNU General Public License v3.0 (GPLv3).
