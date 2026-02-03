# 📖 Devocional Diário - Aplicativo Mobile

Um aplicativo devocional completo para Android com geração de conteúdo por IA, caderno de orações, diário de gratidão e comunidade cristã.

https://devocional-app.vercel.app/auth

## ✨ Funcionalidades

### 🙏 Devocional Diário com IA
- **Geração automática** de devocionais personalizados usando GPT-5.2
- Versículos bíblicos relevantes com referências completas
- Sugestões de **músicas gospel** (brasileiras e internacionais)
- Conteúdo reflexivo e prático para fortalecer sua fé
- Notificações diárias às 8:00 AM

### 📝 Caderno de Orações
- Crie e organize suas orações
- **Categorias**: Pendentes, Respondidas, Contínuas
- Adicione datas e acompanhe o histórico
- Edite e exclua orações facilmente
- Filtro por categoria

### 💖 Diário de Gratidão
- Registre pelo que você é grato
- Histórico completo com datas
- Interface simples e intuitiva

### 👥 Comunidade
- Compartilhe reflexões com outros usuários
- Visualize reflexões públicas da comunidade
- Tipos: Devocional, Oração, Gratidão
- Feed atualizado em tempo real

### 🎨 Personalização
- **Tema claro e escuro** (troca manual)
- Interface moderna e responsiva
- Design mobile-first otimizado

### 📱 Compartilhamento
- Compartilhe devocionais em redes sociais
- WhatsApp e Instagram integrados
- Formato de texto otimizado

## 🛠 Tecnologias Utilizadas

### Frontend (Mobile)
- **Expo** (React Native 0.81.5)
- **Expo Router** - Navegação file-based
- **TypeScript** - Tipagem estática
- **React Native Paper** - Componentes UI
- **Axios** - Requisições HTTP
- **AsyncStorage** - Armazenamento local
- **Expo Notifications** - Notificações push
- **Zustand** - Gerenciamento de estado

### Backend
- **FastAPI** - Framework Python moderno e rápido
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono do MongoDB
- **JWT** - Autenticação com tokens
- **Bcrypt** - Hash de senhas
- **Emergent Integrations** - Biblioteca para IA

### Inteligência Artificial
- **OpenAI GPT-5.2** via Emergent LLM Key
- Geração de devocionais contextualizados
- Seleção de versículos bíblicos relevantes
- Sugestões de músicas gospel

## 📁 Estrutura do Projeto

```
/app
├── backend/
│   ├── server.py           # API FastAPI completa
│   ├── requirements.txt    # Dependências Python
│   └── .env               # Variáveis de ambiente
│
└── frontend/
    ├── app/
    │   ├── (tabs)/        # Telas principais
    │   │   ├── home.tsx        # Devocional diário
    │   │   ├── prayers.tsx     # Caderno de orações
    │   │   ├── gratitude.tsx   # Diário de gratidão
    │   │   ├── community.tsx   # Feed comunitário
    │   │   └── profile.tsx     # Perfil e configurações
    │   ├── auth.tsx            # Login/Registro
    │   ├── index.tsx           # Splash screen
    │   └── _layout.tsx         # Layout raiz
    │
    ├── contexts/
    │   ├── AuthContext.tsx     # Autenticação
    │   └── ThemeContext.tsx    # Tema claro/escuro
    │
    ├── utils/
    │   └── api.ts              # Configuração Axios
    │
    ├── app.json                # Configuração Expo
    └── package.json            # Dependências
```

## 🚀 Como Executar

### Backend

```bash
cd /app/backend

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd /app/frontend

# Instalar dependências
yarn install

# Iniciar Expo
expo start
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Dados do usuário
- `PUT /api/auth/theme` - Atualizar tema

### Devocionais
- `POST /api/devotionals/generate` - Gerar devocional com IA
- `GET /api/devotionals` - Listar devocionais

### Orações
- `POST /api/prayers` - Criar oração
- `GET /api/prayers?category=pendente` - Listar orações
- `PUT /api/prayers/{id}` - Atualizar oração
- `DELETE /api/prayers/{id}` - Excluir oração

### Gratidão
- `POST /api/gratitudes` - Criar gratidão
- `GET /api/gratitudes` - Listar gratidões
- `DELETE /api/gratitudes/{id}` - Excluir gratidão

### Comunidade
- `POST /api/reflections` - Compartilhar reflexão
- `GET /api/reflections/public` - Ver reflexões públicas

## 📊 Dados do Banco

### Collections MongoDB
- `users` - Usuários do app
- `devotionals` - Devocionais gerados
- `prayers` - Orações dos usuários
- `gratitudes` - Registros de gratidão
- `reflections` - Reflexões compartilhadas

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT com expiração de 30 dias
- ✅ Tokens armazenados com segurança (AsyncStorage)
- ✅ Validação de entrada em todos os endpoints
- ✅ CORS configurado corretamente
- ✅ Isolamento de dados por usuário

## 🎨 Design

- Interface clean e moderna
- Cores principais: Roxo (#6B46C1) e tons neutros
- Ícones do Ionicons
- Animações suaves
- Feedback visual para ações
- Estados de loading e erro tratados

## 📱 Compatibilidade

- ✅ **Android** (Otimizado)
- ✅ **iOS** (Compatível)
- ✅ **Web** (Preview)

## 🔔 Notificações

- Lembretes diários às 8:00 AM
- Conteúdo: "Seu devocional de hoje está pronto! 📖"
- Permissões solicitadas no primeiro acesso

## 🌐 Variáveis de Ambiente

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EMERGENT_LLM_KEY=sk-emergent-xxxxx
JWT_SECRET=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=720
```

### Frontend (.env)
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url
```

## 📈 Status dos Testes

### Backend (Testado)
- ✅ 44/45 testes passando (97,8%)
- ✅ Autenticação completa
- ✅ Geração de devocionais com IA
- ✅ CRUD de orações e gratidões
- ✅ Sistema de comunidade
- ✅ Integração MongoDB

### Frontend
- Interface responsiva funcionando
- Navegação entre telas operacional
- Formulários com validação
- Integração com backend configurada

## 🤖 IA e Geração de Conteúdo

O app utiliza **OpenAI GPT-5.2** para gerar:
1. **Título** inspirador para o devocional
2. **Conteúdo** reflexivo de 200-300 palavras
3. **Versículo bíblico** completo e relevante
4. **Referência** do versículo (livro, capítulo, versículo)
5. **3 músicas** gospel (2 brasileiras + 1 internacional)

Exemplo de resposta da IA:
```json
{
  "title": "Paz no Meio do Caos",
  "content": "Em muitos dias, a vida parece...",
  "verse": "Não andeis ansiosos por coisa alguma...",
  "verse_reference": "Filipenses 4:6-7",
  "music_suggestions": [
    {
      "name": "Acalma o Meu Coração",
      "artist": "Anderson Freire",
      "country": "Brasil"
    }
  ]
}
```

## 📝 Próximas Funcionalidades (Sugestões)

- [ ] Histórico de devocionais anteriores
- [ ] Marcação de versículos favoritos
- [ ] Playlists das músicas sugeridas
- [ ] Grupos de oração privados
- [ ] Estatísticas de uso
- [ ] Backup automático na nuvem
- [ ] Modo offline completo
- [ ] Widget para tela inicial
- [ ] Compartilhamento de imagens

## 🙏 Propósito

Este aplicativo foi criado para ajudar cristãos a:
- Fortalecer sua fé diariamente
- Manter um relacionamento constante com Deus
- Desenvolver o hábito da gratidão
- Compartilhar experiências espirituais
- Organizar sua vida de oração

---

**Desenvolvido com ❤️ para fortalecer sua fé**
