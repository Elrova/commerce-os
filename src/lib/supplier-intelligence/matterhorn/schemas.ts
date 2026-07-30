import { z } from "zod";

const stringNumber = z.union([z.string(), z.number()]).transform(String);
const numericValue = z.union([z.number(), z.string()]).transform((value, context) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    context.addIssue({ code: "custom", message: "Valeur numérique Matterhorn invalide." });
    return z.NEVER;
  }
  return number;
});

export const matterhornVariantSchema = z.object({
  variant_uid: stringNumber,
  name: stringNumber,
  stock: numericValue.pipe(z.number().int().nonnegative()),
  max_processing_time: numericValue.pipe(z.number().int().nonnegative()).optional(),
  ean: z.union([z.string(), z.number()]).optional().transform((value) => {
    const normalized = value == null ? "" : String(value).trim();
    return normalized && normalized !== "0" ? normalized : null;
  }),
}).passthrough();

export const matterhornProductSchema = z.object({
  id: stringNumber,
  active: z.union([z.string(), z.boolean(), z.number()]),
  name: z.string(),
  name_without_number: z.string().optional(),
  description: z.string().optional().default(""),
  creation_date: z.string().optional(),
  color: z.string().optional(),
  category_name: z.string().optional().default("Sans catégorie"),
  category_id: stringNumber.optional(),
  category_path: z.string().optional(),
  brand_id: stringNumber.optional(),
  brand: z.string().optional(),
  stock_total: numericValue.pipe(z.number().int().nonnegative()).optional(),
  url: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  new_collection: z.string().optional(),
  variants: z.array(matterhornVariantSchema).optional().default([]),
  prices: z.record(z.string(), numericValue),
  size_table: z.string().optional(),
  size_table_txt: z.string().optional(),
  size_table_html: z.string().optional(),
}).passthrough();

export const matterhornProductsResponseSchema = z.array(matterhornProductSchema);

// La documentation publique confirme les endpoints dictionnaires mais ne publie
// pas leur exemple de réponse. Cette validation accepte uniquement les deux
// clés sémantiques minimales, avec les alias observables id/name.
export const matterhornDictionaryEntrySchema = z.object({
  id: stringNumber,
  name: z.string(),
  parent_id: stringNumber.nullable().optional(),
}).passthrough();
export const matterhornDictionaryResponseSchema = z.array(matterhornDictionaryEntrySchema);

export type MatterhornProduct = z.infer<typeof matterhornProductSchema>;
