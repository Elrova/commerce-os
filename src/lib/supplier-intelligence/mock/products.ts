import type { NormalizedSupplierProduct } from "../schemas";

const now = "2026-07-30T10:00:00.000Z";
const seeds = [
  ["EU-1001","Lampe de table rechargeable","Éclairage",18.9,4.9,39.9,84,1,2,4,"5901234123457"],
  ["EU-1002","Applique murale minimaliste","Éclairage",31,6.5,44.9,22,1,3,6,"5901234123458"],
  ["EU-1003","Panier de rangement feutre","Maison",8.5,3.9,29.9,140,1,2,4,"5901234123459"],
  ["EU-1004","Organiseur de cuisine modulaire","Maison",24,7.5,34.9,7,4,4,8,"5901234123460"],
  ["EU-1005","Fontaine silencieuse pour chat","Animaux",22.8,6.9,54.9,48,1,2,5,"5901234123461"],
  ["EU-1006","Tapis rafraîchissant pour chien","Animaux",12.4,5.5,29.9,0,1,3,6,"5901234123462"],
  ["EU-1007","Compresseur automobile compact","Auto",28.5,6.9,69.9,31,1,2,4,"5901234123463"],
  ["EU-1008","Organiseur de coffre pliable","Auto",14.2,7.9,39.9,9,1,3,7,null],
  ["EU-1009","Arroseur solaire goutte-à-goutte","Jardin",32,8.9,79.9,65,1,2,5,"5901234123465"],
  ["EU-1010","Éclairage solaire de terrasse","Jardin",26.5,9.5,59.9,3,2,8,14,"5901234123466"],
  ["EU-1011","Support ordinateur aluminium","Accessoires informatiques",16.8,4.5,45.9,108,1,2,4,"5901234123467"],
  ["EU-1012","Hub USB-C 7 ports","Accessoires informatiques",27.9,4.5,69.9,19,1,2,4,"5901234123468"],
  ["EU-1013","Clavier compact multi-appareils","Accessoires informatiques",36,5.9,79.9,44,1,3,5,"5901234123469"],
  ["EU-1014","Coussin ergonomique mémoire de forme","Maison",19.5,8.5,49.9,76,1,4,7,"5901234123470"],
  ["EU-1015","Guirlande extérieure connectée","Éclairage",38,11.9,64.9,12,1,10,18,"5901234123471"],
] as const;

export const mockEuropeanProducts: NormalizedSupplierProduct[] = seeds.map(([sku,title,category,price,shipping,rrp,stock,moq,minDays,maxDays,ean], index) => ({
  externalId: `mock-eu-${index + 1}`, supplierId: "mock-eu", sku, ean, gtin: ean,
  brand: index % 3 === 0 ? "Nordlicht" : index % 3 === 1 ? "CasaNova" : "EuroLiving",
  manufacturer: "Mock European Distribution", title,
  description: `${title}, produit de démonstration expédié depuis l’Union européenne.`,
  category, attributes: { scenario: stock === 0 ? "indisponible" : stock < 10 ? "stock-faible" : maxDays > 10 ? "delai-long" : "standard" },
  images: [], variants: index === 0 ? [
    { externalId: "mock-eu-1-black", sku: `${sku}-BLK`, label: "Noir", attributes: { color: "Noir" }, stock: 42, price },
    { externalId: "mock-eu-1-sage", sku: `${sku}-SAG`, label: "Sauge", attributes: { color: "Sauge" }, stock: 42, price: price + 1 },
  ] : [],
  purchasePriceExVat: price, purchasePriceIncVat: Number((price * 1.2).toFixed(2)),
  recommendedRetailPrice: rrp, currency: "EUR", stock,
  stockStatus: stock === 0 ? "out_of_stock" : stock < 10 ? "low_stock" : "in_stock",
  minimumOrderQuantity: moq, weight: 0.8 + index * 0.12,
  dimensions: { length: 30, width: 20, height: 12, unit: "cm" },
  shippingCost: shipping, shippingCountries: ["FR","BE","DE","ES","IT","NL"],
  shipsFromCountry: index % 4 === 0 ? "DE" : index % 4 === 1 ? "NL" : "PL",
  estimatedDeliveryMinDays: minDays, estimatedDeliveryMaxDays: maxDays,
  productUrl: null, active: stock > 0, rawData: { fixture: true, priceVersion: index === 11 ? 2 : 1 }, lastSyncedAt: now,
}));
