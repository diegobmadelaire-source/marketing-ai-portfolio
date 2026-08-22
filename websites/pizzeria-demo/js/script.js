const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');

toggle?.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.querySelector('.sr-only').textContent = isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación';
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menu.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}));

document.querySelector('#current-year').textContent = new Date().getFullYear();
