# Game Catalog App

Um aplicativo web para gerenciar seu catálogo pessoal de jogos, permitindo buscar jogos através da RAWG API, adicionar ao seu catálogo, classificar, comentar e acompanhar seu progresso.

## Funcionalidades

- **Autenticação de usuários**: Cadastro e login usando Supabase Auth
- **Busca de jogos**: Integração com a RAWG API para buscar informações detalhadas sobre jogos
- **Catálogo pessoal**: Adicione jogos ao seu catálogo com status personalizados
- **Avaliações**: Classifique jogos com sistema de 5 estrelas
- **Comentários**: Adicione comentários pessoais aos jogos
- **Favoritos**: Marque jogos como favoritos
- **Estatísticas**: Visualize estatísticas do seu catálogo
- **Perfil de usuário**: Personalize seu perfil com avatar e biografia

## Estrutura do Projeto

```
game-catalog-app/
├── index.html          # Tela de login/cadastro
├── catalog.html        # Tela principal do catálogo de jogos
├── profile.html        # Tela do perfil do usuário
├── game-details.html   # Tela de detalhes do jogo
├── css/
│   └── style.css       # Estilos customizados
├── js/
│   ├── supabase.js     # Conexão e funções do Supabase (Auth + DB)
│   ├── rawg.js         # Funções para buscar jogos na RAWG API
│   ├── login.js        # Funções de login e cadastro
│   ├── catalog.js      # Funções de exibir e adicionar jogos no catálogo
│   ├── profile.js      # Funções de perfil e estatísticas
│   └── helpers.js      # Funções utilitárias
└── assets/
    └── images/         # Imagens do aplicativo
```

## Fluxo do Usuário

1. **Login/Cadastro**: O usuário acessa a página inicial (index.html) e faz login ou se cadastra
2. **Catálogo**: Após autenticação, é redirecionado para o catálogo (catalog.html)
3. **Busca**: Pode buscar jogos na RAWG API e adicionar ao seu catálogo
4. **Gerenciamento**: Pode visualizar, editar status, avaliar e comentar sobre os jogos
5. **Perfil**: Pode acessar seu perfil (profile.html) para ver estatísticas e editar informações

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS**: Bootstrap 5
- **Ícones**: Font Awesome
- **Backend as a Service**: Supabase (Autenticação e Banco de Dados)
- **API Externa**: RAWG API (Informações de jogos)

## Configuração

### Supabase

Para utilizar o aplicativo, você precisa criar um projeto no Supabase e configurar as seguintes tabelas:

1. **profiles**
   - id (uuid, primary key, references auth.users.id)
   - name (text)
   - bio (text)
   - avatar_url (text)
   - created_at (timestamp with time zone)

2. **games**
   - id (bigint, primary key)
   - name (text, not null)
   - cover_image (text)
   - description (text)
   - release_date (date)
   - platforms (text[])
   - genres (text[])
   - rating (numeric)
   - screenshots (text[])

3. **user_games**
   - id (uuid, primary key)
   - user_id (uuid, references auth.users.id)
   - game_id (bigint, references games.id)
   - status (text, check in ('playing', 'completed', 'abandoned', 'wishlist'))
   - rating (integer, check between 1 and 5)
   - is_favorite (boolean, default false)
   - comment (text)
   - created_at (timestamp with time zone)
   - updated_at (timestamp with time zone)

### RAWG API

Você precisa obter uma chave de API da RAWG em [https://rawg.io/apidocs](https://rawg.io/apidocs) e configurá-la no arquivo `js/rawg.js`.

## Como Usar

1. Clone este repositório
2. Configure seu projeto Supabase e obtenha as credenciais
3. Configure sua chave da RAWG API
4. Abra o arquivo `index.html` em um servidor web local

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.