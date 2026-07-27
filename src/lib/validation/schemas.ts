import { z } from "zod";

export const petSchema = z.object({
  name: z.string().min(1, "Prénom requis").max(50),
  species: z.enum(["chien", "chat", "autre"]),
  breed: z.string().max(100).optional(),
  birth_date: z.string().optional(),
  approximate_age: z.string().max(50).optional(),
  weight_kg: z.coerce.number().positive().max(200).optional(),
  sex: z.enum(["male", "femelle", "inconnu"]).default("inconnu"),
});
export type PetInput = z.infer<typeof petSchema>;

export const situationSchema = z.object({
  document_type: z.enum(["devis", "facture"]),
  emergency_context: z.boolean().default(false),
  user_description: z.string().max(2000).optional(),
  primary_question: z.string().max(500).optional(),
  location_department: z.string().max(10).optional(),
  document_date: z.string().optional(),
});
export type SituationInput = z.infer<typeof situationSchema>;

export const consentSchema = z.object({
  consent_data_processing: z.literal(true, {
    message: "Ce consentement est obligatoire pour poursuivre.",
  }),
  consent_anonymized_statistics: z.boolean().default(false),
  consent_anonymized_content: z.boolean().default(false),
});
export type ConsentInput = z.infer<typeof consentSchema>;

export const documentUploadSchema = z.object({
  mime_type: z.enum(["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/heic"]),
  file_size: z.number().max(15 * 1024 * 1024, "Fichier trop volumineux (max 15 Mo)"),
  original_filename: z.string().min(1),
});
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export const productTypeSchema = z.enum(["single", "pack3", "annual"]);
