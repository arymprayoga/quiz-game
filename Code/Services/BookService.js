const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const db = require('./DatabaseService');

class BookService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads/books');
        this.ensureUploadsDir();
    }

    ensureUploadsDir() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    async getAllBooks() {
        try {
            const books = await db.all(
                'SELECT id, title, author, subject, category, grade, description, download_url as downloadUrl, file_size as fileSize, uploaded_at as uploadedAt FROM books ORDER BY uploaded_at DESC'
            );
            return books;
        } catch (error) {
            console.error('Error getting all books:', error);
            return [];
        }
    }

    async getBookById(id) {
        try {
            const book = await db.get(
                'SELECT id, title, author, subject, category, grade, description, download_url as downloadUrl, file_size as fileSize, uploaded_at as uploadedAt FROM books WHERE id = ?',
                [id]
            );
            return book;
        } catch (error) {
            console.error('Error getting book by id:', error);
            return null;
        }
    }

    async searchBooks(query) {
        try {
            const searchTerm = `%${query.toLowerCase()}%`;
            const books = await db.all(
                `SELECT id, title, author, subject, category, grade, description, download_url as downloadUrl, file_size as fileSize, uploaded_at as uploadedAt 
                 FROM books 
                 WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?
                 ORDER BY uploaded_at DESC`,
                [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
            );
            return books;
        } catch (error) {
            console.error('Error searching books:', error);
            return [];
        }
    }

    async getBooksBySubject(subject) {
        try {
            const books = await db.all(
                'SELECT id, title, author, subject, category, grade, description, download_url as downloadUrl, file_size as fileSize, uploaded_at as uploadedAt FROM books WHERE LOWER(subject) = LOWER(?) ORDER BY uploaded_at DESC',
                [subject]
            );
            return books;
        } catch (error) {
            console.error('Error getting books by subject:', error);
            return [];
        }
    }

    async getBooksByCategory(category) {
        try {
            const books = await db.all(
                'SELECT id, title, author, subject, category, grade, description, download_url as downloadUrl, file_size as fileSize, uploaded_at as uploadedAt FROM books WHERE LOWER(category) = LOWER(?) ORDER BY uploaded_at DESC',
                [category]
            );
            return books;
        } catch (error) {
            console.error('Error getting books by category:', error);
            return [];
        }
    }

    async getBooksByGrade(grade) {
        try {
            const books = await db.all(
                'SELECT id, title, author, subject, category, grade, description, download_url as downloadUrl, file_size as fileSize, uploaded_at as uploadedAt FROM books WHERE grade = ? ORDER BY uploaded_at DESC',
                [grade]
            );
            return books;
        } catch (error) {
            console.error('Error getting books by grade:', error);
            return [];
        }
    }

    async createBook(bookData, filePath = null) {
        try {
            const result = await db.run(
                `INSERT INTO books (title, author, subject, category, grade, description, download_url, file_size)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    bookData.title,
                    bookData.author,
                    bookData.subject,
                    bookData.category || 'General',
                    bookData.grade,
                    bookData.description || '',
                    filePath ? `/uploads/books/${path.basename(filePath)}` : '',
                    filePath ? this.getFileSize(filePath) : '0 MB'
                ]
            );
            
            return await this.getBookById(result.id);
        } catch (error) {
            console.error('Error creating book:', error);
            throw error;
        }
    }

    async updateBook(id, updateData, newFilePath = null) {
        try {
            const book = await this.getBookById(id);
            if (!book) {
                throw new Error('Book not found');
            }

            const updateFields = [];
            const updateValues = [];

            if (updateData.title) {
                updateFields.push('title = ?');
                updateValues.push(updateData.title);
            }
            if (updateData.author) {
                updateFields.push('author = ?');
                updateValues.push(updateData.author);
            }
            if (updateData.subject) {
                updateFields.push('subject = ?');
                updateValues.push(updateData.subject);
            }
            if (updateData.category) {
                updateFields.push('category = ?');
                updateValues.push(updateData.category);
            }
            if (updateData.grade) {
                updateFields.push('grade = ?');
                updateValues.push(updateData.grade);
            }
            if (updateData.description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(updateData.description);
            }

            // Update file if new one provided
            if (newFilePath) {
                // Delete old file if exists
                if (book.downloadUrl) {
                    const oldFilePath = path.join(this.uploadsDir, path.basename(book.downloadUrl));
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }
                
                updateFields.push('download_url = ?');
                updateValues.push(`/uploads/books/${path.basename(newFilePath)}`);
                updateFields.push('file_size = ?');
                updateValues.push(this.getFileSize(newFilePath));
            }

            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }

            updateValues.push(id);
            
            await db.run(
                `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
            
            return await this.getBookById(id);
        } catch (error) {
            console.error('Error updating book:', error);
            throw error;
        }
    }

    async deleteBook(id) {
        try {
            const book = await this.getBookById(id);
            if (!book) {
                throw new Error('Book not found');
            }

            // Delete file if exists
            if (book.downloadUrl) {
                const filePath = path.join(this.uploadsDir, path.basename(book.downloadUrl));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            const result = await db.run('DELETE FROM books WHERE id = ?', [id]);
            
            if (result.changes === 0) {
                throw new Error('Book not found');
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting book:', error);
            throw error;
        }
    }

    async getDownloadUrl(id) {
        const book = await this.getBookById(id);
        if (!book) {
            throw new Error('Book not found');
        }
        
        return book.downloadUrl;
    }

    getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const bytes = stats.size;
            
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        } catch (error) {
            return '0 MB';
        }
    }

    async getBookStats() {
        try {
            const [books, subjectStats, gradeStats, categoryStats] = await Promise.all([
                db.get('SELECT COUNT(*) as total FROM books'),
                db.all('SELECT subject, COUNT(*) as count FROM books GROUP BY subject'),
                db.all('SELECT grade, COUNT(*) as count FROM books GROUP BY grade'),
                db.all('SELECT category, COUNT(*) as count FROM books GROUP BY category')
            ]);
            
            const subjects = {};
            subjectStats.forEach(stat => {
                subjects[stat.subject] = stat.count;
            });
            
            const grades = {};
            gradeStats.forEach(stat => {
                grades[stat.grade] = stat.count;
            });
            
            const categories = {};
            categoryStats.forEach(stat => {
                categories[stat.category] = stat.count;
            });
            
            return {
                totalBooks: books.total,
                bySubject: subjects,
                byGrade: grades,
                byCategory: categories
            };
        } catch (error) {
            console.error('Error getting book stats:', error);
            return {
                totalBooks: 0,
                bySubject: {},
                byGrade: {},
                byCategory: {}
            };
        }
    }

    async getAllCategories() {
        try {
            const categories = await db.all('SELECT DISTINCT category FROM books ORDER BY category');
            return categories.map(cat => cat.category);
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }
}

module.exports = new BookService();