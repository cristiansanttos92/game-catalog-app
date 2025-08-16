// Configuração da API RAWG
const RAWG_API_KEY = 'sua-chave-api-rawg'; // Substitua pela sua chave da API RAWG
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Função para buscar jogos na API RAWG
async function searchGames(query, page = 1) {
    try {
        const url = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page=${page}&page_size=12`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar jogos:', error.message);
        return { results: [], count: 0 };
    }
}

// Função para buscar detalhes de um jogo específico
async function getGameDetails(gameId) {
    try {
        const url = `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar detalhes do jogo:', error.message);
        return null;
    }
}

// Função para buscar screenshots de um jogo
async function getGameScreenshots(gameId) {
    try {
        const url = `${RAWG_BASE_URL}/games/${gameId}/screenshots?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Erro ao buscar screenshots:', error.message);
        return [];
    }
}

// Função para buscar jogos da mesma série
async function getGameSeries(gameId) {
    try {
        const url = `${RAWG_BASE_URL}/games/${gameId}/game-series?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Erro ao buscar jogos da série:', error.message);
        return [];
    }
}

// Função para buscar DLCs e expansões de um jogo
async function getGameDLC(gameId) {
    try {
        const url = `${RAWG_BASE_URL}/games/${gameId}/additions?key=${RAWG_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Erro ao buscar DLCs:', error.message);
        return [];
    }
}

// Função para renderizar um card de jogo nos resultados da busca
function renderGameSearchCard(game, isInUserLibrary = false) {
    const platforms = game.platforms ? game.platforms.map(p => p.platform.name).join(', ') : 'Plataforma desconhecida';
    const releaseDate = game.released ? new Date(game.released).toLocaleDateString('pt-BR') : 'Data desconhecida';
    
    const card = document.createElement('div');
    card.className = 'col';
    card.innerHTML = `
        <div class="card game-card bg-dark border-secondary h-100">
            <img src="${game.background_image || 'assets/images/no-image.jpg'}" class="card-img-top" alt="${game.name}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${game.name}</h5>
                <p class="card-text text-muted game-platforms small mb-2">${platforms}</p>
                <p class="card-text small mb-3">Lançamento: ${releaseDate}</p>
                <div class="mt-auto">
                    ${isInUserLibrary ? 
                        `<button class="btn btn-outline-primary btn-sm view-game" data-game-id="${game.id}">Ver Detalhes</button>` : 
                        `<button class="btn btn-primary btn-sm add-game" data-game-id="${game.id}">Adicionar ao Catálogo</button>`
                    }
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Função para renderizar detalhes completos de um jogo
function renderGameDetails(gameDetails, userGame = null) {
    // Formata as informações do jogo
    const releaseDate = gameDetails.released ? new Date(gameDetails.released).toLocaleDateString('pt-BR') : 'Data desconhecida';
    const platforms = gameDetails.platforms ? gameDetails.platforms.map(p => p.platform.name).join(', ') : 'Plataforma desconhecida';
    const genres = gameDetails.genres ? gameDetails.genres.map(g => g.name).join(', ') : 'Gênero desconhecido';
    const developers = gameDetails.developers ? gameDetails.developers.map(d => d.name).join(', ') : 'Desenvolvedor desconhecido';
    const publishers = gameDetails.publishers ? gameDetails.publishers.map(p => p.name).join(', ') : 'Publicadora desconhecida';
    
    // Cria o HTML para os detalhes do jogo
    const detailsHTML = `
        <div class="col-md-4 mb-4">
            <img src="${gameDetails.background_image || 'assets/images/no-image.jpg'}" class="game-cover img-fluid" alt="${gameDetails.name}">
            ${gameDetails.metacritic ? `<div class="mt-3 text-center"><span class="badge bg-${getMetacriticColor(gameDetails.metacritic)} p-2 fs-5">${gameDetails.metacritic}</span></div>` : ''}
        </div>
        <div class="col-md-8">
            <h2 class="mb-3">${gameDetails.name}</h2>
            <ul class="game-info-list mb-4">
                <li><i class="fas fa-calendar-alt"></i> <strong>Lançamento:</strong> ${releaseDate}</li>
                <li><i class="fas fa-gamepad"></i> <strong>Plataformas:</strong> ${platforms}</li>
                <li><i class="fas fa-tags"></i> <strong>Gêneros:</strong> ${genres}</li>
                <li><i class="fas fa-code"></i> <strong>Desenvolvedores:</strong> ${developers}</li>
                <li><i class="fas fa-building"></i> <strong>Publicadoras:</strong> ${publishers}</li>
            </ul>
            <div class="mb-4">
                <h5>Sobre</h5>
                <p>${gameDetails.description_raw || 'Sem descrição disponível.'}</p>
            </div>
        </div>
    `;
    
    return detailsHTML;
}

// Função para determinar a cor do badge do Metacritic
function getMetacriticColor(score) {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
}

// Função para renderizar screenshots
function renderGameScreenshots(screenshots) {
    if (!screenshots || screenshots.length === 0) {
        return '<p>Nenhuma screenshot disponível.</p>';
    }
    
    let html = '<div class="screenshots-container">';
    screenshots.forEach(screenshot => {
        html += `<img src="${screenshot.image}" class="screenshot-item" alt="Screenshot" data-bs-toggle="modal" data-bs-target="#screenshotModal" data-img="${screenshot.image}">`;
    });
    html += '</div>';
    
    return html;
}