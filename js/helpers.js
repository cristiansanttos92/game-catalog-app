/**
 * Arquivo de funções utilitárias para o Game Catalog App
 * Contém funções para formatação de datas, criação de elementos HTML e outras utilidades
 */

/**
 * Inicializa uma página que requer autenticação
 * Verifica se o usuário está logado e configura elementos comuns
 * @returns {Object|null} O objeto do usuário atual ou null se não estiver autenticado
 */
async function initAuthenticatedPage() {
    // Verifica se o usuário está autenticado
    const user = await checkUser();
    
    if (!user) {
        // Redireciona para a página de login se não estiver autenticado
        window.location.href = 'index.html';
        return null;
    }
    
    // Configura elementos comuns da página
    setupCommonElements(user);
    
    return user;
}

/**
 * Configura elementos comuns em todas as páginas autenticadas
 * @param {Object} user - O objeto do usuário atual
 */
function setupCommonElements(user) {
    // Configura o nome do usuário no menu
    const userNameElement = document.getElementById('navbarUserName');
    if (userNameElement) {
        userNameElement.textContent = user.email;
    }
    
    // Configura o botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logout();
            window.location.href = 'index.html';
        });
    }
}

/**
 * Formata uma data para exibição
 * @param {string|Date} date - A data a ser formatada
 * @param {string} format - O formato desejado ('short', 'long', 'year')
 * @returns {string} A data formatada
 */
function formatDate(date, format = 'short') {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    
    const options = {
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        long: { day: '2-digit', month: 'long', year: 'numeric' },
        year: { year: 'numeric' }
    };
    
    return dateObj.toLocaleDateString('pt-BR', options[format] || options.short);
}

/**
 * Formata um número para exibição
 * @param {number} number - O número a ser formatado
 * @param {string} format - O formato desejado ('decimal', 'percent', 'currency')
 * @returns {string} O número formatado
 */
function formatNumber(number, format = 'decimal') {
    if (number === undefined || number === null) return 'N/A';
    
    const formats = {
        decimal: { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 },
        percent: { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 2 },
        currency: { style: 'currency', currency: 'BRL' }
    };
    
    return number.toLocaleString('pt-BR', formats[format] || formats.decimal);
}

/**
 * Cria um elemento HTML com atributos e filhos
 * @param {string} tag - A tag do elemento
 * @param {Object} attributes - Os atributos do elemento
 * @param {Array|string} children - Os filhos do elemento
 * @returns {HTMLElement} O elemento criado
 */
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Adiciona os atributos
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.entries(value).forEach(([prop, val]) => {
                element.style[prop] = val;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.substring(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Adiciona os filhos
    if (typeof children === 'string') {
        element.innerHTML = children;
    } else if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });
    }
    
    return element;
}

/**
 * Trunca um texto para um tamanho máximo
 * @param {string} text - O texto a ser truncado
 * @param {number} maxLength - O tamanho máximo do texto
 * @returns {string} O texto truncado
 */
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Gera uma cor aleatória em formato hexadecimal
 * @returns {string} A cor gerada
 */
function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Debounce para evitar múltiplas chamadas de uma função
 * @param {Function} func - A função a ser executada
 * @param {number} wait - O tempo de espera em milissegundos
 * @returns {Function} A função com debounce
 */
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Cria um toast de notificação
 * @param {string} message - A mensagem a ser exibida
 * @param {string} type - O tipo de toast ('success', 'error', 'warning', 'info')
 * @param {number} duration - A duração em milissegundos
 */
function showToast(message, type = 'info', duration = 3000) {
    // Verifica se o container de toasts existe
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        // Cria o container se não existir
        toastContainer = createElement('div', {
            className: 'toast-container position-fixed bottom-0 end-0 p-3'
        });
        document.body.appendChild(toastContainer);
    }
    
    // Define as classes de acordo com o tipo
    const typeClasses = {
        success: 'bg-success text-white',
        error: 'bg-danger text-white',
        warning: 'bg-warning text-dark',
        info: 'bg-info text-dark'
    };
    
    // Cria o toast
    const toastId = 'toast-' + Date.now();
    const toast = createElement('div', {
        id: toastId,
        className: `toast ${typeClasses[type] || typeClasses.info}`,
        role: 'alert',
        'aria-live': 'assertive',
        'aria-atomic': 'true'
    }, `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `);
    
    // Adiciona o toast ao container
    toastContainer.appendChild(toast);
    
    // Inicializa e mostra o toast
    const toastInstance = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration
    });
    
    toastInstance.show();
    
    // Remove o toast após ser escondido
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

/**
 * Renderiza os detalhes de um jogo
 * @param {Object} game - O objeto do jogo
 * @returns {string} O HTML com os detalhes do jogo
 */
function renderGameDetails(game) {
    if (!game) return '<div class="alert alert-danger">Jogo não encontrado</div>';
    
    // Formata as plataformas
    const platforms = game.platforms ? game.platforms.join(', ') : 'Não disponível';
    
    // Formata os gêneros
    const genres = game.genres ? game.genres.join(', ') : 'Não disponível';
    
    // Formata a data de lançamento
    const releaseDate = game.release_date ? formatDate(game.release_date, 'long') : 'Não disponível';
    
    // Formata a classificação
    const rating = game.rating ? `${game.rating}/5` : 'Não disponível';
    
    // Cria o HTML
    return `
        <div class="col-md-4">
            <img src="${game.cover_image || 'assets/images/no-image.jpg'}" alt="${game.name}" class="img-fluid rounded mb-3">
            
            <div class="list-group mb-3">
                <div class="list-group-item bg-dark text-light border-secondary">
                    <strong>Plataformas:</strong> ${platforms}
                </div>
                <div class="list-group-item bg-dark text-light border-secondary">
                    <strong>Gêneros:</strong> ${genres}
                </div>
                <div class="list-group-item bg-dark text-light border-secondary">
                    <strong>Lançamento:</strong> ${releaseDate}
                </div>
                <div class="list-group-item bg-dark text-light border-secondary">
                    <strong>Classificação:</strong> ${rating}
                </div>
            </div>
        </div>
        
        <div class="col-md-8">
            <h4>Descrição</h4>
            <div class="mb-4">${game.description || 'Sem descrição disponível.'}</div>
            
            ${game.screenshots && game.screenshots.length > 0 ? `
                <h4>Screenshots</h4>
                <div class="row mb-3">
                    ${game.screenshots.slice(0, 4).map(screenshot => `
                        <div class="col-6 col-md-3 mb-3">
                            <a href="${screenshot}" target="_blank">
                                <img src="${screenshot}" alt="Screenshot" class="img-fluid rounded">
                            </a>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Renderiza um card de jogo para a busca
 * @param {Object} game - O objeto do jogo
 * @returns {HTMLElement} O elemento do card
 */
function renderGameSearchCard(game) {
    return createElement('div', {
        className: 'col-md-6 col-lg-4 mb-3'
    }, createElement('div', {
        className: 'card bg-dark text-light h-100 game-card'
    }, `
        <img src="${game.cover_image || 'assets/images/no-image.jpg'}" class="card-img-top" alt="${game.name}">
        <div class="card-body">
            <h5 class="card-title">${game.name}</h5>
            <p class="card-text small">${game.platforms ? game.platforms.join(', ') : ''}</p>
            <p class="card-text small text-muted">${game.release_date ? formatDate(game.release_date) : 'Data não disponível'}</p>
        </div>
        <div class="card-footer bg-dark border-secondary">
            <button class="btn btn-primary btn-sm view-game-details" data-game-id="${game.id}">Ver Detalhes</button>
            <button class="btn btn-success btn-sm add-to-catalog" data-game-id="${game.id}">Adicionar ao Catálogo</button>
        </div>
    `));
}

/**
 * Renderiza um card de jogo para o catálogo
 * @param {Object} userGame - O objeto do jogo do usuário
 * @returns {HTMLElement} O elemento do card
 */
function renderGameCatalogCard(userGame) {
    const game = userGame.games;
    if (!game) return null;
    
    return createElement('div', {
        className: 'col-md-6 col-lg-4 mb-3'
    }, createElement('div', {
        className: 'card bg-dark text-light h-100 game-card'
    }, `
        <div class="position-relative">
            <img src="${game.cover_image || 'assets/images/no-image.jpg'}" class="card-img-top" alt="${game.name}">
            <span class="badge badge-${userGame.status} position-absolute top-0 end-0 m-2">${getStatusLabel(userGame.status)}</span>
            ${userGame.is_favorite ? '<span class="badge bg-danger position-absolute top-0 start-0 m-2"><i class="fas fa-heart"></i></span>' : ''}
        </div>
        <div class="card-body">
            <h5 class="card-title">${game.name}</h5>
            <div class="mb-2">
                ${renderRatingStars(userGame.rating)}
            </div>
            <p class="card-text small">${game.platforms ? game.platforms.join(', ') : ''}</p>
            ${userGame.comment ? `<p class="card-text small fst-italic">${truncateText(userGame.comment, 100)}</p>` : ''}
        </div>
        <div class="card-footer bg-dark border-secondary">
            <button class="btn btn-primary btn-sm view-game-details" data-game-id="${game.id}">Ver Detalhes</button>
            <button class="btn btn-danger btn-sm remove-from-catalog" data-game-id="${game.id}">Remover</button>
        </div>
    `));
}

/**
 * Retorna o label para cada status
 * @param {string} status - O status do jogo
 * @returns {string} O label do status
 */
function getStatusLabel(status) {
    switch (status) {
        case 'playing': return 'Jogando';
        case 'completed': return 'Zerado';
        case 'abandoned': return 'Flopei';
        case 'wishlist': return 'Wishlist';
        default: return 'Desconhecido';
    }
}

/**
 * Renderiza as estrelas de avaliação
 * @param {number} rating - A avaliação do jogo
 * @returns {string} O HTML com as estrelas
 */
function renderRatingStars(rating) {
    if (!rating) return '';
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else {
            stars += '<i class="far fa-star text-warning"></i>';
        }
    }
    
    return stars;
}

// Exporta as funções para uso global
window.helpers = {
    initAuthenticatedPage,
    setupCommonElements,
    formatDate,
    formatNumber,
    createElement,
    truncateText,
    randomColor,
    debounce,
    showToast,
    renderGameDetails,
    renderGameSearchCard,
    renderGameCatalogCard,
    getStatusLabel,
    renderRatingStars
};