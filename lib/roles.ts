const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  seller: 'Vendedor',
  lojista: 'Lojista',
  logist: 'Lojista',
  client: 'Cliente',
};

export function translateRole(role?: string | null): string {
  if (!role) {
    return '';
  }

  const normalized = role.toLowerCase();
  const label = roleLabels[normalized];

  if (label) {
    return label;
  }

  return role;
}
