function sizeNumber(value: string | null | undefined) {
  const match = value?.match(/\b(?:talla|t|size)\s*([0-9]+)\b/i);
  return match?.[1] ?? null;
}

export function matchesSearch(search: { size: string | null; minimumQuantity: number | null; maxPriceCents: number | null }, candidate: { title: string; size: string | null; quantity: number | null; price: number | null; availability: string }) {
  const requestedSize = sizeNumber(search.size);
  const candidateSize = sizeNumber(candidate.size) ?? sizeNumber(candidate.title);
  if (requestedSize && candidateSize !== requestedSize) return false;
  if (search.minimumQuantity !== null && (candidate.quantity === null || candidate.quantity < search.minimumQuantity)) return false;
  if (search.maxPriceCents !== null && (candidate.price === null || candidate.price * 100 > search.maxPriceCents)) return false;
  if (candidate.price === null || candidate.availability !== "available") return false;
  return true;
}
