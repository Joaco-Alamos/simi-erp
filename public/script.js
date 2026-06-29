// --- ELEMENTOS DOM ---
const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const globalError = document.getElementById('globalError');
const loginBtn = document.getElementById('loginBtn');
const resultDiv = document.getElementById('result');
const userInfo = document.getElementById('userInfo');
const tokenDisplay = document.getElementById('tokenDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// --- VALIDACIÓN EN TIEMPO REAL ---
emailInput.addEventListener('input', () => {
    const isValid = emailInput.validity.valid && emailInput.value.trim() !== '';
    emailInput.classList.toggle('error', !isValid);
    emailError.classList.toggle('visible', !isValid);
});

passwordInput.addEventListener('input', () => {
    const isValid = passwordInput.value.length >= 6;
    passwordInput.classList.toggle('error', !isValid);
    passwordError.classList.toggle('visible', !isValid);
});

// --- OCULTAR ERROR GLOBAL AL ESCRIBIR ---
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        globalError.classList.remove('visible');
    });
});

// --- FUNCIÓN DE LOGIN ---
async function handleLogin(e) {
    e.preventDefault();

    // Validar campos antes de enviar
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !emailInput.validity.valid) {
        emailInput.focus();
        emailInput.classList.add('error');
        emailError.classList.add('visible');
        return;
    }

    if (password.length < 6) {
        passwordInput.focus();
        passwordInput.classList.add('error');
        passwordError.classList.add('visible');
        return;
    }

    // Mostrar loading
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    globalError.classList.remove('visible');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // Mostrar error del servidor
            globalError.textContent = '⚠️ ' + (data.error || 'Credenciales inválidas');
            globalError.classList.add('visible');
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            return;
        }

        // --- LOGIN EXITOSO ---
        // Guardar token en localStorage
        localStorage.setItem('token', data.token);

        // Mostrar panel de éxito
        userInfo.textContent = 'Bienvenido ' + data.user.nombre + ' (' + data.user.email + ')';
        tokenDisplay.textContent = data.token;
        resultDiv.style.display = 'block';
        form.style.display = 'none';
        globalError.classList.remove('visible');

    } catch (error) {
        globalError.textContent = '⚠️ Error de conexión con el servidor.';
        globalError.classList.add('visible');
    } finally {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
}

// --- EVENTO ENVÍO DEL FORMULARIO ---
form.addEventListener('submit', handleLogin);

// --- CIERRE DE SESIÓN ---
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    resultDiv.style.display = 'none';
    form.style.display = 'block';
    emailInput.value = 'admin@simi.cl';
    passwordInput.value = 'admin123';
    // Limpiar errores
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    emailError.classList.remove('visible');
    passwordError.classList.remove('visible');
    globalError.classList.remove('visible');
});
