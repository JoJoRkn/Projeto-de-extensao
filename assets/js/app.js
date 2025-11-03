import { auth, logoutUser, fetchProfiles, updateUserData } from './firebase-config.js';
import { buildCard as deckBuildCard, renderDeck as deckRenderDeck, animateOff as deckAnimateOff } from './deck.js';
import { updateHeaderDOM, renderMatchesList, showConfirmModal, showToast as uiShowToast } from './ui.js';
import { mercadoPagoPayments } from './mercadopago-config.js';

/* app.js
 * WorkSwipe - protótipo de frontend
 * Comportamentos:
 * - Modo "Contratar" / "Procurar"
 * - Swipe com mouse/touch (arrastar cartão)
 * - Like / Reject / Super (super é premium)
 * - Simulação de compra premium via localStorage
 * - Histórico de matches em localStorage
 */

(() => {
  // ---------------------------
  // Handler do botão de logout
  // ---------------------------
// Observação: imports movidos para o topo do arquivo (script carregado como module).


// Encontre a função de logout existente e substitua por esta:
async function logout() {
    try {
        // Se o Firebase estiver disponível, faça signOut via wrapper
        try { await logoutUser(); } catch (err) { /* ignore if not configured */ }
        localStorage.removeItem('currentUser'); // Limpa o usuário do localStorage

    // Redireciona para a página de login (index)
    window.location.href = 'index.html';

    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    }
}

// Certifique-se de que o botão de logout chama essa nova função.
// O seu código já faz isso:
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // ---------------------------
  // Dados iniciais (mock)
  // ---------------------------
  const seedProfiles = [
    // Empresas (employer)
    {
      id: 'e1',
      type: 'employer',
      name: 'Casa do Código',
      title: 'Desenvolvedor Front-end',
      area: 'desenvolvimento',
      location: 'São Paulo',
      remote: 'yes',
      bio: 'Equipe ágil, projetos SaaS, React/NextJS.',
      img: 'https://images.unsplash.com/photo-1581091215367-59ab6b128de4?auto=format&fit=crop&w=800&q=60'
    },
    {
      id: 'e2',
      type: 'employer',
      name: 'Agência Aurora',
      title: 'Designer UI/UX',
      area: 'design',
      location: 'Rio de Janeiro',
      remote: 'no',
      bio: 'Trabalhos para marcas e e-commerces.',
      img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=60'
    },
    {
      id: 'e3',
      type: 'employer',
      name: 'SalesPro',
      title: 'Especialista em Vendas',
      area: 'vendas',
      location: 'Remoto',
      remote: 'yes',
      bio: 'Time comercial focado em B2B.',
      img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=60'
    },

    // Candidatos (candidate)
    {
      id: 'c1',
      type: 'candidate',
      name: 'Pedro Silva',
      title: 'Fullstack Developer',
      area: 'desenvolvimento',
      location: 'São Paulo',
      remote: 'yes',
      bio: 'Node.js, React, AWS. 5 anos de experiência.',
      img: 'https://randomuser.me/api/portraits/men/75.jpg'
    },
    {
      id: 'c2',
      type: 'candidate',
      name: 'Ana Souza',
      title: 'Product Designer',
      area: 'design',
      location: 'Belo Horizonte',
      remote: 'no',
      bio: 'Foco em design centrado no usuário.',
      img: 'https://randomuser.me/api/portraits/women/68.jpg'
    },
    {
      id: 'c3',
      type: 'candidate',
      name: 'Lucas Oliveira',
      title: 'Analista de Marketing',
      area: 'marketing',
      location: 'Fortaleza',
      remote: 'yes',
      bio: 'Marketing digital e performance.',
      img: 'https://randomuser.me/api/portraits/men/51.jpg'
    }
  ];

  // ---------------------------
  // Elementos DOM
  // ---------------------------
  const modeToggle = document.getElementById('modeToggle');
  const modeLabel = document.getElementById('modeLabel');
  // fallback: the HTML uses a .container.cards area for the simple UI
  const cardDeck = document.getElementById('cardDeck') || document.querySelector('.container.cards');
  const btnLike = document.getElementById('btnLike') || document.getElementById('likeBtn');
  const btnReject = document.getElementById('btnReject') || document.getElementById('dislikeBtn');
  const btnBio = document.getElementById('btnBio');
  const btnSuper = document.getElementById('btnSuper');
  const openPremium = document.getElementById('openPremium');
  const modalPremium = document.getElementById('modalPremium');
  const closePremium = document.getElementById('closePremium');
  const buys = document.querySelectorAll('.buy') || [];
  const statViews = document.getElementById('statViews');
  const statLikes = document.getElementById('statLikes');
  const statPremium = document.getElementById('statPremium');
  const matchesList = document.getElementById('matchesList');

  const userNameInput = document.getElementById('userName');
  const userRoleSelect = document.getElementById('userRole');
  const saveProfile = document.getElementById('saveProfile') || document.getElementById('saveProfile');
  const userAvatar = document.getElementById('userAvatar');

  const filterLocation = document.getElementById('filterLocation');
  const filterArea = document.getElementById('filterArea');
  const filterRemote = document.getElementById('filterRemote');
  const applyFilters = document.getElementById('applyFilters');
  const clearFilters = document.getElementById('clearFilters');

  // confirm modal elements
  const modalConfirm = document.getElementById('modalConfirm');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmBody = document.getElementById('confirmBody');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  // ---------------------------
  // Estado
  // ---------------------------
  let mode = localStorage.getItem('ws_mode') || 'employer'; // default: Contratar (ver candidatos) => employer sees candidates
  // mapping: mode 'employer' means user is contratante (looking for candidates)
  // mode 'candidate' means user is candidat@ (looking for vagas/empresas)
  let profiles = JSON.parse(localStorage.getItem('ws_profiles')) || [];
  let deck = []; // perfis filtrados atualmente
  let topCard = null;
  let premium = JSON.parse(localStorage.getItem('ws_premium')) || false;
  
  // Função para verificar status premium via MercadoPago
  function checkPremiumStatus() {
    try {
      return mercadoPagoPayments.isPremiumActive();
    } catch (error) {
      console.error('Erro ao verificar premium:', error);
      return premium; // fallback para o sistema antigo
    }
  }
  let stat = JSON.parse(localStorage.getItem('ws_stat')) || { views: 0, likes: 0 };
  let matches = JSON.parse(localStorage.getItem('ws_matches')) || [];

  // ---------------------------
  // Utils
  // ---------------------------
  function saveState(){
    localStorage.setItem('ws_profiles', JSON.stringify(profiles));
    localStorage.setItem('ws_premium', JSON.stringify(premium));
    localStorage.setItem('ws_stat', JSON.stringify(stat));
    localStorage.setItem('ws_matches', JSON.stringify(matches));
    localStorage.setItem('ws_mode', mode);
  }

  function randomColorSeed(name){
    // Generate deterministic pastel bg by name
    let h = 0;
    for (let i=0;i<name.length;i++) h = (h*31 + name.charCodeAt(i)) % 360;
    return `linear-gradient(135deg,hsl(${h}deg 60% 60%), hsl(${(h+40)%360}deg 60% 50%))`;
  }

  // ---------------------------
  // UI Rendering (delegado a ui.js e deck.js)
  // ---------------------------
  function updateHeader(){
    // Atualizar status premium
    premium = checkPremiumStatus();
    updateHeaderDOM({modeLabel, statViews, statLikes, statPremium}, {mode, stat, premium});
  }

  function renderMatches(){
    renderMatchesList(matchesList, matches);
  }

  function renderDeck(){
    // deckBuildCard espera (profile, randomColorSeed)
    const wrapperBuildCard = (p) => {
      const c = deckBuildCard(p, randomColorSeed);
      // Botão 'Ver bio' dentro do card
      try{
        const info = c.querySelector('.info');
        if(info){
          const btnBio = document.createElement('button');
          btnBio.className = 'btn small';
          btnBio.textContent = 'Ver bio';
          btnBio.addEventListener('click', (e)=>{ e.stopPropagation(); openBio(p); });
          info.appendChild(btnBio);
        }
        // Atalho: abrir bio com duplo clique no card
        c.addEventListener('dblclick', (e)=>{ e.stopPropagation(); openBio(p); });
      } catch {}
      return c;
    };
    topCard = deckRenderDeck(cardDeck, deck, makeCardDraggable, wrapperBuildCard);
  }

  function buildDeckFromProfiles(){
    const targetType = mode === 'employer' ? 'candidate' : 'employer';
    const loc = filterLocation ? filterLocation.value.trim().toLowerCase() : '';
    const area = filterArea ? filterArea.value : '';
    const remote = filterRemote ? filterRemote.value : '';

    deck = profiles.filter(p => p.type === targetType)
      .filter(p => {
        if(loc && !p.location.toLowerCase().includes(loc)) return false;
        if(area && area !== '' && p.area !== area) return false;
        if(remote && remote !== '' && p.remote !== remote) return false;
        return true;
      });

    // shuffle deck slightly
    deck = deck.sort(() => Math.random() - 0.5);
    stat.views += deck.length;
    updateHeader();
    saveState();
    renderDeck();
  }

  // ---------------------------
  // Login system (added)
  // ---------------------------
  // Login agora é gerenciado pelo iframe `login.html` e pelos helpers Firebase (registerUser/loginUser/getUserData).
  // O fallback local (login via localStorage) foi removido para evitar duplicação.

  // ---------------------------
  // Interações do cartão (arrastar)
  // ---------------------------
  function makeCardDraggable(card){
    let pointerId = null;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let isDragging = false;

    const onPointerDown = (e) => {
      e.preventDefault();
      pointerId = e.pointerId;
      (e.target).setPointerCapture(pointerId);
      startX = e.clientX;
      startY = e.clientY;
      isDragging = true;
      card.style.transition = 'none';
    };

    const onPointerMove = (e) => {
      if(!isDragging || e.pointerId !== pointerId) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;
      const rot = Math.min(25, Math.max(-25, currentX / 12));
      card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rot}deg)`;
      // visual cue: change opacity
      const opacity = Math.min(1, Math.abs(currentX) / 200);
      card.style.opacity = 1 - Math.min(0.2, opacity * 0.2);
    };

    const onPointerUp = (e) => {
      if(e.pointerId !== pointerId) return;
      isDragging = false;
      (e.target).releasePointerCapture(pointerId);
      card.style.transition = 'transform 250ms cubic-bezier(.2,.9,.3,1), opacity 200ms';
      // decide final position
      const threshold = 120;
      const dx = currentX;
      if(dx > threshold){
        // like
        animateOff(card, 1);
        handleLike(card.dataset.id, false);
      } else if(dx < -threshold){
        // reject
        animateOff(card, -1);
        // no further action for reject
      } else {
        card.style.transform = '';
        card.style.opacity = 1;
      }
      // reset
      pointerId = null;
      startX = startY = currentX = currentY = 0;
    };

    card.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }

  function animateOff(card, dir){
    // delegate animation and removal to deck module
    deckAnimateOff(card, dir, (id) => {
      deck = deck.filter(d => d.id !== id);
      renderDeck();
    });
  }

  // ---------------------------
  // Bio Overlay
  // ---------------------------
  const bioOverlay = document.getElementById('bioOverlay');
  const bioClose = document.getElementById('bioClose');
  const bioName = document.getElementById('bioName');
  const bioTitleEl = document.getElementById('bioTitle');
  const bioImage = document.getElementById('bioImage');
  const bioText = document.getElementById('bioText');
  const bioMeta = document.getElementById('bioMeta');

  function openBio(profile){
    if(!bioOverlay) return;
    if(bioName) bioName.textContent = profile.name || '';
    if(bioTitleEl) bioTitleEl.textContent = profile.title ? profile.title : (profile.area || '');
    if(bioImage){
      if(profile.img){
        bioImage.src = profile.img;
      } else {
        // cria um canvas/padrão simples ou deixa sem src
        bioImage.removeAttribute('src');
        bioImage.style.background = randomColorSeed(profile.name || 'perfil');
        bioImage.style.height = '280px';
      }
    }
    if(bioText) bioText.textContent = profile.bio || '';
    if(bioMeta){
      bioMeta.innerHTML = '';
      const items = [
        profile.type === 'employer' ? 'Empresa' : 'Candidato',
        profile.location,
        profile.area,
        profile.remote === 'yes' ? 'Remoto' : (profile.remote === 'no' ? 'Presencial' : '')
      ].filter(Boolean);
      items.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        bioMeta.appendChild(span);
      });
    }
    bioOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeBio(){
    if(!bioOverlay) return;
    bioOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
  if(bioClose) bioClose.addEventListener('click', closeBio);
  if(bioOverlay) bioOverlay.addEventListener('click', (e)=>{
    if(e.target === bioOverlay) closeBio();
  });

  // ---------------------------
  // Ações: curtir, super, rejeitar
  // ---------------------------
  function getProfileById(id){
    return profiles.find(p => p.id === id) || null;
  }

// Em app.js
async function handleLike(id, isSuper) {
  const profile = getProfileById(id);
  if(!profile) return;

  stat.likes++;
  const newMatch = { id: profile.id, name: profile.name, title: profile.title, time: Date.now(), super: !!isSuper };
  matches.push(newMatch);

  // --- IMPLEMENTAÇÃO AQUI ---
  // Em vez de saveState(), atualize o Firestore
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.uid) {
      await updateUserData(currentUser.uid, {
        matches: matches, // Envia a lista inteira de matches
        stats: stat       // Envia as estatísticas
      });
    }
  } catch (error) {
    console.error("Erro ao salvar match no Firestore:", error);
    uiShowToast("Erro ao salvar seu match.", true);
  }
  // saveState(); // Você pode remover ou manter isso para fallback offline

  updateHeader();
  renderMatches();

  const card = cardDeck.querySelector(`.card[data-id="${id}"]`);
  if(card) animateOff(card, 1);
  uiShowToast(`Você curtiu ${profile.name}` + (isSuper ? ' (SUPER)!' : ''));
}

  // ---------------------------
  // Botões
  // ---------------------------
  if (btnLike) {
    btnLike.addEventListener('click', () => {
      const top = cardDeck && cardDeck.querySelector ? cardDeck.querySelector('.card:last-child') : null;
  if(!top) { uiShowToast('Sem perfis por enquanto'); return; }
      handleLike(top.dataset.id, false);
    });
  }

  if (btnReject) {
    btnReject.addEventListener('click', () => {
      const top = cardDeck && cardDeck.querySelector ? cardDeck.querySelector('.card:last-child') : null;
      if(!top) { uiShowToast('Sem perfis por enquanto'); return; }
      animateOff(top, -1);
    });
  }

  if (btnBio) {
    btnBio.addEventListener('click', () => {
      const top = cardDeck && cardDeck.querySelector ? cardDeck.querySelector('.card:last-child') : null;
      if(!top) { uiShowToast('Sem perfis por enquanto'); return; }
      const profile = getProfileById(top.dataset.id);
      if(profile) openBio(profile);
    });
  }

  if (btnSuper) {
    btnSuper.addEventListener('click', () => {
      const isPremium = checkPremiumStatus();
      if(!isPremium){
        showConfirmModal(modalConfirm, confirmTitle, confirmBody, confirmYes, confirmNo, 'Recurso Premium', 'Super Like é um recurso premium. Quer adquirir o Premium?', () => {
          window.location.href = 'premium.html';
        });
        return;
      }
      const top = cardDeck && cardDeck.querySelector ? cardDeck.querySelector('.card:last-child') : null;
      if(!top) { uiShowToast('Sem perfis por enquanto'); return; }
      handleLike(top.dataset.id, true);
    });
  }

  // ---------------------------
  // Alternar modo
  // ---------------------------
  if (modeToggle) modeToggle.addEventListener('click', () => {
    // toggle user mode
    mode = mode === 'employer' ? 'candidate' : 'employer';
    localStorage.setItem('ws_mode', mode);
    buildDeckFromProfiles();
    updateHeader();
    uiShowToast('Modo alterado: ' + (mode === 'employer' ? 'Contratar' : 'Procurar'));
  });

  // ---------------------------
  // Premium - Redirecionar para página de planos
  // ---------------------------
  if (openPremium) openPremium.addEventListener('click', () => {
    window.location.href = 'premium.html';
  });

  if (buys && buys.length) buys.forEach(b => {
    b.addEventListener('click', () => {
      const plan = b.dataset.plan;
      // simulate payment flow — here apenas confirm
          showConfirmModal(modalConfirm, confirmTitle, confirmBody, confirmYes, confirmNo, 'Comprar Premium', `Deseja comprar o plano ${plan}?`, () => {
        // simulate success
        premium = true;
        saveState();
        updateHeader();
        if (modalPremium) modalPremium.classList.add('hidden');
            uiShowToast('Compra realizada! Premium ativado. ✨');
      });
    });
  });

  // ---------------------------
  // Profile setup
  // ---------------------------
  if (saveProfile) saveProfile.addEventListener('click', () => {
    const name = userNameInput.value.trim();
    const role = userRoleSelect.value; // candidate or employer
    if(!name){
      uiShowToast('Digite um nome para seu perfil');
      return;
    }
    // create or update a pseudo-user profile in local storage (not used in matching logic for now)
    localStorage.setItem('ws_user', JSON.stringify({ name, role }));
    userAvatar.style.background = randomColorSeed(name);
    uiShowToast('Perfil salvo: ' + name);
  });

  // ---------------------------
  // Filters
  // ---------------------------
  if (applyFilters) applyFilters.addEventListener('click', () => {
    buildDeckFromProfiles();
  });
  if (clearFilters) clearFilters.addEventListener('click', () => {
    if (filterLocation) filterLocation.value = '';
    if (filterArea) filterArea.value = '';
    if (filterRemote) filterRemote.value = '';
    buildDeckFromProfiles();
  });

  // showConfirm/showToast foram movidos para `ui.js` (showConfirmModal / uiShowToast)

  // ---------------------------
  // Inicialização
  // ---------------------------
  async function init(){
    // --- IMPLEMENTAÇÃO AQUI ---
    // Tenta carregar perfis do Firestore; se falhar, usa os dados mockados
    try{
      const fetched = await fetchProfiles();
      if(Array.isArray(fetched) && fetched.length > 0){
        profiles = fetched;
      } else if(!profiles || profiles.length === 0){
        profiles = seedProfiles.slice(); // Fallback para os mocks
      }
    } catch(err){
      console.warn('Não foi possível buscar perfis do Firestore, usando mocks.', err);
      if(!profiles || profiles.length === 0) profiles = seedProfiles.slice();
    }

    // Carrega dados do perfil local (UI)
    const user = JSON.parse(localStorage.getItem('ws_user') || 'null');
    if(user){
      userNameInput.value = user.name || '';
      userRoleSelect.value = user.role === 'employer' ? 'employer' : 'candidate';
      userAvatar.style.background = randomColorSeed(user.name || 'user');
    } else {
      userAvatar.style.background = randomColorSeed('Seu perfil');
    }

    // Atualiza cabeçalho, matches e monta o deck
    updateHeader();
    renderMatches();
    buildDeckFromProfiles();
  }

  // Atalhos de teclado para testes
  window.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowRight') btnLike.click();
    if(e.key === 'ArrowLeft') btnReject.click();
    if(e.key === 's') btnSuper.click();
    if(e.key === 'm') modeToggle.click();
    if(e.key.toLowerCase && e.key.toLowerCase() === 'b' && btnBio) btnBio.click();
  });

  // Em app.js, no final do arquivo, antes de init()
window.addEventListener('userLoggedIn', (event) => {
  const userData = event.detail;
  console.log('Usuário logado, carregando dados do Firestore:', userData);

  // Atualiza o estado do app com os dados do Firestore
  matches = userData.matches || [];
  stat = userData.stats || { views: 0, likes: 0 };
  premium = userData.premium || false;
  mode = userData.mode || 'employer';

  // ... salva no localStorage para consistência ...

  // Re-renderiza a UI com os dados corretos
  init();
});

// Inicialização quando a página é aberta direto (main.html)
try {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (currentUser) {
    matches = currentUser.matches || [];
    stat = currentUser.stats || { views: 0, likes: 0 };
    premium = currentUser.premium || false;
    mode = currentUser.mode || 'employer';
  }
} catch {}
// Garante inicialização do app mesmo sem evento de login (usa mocks/firestore)
document.addEventListener('DOMContentLoaded', () => init());
})();