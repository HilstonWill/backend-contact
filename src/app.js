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

const emailNeuralPattern =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='360' viewBox='0 0 1200 360'%3E%3Cg fill='none' stroke='%2360a5fa' stroke-opacity='.28' stroke-width='1.2'%3E%3Cpath d='M0 240 C180 140 300 320 470 220 C620 130 760 310 930 210 C1040 145 1130 190 1200 170'/%3E%3Cpath d='M0 170 C160 90 320 240 470 170 C620 100 780 240 920 170 C1040 110 1120 140 1200 120'/%3E%3Cpath d='M0 300 C170 220 310 360 470 300 C620 240 780 360 940 300 C1050 260 1130 280 1200 260'/%3E%3C/g%3E%3Cg fill='%2393c5fd' fill-opacity='.34'%3E%3Ccircle cx='120' cy='170' r='4'/%3E%3Ccircle cx='210' cy='196' r='3'/%3E%3Ccircle cx='320' cy='154' r='4'/%3E%3Ccircle cx='450' cy='206' r='4'/%3E%3Ccircle cx='560' cy='162' r='3'/%3E%3Ccircle cx='690' cy='220' r='4'/%3E%3Ccircle cx='810' cy='174' r='3'/%3E%3Ccircle cx='930' cy='226' r='4'/%3E%3Ccircle cx='1040' cy='180' r='3'/%3E%3C/g%3E%3C/svg%3E";

function ownerEmailHtml({
  nombre,
  correo,
  mensaje,
  brandName,
  portfolioUrl,
}) {
  return `
  <div style="background:#0b1020;padding:28px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
    <div style="max-width:700px;margin:0 auto 12px auto;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.12);">
      <div style="padding:24px;background:
        linear-gradient(135deg, rgba(15,23,42,.88), rgba(29,78,216,.78)),
        url('${emailNeuralPattern}') center/cover no-repeat;
        color:#ffffff;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.9;margin-bottom:8px;">${brandName}</div>
        <h1 style="margin:0;font-size:22px;line-height:1.3;">Panel de Contacto</h1>
      </div>
    </div>
    <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(2,6,23,.35);">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.9;margin-bottom:8px;">Contacto Web</div>
        <h2 style="margin:0;font-size:23px;line-height:1.3;">Nuevo mensaje recibido</h2>
        <p style="margin:8px 0 0 0;font-size:14px;opacity:.9;">Se registro una nueva solicitud desde el formulario de contacto.</p>
      </div>
      <div style="padding:22px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;font-size:14px;">
              <div style="font-size:12px;color:#475569;margin-bottom:4px;">Nombre</div>
              <strong>${nombre}</strong>
            </td>
            <td style="width:10px;"></td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;font-size:14px;">
              <div style="font-size:12px;color:#475569;margin-bottom:4px;">Correo</div>
              <a href="mailto:${correo}" style="color:#1d4ed8;text-decoration:none;font-weight:600;">${correo}</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px 0;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.08em;">Mensaje</p>
        <div style="background:#f8fafc;border:1px solid #dbe3ef;border-radius:12px;padding:14px;line-height:1.6;font-size:15px;">
          ${mensaje}
        </div>
        <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
          <a href="mailto:${correo}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600;">Abrir respuesta en correo</a>
          <a href="${portfolioUrl}" style="display:inline-block;background:#ffffff;color:#0f172a;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600;border:1px solid #cbd5e1;">Revisar sitio</a>
        </div>
      </div>
    </div>
  </div>
  `;
}

function autoReplyHtml({ nombre, brandName, portfolioUrl }) {
  return `
  <div style="background:#0b1020;padding:28px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
    <div style="max-width:700px;margin:0 auto 12px auto;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.12);">
      <div style="padding:24px;background:
        linear-gradient(135deg, rgba(15,23,42,.88), rgba(29,78,216,.78)),
        url('${emailNeuralPattern}') center/cover no-repeat;
        color:#ffffff;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.9;margin-bottom:8px;">${brandName}</div>
        <h1 style="margin:0;font-size:22px;line-height:1.3;">Contacto Confirmado</h1>
      </div>
    </div>
    <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(2,6,23,.35);">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.9;margin-bottom:8px;">Confirmacion de contacto</div>
        <h2 style="margin:0;font-size:23px;line-height:1.3;">Mensaje recibido correctamente</h2>
      </div>
      <div style="padding:22px 24px;line-height:1.7;font-size:15px;">
        <p style="margin:0 0 12px 0;">Hola ${nombre},</p>
        <p style="margin:0 0 12px 0;">Tu solicitud fue recibida con exito.</p>
        <p style="margin:0 0 14px 0;">Te respondere por este mismo medio a la brevedad posible.</p>
        <a href="${portfolioUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600;">Ver trabajos recientes</a>
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
    const brandName = process.env.BRAND_NAME || "Hilston Will";
    const portfolioUrl = process.env.PORTFOLIO_URL || "https://hilston-will.netlify.app";

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
        brandName: escapeHtml(brandName),
        portfolioUrl: escapeHtml(portfolioUrl),
      }),
    });

    if (autoReplyEnabled) {
      await transporter.sendMail({
        from: `"Portafolio Contacto" <${fromEmail}>`,
        to: cleanCorreo,
        subject: "Recibimos tu mensaje",
        text: `Hola ${cleanNombre}, recibimos tu mensaje correctamente. Te responderemos pronto.`,
        html: autoReplyHtml({
          nombre: safeNombre,
          brandName: escapeHtml(brandName),
          portfolioUrl: escapeHtml(portfolioUrl),
        }),
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
