# backend-contact

Backend de formulario de contacto con Node + Express + Nodemailer, listo para Vercel.

## Endpoints
- `POST /api/contact`
- `GET /api/health`

## Variables de entorno
Copiar `.env.example` a `.env` para pruebas locales.

Variables requeridas en Vercel:
- `ALLOWED_ORIGIN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`

## Desarrollo local
```bash
npm install
npm run dev
```

Server local: `http://localhost:4000`

## Ejemplo body `POST /api/contact`
```json
{
  "nombre": "Will",
  "correo": "will@email.com",
  "mensaje": "Hola, quiero una cotizacion",
  "trap": ""
}
```

## Conectar frontend
En tu frontend define:
- `VITE_CONTACT_API_URL=https://tu-backend.vercel.app/api/contact`

Luego el formulario debe enviar a ese URL.
