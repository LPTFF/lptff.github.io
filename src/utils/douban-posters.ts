let posterIndexPromise: Promise<Record<string, string>> | null = null;

function loadPosterIndex(): Promise<Record<string, string>> {
  if (!posterIndexPromise) {
    const baseUrl = import.meta.env.BASE_URL || "/";
    posterIndexPromise = fetch(`${baseUrl}data/douban-posters.json`, {
      cache: "force-cache",
      credentials: "same-origin",
    }).then(async (response) => {
      if (!response.ok) throw new Error(`Douban poster index request failed: ${response.status}`);
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("Douban poster index has an invalid shape");
      }
      return payload as Record<string, string>;
    }).catch((error) => {
      posterIndexPromise = null;
      throw error;
    });
  }
  return posterIndexPromise;
}

export async function getDoubanPoster(id: string): Promise<string | null> {
  const index = await loadPosterIndex();
  const value = index[id];
  return typeof value === "string" ? value : null;
}
