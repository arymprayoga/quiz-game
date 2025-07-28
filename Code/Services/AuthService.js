const bcrypt = require('bcrypt');
const db = require('./DatabaseService');

class AuthService {
    async authenticateTeacher(username, password) {
        try {
            const teacher = await db.get(
                'SELECT * FROM teachers WHERE username = ?',
                [username]
            );
            
            if (!teacher) {
                return null;
            }

            const isValid = await bcrypt.compare(password, teacher.password);
            if (isValid) {
                return {
                    id: teacher.id,
                    username: teacher.username,
                    name: teacher.name,
                    email: teacher.email
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error authenticating teacher:', error);
            return null;
        }
    }

    async createTeacher(teacherData) {
        try {
            // Check if username already exists
            const existingTeacher = await db.get(
                'SELECT id FROM teachers WHERE username = ? OR email = ?',
                [teacherData.username, teacherData.email]
            );
            
            if (existingTeacher) {
                throw new Error('Username or email already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(teacherData.password, 10);
            
            const result = await db.run(
                `INSERT INTO teachers (username, name, password, email) 
                 VALUES (?, ?, ?, ?)`,
                [teacherData.username, teacherData.name, hashedPassword, teacherData.email]
            );
            
            return {
                id: result.id,
                username: teacherData.username,
                name: teacherData.name,
                email: teacherData.email
            };
        } catch (error) {
            console.error('Error creating teacher:', error);
            throw error;
        }
    }

    async updateTeacher(id, updateData) {
        try {
            // Check if teacher exists
            const teacher = await db.get('SELECT * FROM teachers WHERE id = ?', [id]);
            if (!teacher) {
                throw new Error('Teacher not found');
            }

            const updateFields = [];
            const updateValues = [];

            if (updateData.name) {
                updateFields.push('name = ?');
                updateValues.push(updateData.name);
            }
            if (updateData.email) {
                updateFields.push('email = ?');
                updateValues.push(updateData.email);
            }
            if (updateData.password) {
                const hashedPassword = await bcrypt.hash(updateData.password, 10);
                updateFields.push('password = ?');
                updateValues.push(hashedPassword);
            }

            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }

            updateValues.push(id);
            
            await db.run(
                `UPDATE teachers SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
            
            return {
                id: teacher.id,
                username: teacher.username,
                name: updateData.name || teacher.name,
                email: updateData.email || teacher.email
            };
        } catch (error) {
            console.error('Error updating teacher:', error);
            throw error;
        }
    }

    async deleteTeacher(id) {
        try {
            const result = await db.run('DELETE FROM teachers WHERE id = ?', [id]);
            
            if (result.changes === 0) {
                throw new Error('Teacher not found');
            }

            return true;
        } catch (error) {
            console.error('Error deleting teacher:', error);
            throw error;
        }
    }

    async getAllTeachers() {
        try {
            const teachers = await db.all(
                'SELECT id, username, name, email, created_at as createdAt FROM teachers ORDER BY created_at DESC'
            );
            return teachers;
        } catch (error) {
            console.error('Error getting all teachers:', error);
            return [];
        }
    }

    async getTeacherById(id) {
        try {
            const teacher = await db.get(
                'SELECT id, username, name, email, created_at as createdAt FROM teachers WHERE id = ?',
                [id]
            );
            return teacher;
        } catch (error) {
            console.error('Error getting teacher by id:', error);
            return null;
        }
    }
}

module.exports = new AuthService();