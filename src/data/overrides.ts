// Utilidades genéricas para aplicar ediciones de sesión (sin persistencia real)
// sobre los arreglos base de datos ficticias, usadas por DataStoreContext.
export type OverrideMap<T> = Record<string, Partial<T>>

export function aplicarOverride<T extends { id: string }>(item: T, overrides: OverrideMap<T>): T {
  const cambios = overrides[item.id]
  return cambios ? { ...item, ...cambios } : item
}

export function aplicarOverrides<T extends { id: string }>(items: T[], overrides: OverrideMap<T>): T[] {
  if (Object.keys(overrides).length === 0) return items
  return items.map((item) => aplicarOverride(item, overrides))
}
