// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

// Verifica se o usuário já está logado
async function checkLoggedIn() {
    const user = await checkUser();
    if (user) {
        window.location.href = 'catalog.html';
    }
}

// Função para mostrar mensagem de erro ou sucesso
function showMessage(message, isError = true) {
    authMessage.textContent = message;
    authMessage.classList.remove('d-none', 'alert-success', 'alert-danger');
    authMessage.classList.add(isError ? 'alert-danger' : 'alert-success');
    
    // Esconde a mensagem após 5 segundos
    setTimeout(() => {
        authMessage.classList.add('d-none');
    }, 5000);
}

// Função para validar o formulário de cadastro
function validateRegisterForm() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showMessage('As senhas não coincidem.');
        return false;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres.');
        return false;
    }
    
    return true;
}

// Inicializa a página
function initLoginPage() {
    // Verifica se o usuário já está logado
    checkLoggedIn();
    
    // Configura o formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Desabilita o botão durante o login
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
            
            const result = await loginUser(email, password);
            
            if (result.success) {
                showMessage('Login realizado com sucesso! Redirecionando...', false);
                setTimeout(() => {
                    window.location.href = 'catalog.html';
                }, 1000);
            } else {
                showMessage(result.error || 'Erro ao fazer login. Verifique suas credenciais.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
            }
        });
    }
    
    // Configura o formulário de cadastro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateRegisterForm()) {
                return;
            }
            
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            // Desabilita o botão durante o cadastro
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cadastrando...';
            
            const result = await registerUser(email, password);
            
            if (result.success) {
                showMessage('Cadastro realizado com sucesso! Você já pode fazer login.', false);
                
                // Limpa o formulário
                registerForm.reset();
                
                // Volta para a aba de login
                document.getElementById('login-tab').click();
            } else {
                showMessage(result.error || 'Erro ao fazer cadastro. Tente novamente.');
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cadastrar';
        });
    }
}

// Inicializa a página quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initLoginPage);