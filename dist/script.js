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
