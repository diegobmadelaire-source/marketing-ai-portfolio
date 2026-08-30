# Digital Engine — Landing de agencia

Landing page estática y responsive para una agencia de marketing enfocada en restaurantes, playas de autos e inmobiliarias de Paraguay.

## Contacto configurado

- WhatsApp: `0927 271 737` (`+595 927 271 737`).
- Email: `diego.bmadelaire@gmail.com`.

## Formulario

El formulario usa **Netlify Forms**: no requiere backend ni aplicación de correo del visitante. Cuando se despliegue el sitio en Netlify, las consultas se guardarán en **Forms → solicitud-propuesta**.

Para recibirlas automáticamente por email, en el panel de Netlify configurá una notificación de formulario:

1. Abrí el sitio en Netlify y entrá a **Project configuration → Notifications**.
2. Creá una notificación **Email notification** para el formulario `solicitud-propuesta`.
3. Indicá `diego.bmadelaire@gmail.com` como destinatario.

Netlify detectará el formulario en el próximo despliegue. Incluye una trampa anti-spam y el filtro anti-spam de Netlify.

## Publicación

Abrí `index.html` localmente para revisar el diseño. Antes de indexar el sitio, definí el dominio final; entonces se podrán agregar la URL canónica, imagen Open Graph y la configuración SEO definitiva.
