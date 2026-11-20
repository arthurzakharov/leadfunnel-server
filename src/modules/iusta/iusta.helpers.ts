// Objects go to the query as JSON (?filter={"where":...}), as LoopBack expects,
// instead of axios' default filter[where][...]=... Undefined values are skipped.
export const serializeLoopbackParams = (params: Record<string, unknown>) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.append(
      key,
      value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)
    );
  }
  return searchParams.toString();
};
