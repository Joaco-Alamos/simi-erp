const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'simi_user',
    host: process.env.DB_HOST || '172.31.30.143',
    database: process.env.DB_NAME || 'simi_erp',
    password: process.env.DB_PASSWORD || 'simi_erp',
    port: 5432,
    ssl: false
});

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    jwt.verify(token, process.env.JWT_SECRET || 'simi-secret-key-2025', (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
        req.user = user;
        next();
    });
};

// Ruta de login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
        const user = result.rows[0];
        if (password !== 'admin123') return res.status(401).json({ error: 'Credenciales inválidas' });
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            process.env.JWT_SECRET || 'simi-secret-key-2025',
            { expiresIn: '1h' }
        );
        res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Ruta protegida - lista de usuarios
app.get('/api/usuarios', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, nombre, rol FROM usuarios');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Health check para el ALB
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta raíz - sirve el index.html desde la carpeta public
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor SIMI ERP corriendo en puerto ' + PORT);
});
