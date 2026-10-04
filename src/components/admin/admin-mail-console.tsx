"use client";

import { useActionState, useMemo, useState } from "react";
import {
  deleteSmtpAction,
  retryOutboxAction,
  savePurposeAction,
  saveSmtpAction,
  testPurposeAction,
  testSmtpAction,
} from "@/app/actions/mail";
import { FormError } from "@/components/forms/auth-forms";
import { PillTrack } from "@/components/motion/pill-track";
import { NoteEditor } from "@/components/notes/note-editor";
import { AppIcon } from "@/components/ui/icon";
import { EMAIL_PURPOSES, type EmailPurposeId } from "@/modules/mail/domain/purposes";

type ProviderView = {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  fromAddress: string;
  replyTo: string | null;
  active: boolean;
  isDefault: boolean;
  hasPassword: boolean;
};

type PurposeView = {
  purpose: string;
  providerId: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  bodyFormat: "HTML" | "TEXT";
  active: boolean;
};

type OutboxView = {
  id: string;
  purpose: string;
  toEmail: string;
  subject: string;
  status: "PENDING" | "SENT" | "FAILED";
  error: string | null;
  attempts: number;
  createdAt: string;
};

const empty: { error: string | null; ok?: boolean } = { error: null };

export function AdminMailConsole({
  providers,
  purposes,
  outbox,
  only,
}: {
  providers: ProviderView[];
  purposes: PurposeView[];
  outbox: OutboxView[];
  only?: "smtp" | "purposes" | "queue";
}) {
  const [tab, setTab] = useState<"smtp" | "purposes" | "queue">(only ?? "smtp");
  const current = only ?? tab;

  return (
    <div className="space-y-5">
      {only ? null : (
        <PillTrack className="flex gap-1 rounded-full bg-white/80 p-1" watch={tab}>
          <TabButton active={tab === "smtp"} onClick={() => setTab("smtp")}>
            SMTP
          </TabButton>
          <TabButton active={tab === "purposes"} onClick={() => setTab("purposes")}>
            Finalidades
          </TabButton>
          <TabButton active={tab === "queue"} onClick={() => setTab("queue")}>
            Fila
          </TabButton>
        </PillTrack>
      )}

      {current === "smtp" ? <SmtpPanel providers={providers} /> : null}
      {current === "purposes" ? <PurposePanel providers={providers} purposes={purposes} /> : null}
      {current === "queue" ? <QueuePanel items={outbox} /> : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      className={`nav-link relative z-10 flex-1 justify-center ${active ? "text-ink" : ""}`}
      data-pill-active={active ? "true" : "false"}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SmtpPanel({ providers }: { providers: ProviderView[] }) {
  const [selectedId, setSelectedId] = useState(providers[0]?.id ?? "");
  const selected = providers.find((item) => item.id === selectedId) ?? null;
  const [creating, setCreating] = useState(providers.length === 0);
  const [saveState, saveAction, saving] = useActionState(saveSmtpAction, empty);
  const [testState, testAction, testing] = useActionState(testSmtpAction, empty);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="sheet space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">Provedores</h2>
          <button
            className="btn-ghost"
            onClick={() => {
              setCreating(true);
              setSelectedId("");
            }}
            type="button"
          >
            <AppIcon name="tabler:plus" className="size-4" />
            Novo
          </button>
        </div>
        {providers.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum SMTP ainda. Cadastra host, porta e remetente.</p>
        ) : (
          <ul className="grid gap-2">
            {providers.map((item) => (
              <li key={item.id}>
                <button
                  className={`w-full rounded-2xl px-3 py-3 text-left ${
                    !creating && item.id === selectedId ? "bg-pine-soft text-pine-dark" : "bg-white"
                  }`}
                  onClick={() => {
                    setCreating(false);
                    setSelectedId(item.id);
                  }}
                  type="button"
                >
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-ink/50">
                    {item.host}:{item.port} · {item.fromAddress}
                    {item.isDefault ? " · padrão" : ""}
                    {item.active ? "" : " · off"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sheet space-y-4">
        <h2 className="font-display text-2xl">{creating ? "Novo SMTP" : "Editar SMTP"}</h2>
        <form action={saveAction} className="space-y-3" key={creating ? "new" : selected?.id}>
          {creating ? null : <input name="id" type="hidden" value={selected?.id ?? ""} />}
          <Field label="Nome" name="name" defaultValue={creating ? "" : selected?.name} placeholder="Gmail, Amazon SES..." />
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
            <Field label="Host" name="host" defaultValue={creating ? "" : selected?.host} placeholder="smtp.gmail.com" />
            <Field label="Porta" name="port" defaultValue={String(creating ? 587 : selected?.port ?? 587)} type="number" />
          </div>
          <Field
            label="Remetente"
            name="fromAddress"
            defaultValue={creating ? "" : selected?.fromAddress}
            placeholder="Desparcele <app@desparcele.app>"
          />
          <Field label="Usuário" name="username" defaultValue={creating ? "" : selected?.username ?? ""} />
          <Field
            label="Senha"
            name="password"
            placeholder={creating ? "" : selected?.hasPassword ? "Deixe vazio para manter" : ""}
            type="password"
          />
          <Field label="Reply-to" name="replyTo" defaultValue={creating ? "" : selected?.replyTo ?? ""} />
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={creating ? false : Boolean(selected?.secure)} name="secure" type="checkbox" />
            SSL/TLS (porta 465)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={creating ? true : Boolean(selected?.active)} name="active" type="checkbox" />
            Ativo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={creating ? true : Boolean(selected?.isDefault)} name="isDefault" type="checkbox" />
            SMTP padrão
          </label>
          {saveState.error ? <FormError message={saveState.error} /> : null}
          {saveState.ok ? <p className="text-sm text-moss">SMTP salvo.</p> : null}
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={saving} type="submit">
              {saving ? "Salvando..." : "Salvar SMTP"}
            </button>
            {!creating && selected ? (
              <button
                className="btn-ghost text-clay"
                onClick={() => {
                  void deleteSmtpAction(selected.id);
                }}
                type="button"
              >
                Excluir
              </button>
            ) : null}
          </div>
        </form>

        {!creating && selected ? (
          <form action={testAction} className="space-y-3 border-t border-line pt-4">
            <h3 className="font-medium">Testar envio</h3>
            <input name="providerId" type="hidden" value={selected.id} />
            <Field label="Enviar para" name="to" placeholder="voce@email.com" />
            <label className="block space-y-1.5">
              <span className="text-sm text-ink/70">Formato</span>
              <select className="field" defaultValue="HTML" name="format">
                <option value="HTML">HTML</option>
                <option value="TEXT">Texto</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm text-ink/70">Mensagem (opcional)</span>
              <textarea className="field min-h-24" name="message" placeholder="Deixe vazio para a mensagem padrão de teste." />
            </label>
            {testState.error ? <FormError message={testState.error} /> : null}
            {testState.ok ? <p className="text-sm text-moss">Teste enviado.</p> : null}
            <button className="btn-ghost" disabled={testing} type="submit">
              {testing ? "Enviando..." : "Enviar teste"}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function PurposePanel({
  providers,
  purposes,
}: {
  providers: ProviderView[];
  purposes: PurposeView[];
}) {
  const [purposeId, setPurposeId] = useState<EmailPurposeId>("password_reset");
  const definition = EMAIL_PURPOSES.find((item) => item.id === purposeId)!;
  const initial = purposes.find((item) => item.purpose === purposeId);
  const [body, setBody] = useState(initial?.bodyTemplate ?? definition.defaultBody);
  const [format, setFormat] = useState<"HTML" | "TEXT">(initial?.bodyFormat ?? definition.defaultFormat);
  const [formKey, setFormKey] = useState(0);
  const [saveState, saveAction, saving] = useActionState(savePurposeAction, empty);
  const [testState, testAction, testing] = useActionState(testPurposeAction, empty);

  const current = useMemo(() => {
    return purposes.find((item) => item.purpose === purposeId);
  }, [purposeId, purposes]);

  function applyDefaultTemplate() {
    setBody(definition.defaultBody);
    setFormat(definition.defaultFormat);
    setFormKey((value) => value + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {EMAIL_PURPOSES.map((item) => (
          <button
            className={`rounded-full px-3 py-2 text-sm ${
              item.id === purposeId ? "bg-pine text-white" : "bg-white text-ink/70"
            }`}
            key={item.id}
            onClick={() => {
              const next = purposes.find((entry) => entry.purpose === item.id);
              setPurposeId(item.id);
              setBody(next?.bodyTemplate ?? item.defaultBody);
              setFormat(next?.bodyFormat ?? item.defaultFormat);
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="sheet space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{definition.label}</h2>
            <p className="mt-1 text-sm text-ink/60">{definition.description}</p>
          </div>
          <button className="btn-ghost" onClick={applyDefaultTemplate} type="button">
            Usar template padrão
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {definition.placeholders.map((item) => (
            <button
              className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink/70"
              key={item.key}
              onClick={() => setBody((currentBody) => `${currentBody} {{${item.key}}}`)}
              title={item.description}
              type="button"
            >
              {`{{${item.key}}}`} · {item.label}
            </button>
          ))}
        </div>

        <form action={saveAction} className="space-y-3" key={`${purposeId}-${formKey}`}>
          <input name="purpose" type="hidden" value={purposeId} />
          <input name="bodyTemplate" type="hidden" value={body} />
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">SMTP desta fila</span>
            <select className="field" defaultValue={current?.providerId ?? ""} key={purposeId + "-provider"} name="providerId">
              <option value="">Usar o SMTP padrão</option>
              {providers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Assunto"
            name="subjectTemplate"
            defaultValue={current?.subjectTemplate ?? definition.defaultSubject}
          />
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Formato</span>
            <select
              className="field"
              name="bodyFormat"
              onChange={(event) => setFormat(event.target.value === "TEXT" ? "TEXT" : "HTML")}
              value={format}
            >
              <option value="HTML">HTML</option>
              <option value="TEXT">Texto</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Conteúdo</span>
            {format === "HTML" ? (
              <NoteEditor
                emailMode
                height={480}
                placeholder="Corpo do e-mail"
                value={body}
                onChange={setBody}
              />
            ) : (
              <textarea
                className="field min-h-48"
                onChange={(event) => setBody(event.target.value)}
                value={body}
              />
            )}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={current?.active ?? true} key={purposeId + "-active"} name="active" type="checkbox" />
            Fila ativa
          </label>
          {saveState.error ? <FormError message={saveState.error} /> : null}
          {saveState.ok ? <p className="text-sm text-moss">Finalidade salva.</p> : null}
          <button className="btn-primary" disabled={saving} type="submit">
            {saving ? "Salvando..." : "Salvar finalidade"}
          </button>
        </form>

        <form action={testAction} className="space-y-3 border-t border-line pt-4">
          <h3 className="font-medium">Disparar teste com variáveis de exemplo</h3>
          <input name="purpose" type="hidden" value={purposeId} />
          <Field label="Enviar para" name="to" placeholder="voce@email.com" />
          {testState.error ? <FormError message={testState.error} /> : null}
          {testState.ok ? <p className="text-sm text-moss">Disparo na fila. Confira a aba Fila.</p> : null}
          <button className="btn-ghost" disabled={testing} type="submit">
            {testing ? "Enviando..." : "Disparar teste"}
          </button>
        </form>
      </section>
    </div>
  );
}

function QueuePanel({ items }: { items: OutboxView[] }) {
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  return (
    <section className="sheet space-y-3">
      <h2 className="font-display text-2xl">Fila de envio</h2>
      <p className="text-sm text-ink/60">Pode reenviar qualquer e-mail da fila, mesmo os que já saíram.</p>
      {error ? <FormError message={error} /> : null}
      {items.length === 0 ? (
        <p className="text-sm text-ink/60">Nada na fila ainda.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li className="rounded-2xl bg-white px-3 py-3" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.subject}</p>
                  <p className="text-xs text-ink/50">
                    {item.toEmail} · {purposeLabel(item.purpose)} · {statusLabel(item.status)} ·{" "}
                    {item.attempts} tentativa(s)
                  </p>
                  <p className="text-xs text-ink/40">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </p>
                  {item.error ? <p className="mt-1 text-xs text-clay">{item.error}</p> : null}
                </div>
                <button
                  className="btn-ghost"
                  disabled={sendingId === item.id}
                  onClick={() => {
                    setError(null);
                    setSendingId(item.id);
                    void retryOutboxAction(item.id).then((result) => {
                      setSendingId(null);
                      if (result.error) {
                        setError(result.error);
                      }
                    });
                  }}
                  type="button"
                >
                  {sendingId === item.id
                    ? "Enviando..."
                    : item.status === "FAILED"
                      ? "Tentar de novo"
                      : "Reenviar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function purposeLabel(purpose: string): string {
  if (purpose === "smtp_test") {
    return "Teste SMTP";
  }

  return EMAIL_PURPOSES.find((item) => item.id === purpose)?.label ?? purpose;
}

function statusLabel(status: OutboxView["status"]): string {
  if (status === "SENT") {
    return "enviado";
  }
  if (status === "FAILED") {
    return "falhou";
  }
  return "na fila";
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-ink/70">{label}</span>
      <input
        className="field"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}
