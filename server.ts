/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route para enviar código por e-mail
  app.post("/api/send-code", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "E-mail e código são obrigatórios." });
    }

    // Validação de E-mails Permitidos
    const allowedEmailsStr = process.env.VITE_ALLOWED_EMAILS || "";
    const allowedEmails = allowedEmailsStr.split(",").map(e => e.trim().toLowerCase()).filter(e => e !== "");
    
    if (allowedEmails.length > 0 && !allowedEmails.includes(email.toLowerCase())) {
      console.log(`Acesso negado para o e-mail: ${email}`);
      return res.status(403).json({ error: "Este e-mail não está na lista de usuários autorizados." });
    }

    const user = process.env.VITE_GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.error("ERRO DE CONFIGURAÇÃO: VITE_GMAIL_USER ou GMAIL_APP_PASSWORD não encontrados no ambiente.");
      return res.status(400).json({ 
        success: false, 
        skipped: true, 
        error: "Configurações de e-mail ausentes no servidor (Secrets). Verifique o manual." 
      });
    }

    try {
      console.log(`Tentando enviar e-mail para: ${email} via ${user}`);
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // use TLS
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"Agendamento Institucional" <${user}>`,
        to: email,
        subject: `${code} é seu código de acesso`,
        text: `Seu código de acesso é: ${code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; text-align: center;">
            <h1 style="color: #2563eb; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Código de Acesso</h1>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 32px;">Utilize o código abaixo para entrar no sistema de agendamentos.</p>
            <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; display: inline-block; min-width: 200px;">
              <span style="font-size: 32px; font-weight: 900; color: #2563eb; letter-spacing: 4px;">${code}</span>
            </div>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 16px;">
              Se você não solicitou este código, por favor ignore este e-mail.
            </p>
          </div>
        `,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      res.status(500).json({ error: "Erro ao enviar e-mail. Verifique suas credenciais de App Password." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
