// mercadopago-config.js
// Configuração e integração do MercadoPago para o WorkSwipe

// Configuração do MercadoPago
const MERCADOPAGO_CONFIG = {
    // IMPORTANTE: Substitua pela sua chave pública do MercadoPago
    // Para teste: use as credenciais de teste do MercadoPago
    // Para produção: use as credenciais reais
    publicKey: 'TEST-ed96bf65-751d-440f-a105-625be4fe4c29', // Substitua pela sua chave pública
    
    // URLs de callback (ajustar conforme necessário)
    callbacks: {
        success: window.location.origin + '/success.html',
        failure: window.location.origin + '/failure.html',
        pending: window.location.origin + '/pending.html'
    }
};

// Planos Premium disponíveis
const PREMIUM_PLANS = {
    monthly: {
        id: 'premium_monthly',
        title: 'Premium Mensal',
        price: 19.90,
        currency: 'BRL',
        description: 'Acesso premium por 1 mês',
        features: [
            'Super likes ilimitados',
            'Ver quem curtiu você',
            'Filtros avançados',
            'Prioridade nos matches'
        ]
    },
    yearly: {
        id: 'premium_yearly',
        title: 'Premium Anual',
        price: 199.90,
        currency: 'BRL',
        description: 'Acesso premium por 1 ano (2 meses grátis)',
        features: [
            'Super likes ilimitados',
            'Ver quem curtiu você',
            'Filtros avançados',
            'Prioridade nos matches',
            'Badge premium',
            'Suporte prioritário'
        ]
    }
};

// Classe para gerenciar pagamentos via MercadoPago
class MercadoPagoPayments {
    constructor() {
        this.mp = null;
        this.initialized = false;
    }

    // Inicializar o MercadoPago
    async initialize() {
        try {
            // Verificar se a chave pública está configurada
            if (MERCADOPAGO_CONFIG.publicKey === 'TEST-ed96bf65-751d-440f-a105-625be4fe4c29') {
                throw new Error('Chave pública do MercadoPago não configurada');
            }

            // Carregar o SDK do MercadoPago via CDN
            await this.loadMercadoPagoSDK();
            
            // Inicializar com a chave pública
            this.mp = new window.MercadoPago(MERCADOPAGO_CONFIG.publicKey);
            this.initialized = true;
            
            console.log('MercadoPago inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar MercadoPago:', error);
            return false;
        }
    }

    // Carregar SDK do MercadoPago dinamicamente
    loadMercadoPagoSDK() {
        return new Promise((resolve, reject) => {
            // Verificar se já foi carregado
            if (window.MercadoPago) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Criar preferência de pagamento
    async createPaymentPreference(planId) {
        try {
            const plan = PREMIUM_PLANS[planId];
            if (!plan) {
                throw new Error('Plano não encontrado');
            }

            // Dados do usuário atual
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            // Criar preferência de pagamento
            const preference = {
                items: [{
                    id: plan.id,
                    title: plan.title,
                    description: plan.description,
                    quantity: 1,
                    currency_id: plan.currency,
                    unit_price: plan.price
                }],
                payer: {
                    name: currentUser.name || 'Usuário WorkSwipe',
                    email: currentUser.email || 'usuario@workswipe.com'
                },
                back_urls: {
                    success: MERCADOPAGO_CONFIG.callbacks.success,
                    failure: MERCADOPAGO_CONFIG.callbacks.failure,
                    pending: MERCADOPAGO_CONFIG.callbacks.pending
                },
                auto_return: 'approved',
                external_reference: `${planId}_${currentUser.id || Date.now()}`,
                notification_url: window.location.origin + '/webhook/mercadopago'
            };

            // Aqui você precisará fazer uma requisição para seu backend
            // para criar a preferência no MercadoPago
            // Por enquanto, vamos simular a resposta
            const response = await this.createPreferenceOnBackend(preference);
            
            return response;
        } catch (error) {
            console.error('Erro ao criar preferência:', error);
            throw error;
        }
    }

    // Simular criação de preferência no backend
    async createPreferenceOnBackend(preference) {
        // IMPORTANTE: Esta função deve ser implementada no seu backend
        // Aqui está apenas uma simulação para desenvolvimento
        
        console.warn('AVISO: Usando simulação de backend. Implemente a criação real da preferência.');
        
        // Simulação da resposta do MercadoPago
        return {
            id: 'test-preference-id-' + Date.now(),
            init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-id',
            sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=test-preference-id'
        };
    }

    // Processar pagamento com Checkout Pro
    async processPayment(planId) {
        try {
            if (!this.initialized) {
                throw new Error('MercadoPago não foi inicializado');
            }

            // Criar preferência
            const preference = await this.createPaymentPreference(planId);
            
            // Redirecionar para o checkout do MercadoPago
            window.location.href = preference.sandbox_init_point || preference.init_point;
            
        } catch (error) {
            console.error('Erro no processamento do pagamento:', error);
            throw error;
        }
    }

    // Ativar premium localmente (para simulação)
    activatePremium(planId) {
        const plan = PREMIUM_PLANS[planId];
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Calcular data de expiração
        const expirationDate = new Date();
        if (planId === 'monthly') {
            expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else if (planId === 'yearly') {
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        }

        // Atualizar dados do usuário
        const premiumData = {
            isPremium: true,
            premiumPlan: planId,
            premiumExpiration: expirationDate.toISOString(),
            premiumFeatures: plan.features
        };

        // Salvar no localStorage
        Object.assign(currentUser, premiumData);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('premiumStatus', JSON.stringify(premiumData));

        console.log('Premium ativado:', premiumData);
        return premiumData;
    }

    // Verificar status premium
    isPremiumActive() {
        try {
            const premiumStatus = JSON.parse(localStorage.getItem('premiumStatus') || '{}');
            
            if (!premiumStatus.isPremium) return false;
            
            // Verificar se não expirou
            const expirationDate = new Date(premiumStatus.premiumExpiration);
            const now = new Date();
            
            return now < expirationDate;
        } catch (error) {
            console.error('Erro ao verificar status premium:', error);
            return false;
        }
    }

    // Obter dados do plano premium atual
    getCurrentPremiumPlan() {
        try {
            if (!this.isPremiumActive()) return null;
            
            const premiumStatus = JSON.parse(localStorage.getItem('premiumStatus') || '{}');
            return PREMIUM_PLANS[premiumStatus.premiumPlan] || null;
        } catch (error) {
            console.error('Erro ao obter plano premium:', error);
            return null;
        }
    }
}

// Instância global
const mercadoPagoPayments = new MercadoPagoPayments();

// Funções utilitárias para usar no HTML
window.MercadoPagoUtils = {
    initializeMercadoPago: () => mercadoPagoPayments.initialize(),
    processPayment: (planId) => mercadoPagoPayments.processPayment(planId),
    activatePremium: (planId) => mercadoPagoPayments.activatePremium(planId),
    isPremiumActive: () => mercadoPagoPayments.isPremiumActive(),
    getCurrentPremiumPlan: () => mercadoPagoPayments.getCurrentPremiumPlan(),
    getPremiumPlans: () => PREMIUM_PLANS
};

export { 
    mercadoPagoPayments, 
    PREMIUM_PLANS, 
    MERCADOPAGO_CONFIG 
};