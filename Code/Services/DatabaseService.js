const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../Data/quiz_game.db');
        this.db = null;
        this.initializeDatabase();
    }

    initializeDatabase() {
        // Ensure Data directory exists
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        const tables = [
            // Teachers table
            `CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Quizzes table
            `CREATE TABLE IF NOT EXISTS quizzes (
                id TEXT PRIMARY KEY,
                teacher_id INTEGER NOT NULL,
                teacher_name TEXT NOT NULL,
                lobby_id TEXT NOT NULL,
                title TEXT NOT NULL,
                questions TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                FOREIGN KEY (teacher_id) REFERENCES teachers (id)
            )`,
            
            // Answers table
            `CREATE TABLE IF NOT EXISTS answers (
                id TEXT PRIMARY KEY,
                quiz_id TEXT NOT NULL,
                student_name TEXT NOT NULL,
                lobby_id TEXT,
                answers TEXT NOT NULL,
                score INTEGER DEFAULT 0,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
            )`,
            
            // Books table with category - using INTEGER id for Unity compatibility
            `CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                subject TEXT NOT NULL,
                category TEXT NOT NULL,
                grade TEXT NOT NULL,
                description TEXT,
                download_url TEXT,
                file_size TEXT DEFAULT '0 MB',
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        // Execute table creation serially to avoid timing issues
        this.executeTablesSerially(tables, 0);
    }

    executeTablesSerially(tables, index) {
        if (index >= tables.length) {
            // All tables created, now insert default data
            console.log('All tables created successfully');
            setTimeout(() => this.insertDefaultData(), 100); // Small delay to ensure tables are ready
            return;
        }

        this.db.run(tables[index], (err) => {
            if (err) {
                console.error(`Error creating table ${index + 1}:`, err);
            } else {
                console.log(`Table ${index + 1} created successfully`);
            }
            
            // Continue with next table
            this.executeTablesSerially(tables, index + 1);
        });
    }

    insertDefaultData() {
        // Check if admin user exists
        this.db.get("SELECT id FROM teachers WHERE username = 'admin'", (err, row) => {
            if (err) {
                console.error('Error checking admin user:', err);
                return;
            }

            if (!row) {
                // Insert default admin user
                const bcrypt = require('bcrypt');
                bcrypt.hash('admin123', 10, (err, hash) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        return;
                    }

                    this.db.run(
                        `INSERT INTO teachers (username, name, password, email) 
                         VALUES (?, ?, ?, ?)`,
                        ['admin', 'Administrator', hash, 'admin@school.com'],
                        (err) => {
                            if (err) {
                                console.error('Error inserting admin user:', err);
                            } else {
                                console.log('Default admin user created');
                            }
                        }
                    );
                });

                // Insert sample teacher
                bcrypt.hash('teacher123', 10, (err, hash) => {
                    if (err) return;

                    this.db.run(
                        `INSERT INTO teachers (username, name, password, email) 
                         VALUES (?, ?, ?, ?)`,
                        ['teacher1', 'John Doe', hash, 'john@school.com'],
                        (err) => {
                            if (err) {
                                console.error('Error inserting sample teacher:', err);
                            } else {
                                console.log('Sample teacher created');
                            }
                        }
                    );
                });
            }
        });

        // Sample books insertion disabled - use admin panel to add books
        // Uncomment the section below if you want sample books on first startup
        /*
        this.db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
            if (err) {
                console.error('Error checking books count:', err);
                return;
            }
            
            if (row && row.count > 0) {
                console.log(`Books table already has ${row.count} books, skipping sample data insertion`);
                return;
            }

            console.log('No books found, inserting sample books...');
            // Sample books code here...
        });
        */
    }

    // Generic query methods
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    // Prepared statement for better performance
    prepare(sql) {
        return this.db.prepare(sql);
    }

    // Close database connection
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Transaction support
    beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    commit() {
        return this.run('COMMIT');
    }

    rollback() {
        return this.run('ROLLBACK');
    }
}

module.exports = new DatabaseService();