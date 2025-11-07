// Funções relacionadas ao deck de perfis
// Exporta funções que operam sobre arrays de perfis e sobre o DOM

export function buildCard(profile, randomColorSeed){
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.id = profile.id;

  const cover = document.createElement('div');
  cover.style.height = '180px';
  cover.style.background = profile.img || randomColorSeed(profile.name || 'anon');
  cover.className = 'cover';
  el.appendChild(cover);

  const info = document.createElement('div');
  info.className = 'info';

  const meta = document.createElement('div');
  meta.className = 'meta';
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = profile.name + (profile.title ? ' — ' + profile.title : '');
  const sub = document.createElement('div');
  sub.className = 'sub';
  sub.textContent = `${profile.location} • ${profile.area}`;

  meta.appendChild(title);
  meta.appendChild(sub);

  const bio = document.createElement('div');
  bio.style.color = '#334155';
  bio.textContent = profile.bio || '';

  const tags = document.createElement('div');
  tags.style.marginTop = '8px';
  const t1 = document.createElement('span');
  t1.className = 'tag';
  t1.textContent = profile.type === 'employer' ? 'Empresa' : 'Candidato';
  tags.appendChild(t1);

  info.appendChild(meta);
  info.appendChild(bio);
  info.appendChild(tags);
  el.appendChild(info);

  return el;
}

export function renderDeck(cardDeck, deck, makeCardDraggable, buildCard){
  if(!cardDeck) return null;
  cardDeck.innerHTML = '';
  for (let i = deck.length-1;i>=0;i--){
    const card = buildCard(deck[i]);
    const offset = Math.min(6, deck.length - 1 - i);
    card.style.transform = `translateY(${offset*8}px) scale(${1 - offset*0.02})`;
    card.style.zIndex = i;
    cardDeck.appendChild(card);
    if(typeof makeCardDraggable === 'function') makeCardDraggable(card);
  }
  return cardDeck.querySelector('.card:last-child');
}

export function animateOff(card, dir, removeCallback){
  if(!card) return;
  card.style.transform = `translate(${dir*1200}px, -100px) rotate(${dir*30}deg)`;
  card.style.opacity = 0;
  setTimeout(()=>{
    const id = card.dataset.id;
    if(typeof removeCallback === 'function') removeCallback(id);
  }, 300);
}

// O `makeCardDraggable` foi mantido em `app.js` porque depende dos handlers e do estado do app
