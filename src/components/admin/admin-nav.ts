export const ADMIN_NAV = [
  { href: "/admin", icon: "tabler:layout-dashboard", label: "Visão geral", exact: true },
  { href: "/admin/usuarios", icon: "tabler:users", label: "Usuários" },
  { href: "/admin/espacos", icon: "tabler:building-community", label: "Espaços" },
  { href: "/admin/configuracoes", icon: "tabler:settings", label: "Configurações" },
] as const;

export function isAdminNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
