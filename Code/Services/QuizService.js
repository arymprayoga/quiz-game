const { nanoid } = require('nanoid');
const db = require('./DatabaseService');

class QuizService {
    async submitQuiz(quizData) {
        try {
            const quizId = nanoid(8);
            
            await db.run(
                `INSERT INTO quizzes (id, teacher_id, teacher_name, lobby_id, title, questions, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    quizId,
                    quizData.serverID,
                    quizData.namaGuru,
                    quizData.idLobby,
                    quizData.title || 'Quiz',
                    JSON.stringify(quizData.questions || []),
                    'active'
                ]
            );
            
            return quizId;
        } catch (error) {
            console.error('Error submitting quiz:', error);
            throw error;
        }
    }

    async submitAnswer(answerData) {
        try {
            const answerId = nanoid(8);
            const score = await this.calculateScore(answerData.jawaban, answerData.kodeSoal);
            
            await db.run(
                `INSERT INTO answers (id, quiz_id, student_name, lobby_id, answers, score)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    answerId,
                    answerData.kodeSoal,
                    answerData.namaSiswa,
                    answerData.idLobby || '',
                    JSON.stringify(answerData.jawaban || []),
                    score
                ]
            );
            
            return answerId;
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    }

    async calculateScore(userAnswers, quizId) {
        try {
            const quiz = await db.get('SELECT questions FROM quizzes WHERE id = ?', [quizId]);
            
            if (!quiz || !quiz.questions) {
                return 0;
            }

            const questions = JSON.parse(quiz.questions);
            let correctCount = 0;
            const totalQuestions = questions.length;
            
            userAnswers.forEach((answer, index) => {
                if (questions[index] && questions[index].correctAnswer === answer.selectedAnswer) {
                    correctCount++;
                }
            });

            return Math.round((correctCount / totalQuestions) * 100);
        } catch (error) {
            console.error('Error calculating score:', error);
            return 0;
        }
    }

    async getAllQuizzes() {
        try {
            const quizzes = await db.all(
                'SELECT id, teacher_id as teacherId, teacher_name as teacherName, lobby_id as lobbyId, title, questions, created_at as createdAt, status FROM quizzes ORDER BY created_at DESC'
            );
            
            return quizzes.map(quiz => ({
                ...quiz,
                questions: JSON.parse(quiz.questions)
            }));
        } catch (error) {
            console.error('Error getting all quizzes:', error);
            return [];
        }
    }

    async getQuizById(id) {
        try {
            const quiz = await db.get(
                'SELECT id, teacher_id as teacherId, teacher_name as teacherName, lobby_id as lobbyId, title, questions, created_at as createdAt, status FROM quizzes WHERE id = ?',
                [id]
            );
            
            if (quiz) {
                quiz.questions = JSON.parse(quiz.questions);
            }
            
            return quiz;
        } catch (error) {
            console.error('Error getting quiz by id:', error);
            return null;
        }
    }

    async getQuizzesByTeacher(teacherId) {
        try {
            const quizzes = await db.all(
                'SELECT id, teacher_id as teacherId, teacher_name as teacherName, lobby_id as lobbyId, title, questions, created_at as createdAt, status FROM quizzes WHERE teacher_id = ? ORDER BY created_at DESC',
                [teacherId]
            );
            
            return quizzes.map(quiz => ({
                ...quiz,
                questions: JSON.parse(quiz.questions)
            }));
        } catch (error) {
            console.error('Error getting quizzes by teacher:', error);
            return [];
        }
    }

    async getAllAnswers() {
        try {
            const answers = await db.all(
                'SELECT id, quiz_id as quizId, student_name as studentName, lobby_id as lobbyId, answers, score, submitted_at as submittedAt FROM answers ORDER BY submitted_at DESC'
            );
            
            return answers.map(answer => ({
                ...answer,
                answers: JSON.parse(answer.answers)
            }));
        } catch (error) {
            console.error('Error getting all answers:', error);
            return [];
        }
    }

    async getAnswersByQuiz(quizId) {
        try {
            const answers = await db.all(
                'SELECT id, quiz_id as quizId, student_name as studentName, lobby_id as lobbyId, answers, score, submitted_at as submittedAt FROM answers WHERE quiz_id = ? ORDER BY submitted_at DESC',
                [quizId]
            );
            
            return answers.map(answer => ({
                ...answer,
                answers: JSON.parse(answer.answers)
            }));
        } catch (error) {
            console.error('Error getting answers by quiz:', error);
            return [];
        }
    }

    async getAnswersByLobby(lobbyId) {
        try {
            const answers = await db.all(
                'SELECT id, quiz_id as quizId, student_name as studentName, lobby_id as lobbyId, answers, score, submitted_at as submittedAt FROM answers WHERE lobby_id = ? ORDER BY submitted_at DESC',
                [lobbyId]
            );
            
            return answers.map(answer => ({
                ...answer,
                answers: JSON.parse(answer.answers)
            }));
        } catch (error) {
            console.error('Error getting answers by lobby:', error);
            return [];
        }
    }

    async deleteQuiz(id) {
        try {
            // Start transaction
            await db.beginTransaction();
            
            // Delete related answers first
            await db.run('DELETE FROM answers WHERE quiz_id = ?', [id]);
            
            // Delete quiz
            const result = await db.run('DELETE FROM quizzes WHERE id = ?', [id]);
            
            if (result.changes === 0) {
                await db.rollback();
                throw new Error('Quiz not found');
            }
            
            await db.commit();
            return true;
        } catch (error) {
            await db.rollback();
            console.error('Error deleting quiz:', error);
            throw error;
        }
    }

    async getQuizStats() {
        try {
            const [quizStats, answerStats] = await Promise.all([
                db.get('SELECT COUNT(*) as total, COUNT(CASE WHEN status = "active" THEN 1 END) as active FROM quizzes'),
                db.get('SELECT COUNT(*) as total, AVG(score) as avgScore FROM answers')
            ]);
            
            return {
                totalQuizzes: quizStats.total,
                totalAnswers: answerStats.total,
                averageScore: Math.round(answerStats.avgScore || 0),
                activeQuizzes: quizStats.active
            };
        } catch (error) {
            console.error('Error getting quiz stats:', error);
            return {
                totalQuizzes: 0,
                totalAnswers: 0,
                averageScore: 0,
                activeQuizzes: 0
            };
        }
    }
}

module.exports = new QuizService();