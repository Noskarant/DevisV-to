"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const optionalText = z.string().trim().max(2500).optional().transform((value) => value || null);
const optionalShortText = z.string().trim().max(180).optional().transform((value) => value || null);

const petSchema = z.object({
  name: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
  species: z.enum(["chien", "chat", "autre"]),
  breed: optionalShortText,
  sex: z.enum(["male", "femelle", "inconnu"]),
  birth_date: z.string().optional().transform((value) => value || null),
  approximate_age: optionalShortText,
  weight_kg: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value.replace(",", ".")) : null))
    .refine((value) => value === null || (Number.isFinite(value) && value > 0 && value < 300), "Poids invalide."),
  color: optionalShortText,
  identification_number: optionalShortText,
  sterilized: z.enum(["true", "false", "unknown"]).transform((value) =>
    value === "unknown" ? null : value === "true"
  ),
  allergies: optionalText,
  chronic_conditions: optionalText,
  current_treatments: optionalText,
  diet_notes: optionalText,
  behavior_notes: optionalText,
  veterinarian_name: optionalShortText,
  veterinarian_phone: optionalShortText,
  insurance_provider: optionalShortText,
  insurance_contract: optionalShortText,
  general_notes: optionalText,
});

function formObject(formData: FormData) {
  return Object.fromEntries(
    [
      "name",
      "species",
      "breed",
      "sex",
      "birth_date",
      "approximate_age",
      "weight_kg",
      "color",
      "identification_number",
      "sterilized",
      "allergies",
      "chronic_conditions",
      "current_treatments",
      "diet_notes",
      "behavior_notes",
      "veterinarian_name",
      "veterinarian_phone",
      "insurance_provider",
      "insurance_contract",
      "general_notes",
    ].map((key) => [key, String(formData.get(key) ?? "")])
  );
}

export async function createPetAction(formData: FormData) {
  const user = await requireUser();
  const parsed = petSchema.safeParse(formObject(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Informations invalides.");

  const supabase = await createClient();
  const { data: pet, error } = await supabase
    .from("pets")
    .insert({ user_id: user.id, ...parsed.data })
    .select("id")
    .single();
  if (error || !pet) throw new Error(error?.message ?? "Animal non créé.");

  if (parsed.data.weight_kg) {
    await supabase.from("pet_weight_entries").insert({
      user_id: user.id,
      pet_id: pet.id,
      weight_kg: parsed.data.weight_kg,
      recorded_at: new Date().toISOString().slice(0, 10),
      notes: "Poids renseigné à la création du dossier",
    });
  }

  redirect(`/dashboard/animaux/${pet.id}`);
}

export async function updatePetAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  if (!petId) throw new Error("Animal introuvable.");

  const parsed = petSchema.safeParse(formObject(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Informations invalides.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("pets")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", petId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/animaux/${petId}`);
  revalidatePath("/dashboard");
}

export async function addWeightAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const weight = Number(String(formData.get("weight_kg") ?? "").replace(",", "."));
  const recordedAt = String(formData.get("recorded_at") || new Date().toISOString().slice(0, 10));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!petId || !Number.isFinite(weight) || weight <= 0 || weight >= 300) {
    throw new Error("Poids invalide.");
  }

  const supabase = await createClient();
  const { data: ownedPet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("user_id", user.id)
    .single();
  if (!ownedPet) throw new Error("Animal introuvable.");

  await supabase.from("pet_weight_entries").insert({
    user_id: user.id,
    pet_id: petId,
    weight_kg: weight,
    recorded_at: recordedAt,
    notes,
  });
  await supabase
    .from("pets")
    .update({ weight_kg: weight, updated_at: new Date().toISOString() })
    .eq("id", petId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/animaux/${petId}`);
  revalidatePath("/dashboard");
}

export async function addReminderAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!petId || !title || !dueDate) throw new Error("Titre et date obligatoires.");

  const supabase = await createClient();
  const { data: ownedPet } = await supabase
    .from("pets")
    .select("id")
    .eq("id", petId)
    .eq("user_id", user.id)
    .single();
  if (!ownedPet) throw new Error("Animal introuvable.");

  await supabase.from("pet_reminders").insert({
    user_id: user.id,
    pet_id: petId,
    title: title.slice(0, 180),
    due_date: dueDate,
    notes,
  });

  revalidatePath(`/dashboard/animaux/${petId}`);
  revalidatePath("/dashboard");
}

export async function completeReminderAction(formData: FormData) {
  const user = await requireUser();
  const reminderId = String(formData.get("reminder_id") ?? "");
  const petId = String(formData.get("pet_id") ?? "");
  if (!reminderId || !petId) return;

  const supabase = await createClient();
  await supabase
    .from("pet_reminders")
    .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", reminderId)
    .eq("user_id", user.id);

  revalidatePath(`/dashboard/animaux/${petId}`);
  revalidatePath("/dashboard");
}

export async function archivePetAction(formData: FormData) {
  const user = await requireUser();
  const petId = String(formData.get("pet_id") ?? "");
  if (!petId) return;

  const supabase = await createClient();
  await supabase
    .from("pets")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", petId)
    .eq("user_id", user.id);

  redirect("/dashboard");
}
