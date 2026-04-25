# Capas App

Gerador de capas para Instagram via IA.

## Pré-requisitos

- Node.js 18+
- Docker

## Setup

### 1. Subir o banco Postgres

```bash
docker compose up -d
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha os valores, especialmente `DB_PASSWORD` e as chaves de API.

### 3. Instalar dependências

```bash
npm install
```

### 4. Rodar as migrações do Prisma

```bash
npx prisma migrate dev
```

### 5. Iniciar o dev server

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).
