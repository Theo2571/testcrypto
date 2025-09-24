export interface Token {
  volumeUsd: string;
  marketCapUsd: string;
  priceUsd: string;
  creator?: string;
  icon?: string;
  name: string;
  description?: string;
  ca: string;
  volume: string;
  buys?: number;
  sells?: number;
  marketCap: string;
  price: string;
  percent: number;
  holders: number;
  holdersPercent?: number;
  time?: string;
  author?: string;
  symbol?: string;
  telegram?: string;
  metadataUrl?: string;
  tokenType?: string;
  x?: string;
  website?: string;
}
