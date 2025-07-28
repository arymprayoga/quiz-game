const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class ExcelExportService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads/exports');
        this.ensureUploadsDir();
    }

    ensureUploadsDir() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    async exportQuizResults(quizzes, answers, _options = {}) {
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Quiz Summary
        const quizSummary = this.createQuizSummarySheet(quizzes, answers);
        XLSX.utils.book_append_sheet(workbook, quizSummary, 'Quiz Summary');

        // Sheet 2: Detailed Results
        const detailedResults = this.createDetailedResultsSheet(quizzes, answers);
        XLSX.utils.book_append_sheet(workbook, detailedResults, 'Detailed Results');

        // Sheet 3: Student Performance
        const studentPerformance = this.createStudentPerformanceSheet(answers);
        XLSX.utils.book_append_sheet(workbook, studentPerformance, 'Student Performance');

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `quiz-results-${timestamp}.xlsx`;
        const filePath = path.join(this.uploadsDir, filename);

        // Write file
        XLSX.writeFile(workbook, filePath);

        return {
            filename,
            path: filePath,
            url: `/uploads/exports/${filename}`
        };
    }

    createQuizSummarySheet(quizzes, answers) {
        const data = quizzes.map(quiz => {
            const quizAnswers = answers.filter(a => a.quizId === quiz.id);
            const avgScore = quizAnswers.length > 0 ?
                Math.round(quizAnswers.reduce((sum, a) => sum + a.score, 0) / quizAnswers.length) : 0;

            return {
                'Quiz ID': quiz.id,
                'Title': quiz.title,
                'Teacher': quiz.teacherName,
                'Lobby ID': quiz.lobbyId,
                'Created Date': new Date(quiz.createdAt).toLocaleDateString(),
                'Total Questions': quiz.questions.length,
                'Total Submissions': quizAnswers.length,
                'Average Score': avgScore,
                'Status': quiz.status
            };
        });

        return XLSX.utils.json_to_sheet(data);
    }

    createDetailedResultsSheet(quizzes, answers) {
        const data = [];

        answers.forEach(answer => {
            const quiz = quizzes.find(q => q.id === answer.quizId);
            if (!quiz) return;

            answer.answers.forEach((userAnswer, questionIndex) => {
                const question = quiz.questions[questionIndex];
                if (!question) return;

                // Get correct answer text
                let correctAnswerText = 'N/A';
                if (question.options && question.correctAnswer >= 1 && question.correctAnswer <= question.options.length) {
                    correctAnswerText = question.options[question.correctAnswer - 1];
                }

                // Get student answer text
                let studentAnswerText = 'No Answer';
                if (userAnswer.selectedAnswer !== undefined && userAnswer.selectedAnswer !== null) {
                    if (question.options && userAnswer.selectedAnswer >= 1 && userAnswer.selectedAnswer <= question.options.length) {
                        studentAnswerText = question.options[userAnswer.selectedAnswer - 1];
                    } else {
                        studentAnswerText = `Option ${userAnswer.selectedAnswer}`;
                    }
                } else if (userAnswer.essayAnswer) {
                    studentAnswerText = userAnswer.essayAnswer;
                }

                data.push({
                    'Answer ID': answer.id,
                    'Quiz ID': answer.quizId,
                    'Quiz Title': quiz.title,
                    'Student Name': answer.studentName,
                    'Lobby ID': answer.lobbyId,
                    'Question #': questionIndex + 1,
                    'Question': question.question,
                    'Correct Answer': correctAnswerText,
                    'Student Answer': studentAnswerText,
                    'Is Correct': userAnswer.isCorrect ? 'Yes' : 'No',
                    'Final Score': answer.score,
                    'Submitted Date': new Date(answer.submittedAt).toLocaleString()
                });
            });
        });

        return XLSX.utils.json_to_sheet(data);
    }

    createStudentPerformanceSheet(answers) {
        const studentStats = {};

        // Calculate stats per student
        answers.forEach(answer => {
            const studentName = answer.studentName;
            if (!studentStats[studentName]) {
                studentStats[studentName] = {
                    name: studentName,
                    totalQuizzes: 0,
                    totalScore: 0,
                    scores: []
                };
            }

            studentStats[studentName].totalQuizzes++;
            studentStats[studentName].totalScore += answer.score;
            studentStats[studentName].scores.push(answer.score);
        });

        // Convert to array with calculated averages
        const data = Object.values(studentStats).map(student => ({
            'Student Name': student.name,
            'Total Quizzes': student.totalQuizzes,
            'Average Score': Math.round(student.totalScore / student.totalQuizzes),
            'Best Score': Math.max(...student.scores),
            'Worst Score': Math.min(...student.scores),
            'Total Points': student.totalScore
        }));

        // Sort by average score descending
        data.sort((a, b) => b['Average Score'] - a['Average Score']);

        return XLSX.utils.json_to_sheet(data);
    }

    async exportQuizByTeacher(teacherId, quizzes, answers) {
        // Convert teacherId to number to handle string parameters from URL
        const numericTeacherId = parseInt(teacherId);
        const teacherQuizzes = quizzes.filter(q => q.teacherId === numericTeacherId);
        const teacherAnswers = answers.filter(a =>
            teacherQuizzes.some(q => q.id === a.quizId)
        );

        return this.exportQuizResults(teacherQuizzes, teacherAnswers);
    }

    async exportQuizByLobby(lobbyId, quizzes, answers) {
        const lobbyQuizzes = quizzes.filter(q => q.lobbyId === lobbyId);
        const lobbyAnswers = answers.filter(a => a.lobbyId === lobbyId);

        return this.exportQuizResults(lobbyQuizzes, lobbyAnswers);
    }

    async exportQuizByDateRange(startDate, endDate, quizzes, answers) {
        const filteredQuizzes = quizzes.filter(q => {
            const quizDate = new Date(q.createdAt);
            return quizDate >= new Date(startDate) && quizDate <= new Date(endDate);
        });

        const filteredAnswers = answers.filter(a =>
            filteredQuizzes.some(q => q.id === a.quizId)
        );

        return this.exportQuizResults(filteredQuizzes, filteredAnswers);
    }

    async getAvailableExports() {
        try {
            const files = fs.readdirSync(this.uploadsDir);
            return files
                .filter(file => file.endsWith('.xlsx'))
                .map(file => {
                    const stats = fs.statSync(path.join(this.uploadsDir, file));
                    return {
                        filename: file,
                        size: stats.size,
                        created: stats.mtime,
                        url: `/uploads/exports/${file}`
                    };
                })
                .sort((a, b) => b.created - a.created);
        } catch (error) {
            console.error('Error getting available exports:', error);
            return [];
        }
    }

    async cleanupOldExports(daysOld = 7) {
        try {
            const files = fs.readdirSync(this.uploadsDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            let deletedCount = 0;
            files.forEach(file => {
                const filePath = path.join(this.uploadsDir, file);
                const stats = fs.statSync(filePath);

                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            });

            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up old exports:', error);
            return 0;
        }
    }
}

module.exports = new ExcelExportService();
