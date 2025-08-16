// Variáveis globais
let currentUser = null;
let currentGame = null;
let userGame = null;

// Elementos do DOM
const gameTitle = document.getElementById('gameTitle');
const gameBanner = document.getElementById('gameBanner');
const gameDescription = document.getElementById('gameDescription');
const gamePlatforms = document.getElementById('gamePlatforms');
const gameGenres = document.getElementById('gameGenres');
const gameReleaseDate = document.getElementById('gameReleaseDate');
const gameRating = document.getElementById('gameRating');
const gameScreenshots = document.getElementById('gameScreenshots');
const gameStatusForm = document.getElementById('gameStatusForm');
const saveGameBtn = document.getElementById('saveGameBtn');
const backToCatalogBtn = document.getElementById('backToCatalogBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const gameContent = document.getElementById('gameContent');
const errorMessage = document.getElementById('errorMessage');

// Inicializa a página
async function initGameDetailsPage() {
    // Verifica autenticação e inicializa elementos comuns
    currentUser = await initAuthenticatedPage();
    if (!currentUser) return;
    
    // Obtém o ID do jogo da URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    
    if (!gameId) {
        // Redireciona para o catálogo se não houver ID
        window.location.href = 'catalog.html';
        return;
    }
    
    // Mostra indicador de carregamento
    showLoading(true);
    
    try {
        // Carrega os detalhes do jogo
        currentGame = await getGameDetails(gameId);
        
        if (!currentGame) {
            showError('Jogo não encontrado. Verifique o ID e tente novamente.');
            return;
        }
        
        // Carrega informações do jogo no catálogo do usuário
        userGame = await getUserGame(currentUser.id, gameId);
        
        // Renderiza os detalhes do jogo
        renderGameDetails();
        
        // Configura o formulário de status
        setupGameStatusForm();
        
        // Configura eventos
        setupEventListeners();
        
        // Mostra o conteúdo
        showLoading(false);
    } catch (error) {
        console.error('Erro ao carregar detalhes do jogo:', error);
        showError('Ocorreu um erro ao carregar os detalhes do jogo. Tente novamente mais tarde.');
    }
}

// Renderiza os detalhes do jogo
function renderGameDetails() {
    // Atualiza o título da página
    document.title = `${currentGame.name} - Game Catalog`;
    
    // Atualiza os elementos com os detalhes do jogo
    gameTitle.textContent = currentGame.name;
    
    // Banner do jogo
    if (currentGame.screenshots && currentGame.screenshots.length > 0) {
        gameBanner.style.backgroundImage = `url(${currentGame.screenshots[0]})`;
    } else if (currentGame.cover_image) {
        gameBanner.style.backgroundImage = `url(${currentGame.cover_image})`;
    } else {
        gameBanner.style.backgroundImage = 'url(assets/images/no-image.svg)';
    }
    
    // Descrição
    gameDescription.innerHTML = currentGame.description || 'Sem descrição disponível.';
    
    // Plataformas
    gamePlatforms.textContent = currentGame.platforms ? currentGame.platforms.join(', ') : 'Não disponível';
    
    // Gêneros
    gameGenres.textContent = currentGame.genres ? currentGame.genres.join(', ') : 'Não disponível';
    
    // Data de lançamento
    gameReleaseDate.textContent = currentGame.release_date ? formatDate(currentGame.release_date, 'long') : 'Não disponível';
    
    // Classificação
    gameRating.textContent = currentGame.rating ? `${currentGame.rating}/5` : 'Não disponível';
    
    // Screenshots
    if (currentGame.screenshots && currentGame.screenshots.length > 0) {
        gameScreenshots.innerHTML = '';
        
        currentGame.screenshots.forEach(screenshot => {
            const col = document.createElement('div');
            col.className = 'col-md-3 col-6 mb-3';
            
            const link = document.createElement('a');
            link.href = screenshot;
            link.target = '_blank';
            link.className = 'screenshot-link';
            
            const img = document.createElement('img');
            img.src = screenshot;
            img.alt = 'Screenshot';
            img.className = 'img-fluid rounded';
            
            link.appendChild(img);
            col.appendChild(link);
            gameScreenshots.appendChild(col);
        });
    } else {
        gameScreenshots.innerHTML = '<div class="col-12"><p>Nenhuma screenshot disponível.</p></div>';
    }
}

// Configura o formulário de status do jogo
function setupGameStatusForm() {
    // Preenche o formulário com os dados do jogo do usuário, se existir
    if (userGame) {
        // Status
        const statusRadio = document.querySelector(`input[name="gameStatus"][value="${userGame.status}"]`);
        if (statusRadio) {
            statusRadio.checked = true;
        }
        
        // Avaliação
        document.getElementById('ratingValue').value = userGame.rating || 0;
        updateRatingStars(userGame.rating || 0);
        
        // Favorito
        document.getElementById('favoriteGame').checked = userGame.is_favorite || false;
        updateFavoriteIcon(userGame.is_favorite || false);
        
        // Comentário
        document.getElementById('gameComment').value = userGame.comment || '';
    } else {
        // Define valores padrão para um novo jogo
        const wishlistRadio = document.querySelector('input[name="gameStatus"][value="wishlist"]');
        if (wishlistRadio) {
            wishlistRadio.checked = true;
        }
        
        document.getElementById('ratingValue').value = 0;
        document.getElementById('favoriteGame').checked = false;
        document.getElementById('gameComment').value = '';
    }
}

// Atualiza as estrelas de avaliação
function updateRatingStars(rating) {
    document.querySelectorAll('.rating-stars i').forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        if (starRating <= rating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

// Atualiza o ícone de favorito
function updateFavoriteIcon(isFavorite) {
    const icon = document.querySelector('label[for="favoriteGame"] i');
    if (icon) {
        if (isFavorite) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    }
}

// Configura os eventos da página
function setupEventListeners() {
    // Eventos para as estrelas de avaliação
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.addEventListener('click', (e) => {
            const rating = parseInt(e.target.dataset.rating);
            document.getElementById('ratingValue').value = rating;
            updateRatingStars(rating);
        });
    });
    
    // Evento para o checkbox de favorito
    const favoriteCheckbox = document.getElementById('favoriteGame');
    if (favoriteCheckbox) {
        favoriteCheckbox.addEventListener('change', (e) => {
            updateFavoriteIcon(e.target.checked);
        });
    }
    
    // Evento para o botão de salvar
    saveGameBtn.addEventListener('click', saveGameStatus);
    
    // Evento para o botão de voltar ao catálogo
    backToCatalogBtn.addEventListener('click', () => {
        window.location.href = 'catalog.html';
    });
}

// Salva o status do jogo
async function saveGameStatus() {
    // Desabilita o botão de salvar durante o processo
    saveGameBtn.disabled = true;
    saveGameBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    try {
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
        const result = await saveUserGame(currentUser.id, currentGame, userGameData);
        
        if (result.success) {
            // Atualiza o objeto userGame
            userGame = await getUserGame(currentUser.id, currentGame.id);
            
            // Mostra mensagem de sucesso
            showToast('Jogo salvo com sucesso!', 'success');
        } else {
            showToast('Erro ao salvar o jogo. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar o jogo:', error);
        showToast('Ocorreu um erro ao salvar o jogo. Tente novamente mais tarde.', 'error');
    } finally {
        // Reabilita o botão de salvar
        saveGameBtn.disabled = false;
        saveGameBtn.innerHTML = 'Salvar';
    }
}

// Mostra ou esconde o indicador de carregamento
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('d-none');
        gameContent.classList.add('d-none');
        errorMessage.classList.add('d-none');
    } else {
        loadingIndicator.classList.add('d-none');
        gameContent.classList.remove('d-none');
    }
}

// Mostra mensagem de erro
function showError(message) {
    loadingIndicator.classList.add('d-none');
    gameContent.classList.add('d-none');
    errorMessage.classList.remove('d-none');
    errorMessage.querySelector('p').textContent = message;
}

// Inicializa a página quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initGameDetailsPage);