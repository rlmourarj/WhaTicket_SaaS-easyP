# 🚀 WhaTicket SaaS - Guia de Deploy no EasyPanel

Este guia fornece instruções completas para fazer deploy do WhaTicket SaaS em uma VPS usando [EasyPanel](https://easypanel.io/).

## 📋 Pré-requisitos

### Requisitos de Hardware (VPS)

- **CPU**: Mínimo 4 vCores
- **RAM**: Mínimo 8GB
- **Disco**: Mínimo 40GB SSD
- **Sistema Operacional**: Ubuntu 20.04 LTS ou superior

### Provedores Recomendados

✅ **Recomendados:**

- [Peramix](https://control.peramix.com/?affid=14) - VPS X2
- Contabo
- Hetzner

❌ **Não Recomendados:**

- Hostinger
- Hostgator
- Locaweb

### Requisitos de Software

- EasyPanel instalado na VPS
- Domínio configurado (exemplo: `app.seudominio.com`)
- Acesso SSH à VPS (opcional, mas recomendado)

---

## 🔧 Instalação do EasyPanel

Se ainda não tem o EasyPanel instalado, execute na sua VPS:

```bash
curl -sSL https://get.easypanel.io | sh
```

Após a instalação:

1. Acesse `http://SEU_IP_VPS:3000`
2. Complete a configuração inicial
3. Configure seu domínio

---

## 📦 Deploy da Aplicação

### Passo 1: Preparar o Repositório

1. **Fork ou clone este repositório** para sua conta GitHub
2. Certifique-se de que todos os arquivos estão commitados

### Passo 2: Criar Projeto no EasyPanel

1. Acesse o dashboard do EasyPanel
2. Clique em **"New Project"**
3. Escolha **"Docker Compose"**
4. Conecte seu repositório GitHub
5. Selecione a branch (geralmente `main` ou `master`)

### Passo 3: Configurar Variáveis de Ambiente

No EasyPanel, vá para **Environment Variables** e configure as seguintes variáveis:

#### 🔐 Variáveis Obrigatórias

```bash
# URLs da Aplicação (IMPORTANTE: Alterar para seu domínio)
BACKEND_URL=https://api.seudominio.com
FRONTEND_URL=https://seudominio.com

# Banco de Dados
DB_USER=whaticket
DB_PASS=SuaSenhaSeguraAqui123!
DB_NAME=whaticket

# Redis
REDIS_PASSWORD=OutraSenhaSeguraAqui456!

# JWT Secrets (CRÍTICO: Gerar valores únicos)
JWT_SECRET=GerarComCrypto32CharsMínimo
JWT_REFRESH_SECRET=OutroSegredoDiferente32CharsMin
```

> **⚠️ IMPORTANTE**: Para gerar secrets seguros, execute no terminal:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
> ```

#### ⚙️ Variáveis Opcionais

```bash
# Limites da Aplicação
USER_LIMIT=10000
CONNECTIONS_LIMIT=100000
CLOSED_SEND_BY_ME=true
HOURS_CLOSE_TICKETS_AUTO=24

# Integração Gerencianet/Efi Pay (Se usar pagamentos)
GERENCIANET_SANDBOX=false
GERENCIANET_CLIENT_ID=seu_client_id
GERENCIANET_CLIENT_SECRET=seu_client_secret
GERENCIANET_PIX_CERT=certificado
GERENCIANET_PIX_KEY=sua_chave_pix

# Integração Facebook (Se usar)
FACEBOOK_APP_ID=seu_app_id
FACEBOOK_APP_SECRET=seu_app_secret

# Webhook
VERIFY_TOKEN=token_webhook_seguro
```

### Passo 4: Configurar Domínios

No EasyPanel, configure os domínios:

1. **Frontend**: `app.seudominio.com` → Porta `3000`
2. **Backend**: `api.seudominio.com` → Porta `8080`

Ative **SSL/TLS** (Let's Encrypt) para ambos os domínios.

### Passo 5: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (pode levar 5-10 minutos)
3. Monitore os logs para verificar se não há erros

---

## ✅ Verificação Pós-Deploy

### 1. Verificar Logs

```bash
# No EasyPanel, vá para Logs e verifique:
# - Backend deve mostrar "Migrations completed"
# - Backend deve mostrar "Server started on port 8080"
# - Frontend deve estar servindo no nginx
```

### 2. Verificar Health Checks

```bash
# Backend API
curl https://api.seudominio.com/api/health

# Frontend
curl https://seudominio.com/health
```

Ambos devem retornar status `200 OK`.

### 3. Acessar a Aplicação

1. Abra `https://seudominio.com`
2. Você verá a tela de login do WhaTicket
3. Faça o primeiro cadastro (será o usuário admin)

---

## 🔍 Troubleshooting

### Problema: Migrations não executam

**Solução:**

```bash
# Conecte via SSH na VPS e execute:
docker exec -it whaticket_backend npm run db:migrate
```

### Problema: Frontend não conecta no backend

**Verificações:**

1. Confirme que `BACKEND_URL` nas variáveis de ambiente está correto
2. Verifique se o SSL está ativo em ambos os domínios
3. Reconstrua o frontend com as variáveis corretas:

```bash
docker-compose up -d --build frontend
```

### Problema: Erro 502 Bad Gateway

**Causas comuns:**

- Backend ainda está iniciando (aguarde 2-3 minutos)
- Migrations falharam
- Banco de dados não está acessível

**Solução:**

```bash
# Verificar status dos containers
docker-compose ps

# Verificar logs do backend
docker-compose logs -f backend

# Reiniciar serviços
docker-compose restart
```

### Problema: WhatsApp não conecta

**Verificações:**

1. Verifique se o Chrome está instalado no container backend
2. Verifique logs do backend durante a conexão
3. Certifique-se de que a VPS não tem latência muito baixa (não funciona em localhost)

```bash
# Verificar instalação do Chrome
docker exec -it whaticket_backend google-chrome --version
```

### Problema: Uploads não funcionam

**Solução:**

```bash
# Verificar permissões do volume
docker exec -it whaticket_backend ls -la /usr/src/app/public

# Se necessário, ajustar permissões
docker exec -it whaticket_backend chown -R whaticket:whaticket /usr/src/app/public
```

### Problema: Redis Connection Failed

**Solução:**

```bash
# Verificar se Redis está rodando
docker exec -it whaticket_redis redis-cli ping

# Com senha
docker exec -it whaticket_redis redis-cli -a SuaSenha ping

# Deve retornar: PONG
```

---

## 🔄 Atualizações

### Como atualizar a aplicação

1. Faça pull das últimas alterações no repositório
2. No EasyPanel, clique em **"Redeploy"**
3. Ou via SSH:

```bash
cd /caminho/do/projeto
git pull origin main
docker-compose down
docker-compose up -d --build
```

> **⚠️ IMPORTANTE**: As migrações de banco de dados rodam automaticamente no startup.

---

## 💾 Backup

### Backup do Banco de Dados

```bash
# Criar backup
docker exec whaticket_postgres pg_dump -U whaticket whaticket > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_YYYYMMDD.sql | docker exec -i whaticket_postgres psql -U whaticket whaticket
```

### Backup dos Arquivos Enviados

```bash
# Backup dos arquivos públicos
docker run --rm -v whaticket_backend_public:/data -v $(pwd):/backup alpine tar czf /backup/public_backup_$(date +%Y%m%d).tar.gz /data

# Backup das sessões WhatsApp
docker run --rm -v whaticket_backend_wwebjs:/data -v $(pwd):/backup alpine tar czf /backup/wwebjs_backup_$(date +%Y%m%d).tar.gz /data
```

---

## 📊 Monitoramento

### Recursos do Sistema

```bash
# Ver uso de recursos
docker stats

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f backend
```

### Verificar Espaço em Disco

```bash
# Uso de volumes Docker
docker system df -v

# Limpar recursos não utilizados
docker system prune -a --volumes
```

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] JWT_SECRET e JWT_REFRESH_SECRET são únicos e seguros (32+ caracteres)
- [ ] Senhas de banco de dados e Redis são fortes
- [ ] SSL/TLS está ativado para ambos os domínios
- [ ] Firewall configurado (apenas portas 80, 443, 22 abertas)
- [ ] Backups automáticos configurados
- [ ] Logs sendo monitorados

### Configurar Firewall (UFW)

```bash
# Ativar firewall
sudo ufw enable

# Permitir apenas portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # EasyPanel (opcional, pode bloquear após configuração)

# Verificar status
sudo ufw status
```

---

## 📞 Suporte

- **Documentação Oficial**: [README.md](./README.md)
- **Issues**: Abra uma issue no repositório GitHub
- **Suporte Pago**: [licencas.digital](https://licencasdigital.shop)

---

## 🎉 Pronto!

Se tudo estiver configurado corretamente:

1. ✅ Aplicação acessível via `https://seudominio.com`
2. ✅ API funcionando em `https://api.seudominio.com`
3. ✅ Banco de dados persistindo dados
4. ✅ WhatsApp conectando via QR Code
5. ✅ Uploads funcionando
6. ✅ WebSocket funcionando (tempo real)

**Bom uso do WhaTicket SaaS! 🚀**
