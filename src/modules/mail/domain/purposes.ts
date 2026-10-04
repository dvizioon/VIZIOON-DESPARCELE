import {
  INSTALLMENT_REMINDER_MAIL_HTML,
  PASSWORD_RESET_MAIL_HTML,
  WELCOME_MAIL_HTML,
  WORKSPACE_INVITE_MAIL_HTML,
} from "./email-layout";

export type EmailPurposeId =
  | "welcome"
  | "password_reset"
  | "workspace_invite"
  | "installment_reminder";

export type EmailPlaceholder = {
  key: string;
  label: string;
  description: string;
};

export type EmailPurposeDefinition = {
  id: EmailPurposeId;
  label: string;
  description: string;
  placeholders: EmailPlaceholder[];
  defaultSubject: string;
  defaultBody: string;
  defaultFormat: "HTML" | "TEXT";
  sample: Record<string, string>;
};

const LOGO: EmailPlaceholder = {
  key: "logo",
  label: "Logo",
  description: "Marca Desparcele em base64, já no próprio e-mail",
};

export const EMAIL_PURPOSES: EmailPurposeDefinition[] = [
  {
    id: "welcome",
    label: "Boas-vindas",
    description: "Enviado quando a pessoa cria a conta.",
    placeholders: [
      LOGO,
      { key: "nome", label: "Nome", description: "Nome completo da pessoa" },
      { key: "email", label: "E-mail", description: "E-mail da conta" },
      { key: "data", label: "Data", description: "Data do cadastro" },
      { key: "link", label: "Link", description: "Link para entrar no app" },
    ],
    defaultSubject: "Bem-vindo ao Desparcele, {{nome}}",
    defaultBody: WELCOME_MAIL_HTML,
    defaultFormat: "HTML",
    sample: {
      nome: "Ana Silva",
      email: "ana@desparcele.app",
      data: "14/09/2026",
      link: "http://localhost:7250/login",
    },
  },
  {
    id: "password_reset",
    label: "Redefinir senha",
    description: "Pedido de senha nova.",
    placeholders: [
      LOGO,
      { key: "nome", label: "Nome", description: "Nome completo da pessoa" },
      { key: "email", label: "E-mail", description: "E-mail da conta" },
      { key: "link", label: "Link", description: "Link para criar a senha nova" },
      { key: "data", label: "Data", description: "Data do pedido" },
    ],
    defaultSubject: "Redefinir senha no Desparcele",
    defaultBody: PASSWORD_RESET_MAIL_HTML,
    defaultFormat: "HTML",
    sample: {
      nome: "Ana Silva",
      email: "ana@desparcele.app",
      data: "14/09/2026",
      link: "http://localhost:7250/redefinir-senha?token=exemplo",
    },
  },
  {
    id: "workspace_invite",
    label: "Convite para espaço",
    description: "Quando alguém entra num espaço compartilhado.",
    placeholders: [
      LOGO,
      { key: "nome", label: "Nome", description: "Quem foi convidado" },
      { key: "email", label: "E-mail", description: "E-mail de quem foi convidado" },
      { key: "workspace", label: "Espaço", description: "Nome do espaço" },
      { key: "convidadoPor", label: "Quem convidou", description: "Nome de quem enviou o convite" },
      { key: "papel", label: "Papel", description: "Editor, visualizador ou admin" },
      { key: "link", label: "Link", description: "Link do espaço" },
      { key: "data", label: "Data", description: "Data do convite" },
    ],
    defaultSubject: "Você entrou no espaço {{workspace}}",
    defaultBody: WORKSPACE_INVITE_MAIL_HTML,
    defaultFormat: "HTML",
    sample: {
      nome: "Ana Silva",
      email: "ana@desparcele.app",
      workspace: "Casa",
      convidadoPor: "Daniel Souza",
      papel: "Editor",
      data: "14/09/2026",
      link: "http://localhost:7250/workspaces",
    },
  },
  {
    id: "installment_reminder",
    label: "Lembrete de parcela",
    description: "Aviso de parcela perto do vencimento.",
    placeholders: [
      LOGO,
      { key: "nome", label: "Nome", description: "Dono da dívida" },
      { key: "email", label: "E-mail", description: "E-mail de quem recebe" },
      { key: "workspace", label: "Espaço", description: "Nome do espaço" },
      { key: "divida", label: "Dívida", description: "Nome da dívida" },
      { key: "parcela", label: "Parcela", description: "Número da parcela" },
      { key: "valor", label: "Valor", description: "Valor em reais" },
      { key: "vencimento", label: "Vencimento", description: "Data de vencimento" },
      { key: "link", label: "Link", description: "Link da dívida" },
      { key: "data", label: "Data", description: "Data do aviso" },
    ],
    defaultSubject: "Parcela {{parcela}} de {{divida}} vence em {{vencimento}}",
    defaultBody: INSTALLMENT_REMINDER_MAIL_HTML,
    defaultFormat: "HTML",
    sample: {
      nome: "Ana Silva",
      email: "ana@desparcele.app",
      workspace: "Casa",
      divida: "Cartão Nubank",
      parcela: "3",
      valor: "R$ 300,00",
      vencimento: "20/09/2026",
      data: "14/09/2026",
      link: "http://localhost:7250/workspaces",
    },
  },
];

export function findEmailPurpose(id: string): EmailPurposeDefinition | null {
  return EMAIL_PURPOSES.find((item) => item.id === id) ?? null;
}

export function applyEmailTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    return variables[key] ?? "";
  });
}
