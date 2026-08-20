export function buildQueryString(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  ) as [string, string | number][];
  return new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
