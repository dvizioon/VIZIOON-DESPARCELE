import { MAIL_LOGO_DATA_URI } from "./mail-logo";

const PINE = "#0c6b5c";
const PINE_DARK = "#08483e";
const PAPER = "#f4efe6";
const CARD = "#fffcf7";
const INK = "#1a1612";
const MUTED = "#6b645c";
const LINE = "#e4d8c8";
const WHITE = "#ffffff";

export type MailFact = {
  label: string;
  value: string;
};

export type MailLayoutInput = {
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  facts?: MailFact[];
  ctaLabel: string;
  ctaHref: string;
  footerNote: string;
};

export function mailLayout(input: MailLayoutInput): string {
  const paragraphs = input.paragraphs
    .map(
      (text) =>
        `<p style="margin:0 0 16px 0;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:${INK};">${text}</p>`,
    )
    .join("");

  const facts = input.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;background:${PAPER};border:1px solid ${LINE};border-radius:16px;">
        ${input.facts
          .map(
            (fact, index) => `<tr>
              <td style="padding:${index === 0 ? "16px" : "0"} 20px ${index === (input.facts?.length ?? 0) - 1 ? "16px" : "10px"} 20px;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};width:38%;">${fact.label}</td>
              <td style="padding:${index === 0 ? "16px" : "0"} 20px ${index === (input.facts?.length ?? 0) - 1 ? "16px" : "10px"} 20px;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${INK};">${fact.value}</td>
            </tr>`,
          )
          .join("")}
      </table>`
    : "";

  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${input.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background:${PAPER};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CARD};border:1px solid ${LINE};border-radius:28px;overflow:hidden;">
        <tr>
          <td style="background:${PINE_DARK};padding:22px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:12px;">
                  <img src="${MAIL_LOGO_DATA_URI}" width="48" height="48" alt="Desparcele" style="display:block;border:0;outline:none;width:48px;height:48px;border-radius:10px;" />
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1;color:${WHITE};">Desparcele</p>
                  <p style="margin:6px 0 0 0;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:12px;color:rgba(255,255,255,0.7);">Parcelas no controle</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px 8px 28px;">
            <p style="margin:0 0 8px 0;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${PINE};">${input.eyebrow}</p>
            <h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:500;color:${INK};">${input.title}</h1>
            ${paragraphs}
            ${facts}
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 12px 0;">
              <tr>
                <td align="center" style="background:${PINE};border-radius:999px;">
                  <a href="${input.ctaHref}" style="display:inline-block;padding:14px 26px;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${WHITE};text-decoration:none;">${input.ctaLabel}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 28px 28px;">
            <p style="margin:0;font-family:Manrope,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};">${input.footerNote}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export const WELCOME_MAIL_HTML = mailLayout({
  preheader: "Sua conta no Desparcele está pronta.",
  eyebrow: "Boas-vindas",
  title: "Oi, {{nome}}",
  paragraphs: [
    "Sua conta ficou pronta. Dívidas, parcelas e combinados agora ficam num só lugar.",
    "Entra quando quiser. O espaço já está te esperando.",
  ],
  ctaLabel: "Abrir o Desparcele",
  ctaHref: "{{link}}",
  footerNote: "Enviado em {{data}} para {{email}}.",
});

export const PASSWORD_RESET_MAIL_HTML = mailLayout({
  preheader: "Pedido de senha nova no Desparcele.",
  eyebrow: "Senha",
  title: "Criar uma senha nova",
  paragraphs: [
    "Alguém pediu uma senha nova para <strong>{{email}}</strong>.",
    "Se foi você, o botão abaixo vale por 1 hora. Se não foi, pode ignorar este e-mail.",
  ],
  ctaLabel: "Criar senha nova",
  ctaHref: "{{link}}",
  footerNote: "Pedido feito em {{data}}.",
});

export const WORKSPACE_INVITE_MAIL_HTML = mailLayout({
  preheader: "Você entrou no espaço {{workspace}}.",
  eyebrow: "Espaço",
  title: "Você entrou em {{workspace}}",
  paragraphs: [
    "<strong>{{convidadoPor}}</strong> te colocou no espaço compartilhado.",
    "Por lá vocês veem as dívidas, as parcelas e o que já foi pago.",
  ],
  facts: [
    { label: "Espaço", value: "{{workspace}}" },
    { label: "Seu papel", value: "{{papel}}" },
  ],
  ctaLabel: "Abrir o espaço",
  ctaHref: "{{link}}",
  footerNote: "Convite enviado em {{data}} para {{email}}.",
});

export const INSTALLMENT_REMINDER_MAIL_HTML = mailLayout({
  preheader: "A parcela {{parcela}} de {{divida}} vence em {{vencimento}}.",
  eyebrow: "Parcela",
  title: "{{divida}} vence em breve",
  paragraphs: ["Dá uma olhada no que está perto do vencimento para não passar batido."],
  facts: [
    { label: "Espaço", value: "{{workspace}}" },
    { label: "Parcela", value: "{{parcela}}" },
    { label: "Valor", value: "{{valor}}" },
    { label: "Vencimento", value: "{{vencimento}}" },
  ],
  ctaLabel: "Ver a dívida",
  ctaHref: "{{link}}",
  footerNote: "Aviso de {{data}} para {{email}}.",
});

export const SMTP_TEST_MAIL_HTML = mailLayout({
  preheader: "Teste SMTP do Desparcele.",
  eyebrow: "Teste",
  title: "O SMTP está no ar",
  paragraphs: ["{{mensagem}}"],
  ctaLabel: "Abrir o Desparcele",
  ctaHref: "{{link}}",
  footerNote: "E-mail de teste. Pode ignorar.",
});
