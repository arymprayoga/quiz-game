const express = require('express');
const router = express.Router();
const AuthService = require('../../Services/AuthService');
const QuizService = require('../../Services/QuizService');
const BookService = require('../../Services/BookService');
const ExcelExportService = require('../../Services/ExcelExportService');

// Authentication endpoints (replaces external API)
router.post('/login-game', async (req, res) => {
    try {
        const { username, password } = req.body;
        const teacher = await AuthService.authenticateTeacher(username, password);

        if (teacher) {
            res.json({
                id: teacher.id,
                username: teacher.username,
                name: teacher.name
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Quiz endpoints (replaces external API)
router.post('/submit-soal', async (req, res) => {
    try {
        const quizData = req.body.data;
        const quizId = await QuizService.submitQuiz(quizData);
        res.json(quizId);
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/submit-jawaban', async (req, res) => {
    try {
        const answerData = req.body.data;
        const answerId = await QuizService.submitAnswer(answerData);
        res.json({ success: true, id: answerId });
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Book endpoints (replaces external API)
router.get('/download-buku/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const downloadUrl = await BookService.getDownloadUrl(id);

        // Return full download URL using public host
        const publicHost = process.env.PUBLIC_HOST || req.get('host');
        const fullUrl = downloadUrl ? `${req.protocol}://${publicHost}${downloadUrl}` : '';
        res.json(fullUrl);
    } catch (error) {
        console.error('Download book error:', error);
        res.status(404).json({ error: 'Book not found' });
    }
});

router.get('/list-buku/:data', async (req, res) => {
    try {
        const { data } = req.params;
        let books;

        if (data === 'all') {
            books = await BookService.getAllBooks();
        } else {
            books = await BookService.getBooksByCategory(data);
        }

        // Transform the response to match Unity game expectations
        const daftarBuku = books.map(book => ({
            id: book.id, // Already an integer from auto-increment
            name: book.title || '', // Use title as name
            path: book.downloadUrl ? `${req.protocol}://${process.env.PUBLIC_HOST || req.get('host')}${book.downloadUrl}` : '' // Full download URL
        }));

        // Return in the format expected by Unity game
        const jawaban = {
            daftarBuku: daftarBuku
        };

        res.json(jawaban);
    } catch (error) {
        console.error('List books error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/search-buku/:data', async (req, res) => {
    try {
        const { data } = req.params;
        const books = await BookService.searchBooks(data);

        // Transform the response to match Unity game expectations
        const daftarBuku = books.map(book => ({
            id: book.id, // Already an integer from auto-increment
            name: book.title || '', // Use title as name
            path: book.downloadUrl ? `${req.protocol}://${process.env.PUBLIC_HOST || req.get('host')}${book.downloadUrl}` : '' // Full download URL
        }));

        // Return in the format expected by Unity game
        const jawaban = {
            daftarBuku: daftarBuku
        };

        res.json(jawaban);
    } catch (error) {
        console.error('Search books error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin API endpoints
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await AuthService.getAllTeachers();
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/teachers', async (req, res) => {
    try {
        const teacher = await AuthService.createTeacher(req.body);
        res.json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/teachers/:id', async (req, res) => {
    try {
        const teacher = await AuthService.updateTeacher(req.params.id, req.body);
        res.json(teacher);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/teachers/:id', async (req, res) => {
    try {
        await AuthService.deleteTeacher(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/quizzes', async (req, res) => {
    try {
        const quizzes = await QuizService.getAllQuizzes();
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/quizzes/:id/answers', async (req, res) => {
    try {
        const answers = await QuizService.getAnswersByQuiz(req.params.id);
        res.json(answers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/quizzes/:id', async (req, res) => {
    try {
        await QuizService.deleteQuiz(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/books', async (req, res) => {
    try {
        const books = await BookService.getAllBooks();
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/books/:id', async (req, res) => {
    try {
        await BookService.deleteBook(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/books/categories', async (req, res) => {
    try {
        const categories = await BookService.getAllCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export endpoints
router.post('/export/all', async (req, res) => {
    try {
        const quizzes = await QuizService.getAllQuizzes();
        const answers = await QuizService.getAllAnswers();
        const result = await ExcelExportService.exportQuizResults(quizzes, answers);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/export/teacher/:teacherId', async (req, res) => {
    try {
        const quizzes = await QuizService.getAllQuizzes();
        const answers = await QuizService.getAllAnswers();
        const result = await ExcelExportService.exportQuizByTeacher(req.params.teacherId, quizzes, answers);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/export/lobby/:lobbyId', async (req, res) => {
    try {
        const quizzes = await QuizService.getAllQuizzes();
        const answers = await QuizService.getAllAnswers();
        const result = await ExcelExportService.exportQuizByLobby(req.params.lobbyId, quizzes, answers);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const [quizStats, bookStats] = await Promise.all([
            QuizService.getQuizStats(),
            BookService.getBookStats()
        ]);

        const teachers = await AuthService.getAllTeachers();

        res.json({
            quiz: quizStats,
            books: bookStats,
            teachers: {
                total: teachers.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
