// test/test-app.js - App Express solo para tests
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

// Mock de la base de datos
const mockUsers = {
    'test@test.com': {
        id: 1,
        email: 'test@test.com',
        name: 'John',
        last_name: 'Doe',
        rol: 'admin',
        password: '$2b$10$hashedpassword' // bcrypt hash de 'correctpass'
    }
};

// Ruta de login simplificada
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
], async (req, res) => {
    // Validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Simular búsqueda en BD
        const user = mockUsers[email];
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Comparar contraseña (en tests mockearemos bcrypt)
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generar token (en tests mockearemos jwt)
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                last_name: user.last_name,
                rol: user.rol,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

export default app;