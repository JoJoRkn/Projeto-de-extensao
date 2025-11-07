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
            if (!MERCADOPAGO_CONFIG.publicKey || MERCADOPAGO_CONFIG.publicKey === 'TEST-your-public-key-here') {
                console.warn('MercadoPago: Chave pública não configurada - modo demonstração ativo');
                return false;
            }

            // Carregar o SDK do MercadoPago via CDN
            await this.loadMercadoPagoSDK();
            
            // Inicializar com a chave pública
            this.mp = new window.MercadoPago(MERCADOPAGO_CONFIG.publicKey);
            this.initialized = true;
            
            console.log('MercadoPago inicializado com sucesso');
            return true;
        } catch (error) {
            console.warn('MercadoPago não pôde ser inicializado:', error.message);
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
            
            // Fazer requisição para o backend
            const response = await fetch('http://localhost:3001/api/create-preference', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    planId: planId,
                    userEmail: currentUser.email || 'usuario@workswipe.com',
                    userName: currentUser.name || 'Usuário WorkSwipe'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao criar preferência');
            }

            const preferenceData = await response.json();
            return preferenceData;
            
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
            // Criar preferência no backend
            const preference = await this.createPaymentPreference(planId);
            
            // Salvar referência para rastreamento
            localStorage.setItem('workswipe_payment_reference', preference.externalReference);
            
            // Redirecionar para o checkout do MercadoPago
            const checkoutUrl = preference.sandboxInitPoint || preference.initPoint;
            window.location.href = checkoutUrl;
            
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

        // Salvar no localStorage (múltiplos formatos para compatibilidade)
        Object.assign(currentUser, premiumData);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('premiumStatus', JSON.stringify(premiumData));
        
        // Salvar também no formato usado pelo app principal
        localStorage.setItem('ws_premium', JSON.stringify(true));

        console.log('Premium ativado:', premiumData);
        return premiumData;
    }

    // Verificar status premium
    async isPremiumActive() {
        try {
            // Primeiro verificar localmente
            const localPremiumStatus = JSON.parse(localStorage.getItem('premiumStatus') || '{}');
            
            // Se tiver dados locais válidos, usar eles
            if (localPremiumStatus.isPremium) {
                const expirationDate = new Date(localPremiumStatus.premiumExpiration);
                const now = new Date();
                
                if (now < expirationDate) {
                    return true;
                }
            }

            // Verificar no backend se disponível
            try {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                if (currentUser.email) {
                    const response = await fetch(`http://localhost:3001/api/user-premium/${encodeURIComponent(currentUser.email)}`);
                    
                    if (response.ok) {
                        const premiumData = await response.json();
                        
                        // Atualizar dados locais
                        if (premiumData.isPremium) {
                            const updatedStatus = {
                                isPremium: true,
                                premiumPlan: premiumData.planId,
                                premiumExpiration: premiumData.expirationDate,
                                syncedAt: new Date().toISOString()
                            };
                            localStorage.setItem('premiumStatus', JSON.stringify(updatedStatus));
                        }
                        
                        return premiumData.isPremium;
                    }
                }
            } catch (backendError) {
                console.warn('Backend não disponível, usando dados locais:', backendError.message);
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao verificar status premium:', error);
            return false;
        }
    }

    // Versão síncrona para compatibilidade
    isPremiumActiveSync() {
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

    // Cancelar plano premium
    async cancelPremium(reason = null) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            if (!currentUser.email) {
                // Se não há usuário, criar um padrão
                currentUser.email = 'usuario@workswipe.com';
            }

            let cancelData = {
                success: true,
                cancelledAt: new Date().toISOString(),
                planId: 'monthly',
                reason: reason
            };

            // Tentar fazer requisição para o backend (opcional)
            try {
                const response = await fetch('http://localhost:3001/api/cancel-premium', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userEmail: currentUser.email,
                        reason: reason
                    })
                });

                if (response.ok) {
                    const backendData = await response.json();
                    cancelData = { ...cancelData, ...backendData };
                }
            } catch (backendError) {
                console.warn('Backend indisponível, cancelando localmente:', backendError.message);
                // Continuar com cancelamento local
            }

            // Atualizar dados locais
            const premiumStatus = {
                isPremium: false,
                cancelledAt: cancelData.cancelledAt,
                cancellationReason: reason,
                lastPlanId: cancelData.planId
            };

            localStorage.setItem('premiumStatus', JSON.stringify(premiumStatus));
            localStorage.setItem('ws_premium', JSON.stringify(false));

            console.log('Plano cancelado com sucesso:', cancelData);
            return cancelData;

        } catch (error) {
            console.error('Erro ao cancelar plano:', error);
            throw error;
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
    cancelPremium: (reason) => mercadoPagoPayments.cancelPremium(reason),
    isPremiumActive: () => mercadoPagoPayments.isPremiumActiveSync(),
    isPremiumActiveAsync: () => mercadoPagoPayments.isPremiumActive(),
    getCurrentPremiumPlan: () => mercadoPagoPayments.getCurrentPremiumPlan(),
    getPremiumPlans: () => PREMIUM_PLANS,
    checkPaymentStatus: (externalReference) => {
        return fetch(`http://localhost:3001/api/payment-status/${externalReference}`)
            .then(response => response.json());
    }
};

export { 
    mercadoPagoPayments, 
    PREMIUM_PLANS, 
    MERCADOPAGO_CONFIG 
};