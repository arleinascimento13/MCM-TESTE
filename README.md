# MCM — Sistema de Apontamento de Horas

Sistema interno de registro de apontamento de horas da MCM. Permite que funcionários registrem suas horas trabalhadas em projetos, centros de custo, disciplinas e locais, com aprovação por job leaders.

## Requisitos

- Node.js 20+
- PostgreSQL (instalado localmente, sem Docker)
- npm ou yarn

## Setup local

### 1. Criar o banco de dados

Acesse o PostgreSQL e crie o banco `mcm`:

```sql
CREATE DATABASE mcm;
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste os valores:

```bash
cp .env.example .env
```

Edite o `.env` com as credenciais do seu banco local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mcm?schema=public"
AUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Aplicar migrations

```bash
npx prisma migrate dev
```

### 5. Popular o banco com dados de demonstração

```bash
npx prisma db seed
```

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Credenciais padrão

Após executar o seed, as seguintes contas estão disponíveis:

| Usuário | Senha | Papel |
|---|---|---|
| admin@mcm.local | Admin123! | ADMIN |
| lider@mcm.local | Senha123! | JOB_LEADER |
| func1@mcm.local | Senha123! | FUNCIONARIO |
| func2@mcm.local | Senha123! | FUNCIONARIO |

## Scripts

```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run start  # Iniciar servidor de produção
npm run lint   # Verificação de lint
npm test       # Executar todos os testes
```
