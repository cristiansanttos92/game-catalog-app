// Inicialização do cliente Supabase
const SUPABASE_URL = "NEXT_PUBLIC_SUPABASE_URL"; // Substitua pela sua URL do Supabase
const SUPABASE_ANON_KEY = "NEXT_PUBLIC_SUPABASE_ANON_KEY"; // Substitua pela sua chave anônima pública

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verifica se o usuário está autenticado
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Redireciona para a página de login se não estiver autenticado
async function requireAuth() {
    const user = await checkUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// Exibe o email do usuário na navbar
async function displayUserEmail() {
    const user = await checkUser();
    const userEmailElement = document.getElementById('userEmail');
    
    if (user && userEmailElement) {
        userEmailElement.textContent = user.email;
    }
}

// Função de login
async function loginUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Função de cadastro
async function registerUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;
        
        // Cria o perfil do usuário
        if (data.user) {
            await createUserProfile(data.user.id, email);
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Função de logout
async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error.message);
    }
}

// Cria o perfil do usuário no banco de dados
async function createUserProfile(userId, email) {
    try {
        const { error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email,
                name: email.split('@')[0], // Nome padrão baseado no email
                avatar_url: null,
                bio: 'Olá! Sou novo por aqui.',
                created_at: new Date()
            });

        if (error) throw error;
    } catch (error) {
        console.error('Erro ao criar perfil:', error.message);
    }
}

// Busca o perfil do usuário
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar perfil:', error.message);
        return null;
    }
}

// Atualiza o perfil do usuário
async function updateUserProfile(userId, profileData) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error.message);
        return { success: false, error: error.message };
    }
}

// Upload de avatar
async function uploadAvatar(userId, file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtém a URL pública
        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Atualiza o perfil com a nova URL
        await updateUserProfile(userId, { avatar_url: data.publicUrl });

        return { success: true, url: data.publicUrl };
    } catch (error) {
        console.error('Erro ao fazer upload de avatar:', error.message);
        return { success: false, error: error.message };
    }
}

// Busca jogos do usuário
async function getUserGames(userId, status = null) {
    try {
        let query = supabase
            .from('user_games')
            .select(`
                *,
                games:game_id(*)
            `)
            .eq('user_id', userId);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('updated_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Erro ao buscar jogos do usuário:', error.message);
        return [];
    }
}

// Busca um jogo específico do usuário
async function getUserGame(userId, gameId) {
    try {
        const { data, error } = await supabase
            .from('user_games')
            .select('*')
            .eq('user_id', userId)
            .eq('game_id', gameId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 é o código para 'nenhum resultado'
        return data;
    } catch (error) {
        console.error('Erro ao buscar jogo do usuário:', error.message);
        return null;
    }
}

// Adiciona ou atualiza um jogo no catálogo do usuário
async function saveUserGame(userId, gameData, userGameData) {
    try {
        // Primeiro, verifica se o jogo já existe no banco
        const { data: existingGame, error: gameCheckError } = await supabase
            .from('games')
            .select('id')
            .eq('id', gameData.id)
            .single();

        if (gameCheckError && gameCheckError.code !== 'PGRST116') throw gameCheckError;

        // Se o jogo não existir, adiciona-o
        if (!existingGame) {
            const { error: gameInsertError } = await supabase
                .from('games')
                .insert({
                    id: gameData.id,
                    name: gameData.name,
                    slug: gameData.slug,
                    cover_image: gameData.background_image,
                    release_date: gameData.released,
                    platforms: gameData.platforms ? gameData.platforms.map(p => p.platform.name) : [],
                    genres: gameData.genres ? gameData.genres.map(g => g.name) : [],
                    developers: gameData.developers ? gameData.developers.map(d => d.name) : [],
                    publishers: gameData.publishers ? gameData.publishers.map(p => p.name) : [],
                    metacritic: gameData.metacritic || null
                });

            if (gameInsertError) throw gameInsertError;
        }

        // Verifica se o usuário já tem este jogo
        const { data: existingUserGame, error: userGameCheckError } = await supabase
            .from('user_games')
            .select('id')
            .eq('user_id', userId)
            .eq('game_id', gameData.id)
            .single();

        if (userGameCheckError && userGameCheckError.code !== 'PGRST116') throw userGameCheckError;

        // Prepara os dados para inserção/atualização
        const userGameRecord = {
            user_id: userId,
            game_id: gameData.id,
            status: userGameData.status,
            rating: userGameData.rating || null,
            is_favorite: userGameData.is_favorite || false,
            comment: userGameData.comment || null,
            updated_at: new Date()
        };

        // Se o usuário já tem o jogo, atualiza; senão, insere
        if (existingUserGame) {
            const { error: updateError } = await supabase
                .from('user_games')
                .update(userGameRecord)
                .eq('id', existingUserGame.id);

            if (updateError) throw updateError;
        } else {
            userGameRecord.created_at = new Date();
            const { error: insertError } = await supabase
                .from('user_games')
                .insert(userGameRecord);

            if (insertError) throw insertError;
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao salvar jogo do usuário:', error.message);
        return { success: false, error: error.message };
    }
}

// Remove um jogo do catálogo do usuário
async function removeUserGame(userId, gameId) {
    try {
        const { error } = await supabase
            .from('user_games')
            .delete()
            .eq('user_id', userId)
            .eq('game_id', gameId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao remover jogo do usuário:', error.message);
        return { success: false, error: error.message };
    }
}

// Obtém estatísticas do usuário
async function getUserStats(userId) {
    try {
        const { data, error } = await supabase
            .from('user_games')
            .select('status')
            .eq('user_id', userId);

        if (error) throw error;

        // Conta os jogos por status
        const stats = {
            total: data.length,
            playing: data.filter(game => game.status === 'playing').length,
            completed: data.filter(game => game.status === 'completed').length,
            abandoned: data.filter(game => game.status === 'abandoned').length,
            wishlist: data.filter(game => game.status === 'wishlist').length
        };

        return stats;
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error.message);
        return {
            total: 0,
            playing: 0,
            completed: 0,
            abandoned: 0,
            wishlist: 0
        };
    }
}

// Configura o botão de logout
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
}

// Inicializa elementos comuns em páginas autenticadas
async function initAuthenticatedPage() {
    const user = await requireAuth();
    if (user) {
        displayUserEmail();
        setupLogoutButton();
        return user;
    }
    return null;
}