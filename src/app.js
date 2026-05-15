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

function ownerEmailHtml({ nombre, correo, mensaje }) {
  return `
  <div style="background:#f3f6fb;padding:24px;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:18px 22px;background:#0f172a;color:#ffffff;">
        <h2 style="margin:0;font-size:20px;">Nuevo mensaje desde tu portafolio</h2>
      </div>
      <div style="padding:20px 22px;">
        <p style="margin:0 0 14px 0;"><strong>Nombre:</strong> ${nombre}</p>
        <p style="margin:0 0 14px 0;"><strong>Correo:</strong> <a href="mailto:${correo}">${correo}</a></p>
        <p style="margin:0 0 8px 0;"><strong>Mensaje:</strong></p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;line-height:1.5;">
          ${mensaje}
        </div>
        <div style="margin-top:18px;">
          <a href="mailto:${correo}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:8px;">Responder a este contacto</a>
        </div>
      </div>
    </div>
  </div>
  `;
}

function autoReplyHtml({ nombre }) {
  return `
  <div style="background:#f3f6fb;padding:24px;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:18px 22px;background:#0f172a;color:#ffffff;">
        <h2 style="margin:0;font-size:20px;">Gracias por escribir</h2>
      </div>
      <div style="padding:20px 22px;line-height:1.6;">
        <p>Hola ${nombre},</p>
        <p>Recibi tu mensaje correctamente. Te respondere lo antes posible.</p>
        <p>Gracias por contactarme.</p>
      </div>
    </div>
  </div>
  `;
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
    const autoReplyEnabled = String(process.env.AUTO_REPLY_ENABLED || "false") === "true";

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
      html: ownerEmailHtml({
        nombre: safeNombre,
        correo: safeCorreo,
        mensaje: safeMensaje,
      }),
    });

    if (autoReplyEnabled) {
      await transporter.sendMail({
        from: `"Portafolio Contacto" <${fromEmail}>`,
        to: cleanCorreo,
        subject: "Recibimos tu mensaje",
        text: `Hola ${cleanNombre}, recibimos tu mensaje correctamente. Te responderemos pronto.`,
        html: autoReplyHtml({ nombre: safeNombre }),
      });
    }

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
