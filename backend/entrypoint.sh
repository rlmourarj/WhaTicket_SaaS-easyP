#!/bin/bash
set -e

echo "🚀 Iniciando WhaTicket Backend..."

# Function to wait for PostgreSQL
wait_for_postgres() {
  echo "⏳ Aguardando PostgreSQL..."
  
  until PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
    echo "PostgreSQL indisponível - aguardando"
    sleep 2
  done
  
  echo "✅ PostgreSQL pronto!"
}

# Function to wait for Redis
wait_for_redis() {
  echo "⏳ Aguardando Redis..."
  
  # Extract Redis host and port from REDIS_URI
  # Format: redis://:password@host:port
  REDIS_HOST=$(echo $REDIS_URI | sed -n 's/.*@\([^:]*\):.*/\1/p')
  REDIS_PORT=$(echo $REDIS_URI | sed -n 's/.*:\([0-9]*\)$/\1/p')
  
  if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PORT" ]; then
    echo "⚠️  Não foi possível ler URI do Redis, pulando checagem"
  else
    until nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; do
      echo "Redis indisponível - aguardando"
      sleep 2
    done
    echo "✅ Redis pronto!"
  fi
}

# Wait for database and Redis
wait_for_postgres
wait_for_redis

# Run database migrations
echo "🔄 Rodando migrações do banco..."
npm run db:migrate

if [ $? -eq 0 ]; then
  echo "✅ Migrações concluídas com sucesso!"
else
  echo "❌ Falha na migração!"
  exit 1
fi

# Run seeds
echo "🌱 Rodando seeds do banco de dados..."
npm run db:seed

if [ $? -eq 0 ]; then
  echo "✅ Seeds completadas (ou já existiam)!"
else
  echo "❌ Seeds falharam! Isso é crítico para a primeira implantação."
  exit 1
fi

echo "🎉 Iniciando aplicação..."

# Start the application
exec "$@"
