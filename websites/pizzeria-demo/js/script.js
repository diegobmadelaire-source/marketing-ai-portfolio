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

const proposalForm = document.querySelector('#proposal-form');
const formNote = document.querySelector('#form-note');

proposalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(proposalForm);
  const subject = encodeURIComponent(`Nueva consulta: ${data.get('empresa')}`);
  const body = encodeURIComponent(`Nombre: ${data.get('nombre')}\nEmpresa: ${data.get('empresa')}\nTipo de negocio: ${data.get('tipo')}\nWhatsApp: ${data.get('whatsapp')}\n\nQué quiere mejorar:\n${data.get('mensaje')}`);
  window.location.href = `mailto:diego.bmadelaire@gmail.com?subject=${subject}&body=${body}`;
  if (formNote) formNote.textContent = 'Abrimos tu aplicación de correo para enviar la consulta.';
});
