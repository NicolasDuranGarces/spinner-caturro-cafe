export async function readErrorMessage(res, fallback = 'Ocurrió un error') {
  try {
    const data = await res.clone().json();
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d) => d?.msg || d).join(', ');
    }
    if (typeof data?.message === 'string') return data.message;
  } catch (_) {
    try {
      const t = await res.text();
      const trimmed = (t || '').trim();
      if (!trimmed) return fallback;
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) return fallback;
      return trimmed;
    } catch (_) {
      return fallback;
    }
  }
  return fallback;
}

