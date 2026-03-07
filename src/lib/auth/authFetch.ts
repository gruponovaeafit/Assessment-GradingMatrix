export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  onUnauthorized?: () => void
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return res;
  }

  return res;
}
