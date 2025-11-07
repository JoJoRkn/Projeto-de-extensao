document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ WorkSwipe iniciado com swipe ativo");

  // ========== DADOS DE EXEMPLO ==========
  const profiles = [
    { name: "Ana Silva", title: "Frontend Pleno", location: "São Paulo", bio: "Apaixonada por UI e acessibilidade.", skills: ["React", "Next.js", "UI/UX"], image: "https://i.pravatar.cc/500?img=5" },
    { name: "Bruno Costa", title: "Backend Sênior", location: "Recife", bio: "Especialista em Node.js e arquitetura limpa.", skills: ["Node.js", "AWS", "Docker"], image: "https://i.pravatar.cc/500?img=15" },
    { name: "Carla Mendes", title: "UX Designer", location: "Curitiba", bio: "Design centrado no usuário e pesquisa qualitativa.", skills: ["Figma", "User Research"], image: "https://i.pravatar.cc/500?img=23" }
  ];

  let current = 0;
  // ========== LIKES (persistidos) ==========
  const likes = JSON.parse(localStorage.getItem('likesList')) || [];

  function updateLikesList() {
    const container = document.getElementById('likes-list');
    if (!container) return;
    if (!likes.length) {
      container.innerHTML = '<p class="empty">Nenhuma curtida ainda.</p>';
      return;
    }
    container.innerHTML = likes.map(l => `
      <div class="like-item">
        <img src="${l.image}" alt="${l.name}" class="like-avatar">
        <div class="like-meta"><strong>${l.name}</strong><div class="like-title">${l.title || ''}</div></div>
      </div>
    `).join('');
  }

  // ========= ELEMENTOS =========
  const card = document.querySelector('.swipe-card');
  const img = card.querySelector('.card-image');
  const nameEl = card.querySelector('.card-name');
  const titleEl = card.querySelector('.card-title');
  const locEl = card.querySelector('.card-location');
  const bioEl = card.querySelector('.card-bio');
  const skillsEl = card.querySelector('.card-skills');
  const endMsg = document.querySelector('.no-more-profiles');

  // ========= FUNÇÕES =========
  function renderProfile() {
    if (current >= profiles.length) {
      card.style.display = 'none';
      endMsg.classList.remove('hidden');
      return;
    }
    const p = profiles[current];
    img.src = p.image;
    nameEl.textContent = p.name;
    titleEl.textContent = p.title;
    locEl.textContent = p.location;
    bioEl.textContent = p.bio;
    skillsEl.innerHTML = p.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    card.style.transform = "none";
    card.style.opacity = "1";
  }

  function nextProfile() {
    card.classList.add('fade-out');
    setTimeout(() => {
      current++;
      card.classList.remove('fade-out');
      renderProfile();
    }, 400);
  }

  // ========= BOTÕES =========
  document.querySelector('.btn-like').addEventListener('click', () => animateSwipe("right"));
  document.querySelector('.btn-reject').addEventListener('click', () => animateSwipe("left"));
  document.querySelector('.btn-bio').addEventListener('click', () => alert(bioEl.textContent));

  // ========= SWIPE GESTURE =========
  let startX = 0;
  let currentX = 0;
  let isDragging = false;

  const handleGestureStart = (e) => {
    isDragging = true;
    startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    card.style.transition = "none";
  };

  const handleGestureMove = (e) => {
    if (!isDragging) return;
    currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX;
    const rotation = diff / 20;
    card.style.transform = `translateX(${diff}px) rotate(${rotation}deg)`;
    card.style.opacity = 1 - Math.min(Math.abs(diff) / 300, 0.6);
  };

  const handleGestureEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    card.style.transition = "all 0.3s ease";

    const diff = currentX - startX;
    if (Math.abs(diff) > 120) {
      const direction = diff > 0 ? "right" : "left";
      animateSwipe(direction);
    } else {
      card.style.transform = "translateX(0) rotate(0)";
      card.style.opacity = "1";
    }
  };

  const animateSwipe = (direction) => {
    // se curtiu, salva no likes
    if (direction === "right") {
      const liked = profiles[current];
      if (liked) {
        // evita duplicatas básicas (mesmo nome + imagem)
        const exists = likes.some(l => l.name === liked.name && l.image === liked.image);
        if (!exists) {
          likes.push({ name: liked.name, title: liked.title, image: liked.image });
          localStorage.setItem('likesList', JSON.stringify(likes));
          // atualiza contador de likes no perfil
          const likesCountEl = document.getElementById('user-likes');
          if (likesCountEl) likesCountEl.textContent = likes.length;
          updateLikesList();
        }
      }
    }

    const offset = direction === "right" ? 500 : -500;
    card.style.transition = "all 0.4s ease";
    card.style.transform = `translateX(${offset}px) rotate(${direction === "right" ? 25 : -25}deg)`;
    card.style.opacity = "0";
    setTimeout(nextProfile, 400);
  };

  // Eventos para mouse e toque
  card.addEventListener("mousedown", handleGestureStart);
  card.addEventListener("mousemove", handleGestureMove);
  document.addEventListener("mouseup", handleGestureEnd);

  card.addEventListener("touchstart", handleGestureStart);
  card.addEventListener("touchmove", handleGestureMove);
  card.addEventListener("touchend", handleGestureEnd);

  // ========= PERFIL LOCAL =========
  const user = JSON.parse(localStorage.getItem('userProfile')) || {
    name: "Lucas Lucena",
    status: "Ser contratado",
    title: "Dev Fullstack Jr.",
    company: "Buscando recolocação",
    bio: "Focado em aprender e crescer no mundo da tecnologia."
  };

  function updateUserProfile() {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-status').textContent = user.status;
    localStorage.setItem('userProfile', JSON.stringify(user));
  }

  document.getElementById('edit-profile-form').onsubmit = e => {
    e.preventDefault();
    user.name = document.getElementById('edit-name').value;
    user.status = document.getElementById('edit-status').value;
    user.title = document.getElementById('edit-title').value;
    user.company = document.getElementById('edit-company').value;
    user.bio = document.getElementById('edit-bio').value;
    updateUserProfile();
    document.getElementById('edit-modal-overlay').classList.remove('open');
  };

  // ========= MODAL =========
  const modal = document.getElementById('edit-modal-overlay');
  document.getElementById('open-edit-modal-btn').onclick = () => modal.classList.add('open');
  document.getElementById('modal-close-btn').onclick = () => modal.classList.remove('open');
  document.getElementById('modal-cancel-btn').onclick = () => modal.classList.remove('open');

  // ======== CURTIDAS MODAL ========
  const likesModal = document.getElementById("likes-modal-overlay");
  const likesBtn = document.getElementById("open-likes-modal-btn");
  const likesClose = document.getElementById("likes-close-btn");
  const likesList = document.getElementById("likes-list");

  // Simulação de curtidas recebidas
  const likedBy = [
    { name: "Fernanda Souza", role: "UX Designer", image: "https://i.pravatar.cc/100?img=48" },
    { name: "João Lima", role: "Recrutador Tech", image: "https://i.pravatar.cc/100?img=12" },
    { name: "Mariana Costa", role: "CEO - StartHub", image: "https://i.pravatar.cc/100?img=36" }
  ];

  if (likesBtn) likesBtn.onclick = () => {
    if (likesList) {
      likesList.innerHTML = likedBy.map(p => `
        <div class="like-item">
          <img src="${p.image}" alt="${p.name}">
          <div class="like-info">
            <h4>${p.name}</h4>
            <p>${p.role}</p>
          </div>
        </div>
      `).join('');
    }
    if (likesModal) likesModal.classList.add("open");
  };
  if (likesClose) likesClose.onclick = () => likesModal.classList.remove("open");

  // Premium modal
  const premiumModal = document.getElementById('premium-modal-overlay');
  const premiumOpenBtn = document.getElementById('open-premium-modal-btn');
  const premiumCloseBtn = document.getElementById('premium-close-btn');
  if (premiumOpenBtn && premiumModal) premiumOpenBtn.onclick = () => premiumModal.classList.add('open');
  if (premiumCloseBtn && premiumModal) premiumCloseBtn.onclick = () => premiumModal.classList.remove('open');

  // ========= FOTO PERFIL =========
  const upload = document.getElementById('profile-pic-upload');
  const photo = document.getElementById('profile-pic-large');

  upload.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const imgData = ev.target.result;
        photo.style.backgroundImage = `url(${imgData})`;
        localStorage.setItem('profilePic', imgData);
      };
      reader.readAsDataURL(file);
    }
  });

  const savedPic = localStorage.getItem('profilePic');
  if (savedPic) photo.style.backgroundImage = `url(${savedPic})`;

  // ========= INICIALIZA =========
  // Atualiza contador de likes no perfil
  const likesCountEl = document.getElementById('user-likes');
  if (likesCountEl) likesCountEl.textContent = likes.length;
  
  updateUserProfile();
  updateLikesList();
  renderProfile();
});
