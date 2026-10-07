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
                  <table role="presentation" cellpadding="0" cellspacing="0" style="background:${WHITE};border-radius:12px;">
                    <tr>
                      <td style="padding:6px;line-height:0;">
                        <img src="{{logo}}" width="40" height="40" alt="Desparcele" style="display:block;border:0;outline:none;width:40px;height:40px;border-radius:8px;" />
                      </td>
                    </tr>
                  </table>
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

export const EMAIL_VERIFICATION_MAIL_HTML = mailLayout({
  preheader: "Confirme seu e-mail no Desparcele. Vale 48 horas.",
  eyebrow: "Verificação",
  title: "Confirme seu e-mail",
  paragraphs: [
    "Oi, {{nome}}. Confirme que <strong>{{email}}</strong> é seu.",
    "Você já pode usar o app por 24 horas. Depois disso, só entra depois de verificar.",
    "O botão vale por 48 horas. Se não foi você, ignore este e-mail.",
  ],
  ctaLabel: "Verificar e-mail",
  ctaHref: "{{link}}",
  footerNote: "Pedido em {{data}} para {{email}}.",
});

export const PASSWORD_RESET_MAIL_HTML = mailLayout({
  preheader: "Pedido de senha nova no Desparcele. Só você usa este link.",
  eyebrow: "Senha",
  title: "Criar uma senha nova",
  paragraphs: [
    "Recebemos um pedido para redefinir a senha da conta <strong>{{email}}</strong>.",
    "O botão vale por 1 hora. Se você não pediu, ignore este e-mail. Sua senha continua a mesma.",
  ],
  ctaLabel: "Criar senha nova",
  ctaHref: "{{link}}",
  footerNote: "Pedido feito em {{data}} para {{email}}.",
});

export const WORKSPACE_INVITE_MAIL_HTML = mailLayout({
  preheader: "Convite para o espaço {{workspace}}. Você decide se entra.",
  eyebrow: "Convite",
  title: "Convite para {{workspace}}",
  paragraphs: [
    "<strong>{{convidadoPor}}</strong> convidou você para o espaço compartilhado.",
    "Para entrar, abra o Desparcele e aceite o convite na tela inicial.",
    "Se você ainda não tem conta, crie com este e-mail e o convite aparece em Espaços.",
  ],
  facts: [
    { label: "Espaço", value: "{{workspace}}" },
    { label: "Papel sugerido", value: "{{papel}}" },
  ],
  ctaLabel: "Ver convites",
  ctaHref: "{{link}}",
  footerNote: "Convite enviado em {{data}} para {{email}}. Só você pode aceitar.",
});

export const INSTALLMENT_REMINDER_MAIL_HTML = mailLayout({
  preheader: "Parcela {{parcela}} de {{divida}}: {{motivo}} ({{vencimento}}).",
  eyebrow: "Parcela",
  title: "{{divida}}: {{motivo}}",
  paragraphs: ["Confira a parcela no Desparcele. Se já pagou, marque como paga para parar os avisos."],
  facts: [
    { label: "Espaço", value: "{{workspace}}" },
    { label: "Parcela", value: "{{parcela}}" },
    { label: "Valor", value: "{{valor}}" },
    { label: "Vencimento", value: "{{vencimento}}" },
    { label: "Situação", value: "{{motivo}}" },
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
