#!/usr/bin/env bash
set -euo pipefail

# ── Capas App — Deploy Script ──────────────────────────
# Uso:  ./deploy.sh
# Pré-requisitos:
#   - git, node, npm ou yarn instalados
#   - PM2 rodando o app como "capas-app" (ou ajuste o comando restart)
#────────────────────────────────────────────────────────

cd "$(dirname "$0")"

APP_DIR="$(pwd)"
LOG_FILE="$APP_DIR/.deploy.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy iniciado..." | tee -a "$LOG_FILE"

# 1. Atualizar repositório
echo "  → git pull" | tee -a "$LOG_FILE"
git pull origin main 2>&1 | tee -a "$LOG_FILE"

# 2. Instalar dependências
echo "  → Instalando dependências..." | tee -a "$LOG_FILE"
npm install 2>&1 | tee -a "$LOG_FILE"

# 3. Gerar Prisma Client
echo "  → Gerando Prisma Client..." | tee -a "$LOG_FILE"
npx prisma generate 2>&1 | tee -a "$LOG_FILE"

# 4. Rodar migrations (produção)
echo "  → Rodando migrations..." | tee -a "$LOG_FILE"
npx prisma migrate deploy 2>&1 | tee -a "$LOG_FILE"

# 5. Build
echo "  → Build Next.js..." | tee -a "$LOG_FILE"
npm run build 2>&1 | tee -a "$LOG_FILE"

# 6. Restart da aplicação
if command -v pm2 &>/dev/null; then
  echo "  → Restart PM2..." | tee -a "$LOG_FILE"
  pm2 restart capas-app 2>&1 | tee -a "$LOG_FILE"
elif command -v systemctl &>/dev/null; then
  echo "  → Restart systemd..." | tee -a "$LOG_FILE"
  sudo systemctl restart capas-app 2>&1 | tee -a "$LOG_FILE"
else
  echo "  ⚠️  Nenhum gerenciador de processo encontrado (PM2/systemd)." | tee -a "$LOG_FILE"
  echo "     Reinicie o app manualmente." | tee -a "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy concluído!" | tee -a "$LOG_FILE"
