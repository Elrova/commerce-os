// Fixtures locales sans donnée d’accès et sans appel réseau.
export const matterhornSimpleProductFixture = {
  id: "186365", active: "true", name: "Robe de jour modèle 186365",
  description: "Robe de démonstration.", category_name: "Robes de jour",
  category_id: "42", brand_id: "261", brand: "Marque test",
  stock_total: 4, url: "https://matterhorn-wholesale.com/example-product.htm",
  images: ["https://matterhorn-wholesale.com/db_images/example.jpg"],
  variants: [{ variant_uid: "1090551", name: "38", stock: "4", max_processing_time: "3", ean: "5900000000001" }],
  prices: { EUR: 12.9 },
};

export const matterhornVariantsProductFixture = {
  ...matterhornSimpleProductFixture, id: "186366", stock_total: 9, images: [],
  variants: [
    { variant_uid: "1090552", name: "S", stock: "2", max_processing_time: "2", ean: "" },
    { variant_uid: "1090553", name: "M", stock: "7", max_processing_time: "2", ean: 0 },
  ],
};

export const matterhornInvalidProductFixture = {
  id: "invalid", active: "true", name: "Produit sans prix", prices: {},
};

export const matterhornFixtureExpectations = {
  simple: { stock: 4, ean: "5900000000001", images: 1 },
  variants: { stock: 9, ean: null, images: 0 },
  pagination: { firstPage: 1, importedAfterFirstPage: 100 },
  errors: ["authentication", "invalid-response", "missing-environment"],
};
