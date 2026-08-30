const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');
const menuLabel = toggle?.querySelector('.sr-only');
const menuIcon = toggle?.querySelector('.menu-icon');
const year = document.querySelector('#current-year');

function closeMenu() {
  menu?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
  if (menuLabel) menuLabel.textContent = 'Abrir menú de navegación';
  if (menuIcon) menuIcon.textContent = '☰';
}

toggle?.addEventListener('click', () => {
  const isOpen = menu?.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  if (menuLabel) menuLabel.textContent = isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación';
  if (menuIcon) menuIcon.textContent = isOpen ? '×' : '☰';
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu?.classList.contains('open')) {
    closeMenu();
    toggle?.focus();
  }
});

if (year) year.textContent = new Date().getFullYear();
