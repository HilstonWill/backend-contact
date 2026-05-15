import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGIN || "*")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*")) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "256kb" }));

function validEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "backend-contact" });
});

app.post("/api/contact", async (req, res) => {
  try {
    const { nombre = "", correo = "", mensaje = "", trap = "" } = req.body || {};

    if (trap) return res.status(200).json({ ok: true });

    if (!correo || !mensaje) {
      return res
        .status(400)
        .json({ ok: false, message: "El correo y el mensaje son obligatorios." });
    }

    if (!validEmail(correo)) {
      return res.status(400).json({ ok: false, message: "Correo no valido." });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = String(process.env.SMTP_SECURE || "false") === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.CONTACT_TO_EMAIL || smtpUser;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail || !toEmail) {
      return res.status(500).json({
        ok: false,
        message: "Faltan variables SMTP en el servidor.",
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const cleanNombre = String(nombre).trim() || "No especificado";
    const cleanCorreo = String(correo).trim();
    const cleanMensaje = String(mensaje).trim();
    const safeNombre = escapeHtml(cleanNombre);
    const safeCorreo = escapeHtml(cleanCorreo);
    const safeMensaje = escapeHtml(cleanMensaje).replace(/\n/g, "<br/>");

    await transporter.sendMail({
      from: `"Portafolio Contacto" <${fromEmail}>`,
      to: toEmail,
      replyTo: cleanCorreo,
      subject: `Nuevo contacto: ${cleanNombre}`,
      text: `Nombre: ${cleanNombre}\nCorreo: ${cleanCorreo}\n\nMensaje:\n${cleanMensaje}`,
      html: `
        <h2>Nuevo mensaje desde el formulario</h2>
        <p><strong>Nombre:</strong> ${safeNombre}</p>
        <p><strong>Correo:</strong> ${safeCorreo}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${safeMensaje}</p>
      `,
    });

    return res.status(200).json({
      ok: true,
      message: "Mensaje enviado correctamente.",
    });
  } catch (error) {
    console.error("Error al enviar correo:", error);
    return res.status(500).json({
      ok: false,
      message: "No se pudo enviar el mensaje.",
    });
  }
});

export default app;
