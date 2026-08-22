import nodemailer from "nodemailer";

export async function sendDigest(subject: string, html: string, text: string) {
  const host = process.env.RADAR_SMTP_HOST ?? "smtp.dondominio.com";
  const port = Number(process.env.RADAR_SMTP_PORT ?? "587");
  const secure = process.env.RADAR_SMTP_SECURE === "true";
  const user = process.env.RADAR_SMTP_USER ?? "alerts@conquense.dev";
  const password = process.env.RADAR_SMTP_PASSWORD;
  const from = process.env.RADAR_FROM ?? user;
  const to = (process.env.RADAR_RECIPIENTS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!password || !from || to.length === 0) throw new Error("Faltan RADAR_SMTP_PASSWORD, RADAR_FROM o RADAR_RECIPIENTS.");
  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass: password } });
  const response = await transporter.sendMail({ from, to, subject, text, html });
  return { id: response.messageId, recipients: to.length };
}
