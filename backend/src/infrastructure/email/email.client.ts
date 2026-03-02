import nodemailer from 'nodemailer';
import { config } from '../../config';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: config.SMTP_USER
      ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
      : undefined,
  });

  return transporter;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  encoding?: string;
  contentType?: string;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  const t = getEmailTransporter();

  const mailOptions: nodemailer.SendMailOptions = {
    from: config.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  if (options.attachments?.length) {
    mailOptions.attachments = options.attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      encoding: att.encoding as BufferEncoding | undefined,
      contentType: att.contentType,
    }));
  }

  await t.sendMail(mailOptions);
}
