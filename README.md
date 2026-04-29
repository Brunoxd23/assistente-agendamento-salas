# Assistente de Agendamento de Salas

Este sistema é um assistente inteligente para agendamento e consulta de salas em uma instituição de ensino. Ele utiliza React, Express, Vite e integração com a API Gemini AI do Google para responder dúvidas, mostrar ocupação de salas e eventos, e permitir login seguro por e-mail.

## Funcionalidades

- **Login por e-mail:** Usuários autorizados recebem um código de acesso por e-mail para autenticação.
- **Consulta de agendamentos:** Veja salas ocupadas, eventos e disponibilidade por data, unidade e sala.
- **Assistente AI:** O assistente responde perguntas usando a API Gemini AI, consultando dados reais de agendamento.
- **Interface moderna:** Desenvolvido com React, TailwindCSS e componentes interativos.

## Tecnologias Utilizadas

- React 19
- TypeScript
- Express.js
- Vite
- TailwindCSS
- Nodemailer (envio de e-mails)
- Gemini AI (Google GenAI)

## Como rodar o projeto

### Pré-requisitos

- Node.js 18 ou superior
- Uma conta Google para gerar senha de app (para envio de e-mails)
- Chave da API Gemini AI (Google)

### Passos

1. **Clone o repositório:**

   ```bash
   git clone <url-do-repo>
   cd assistenteAgendamentoSalas
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env` e preencha os valores:
     - `VITE_GEMINI_API_KEY`: Sua chave da API Gemini AI
     - `VITE_GMAIL_USER`: Seu e-mail do Gmail (remetente)
     - `GMAIL_APP_PASSWORD`: Senha de app do Gmail (16 dígitos)
     - `VITE_ALLOWED_EMAILS`: Lista de e-mails autorizados a logar (separados por vírgula)

4. **Rode o sistema:**
   ```bash
   npm run dev
   ```
   O sistema estará disponível em http://localhost:3000

### Exemplo de .env

```
VITE_GEMINI_API_KEY="sua-chave-gemini"
VITE_GMAIL_USER="seu-email@gmail.com"
GMAIL_APP_PASSWORD="sua-senha-app"
VITE_ALLOWED_EMAILS="usuario1@email.com,usuario2@email.com"
```

## Fluxo de uso

1. O usuário acessa a aplicação e informa o e-mail.
2. Se o e-mail estiver autorizado, recebe um código de acesso.
3. Após login, pode consultar agendamentos, disponibilidade de salas e eventos.
4. O assistente AI responde perguntas e mostra resultados de forma amigável.

## Dicas para Devs

- Sempre reinicie o servidor após alterar variáveis do .env.
- Se a porta 3000 estiver ocupada, feche outros servidores ou altere a porta no arquivo `server.ts`.
- Para dúvidas sobre a API Gemini, consulte a [documentação oficial](https://ai.google.dev/).

---

Desenvolvido para facilitar consultar agendamento e a consulta de salas de forma inteligente e segura.
