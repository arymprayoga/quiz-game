const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const BookService = require('../../Services/BookService');
const AuthService = require('../../Services/AuthService');

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../../../uploads/books');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};

// Admin login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const teacher = await AuthService.authenticateTeacher(username, password);
        
        if (teacher) {
            req.session.authenticated = true;
            req.session.user = { 
                username: teacher.username, 
                name: teacher.name,
                id: teacher.id 
            };
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Admin dashboard
router.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

router.get('/teachers', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/teachers.html'));
});

router.get('/quizzes', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/quizzes.html'));
});

router.get('/books', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/books.html'));
});

router.get('/exports', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/exports.html'));
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 50MB' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// Book upload endpoint
router.post('/books/upload', requireAuth, upload.single('bookFile'), handleMulterError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const bookData = {
            title: req.body.title,
            author: req.body.author,
            subject: req.body.subject,
            category: req.body.category,
            grade: req.body.grade,
            description: req.body.description
        };
        
        const book = await BookService.createBook(bookData, req.file.path);
        res.json(book);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Book update endpoint
router.put('/books/:id', requireAuth, upload.single('bookFile'), handleMulterError, async (req, res) => {
    try {
        const updateData = {
            title: req.body.title,
            author: req.body.author,
            subject: req.body.subject,
            category: req.body.category,
            grade: req.body.grade,
            description: req.body.description
        };
        
        const book = await BookService.updateBook(req.params.id, updateData, req.file ? req.file.path : null);
        res.json(book);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Files are served via static middleware in index.js (/uploads route)
// No need for separate download routes to avoid conflicts

module.exports = router;