// @ts-nocheck
import { Token as ApiToken } from "../hooks/useTokens"; // то что прилетает с API

export function mapTokenFromApi(apiToken: ApiToken) {
  return {
    icon: apiToken.photo || "/icons/default.png",
    name: apiToken.name || apiToken.symbol,
    description: apiToken.description || "",
    ca: apiToken.token, // contract address
    volume: `$${Number(apiToken.volumeUsd || 0).toLocaleString()}`,
    buys: apiToken.buys ?? 0,
    sells: apiToken.sells ?? 0,
    marketCap: `$${Number(apiToken.marketCapUsd || 0).toLocaleString()}`,
    price: `$${Number(apiToken.priceUsd || 0).toFixed(6)}`,
    percent: apiToken.progress ?? 0,
    holders: apiToken.holders ?? 0,
    holdersPercent: apiToken.topHoldersPercentage ?? 0,
    time: apiToken.createdAt,
    author: apiToken.creator,
  };
}
