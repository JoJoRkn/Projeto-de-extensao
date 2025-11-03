# 💳 Configuração do MercadoPago - WorkSwipe

Este documento explica como configurar e usar a integração do MercadoPago no WorkSwipe.

## 📋 Pré-requisitos

1. **Conta no MercadoPago**: Crie uma conta em [mercadopago.com.br](https://www.mercadopago.com.br/)
2. **Credenciais de API**: Obtenha suas chaves pública e privada no painel do MercadoPago
3. **Node.js**: Para executar o servidor local (já instalado)

## ⚙️ Configuração Inicial

### 1. Configurar Credenciais do MercadoPago

Abra o arquivo `assets/js/mercadopago-config.js` e substitua as credenciais:

```javascript
const MERCADOPAGO_CONFIG = {
    // IMPORTANTE: Substitua pelas suas credenciais
    publicKey: 'SUA_CHAVE_PUBLICA_AQUI', // Ex: 'TEST-12345678-abcd...'
    
    callbacks: {
        success: window.location.origin + '/success.html',
        failure: window.location.origin + '/failure.html',
        pending: window.location.origin + '/pending.html'
    }
};
```

### 2. Obter Credenciais

#### Para Teste (Sandbox):
1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Selecione "Credenciais de teste"
3. Copie a "Chave pública de teste"

#### Para Produção:
1. Complete o processo de verificação da conta
2. Acesse as "Credenciais de produção"
3. Copie a "Chave pública de produção"

## 🚀 Como Usar

### 1. Acessar os Planos Premium

No WorkSwipe, clique no botão **"Premium"** no topo da tela. Isso abrirá a página `premium.html` com os planos disponíveis.

### 2. Escolher um Plano

- **Premium Mensal**: R$ 19,90/mês
- **Premium Anual**: R$ 199,90/ano (2 meses grátis)

### 3. Processo de Pagamento

1. Clique em "Escolher Mensal" ou "Escolher Anual"
2. Confirme a compra no modal
3. **Para demonstração**: O sistema ativa o premium imediatamente
4. **Para produção**: Seria redirecionado para o checkout do MercadoPago

## 🔧 Implementação Backend (Necessário para Produção)

Para usar em produção, você precisa implementar um backend que:

### 1. Crie Preferências de Pagamento

```javascript
// Exemplo Node.js com Express
const mercadopago = require('mercadopago');

mercadopago.configure({
    access_token: 'SUA_CHAVE_PRIVADA_AQUI'
});

app.post('/create_preference', (req, res) => {
    const preference = {
        items: [{
            id: req.body.planId,
            title: req.body.title,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: req.body.price
        }],
        back_urls: {
            success: 'https://seudominio.com/success.html',
            failure: 'https://seudominio.com/failure.html',
            pending: 'https://seudominio.com/pending.html'
        },
        auto_return: 'approved'
    };

    mercadopago.preferences.create(preference)
        .then(response => res.json(response.body))
        .catch(error => res.status(500).json(error));
});
```

### 2. Webhook para Notificações

```javascript
app.post('/webhook/mercadopago', (req, res) => {
    const { type, data } = req.body;
    
    if (type === 'payment') {
        // Verificar status do pagamento
        mercadopago.payment.findById(data.id)
            .then(payment => {
                if (payment.body.status === 'approved') {
                    // Ativar premium do usuário
                    activatePremiumForUser(payment.body.external_reference);
                }
            });
    }
    
    res.status(200).send('OK');
});
```

## 🔒 Recursos Premium Implementados

### Funcionalidades Ativas:

- ✅ **Interface de Planos**: Página premium.html com planos mensais/anuais
- ✅ **Verificação de Status**: Função `isPremiumActive()` integrada
- ✅ **Super Likes**: Bloqueio para usuários gratuitos
- ✅ **Sistema de Callbacks**: Páginas success/failure/pending
- ✅ **Armazenamento Local**: Premium salvo no localStorage
- ✅ **Interface Atualizada**: Status premium visível na UI

### Para Implementar (Backend):

- ⏳ **Pagamentos Reais**: Integração com API do MercadoPago
- ⏳ **Webhooks**: Confirmação automática de pagamentos
- ⏳ **Banco de Dados**: Persistir status premium no servidor
- ⏳ **Autenticação**: Validar usuário logado

## 🧪 Modo de Demonstração

Atualmente o sistema está em **modo demonstração**:

- ✅ Interfaces funcionais
- ✅ Fluxo de pagamento simulado
- ✅ Ativação imediata do premium
- ⚠️ Sem cobrança real
- ⚠️ Premium salvo apenas localmente

## 📱 Planos Disponíveis

### Premium Mensal - R$ 19,90
- Super likes ilimitados
- Ver quem curtiu você
- Filtros avançados
- Prioridade nos matches

### Premium Anual - R$ 199,90
- Todos os recursos do mensal
- Badge premium exclusivo
- Suporte prioritário
- 2 meses grátis (economia de R$ 38,80)

## 🛠️ Arquivos Criados/Modificados

### Novos Arquivos:
- `assets/js/mercadopago-config.js` - Configuração e lógica do MercadoPago
- `premium.html` - Interface de planos premium
- `success.html` - Página de pagamento aprovado
- `failure.html` - Página de pagamento rejeitado
- `pending.html` - Página de pagamento pendente

### Arquivos Modificados:
- `assets/js/app.js` - Integração com sistema de premium
- `package.json` - Dependência MercadoPago adicionada

## 🔍 Testes

### Para Testar Localmente:

1. **Iniciar servidor**:
   ```bash
   npm start
   ```

2. **Acessar**: http://localhost:8000

3. **Testar fluxo**:
   - Fazer login
   - Clicar em "Premium"
   - Escolher um plano
   - Confirmar compra
   - Verificar ativação

### Cartões de Teste MercadoPago:

```
Mastercard: 5031 7557 3453 0604
Visa: 4509 9535 6623 3704
CVV: 123
Data: 11/25
Nome: APRO (aprovado) / OTHE (rejeitado)
```

## 📞 Suporte

- **MercadoPago**: https://www.mercadopago.com.br/developers/
- **Documentação**: https://www.mercadopago.com.br/developers/pt/docs
- **Status API**: https://status.mercadopago.com/

## 🚨 Próximos Passos

1. **Implementar Backend**: Criar APIs para preferências e webhooks
2. **Configurar Webhooks**: Para confirmação automática
3. **Adicionar Banco de Dados**: PostgreSQL/MySQL para persistir dados
4. **Implementar Autenticação**: JWT ou sessões
5. **Deploy**: Hospedar em servidor com HTTPS
6. **Certificação PCI**: Para lidar com dados de pagamento

---

**🎉 Parabéns! O MercadoPago foi integrado com sucesso ao WorkSwipe!**