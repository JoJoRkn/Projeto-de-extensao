// Script para ativar premium manualmente para testes
// Execute no console do navegador

function activateTestPremium() {
    // Ativar premium no formato do app principal
    localStorage.setItem('ws_premium', JSON.stringify(true));
    
    // Ativar premium no formato do sistema de pagamentos
    const premiumData = {
        isPremium: true,
        premiumPlan: 'monthly',
        premiumExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        premiumFeatures: ['unlimited_super_likes', 'see_who_likes', 'advanced_filters', 'priority_matches']
    };
    
    localStorage.setItem('premiumStatus', JSON.stringify(premiumData));
    
    // Atualizar dados do usuário atual
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    Object.assign(currentUser, premiumData);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    console.log('✅ Premium ativado para teste!');
    console.log('📊 Dados salvos:', {
        ws_premium: JSON.parse(localStorage.getItem('ws_premium')),
        premiumStatus: JSON.parse(localStorage.getItem('premiumStatus')),
        currentUser: JSON.parse(localStorage.getItem('currentUser'))
    });
    
    alert('Premium ativado! Recarregue a página para ver as mudanças.');
}

function deactivateTestPremium() {
    localStorage.setItem('ws_premium', JSON.stringify(false));
    localStorage.removeItem('premiumStatus');
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    delete currentUser.isPremium;
    delete currentUser.premiumPlan;
    delete currentUser.premiumExpiration;
    delete currentUser.premiumFeatures;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    console.log('❌ Premium desativado!');
    alert('Premium desativado! Recarregue a página para ver as mudanças.');
}

// Executar automaticamente para ativar premium
console.log('🔧 Script de teste carregado!');
console.log('📋 Para ativar premium: activateTestPremium()');
console.log('📋 Para desativar premium: deactivateTestPremium()');

// Status atual
console.log('📊 Status atual do premium:');
console.log('- ws_premium:', JSON.parse(localStorage.getItem('ws_premium') || 'false'));
console.log('- premiumStatus:', JSON.parse(localStorage.getItem('premiumStatus') || 'null'));