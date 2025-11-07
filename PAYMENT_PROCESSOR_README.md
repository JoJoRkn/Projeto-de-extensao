# 💳 Processador de Pagamento WorkSwipe

Backend completo para processar pagamentos via MercadoPago no WorkSwipe.

## 🚀 Funcionalidades

### ✅ **Implementadas:**
- 🔐 **API Segura**: Servidor Express.js com CORS configurado
- 💳 **Criação de Preferências**: Integração direta com API do MercadoPago
- 🔄 **Webhooks**: Recebimento automático de notificações de pagamento
- 📊 **Status de Pagamento**: Consulta em tempo real do status
- 👤 **Gerenciamento de Premium**: Ativação automática após pagamento aprovado
- 🗂️ **Armazenamento**: Sistema de cache em memória (expansível para BD)
- 🏠 **Interface de Gerenciamento**: Página completa para administrar planos (manage-premium.html)
- ❌ **Cancelamento de Planos**: Sistema completo de cancelamento com feedback
- 📈 **Histórico Detalhado**: Rastreamento do ciclo completo do plano premium
- 🔄 **Reativação**: Possibilidade de reativar planos cancelados

## 🛠️ Configuração

### 1. **Variáveis de Ambiente**

Edite o arquivo `.env`:

```env
# Chave de acesso do MercadoPago (NUNCA compartilhe)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-abcdef

# Porta do servidor
PORT=3001

# Ambiente
NODE_ENV=development
```

### 2. **Obter Credenciais MercadoPago**

#### **Para Teste:**
1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Selecione "Credenciais de teste"
3. Copie o "Access Token de teste"

#### **Para Produção:**
1. Complete a verificação da conta
2. Acesse "Credenciais de produção"
3. Copie o "Access Token de produção"

## 🎯 Como Usar

### **Iniciar Apenas o Processador:**
```bash
npm run payment-server
```

### **Iniciar Sistema Completo:**
```bash
npm run dev:full
```

Isso iniciará:
- 🌐 **Frontend**: http://localhost:8000
- 🔧 **Backend**: http://localhost:3001

## 📡 APIs Disponíveis

### **POST /api/create-preference**
Criar preferência de pagamento

```json
{
  "planId": "monthly",
  "userEmail": "usuario@email.com",
  "userName": "João Silva"
}
```

**Resposta:**
```json
{
  "preferenceId": "1234567890-abcd-1234-5678-abcdefghijkl",
  "initPoint": "https://mercadopago.com/checkout/...",
  "sandboxInitPoint": "https://sandbox.mercadopago.com/checkout/...",
  "externalReference": "monthly_1699027200000_usuario@email.com"
}
```

### **GET /api/payment-status/:externalReference**
Consultar status de pagamento

**Resposta:**
```json
{
  "status": "approved",
  "planId": "monthly",
  "userEmail": "usuario@email.com",
  "createdAt": "2025-11-03T18:00:00.000Z",
  "updatedAt": "2025-11-03T18:05:00.000Z"
}
```

### **GET /api/user-premium/:email**
Verificar status premium do usuário

**Resposta:**
```json
{
  "isPremium": true,
  "planId": "monthly",
  "expirationDate": "2025-12-03T18:00:00.000Z",
  "activatedAt": "2025-11-03T18:00:00.000Z"
}
```

### **POST /api/webhook/mercadopago**
Receber notificações do MercadoPago (automático)

## 🔄 Fluxo de Pagamento

```
1. 👤 Usuário escolhe plano → Frontend
2. 📝 Frontend cria preferência → POST /api/create-preference
3. 🔄 Backend cria preferência → MercadoPago API
4. 🌐 Usuário redirecionado → Checkout MercadoPago
5. 💳 Usuário paga → MercadoPago processa
6. 📢 MercadoPago notifica → POST /api/webhook/mercadopago
7. ✅ Backend ativa premium → Usuário automaticamente
8. 🎉 Usuário retorna → Premium ativado
```

## 🔧 Estrutura do Backend

```
payment-server.js
├── 🔧 Configuração Express + CORS
├── 💳 Integração MercadoPago
├── 📊 Gerenciamento de Planos
├── 🗂️ Armazenamento em Memória
├── 📡 APIs REST
├── 🔄 Webhook Handler
└── 📋 Logs e Monitoramento
```

## 💾 Dados Armazenados

### **Pagamentos (Map):**
```javascript
{
  "monthly_1699027200000_user@email.com": {
    planId: "monthly",
    userEmail: "user@email.com",
    userName: "User Name",
    preferenceId: "pref-123",
    status: "approved",
    paymentId: "pay-456",
    createdAt: Date,
    updatedAt: Date
  }
}
```

### **Usuários Premium (Map):**
```javascript
{
  "user@email.com": {
    isPremium: true,
    planId: "monthly",
    activatedAt: Date,
    expirationDate: Date,
    paymentId: "pay-456"
  }
}
```

## 🎯 Planos Disponíveis

```javascript
const PREMIUM_PLANS = {
  monthly: {
    id: 'premium_monthly',
    title: 'WorkSwipe Premium Mensal',
    price: 19.90,
    description: 'Acesso premium por 1 mês'
  },
  yearly: {
    id: 'premium_yearly',
    title: 'WorkSwipe Premium Anual',
    price: 199.90,
    description: 'Acesso premium por 1 ano (2 meses grátis)'
  }
}
```

## 🔒 Segurança

### **Implementadas:**
- ✅ **CORS** configurado
- ✅ **Validação** de dados de entrada
- ✅ **Tratamento** de erros
- ✅ **Logs** detalhados
- ✅ **Timeout** configurado

### **Para Produção:**
- 🔐 **HTTPS** obrigatório
- 🛡️ **Rate Limiting**
- 📊 **Banco de dados** (PostgreSQL/MongoDB)
- 🔑 **Autenticação JWT**
- 🏗️ **Load Balancer**

## 🧪 Testes

### **Cartões de Teste MercadoPago:**

```
✅ Aprovado:
Mastercard: 5031 7557 3453 0604
Visa: 4509 9535 6623 3704
CVV: 123, Data: 11/25, Nome: APRO

❌ Rejeitado:
Mastercard: 5031 7557 3453 0604
CVV: 123, Data: 11/25, Nome: OTHE

⏳ Pendente:
Mastercard: 5031 7557 3453 0604  
CVV: 123, Data: 11/25, Nome: CONT
```

## 📊 Monitoramento

### **Status da API:**
```
GET http://localhost:3001/api/status
```

**Resposta:**
```json
{
  "status": "online",
  "timestamp": "2025-11-03T18:00:00.000Z",
  "paymentsCount": 5,
  "usersCount": 3
}
```

### **Logs no Console:**
```
🚀 Processador de pagamento rodando na porta 3001
📋 Status: http://localhost:3001/api/status
💳 Webhook: http://localhost:3001/api/webhook/mercadopago
Preferência criada: { id: "pref-123", planId: "monthly" }
Premium ativado para: user@email.com
```

## 🚀 Deploy em Produção

### **1. Preparar Ambiente:**
```bash
# Instalar dependências
npm install --production

# Configurar variáveis
export MERCADOPAGO_ACCESS_TOKEN="PROD-your-token"
export NODE_ENV="production"
export PORT="3001"
```

### **2. Iniciar com PM2:**
```bash
# Instalar PM2
npm install -g pm2

# Iniciar processo
pm2 start payment-server.js --name "workswipe-payments"

# Monitorar
pm2 logs workswipe-payments
pm2 status
```

### **3. Configurar Reverse Proxy (Nginx):**
```nginx
server {
    listen 443 ssl;
    server_name api.workswipe.com;
    
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 Próximas Melhorias

### **Planejadas:**
- 🗄️ **PostgreSQL**: Persistência de dados
- 🔑 **JWT Auth**: Autenticação de usuários
- 📧 **Email**: Notificações por email
- 📊 **Analytics**: Dashboard de vendas
- 🎯 **Cupons**: Sistema de desconto
- 🔔 **Push**: Notificações push
- 📱 **Mobile**: API para app mobile

---

## 🏠 **Página de Gerenciamento de Plano**

A página `manage-premium.html` oferece uma interface completa para administrar assinaturas premium:

### **Funcionalidades:**
- 📊 **Status Detalhado**: Visualização completa do plano atual
- 📅 **Datas Importantes**: Ativação, expiração e histórico
- ❌ **Cancelamento**: Interface intuitiva para cancelar planos
- 📝 **Feedback**: Formulário para coletar motivos de cancelamento
- 🔄 **Reativação**: Botões para reativar planos cancelados
- ✨ **Design Responsivo**: Interface adaptada para todos os dispositivos

### **Estados do Plano:**
1. **Premium Ativo**: Mostra detalhes e opções de cancelamento
2. **Premium Cancelado**: Histórico e opção de reativação
3. **Sem Premium**: Botão direto para assinar

### **Navegação:**
- Acesso via botão "Gerenciar Plano" na página premium
- Link de retorno para o WorkSwipe principal
- Integração completa com o sistema de autenticação

---

## ⚡ **Quick Start:**

```bash
# 1. Configurar credenciais no .env
# 2. Instalar dependências
npm install

# 3. Iniciar sistema completo
npm run dev:full

# 4. Testar pagamento
# Frontend: http://localhost:8000
# Backend: http://localhost:3001
```

## 🧪 **Testando o Sistema**

### **Ativação Manual Premium (Para Testes)**

Se você quiser testar o gerenciador de planos sem fazer um pagamento real:

1. **Abra o Console do Navegador** (F12 > Console)
2. **Execute o script de teste:**
   ```javascript
   // Copie e cole no console:
   localStorage.setItem('ws_premium', JSON.stringify(true));
   
   const premiumData = {
       isPremium: true,
       premiumPlan: 'monthly',
       premiumExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
   };
   localStorage.setItem('premiumStatus', JSON.stringify(premiumData));
   
   alert('Premium ativado! Recarregue a página.');
   ```

3. **Recarregue a página** para ver o plano ativo
4. **Acesse:** `http://localhost:8000/manage-premium.html`

### **Ou use o arquivo de teste:**
```javascript
// Carregue o arquivo test-premium.js no console
activateTestPremium(); // Ativar premium
deactivateTestPremium(); // Desativar premium
```

---

**🎉 Processador de pagamento pronto para uso!** 💳