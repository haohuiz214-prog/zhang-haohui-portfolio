const header = document.querySelector('[data-header]');
const trackedLinks = [...document.querySelectorAll('[data-section]')];
const sections = [...document.querySelectorAll('.page-section')];

const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const setActiveSection = (id) => {
  trackedLinks.forEach((link) => {
    const active = link.dataset.section === id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveSection(visible.target.id);
  },
  { rootMargin: '-18% 0px -58% 0px', threshold: [0.05, 0.2, 0.45] },
);

sections.forEach((section) => observer.observe(section));

const hobbyCards = [...document.querySelectorAll('.hobby-card')];
const photoDialog = document.querySelector('.hobby-dialog');
let activeAlbum = null;
let activePhoto = 0;
const showAlbumPhoto = () => {
  const photos = [...activeAlbum.querySelectorAll('.hobby-photo')];
  const photo = photos[activePhoto];
  photoDialog.querySelector('img').src = photo.src;
  photoDialog.querySelector('img').alt = photo.alt;
  photoDialog.querySelector('.hobby-dialog-footer span').textContent = `${activeAlbum.dataset.hobby} · ${activePhoto + 1} / ${photos.length}`;
};
hobbyCards.forEach((card) => {
  const photos = [...card.querySelectorAll('.hobby-photo')];
  card.querySelector('.hobby-stack').addEventListener('click', () => {
    const next = (photos.findIndex((photo) => photo.classList.contains('is-front')) + 1) % photos.length;
    photos.forEach((photo, i) => photo.classList.toggle('is-front', i === next));
    card.querySelector('.hobby-counter').textContent = `0${next + 1} / 02`;
  });
  card.querySelector('.hobby-expand').addEventListener('click', () => {
    activeAlbum = card;
    activePhoto = photos.findIndex((photo) => photo.classList.contains('is-front'));
    showAlbumPhoto();
    photoDialog.showModal();
  });
});
const stepPhoto = (step) => {
  activePhoto = (activePhoto + step + 2) % 2;
  showAlbumPhoto();
};
photoDialog.querySelector('.hobby-dialog-close').addEventListener('click', () => photoDialog.close());
photoDialog.querySelectorAll('[data-photo-step]').forEach((button) => button.addEventListener('click', () => stepPhoto(Number(button.dataset.photoStep))));
photoDialog.addEventListener('click', (event) => {
  if (event.target !== photoDialog) return;
  const box = photoDialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) photoDialog.close();
});
photoDialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
