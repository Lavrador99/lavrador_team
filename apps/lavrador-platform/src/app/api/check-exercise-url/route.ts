// Cache em memória: evita re-verificar o mesmo URL na mesma instância do servidor
const cache = new Map<string, boolean>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return Response.json({ exists: false });

  if (cache.has(url)) return Response.json({ exists: cache.get(url) });

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const exists = res.ok;
    cache.set(url, exists);
    return Response.json({ exists });
  } catch {
    cache.set(url, false);
    return Response.json({ exists: false });
  }
}
