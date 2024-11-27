// server.js
const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MariaDB Pool Configuration
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Student Registration
app.post('/api/students/register', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { studentId, firstName, lastName, email, program } = req.body;
        const result = await conn.query(
            'INSERT INTO students (student_id, first_name, last_name, email, program) VALUES (?, ?, ?, ?, ?)',
            [studentId, firstName, lastName, email, program]
        );
        res.json({ id: result.insertId, message: 'Student registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Course Enrollment
app.post('/api/enrollments', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { studentId, courseId } = req.body;
        await conn.query(
            'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
            [studentId, courseId]
        );
        res.json({ message: 'Enrollment successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Course De-enrollment
app.delete('/api/enrollments/:studentId/:courseId', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { studentId, courseId } = req.params;
        await conn.query(
            'DELETE FROM enrollments WHERE student_id = ? AND course_id = ?',
            [studentId, courseId]
        );
        res.json({ message: 'De-enrollment successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Get Students with Enrolled Courses
app.get('/api/students', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const students = await conn.query(`
            SELECT 
                s.*,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', c.id,
                        'name', c.name,
                        'code', c.code
                    )
                ) as enrolled_courses
            FROM students s
            LEFT JOIN enrollments e ON s.id = e.student_id
            LEFT JOIN courses c ON e.course_id = c.id
            GROUP BY s.id
        `);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// Get Available Courses
app.get('/api/courses', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const courses = await conn.query('SELECT * FROM courses');
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});