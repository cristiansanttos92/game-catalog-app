// Variáveis globais
let currentUser = null;
let userGames = [];
let userProfile = null;

// Elementos do DOM
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userBio = document.getElementById('userBio');
const editProfileBtn = document.getElementById('editProfileBtn');
const profileGamesList = document.getElementById('profileGamesList');
const playingCount = document.getElementById('playingCount');
const completedCount = document.getElementById('completedCount');
const abandonedCount = document.getElementById('abandonedCount');
const wishlistCount = document.getElementById('wishlistCount');
const editProfileModal = document.getElementById('editProfileModal');
const profileForm = document.getElementById('profileForm');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const avatarUpload = document.getElementById('avatarUpload');
const avatarPreview = document.getElementById('avatarPreview');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const gameModal = document.getElementById('gameModal');
const gameModalTitle = document.getElementById('gameModalTitle');
const gameModalBody = document.getElementById('gameModalBody');
const saveGameBtn = document.getElementById('saveGameBtn');

// Inicializa a página
async function initProfilePage() {
    // Verifica autenticação e inicializa elementos comuns
    currentUser = await initAuthenticatedPage();
    if (!currentUser) return;
    
    // Carrega o perfil do usuário
    await loadUserProfile();
    
    // Carrega as estatísticas do usuário
    await loadUserStats();
    
    // Carrega os jogos do usuário
    await loadUserGames();
    
    // Configura os eventos
    setupEventListeners();
}

// Carrega o perfil do usuário
async function loadUserProfile() {
    userProfile = await getUserProfile(currentUser.id);
    
    if (userProfile) {
        // Atualiza os elementos do perfil
        userName.textContent = userProfile.name || 'Usuário';
        userBio.textContent = userProfile.bio || 'Sem biografia.';
        
        if (userProfile.avatar_url) {
            userAvatar.src = userProfile.avatar_url;
        }
        
        // Preenche o formulário de edição
        profileName.value = userProfile.name || '';
        profileBio.value = userProfile.bio || '';
        
        if (userProfile.avatar_url) {
            avatarPreview.src = userProfile.avatar_url;
        }
    }
}

// Carrega as estatísticas do usuário
async function loadUserStats() {
    const stats = await getUserStats(currentUser.id);
    
    // Atualiza os contadores
    playingCount.textContent = stats.playing;
    completedCount.textContent = stats.completed;
    abandonedCount.textContent = stats.abandoned;
    wishlistCount.textContent = stats.wishlist;
}

// Carrega os jogos do usuário
async function loadUserGames(filter = 'all') {
    // Mostra indicador de carregamento
    profileGamesList.innerHTML = '<div class="d-flex justify-content-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';
    
    // Busca os jogos do usuário
    const status = filter !== 'all' ? filter : null;
    userGames = await getUserGames(currentUser.id, status);
    
    // Renderiza os jogos
    renderUserGames(userGames);
}

// Renderiza os jogos do usuário
function renderUserGames(games) {
    if (games.length === 0) {
        profileGamesList.innerHTML = '<div class="text-center py-4"><p>Nenhum jogo encontrado. Adicione jogos ao seu catálogo na página principal.</p></div>';
        return;
    }
    
    profileGamesList.innerHTML = '';
    
    games.forEach(userGame => {
        const game = userGame.games;
        if (!game) return;
        
        const item = document.createElement('div');
        item.className = 'list-group-item bg-dark border-secondary profile-game-item';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${game.cover_image || 'assets/images/no-image.jpg'}" alt="${game.name}" class="me-3">
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="mb-1">${game.name}</h5>
                        <span class="badge badge-${userGame.status}">${getStatusLabel(userGame.status)}</span>
                    </div>
                    <div class="mb-1">
                        ${renderRatingStars(userGame.rating)}
                    </div>
                    <p class="mb-1 small text-muted">
                        ${userGame.is_favorite ? '<i class="fas fa-heart text-danger me-1"></i>' : ''}
                        ${game.platforms ? game.platforms.join(', ') : ''}
                    </p>
                    ${userGame.comment ? `<p class="mb-0 small fst-italic">${userGame.comment}</p>` : ''}
                </div>
                <div class="ms-3">
                    <button class="btn btn-outline-primary btn-sm edit-game" data-game-id="${game.id}">Editar</button>
                </div>
            </div>
        `;
        
        profileGamesList.appendChild(item);
    });
    
    // Adiciona eventos aos botões
    addUserGameButtonEvents();
}

// Adiciona eventos aos botões dos jogos do usuário
function addUserGameButtonEvents() {
    // Botões de edição
    document.querySelectorAll('.edit-game').forEach(button => {
        button.addEventListener('click', async (e) => {
            const gameId = e.target.dataset.gameId;
            await openGameDetailsModal(gameId);
        });
    });
}

// Abre o modal com detalhes do jogo
async function openGameDetailsModal(gameId) {
    // Mostra indicador de carregamento
    gameModalBody.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Carregando detalhes do jogo...</p></div>';
    
    // Abre o modal
    const modalInstance = new bootstrap.Modal(gameModal);
    modalInstance.show();
    
    // Busca detalhes do jogo
    const gameDetails = await getGameDetails(gameId);
    
    if (!gameDetails) {
        gameModalBody.innerHTML = '<div class="alert alert-danger">Erro ao carregar detalhes do jogo. Tente novamente.</div>';
        return;
    }
    
    // Atualiza o título do modal
    gameModalTitle.textContent = gameDetails.name;
    
    // Busca informações do jogo no catálogo do usuário
    const userGame = await getUserGame(currentUser.id, gameId);
    
    // Renderiza os detalhes do jogo
    renderGameDetailsModal(gameDetails, userGame);
}

// Renderiza o modal de detalhes do jogo
function renderGameDetailsModal(gameDetails, userGame) {
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
                            <input class="form-check-input" type="radio" name="gameStatus" id="statusWishlist" value="wishlist" ${userGame && userGame.status === 'wishlist' ? 'checked' : ''}>
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
        await saveGameStatus(gameDetails);
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
async function saveGameStatus(gameDetails) {
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
    const result = await saveUserGame(currentUser.id, gameDetails, userGameData);
    
    if (result.success) {
        // Fecha o modal
        bootstrap.Modal.getInstance(gameModal).hide();
        
        // Recarrega os jogos do usuário e estatísticas
        await loadUserGames();
        await loadUserStats();
    } else {
        alert('Erro ao salvar o jogo. Tente novamente.');
    }
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

// Configura o formulário de edição de perfil
function setupProfileForm() {
    // Evento para o botão de editar perfil
    editProfileBtn.addEventListener('click', () => {
        const modalInstance = new bootstrap.Modal(editProfileModal);
        modalInstance.show();
    });
    
    // Evento para o upload de avatar
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Evento para o botão de salvar perfil
    saveProfileBtn.addEventListener('click', async () => {
        // Obtém os valores do formulário
        const name = profileName.value.trim();
        const bio = profileBio.value.trim();
        
        // Prepara os dados do perfil
        const profileData = {
            name: name || userProfile.name,
            bio: bio || userProfile.bio
        };
        
        // Salva o perfil
        const result = await updateUserProfile(currentUser.id, profileData);
        
        // Se houver um arquivo de avatar, faz o upload
        if (avatarUpload.files.length > 0) {
            const avatarResult = await uploadAvatar(currentUser.id, avatarUpload.files[0]);
            if (avatarResult.success) {
                userAvatar.src = avatarResult.url;
            }
        }
        
        if (result.success) {
            // Fecha o modal
            bootstrap.Modal.getInstance(editProfileModal).hide();
            
            // Atualiza o perfil na página
            userName.textContent = profileData.name;
            userBio.textContent = profileData.bio;
            
            // Atualiza o perfil global
            userProfile = { ...userProfile, ...profileData };
        } else {
            alert('Erro ao salvar o perfil. Tente novamente.');
        }
    });
}

// Configura os eventos da página
function setupEventListeners() {
    // Configura os filtros de status
    setupStatusFilters();
    
    // Configura o formulário de edição de perfil
    setupProfileForm();
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
document.addEventListener('DOMContentLoaded', initProfilePage);