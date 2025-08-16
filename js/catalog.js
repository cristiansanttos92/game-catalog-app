// Variáveis globais
let currentUser = null;
let currentGameDetails = null;
let userGames = [];

// Elementos do DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResults = document.getElementById('searchResults');
const searchResultsList = document.getElementById('searchResultsList');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const userGamesList = document.getElementById('userGamesList');
const gameModal = document.getElementById('gameModal');
const gameModalTitle = document.getElementById('gameModalTitle');
const gameModalBody = document.getElementById('gameModalBody');
const saveGameBtn = document.getElementById('saveGameBtn');

// Inicializa a página
async function initCatalogPage() {
    // Verifica autenticação e inicializa elementos comuns
    currentUser = await initAuthenticatedPage();
    if (!currentUser) return;
    
    // Carrega os jogos do usuário
    await loadUserGames();
    
    // Configura os eventos
    setupEventListeners();
}

// Carrega os jogos do usuário
async function loadUserGames(filter = 'all') {
    // Mostra indicador de carregamento
    userGamesList.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Carregando seu catálogo...</p></div>';
    
    // Busca os jogos do usuário
    const status = filter !== 'all' ? filter : null;
    userGames = await getUserGames(currentUser.id, status);
    
    // Renderiza os jogos
    renderUserGames(userGames);
}

// Renderiza os jogos do usuário
function renderUserGames(games) {
    if (games.length === 0) {
        userGamesList.innerHTML = '<div class="col-12 text-center py-4"><p>Nenhum jogo encontrado. Use a busca acima para adicionar jogos ao seu catálogo.</p></div>';
        return;
    }
    
    userGamesList.innerHTML = '';
    
    games.forEach(userGame => {
        const game = userGame.games;
        if (!game) return;
        
        const card = document.createElement('div');
        card.className = 'col';
        card.innerHTML = `
            <div class="card game-card bg-dark border-secondary h-100">
                <div class="position-relative">
                    <img src="${game.cover_image || 'assets/images/no-image.jpg'}" class="card-img-top" alt="${game.name}">
                    <span class="position-absolute top-0 end-0 m-2 badge badge-${userGame.status}">${getStatusLabel(userGame.status)}</span>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${game.name}</h5>
                    <div class="mb-2">
                        ${renderRatingStars(userGame.rating)}
                    </div>
                    <p class="card-text small mb-3">
                        ${userGame.is_favorite ? '<i class="fas fa-heart text-danger me-1"></i>' : ''}
                        ${game.platforms ? game.platforms.join(', ') : ''}
                    </p>
                    <div class="mt-auto d-flex justify-content-between">
                        <button class="btn btn-outline-primary btn-sm edit-game" data-game-id="${game.id}">Editar</button>
                        <button class="btn btn-outline-danger btn-sm remove-game" data-game-id="${game.id}">Remover</button>
                    </div>
                </div>
            </div>
        `;
        
        userGamesList.appendChild(card);
    });
    
    // Adiciona eventos aos botões
    addUserGameButtonEvents();
}

// Adiciona eventos aos botões dos cards de jogos do usuário
function addUserGameButtonEvents() {
    // Botões de edição
    document.querySelectorAll('.edit-game').forEach(button => {
        button.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId;
            await openGameDetailsModal(gameId);
        });
    });
    
    // Botões de remoção
    document.querySelectorAll('.remove-game').forEach(button => {
        button.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId;
            if (confirm('Tem certeza que deseja remover este jogo do seu catálogo?')) {
                await removeUserGame(currentUser.id, gameId);
                await loadUserGames();
            }
        });
    });
}

// Busca jogos na API RAWG
async function searchGamesFromAPI() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Mostra a seção de resultados
    searchResults.classList.remove('d-none');
    
    // Mostra indicador de carregamento
    searchResultsList.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Buscando jogos...</p></div>';
    
    // Busca os jogos
    const results = await searchGames(query);
    
    // Renderiza os resultados
    renderSearchResults(results);
}

// Renderiza os resultados da busca
function renderSearchResults(results) {
    if (!results.results || results.results.length === 0) {
        searchResultsList.innerHTML = '<div class="col-12 text-center py-4"><p>Nenhum jogo encontrado. Tente outra busca.</p></div>';
        return;
    }
    
    searchResultsList.innerHTML = '';
    
    results.results.forEach(async (game) => {
        // Verifica se o jogo já está no catálogo do usuário
        const isInUserLibrary = userGames.some(userGame => userGame.game_id === game.id);
        
        // Cria o card do jogo
        const card = renderGameSearchCard(game, isInUserLibrary);
        searchResultsList.appendChild(card);
    });
    
    // Adiciona eventos aos botões
    addSearchResultButtonEvents();
}

// Adiciona eventos aos botões dos resultados da busca
function addSearchResultButtonEvents() {
    // Botões de adicionar jogo
    document.querySelectorAll('.add-game').forEach(button => {
        button.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId;
            await openGameDetailsModal(gameId, true);
        });
    });
    
    // Botões de ver detalhes
    document.querySelectorAll('.view-game').forEach(button => {
        button.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId;
            await openGameDetailsModal(gameId);
        });
    });
}

// Abre o modal com detalhes do jogo
async function openGameDetailsModal(gameId, isNewGame = false) {
    // Mostra indicador de carregamento
    gameModalBody.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Carregando detalhes do jogo...</p></div>';
    
    // Abre o modal
    const modalInstance = new bootstrap.Modal(gameModal);
    modalInstance.show();
    
    // Busca detalhes do jogo
    currentGameDetails = await getGameDetails(gameId);
    
    if (!currentGameDetails) {
        gameModalBody.innerHTML = '<div class="alert alert-danger">Erro ao carregar detalhes do jogo. Tente novamente.</div>';
        return;
    }
    
    // Atualiza o título do modal
    gameModalTitle.textContent = currentGameDetails.name;
    
    // Busca informações do jogo no catálogo do usuário
    const userGame = await getUserGame(currentUser.id, gameId);
    
    // Renderiza os detalhes do jogo
    renderGameDetailsModal(currentGameDetails, userGame, isNewGame);
}

// Renderiza o modal de detalhes do jogo
function renderGameDetailsModal(gameDetails, userGame, isNewGame) {
    // Cria o HTML para os detalhes do jogo
    const detailsHTML = renderGameDetails(gameDetails);
    
    // Cria o formulário para editar o status do jogo
    const formHTML = `
        <div class="mt-4 border-top border-secondary pt-3">
            <h5>Meu Status</h5>
            <form id="gameStatusForm">
                <!-- Status Selection -->
                <div class="mb-3">
                    <label class="form-label">Status</label>
                    <div class="d-flex flex-wrap gap-2">
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="gameStatus" id="statusPlaying" value="playing" ${userGame && userGame.status === 'playing' ? 'checked' : ''}>
                            <label class="form-check-label" for="statusPlaying">Jogando</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="gameStatus" id="statusCompleted" value="completed" ${userGame && userGame.status === 'completed' ? 'checked' : ''}>
                            <label class="form-check-label" for="statusCompleted">Zerado</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="gameStatus" id="statusAbandoned" value="abandoned" ${userGame && userGame.status === 'abandoned' ? 'checked' : ''}>
                            <label class="form-check-label" for="statusAbandoned">Flopei</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="gameStatus" id="statusWishlist" value="wishlist" ${userGame && userGame.status === 'wishlist' ? 'checked' : (!userGame ? 'checked' : '')}>
                            <label class="form-check-label" for="statusWishlist">Wishlist</label>
                        </div>
                    </div>
                </div>
                
                <!-- Rating -->
                <div class="mb-3">
                    <label class="form-label">Avaliação</label>
                    <div class="rating-stars fs-3">
                        <i class="${userGame && userGame.rating >= 1 ? 'fas' : 'far'} fa-star" data-rating="1"></i>
                        <i class="${userGame && userGame.rating >= 2 ? 'fas' : 'far'} fa-star" data-rating="2"></i>
                        <i class="${userGame && userGame.rating >= 3 ? 'fas' : 'far'} fa-star" data-rating="3"></i>
                        <i class="${userGame && userGame.rating >= 4 ? 'fas' : 'far'} fa-star" data-rating="4"></i>
                        <i class="${userGame && userGame.rating >= 5 ? 'fas' : 'far'} fa-star" data-rating="5"></i>
                    </div>
                    <input type="hidden" id="ratingValue" value="${userGame ? userGame.rating || 0 : 0}">
                </div>
                
                <!-- Like/Favorite -->
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="favoriteGame" ${userGame && userGame.is_favorite ? 'checked' : ''}>
                        <label class="form-check-label" for="favoriteGame">
                            <i class="${userGame && userGame.is_favorite ? 'fas' : 'far'} fa-heart me-1"></i> Favorito
                        </label>
                    </div>
                </div>
                
                <!-- Comment -->
                <div class="mb-3">
                    <label for="gameComment" class="form-label">Comentário</label>
                    <textarea class="form-control bg-dark text-light border-secondary" id="gameComment" rows="3">${userGame && userGame.comment ? userGame.comment : ''}</textarea>
                </div>
            </form>
        </div>
    `;
    
    // Combina os detalhes e o formulário
    gameModalBody.innerHTML = `
        <div class="row">
            ${detailsHTML}
        </div>
        ${formHTML}
    `;
    
    // Configura os eventos do formulário
    setupGameFormEvents();
    
    // Configura o botão de salvar
    saveGameBtn.onclick = async () => {
        await saveGameStatus(gameDetails.id, isNewGame);
    };
}

// Configura os eventos do formulário de status do jogo
function setupGameFormEvents() {
    // Eventos para as estrelas de avaliação
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.addEventListener('click', (e) => {
            const rating = parseInt(e.target.dataset.rating);
            document.getElementById('ratingValue').value = rating;
            
            // Atualiza as estrelas
            document.querySelectorAll('.rating-stars i').forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });
    
    // Evento para o checkbox de favorito
    const favoriteCheckbox = document.getElementById('favoriteGame');
    if (favoriteCheckbox) {
        favoriteCheckbox.addEventListener('change', (e) => {
            const label = e.target.nextElementSibling.querySelector('i');
            if (e.target.checked) {
                label.classList.remove('far');
                label.classList.add('fas');
            } else {
                label.classList.remove('fas');
                label.classList.add('far');
            }
        });
    }
}

// Salva o status do jogo
async function saveGameStatus(gameId, isNewGame) {
    // Obtém os valores do formulário
    const status = document.querySelector('input[name="gameStatus"]:checked')?.value || 'wishlist';
    const rating = parseInt(document.getElementById('ratingValue').value) || null;
    const isFavorite = document.getElementById('favoriteGame').checked;
    const comment = document.getElementById('gameComment').value.trim();
    
    // Prepara os dados do jogo
    const userGameData = {
        status,
        rating,
        is_favorite: isFavorite,
        comment: comment || null
    };
    
    // Salva o jogo
    const result = await saveUserGame(currentUser.id, currentGameDetails, userGameData);
    
    if (result.success) {
        // Fecha o modal
        bootstrap.Modal.getInstance(gameModal).hide();
        
        // Recarrega os jogos do usuário
        await loadUserGames();
        
        // Se for um novo jogo, fecha a busca
        if (isNewGame) {
            closeSearch();
        }
    } else {
        alert('Erro ao salvar o jogo. Tente novamente.');
    }
}

// Fecha a busca
function closeSearch() {
    searchResults.classList.add('d-none');
    searchInput.value = '';
}

// Configura os filtros de status
function setupStatusFilters() {
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove a classe active de todos os botões
            document.querySelectorAll('[data-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Adiciona a classe active ao botão clicado
            e.target.classList.add('active');
            
            // Carrega os jogos com o filtro selecionado
            loadUserGames(e.target.dataset.filter);
        });
    });
}

// Configura os eventos da página
function setupEventListeners() {
    // Evento de busca
    searchBtn.addEventListener('click', searchGamesFromAPI);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchGamesFromAPI();
        }
    });
    
    // Evento para fechar a busca
    closeSearchBtn.addEventListener('click', closeSearch);
    
    // Configura os filtros de status
    setupStatusFilters();
}

// Retorna o label para cada status
function getStatusLabel(status) {
    switch (status) {
        case 'playing': return 'Jogando';
        case 'completed': return 'Zerado';
        case 'abandoned': return 'Flopei';
        case 'wishlist': return 'Wishlist';
        default: return 'Desconhecido';
    }
}

// Renderiza as estrelas de avaliação
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

// Inicializa a página quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initCatalogPage);