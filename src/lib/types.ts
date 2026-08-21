export type Search = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  size: string | null;
  brand: string | null;
  minimumQuantity: number | null;
  maxPriceCents: number | null;
  preferredStores: string[];
  active: boolean;
  updatedAt: string;
};

export type Offer = {
  id: string;
  title: string;
  retailer: string;
  priceCents: number | null;
  unitPriceCents: number | null;
  size: string | null;
  quantity: number | null;
  relevanceReason: string;
  url: string;
  status: "new" | "viewed" | "discarded" | "expired";
};
