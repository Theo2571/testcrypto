const API_URL = "https://launch.meme/api";

export async function fetchTokens() {
  const res = await fetch(`${API_URL}/tokens`);
  if (!res.ok) throw new Error("Failed to fetch tokens");
  return res.json();
}
