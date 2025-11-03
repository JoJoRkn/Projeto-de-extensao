// Funções utilitárias de UI: header, matches list, toasts e modal de confirmação
import { t, onLocaleChange } from './tradutor.js';

export function updateHeaderDOM({modeLabel, statViews, statLikes, statPremium}, {mode, stat, premium}){
  if (modeLabel) modeLabel.textContent = mode === 'employer' ? t('app.mode.hire') : t('app.mode.search');
  if (statViews) statViews.textContent = (stat && typeof stat.views !== 'undefined') ? stat.views : '';
  if (statLikes) statLikes.textContent = (stat && typeof stat.likes !== 'undefined') ? stat.likes : '';
  if (statPremium) statPremium.textContent = premium ? t('common.yes') : t('common.no');
}

export function renderMatchesList(matchesListEl, matches){
  if(!matchesListEl) return;
  matchesListEl.innerHTML = '';
  if(!matches || matches.length === 0){
    matchesListEl.innerHTML = `<li style="color:var(--muted)">${t('app.matches.none')}</li>`;
    return;
  }
  matches.slice().reverse().forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${m.name}</strong> — <span style="color:var(--muted)">${m.title}</span>`;
    matchesListEl.appendChild(li);
  });
}

// Reaplicar textos quando o idioma mudar
onLocaleChange(() => {
  // Nada a fazer diretamente aqui; os textos são atualizados via chamadas a updateHeaderDOM/renderMatchesList feitas pelo app
});

export function showConfirmModal(modalConfirm, confirmTitle, confirmBody, confirmYes, confirmNo, title, body, onYes){
  if(!modalConfirm) return;
  if(confirmTitle) confirmTitle.textContent = title;
  if(confirmBody) confirmBody.textContent = body;
  modalConfirm.classList.remove('hidden');
  function cleanup(){
    modalConfirm.classList.add('hidden');
    confirmYes.removeEventListener('click', yesHandler);
    confirmNo.removeEventListener('click', noHandler);
  }
  function yesHandler(){ cleanup(); if(typeof onYes === 'function') onYes(); }
  function noHandler(){ cleanup(); }
  confirmYes.addEventListener('click', yesHandler);
  confirmNo.addEventListener('click', noHandler);
}

export function showToast(text, ms = 1800){
  const t = document.createElement('div');
  t.textContent = text;
  t.style.position = 'fixed';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.bottom = '28px';
  t.style.padding = '10px 14px';
  t.style.background = 'rgba(0,0,0,0.6)';
  t.style.color = '#fff';
  t.style.borderRadius = '10px';
  t.style.zIndex = 9999;
  document.body.appendChild(t);
  setTimeout(()=> t.style.opacity = '0', ms - 300);
  setTimeout(()=> t.remove(), ms);
}
