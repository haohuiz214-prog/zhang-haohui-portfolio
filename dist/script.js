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

const projectDialog = document.querySelector('[data-project-dialog]');
const projectCards = [...document.querySelectorAll('.project-card')];

if (projectDialog && projectCards.length) {
  const dialogNumber = projectDialog.querySelector('[data-dialog-number]');
  const dialogType = projectDialog.querySelector('[data-dialog-type]');
  const dialogTitle = projectDialog.querySelector('[data-dialog-title]');
  const dialogDescription = projectDialog.querySelector('[data-dialog-description]');
  const dialogLogo = projectDialog.querySelector('[data-dialog-logo]');
  const dialogStatusTitle = projectDialog.querySelector('[data-dialog-status-title]');
  const dialogStatusCopy = projectDialog.querySelector('[data-dialog-status-copy]');
  const dialogDemo = projectDialog.querySelector('[data-dialog-demo]');
  const closeButton = projectDialog.querySelector('[data-dialog-close]');

  const closeProjectDialog = () => {
    projectDialog.close();
    document.body.classList.remove('dialog-open');
  };

  projectCards.forEach((card) => {
    card.addEventListener('click', () => {
      dialogNumber.textContent = `${card.dataset.projectNumber} / PROJECT`;
      dialogType.textContent = card.dataset.projectType;
      dialogTitle.textContent = card.dataset.projectTitle;
      dialogDescription.textContent = card.dataset.projectDescription;
      dialogLogo.innerHTML = card.querySelector('.project-logo').innerHTML;
      const demoUrl = card.dataset.projectDemo;
      dialogStatusTitle.textContent = demoUrl ? 'Live Demo 已接入' : '交互原型';
      dialogStatusCopy.textContent = demoUrl ? '使用自定义对话界面体验智能旅行规划' : '项目暂未部署，线上体验入口将在后续接入';
      dialogDemo.hidden = !demoUrl;
      if (demoUrl) dialogDemo.href = demoUrl;
      projectDialog.showModal();
      document.body.classList.add('dialog-open');
    });
  });

  closeButton.addEventListener('click', closeProjectDialog);
  projectDialog.addEventListener('click', (event) => {
    if (event.target === projectDialog) closeProjectDialog();
  });
  projectDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
}
