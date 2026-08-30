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
  const submitButton = proposalForm.querySelector('button[type="submit"]');
  const data = new FormData(proposalForm);
  if (submitButton) submitButton.disabled = true;
  if (formNote) formNote.textContent = 'Enviando tu consulta...';

  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
  })
    .then((response) => {
      if (!response.ok) throw new Error('No se pudo enviar el formulario.');
      proposalForm.reset();
      if (formNote) formNote.textContent = '¡Gracias! Recibimos tu consulta y te contactaremos pronto.';
    })
    .catch(() => {
      if (formNote) formNote.textContent = 'No pudimos enviar la consulta. Escribinos por WhatsApp.';
    })
    .finally(() => {
      if (submitButton) submitButton.disabled = false;
    });
});
