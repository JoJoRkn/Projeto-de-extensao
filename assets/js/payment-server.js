const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar MercadoPago com a chave privada
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-your-access-token-here',
    options: {
        timeout: 5000,
        idempotencyKey: 'abc123'
    }
});

// Inicializar preferências e pagamentos
const preference = new Preference(client);
const payment = new Payment(client);

// Armazenamento temporário de usuários (em produção, usar banco de dados)
const users = new Map();
const payments = new Map();

// Planos disponíveis
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
};

// Rota para criar preferência de pagamento
app.post('/api/create-preference', async (req, res) => {
    try {
        const { planId, userEmail, userName } = req.body;
        
        // Validar dados
        if (!planId || !PREMIUM_PLANS[planId]) {
            return res.status(400).json({ error: 'Plano inválido' });
        }
        
        if (!userEmail) {
            return res.status(400).json({ error: 'Email obrigatório' });
        }

        const plan = PREMIUM_PLANS[planId];
        const externalReference = `${planId}_${Date.now()}_${userEmail}`;

        // Criar preferência no MercadoPago
        const preferenceData = {
            items: [{
                id: plan.id,
                title: plan.title,
                description: plan.description,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: plan.price
            }],
            payer: {
                name: userName || 'Usuário WorkSwipe',
                email: userEmail
            },
            back_urls: {
                success: `${req.protocol}://${req.get('host')}/payment/success`,
                failure: `${req.protocol}://${req.get('host')}/payment/failure`,
                pending: `${req.protocol}://${req.get('host')}/payment/pending`
            },
            auto_return: 'approved',
            external_reference: externalReference,
            notification_url: `${req.protocol}://${req.get('host')}/api/webhook/mercadopago`,
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
        };

        const response = await preference.create({
            body: preferenceData
        });

        // Salvar referência do pagamento
        payments.set(externalReference, {
            planId,
            userEmail,
            userName,
            preferenceId: response.id,
            status: 'pending',
            createdAt: new Date()
        });

        console.log('Preferência criada:', {
            id: response.id,
            externalReference,
            planId,
            userEmail
        });

        res.json({
            preferenceId: response.id,
            initPoint: response.init_point,
            sandboxInitPoint: response.sandbox_init_point,
            externalReference
        });

    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor', 
            message: error.message 
        });
    }
});

// Rota para consultar status de pagamento
app.get('/api/payment-status/:externalReference', async (req, res) => {
    try {
        const { externalReference } = req.params;
        
        const paymentData = payments.get(externalReference);
        if (!paymentData) {
            return res.status(404).json({ error: 'Pagamento não encontrado' });
        }

        res.json({
            status: paymentData.status,
            planId: paymentData.planId,
            userEmail: paymentData.userEmail,
            createdAt: paymentData.createdAt,
            updatedAt: paymentData.updatedAt
        });

    } catch (error) {
        console.error('Erro ao consultar status:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para cancelar plano premium
app.post('/api/cancel-premium', async (req, res) => {
    try {
        const { userEmail, reason } = req.body;
        
        // Validar dados
        if (!userEmail) {
            return res.status(400).json({ error: 'Email obrigatório' });
        }

        // Verificar se o usuário tem premium ativo
        const userData = users.get(userEmail);
        if (!userData || !userData.isPremium) {
            return res.status(404).json({ error: 'Usuário não possui plano premium ativo' });
        }

        // Cancelar o premium
        const cancelledData = {
            ...userData,
            isPremium: false,
            cancelledAt: new Date(),
            cancellationReason: reason || 'Cancelamento solicitado pelo usuário',
            originalExpirationDate: userData.expirationDate,
            expirationDate: new Date() // Expira imediatamente
        };

        users.set(userEmail, cancelledData);

        console.log('Premium cancelado para:', userEmail, {
            planId: userData.planId,
            reason: reason || 'Não informado',
            cancelledAt: cancelledData.cancelledAt
        });

        res.json({
            success: true,
            message: 'Plano premium cancelado com sucesso',
            cancelledAt: cancelledData.cancelledAt,
            planId: userData.planId
        });

    } catch (error) {
        console.error('Erro ao cancelar premium:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Webhook para receber notificações do MercadoPago
app.post('/api/webhook/mercadopago', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        console.log('Webhook recebido:', { type, data });

        if (type === 'payment') {
            // Buscar detalhes do pagamento
            const paymentDetails = await payment.get({ id: data.id });
            
            console.log('Detalhes do pagamento:', {
                id: paymentDetails.id,
                status: paymentDetails.status,
                external_reference: paymentDetails.external_reference
            });

            // Atualizar status local
            if (paymentDetails.external_reference) {
                const paymentData = payments.get(paymentDetails.external_reference);
                
                if (paymentData) {
                    paymentData.status = paymentDetails.status;
                    paymentData.paymentId = paymentDetails.id;
                    paymentData.updatedAt = new Date();
                    
                    // Se aprovado, ativar premium do usuário
                    if (paymentDetails.status === 'approved') {
                        await activateUserPremium(paymentData);
                    }
                    
                    payments.set(paymentDetails.external_reference, paymentData);
                    
                    console.log('Status atualizado:', {
                        externalReference: paymentDetails.external_reference,
                        status: paymentDetails.status
                    });
                }
            }
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Função para ativar premium do usuário
async function activateUserPremium(paymentData) {
    try {
        const { planId, userEmail } = paymentData;
        const plan = PREMIUM_PLANS[planId];
        
        // Calcular data de expiração
        const expirationDate = new Date();
        if (planId === 'monthly') {
            expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else if (planId === 'yearly') {
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        }

        // Salvar dados do premium do usuário
        const premiumData = {
            isPremium: true,
            planId,
            activatedAt: new Date(),
            expirationDate,
            paymentId: paymentData.paymentId
        };

        users.set(userEmail, premiumData);
        
        console.log('Premium ativado para:', userEmail, premiumData);
        
        // Aqui você poderia enviar email de confirmação, etc.
        
    } catch (error) {
        console.error('Erro ao ativar premium:', error);
    }
}

// Rota para verificar status premium do usuário
app.get('/api/user-premium/:email', (req, res) => {
    try {
        const { email } = req.params;
        const userData = users.get(email);
        
        if (!userData) {
            return res.json({ isPremium: false });
        }

        // Verificar se não expirou
        const now = new Date();
        const expired = now > new Date(userData.expirationDate);
        
        if (expired) {
            userData.isPremium = false;
            users.set(email, userData);
        }

        res.json({
            isPremium: userData.isPremium && !expired,
            planId: userData.planId,
            expirationDate: userData.expirationDate,
            activatedAt: userData.activatedAt,
            cancelledAt: userData.cancelledAt,
            cancellationReason: userData.cancellationReason,
            originalExpirationDate: userData.originalExpirationDate
        });

    } catch (error) {
        console.error('Erro ao verificar premium:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas de callback para páginas do frontend
app.get('/payment/success', (req, res) => {
    const { payment_id, status, external_reference } = req.query;
    
    // Redirecionar para o frontend com parâmetros
    const frontendUrl = `http://localhost:8000/success.html?payment_id=${payment_id}&status=${status}&external_reference=${external_reference}`;
    res.redirect(frontendUrl);
});

app.get('/payment/failure', (req, res) => {
    const { payment_id, status, external_reference } = req.query;
    
    const frontendUrl = `http://localhost:8000/failure.html?payment_id=${payment_id}&status=${status}&external_reference=${external_reference}`;
    res.redirect(frontendUrl);
});

app.get('/payment/pending', (req, res) => {
    const { payment_id, status, external_reference } = req.query;
    
    const frontendUrl = `http://localhost:8000/pending.html?payment_id=${payment_id}&status=${status}&external_reference=${external_reference}`;
    res.redirect(frontendUrl);
});

// Rota de status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        paymentsCount: payments.size,
        usersCount: users.size
    });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🚀 Processador de pagamento rodando na porta ${port}`);
    console.log(`📋 Status: http://localhost:${port}/api/status`);
    console.log(`💳 Webhook: http://localhost:${port}/api/webhook/mercadopago`);
    
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN === 'TEST-your-access-token-here') {
        console.warn('⚠️  ATENÇÃO: Configure a variável MERCADOPAGO_ACCESS_TOKEN no arquivo .env');
    }
});

module.exports = app;