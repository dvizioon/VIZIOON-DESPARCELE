export function toCents(value: string | number): number {
  const normalized = String(value).trim().replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    throw new Error("Valor monetario invalido");
  }

  const sign = match[1] === "-" ? -1 : 1;
  const reais = Number(match[2]);
  const cents = Number((match[3] ?? "00").padEnd(2, "0").slice(0, 2));

  return sign * (reais * 100 + cents);
}

export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return `${sign}${reais}.${fraction}`;
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function splitEvenly(totalCents: number, parts: number): number[] {
  if (parts < 1) {
    throw new Error("Quantidade de parcelas deve ser maior que zero");
  }

  const base = Math.floor(totalCents / parts);
  const remainder = totalCents % parts;

  return Array.from({ length: parts }, (_, index) => {
    return base + (index < remainder ? 1 : 0);
  });
}

export function parseBRLInput(raw: string): number {
  const cleaned = raw.replace(/[^\d.,-]/g, "");

  if (cleaned.includes(",") && cleaned.includes(".")) {
    return toCents(cleaned.replace(/\./g, "").replace(",", "."));
  }

  if (cleaned.includes(",")) {
    return toCents(cleaned.replace(",", "."));
  }

  return toCents(cleaned);
}
