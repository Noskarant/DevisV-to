"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import {
  petSchema,
  situationSchema,
  consentSchema,
  type PetInput,
  type SituationInput,
  type ConsentInput,
} from "@/lib/validation/schemas";

export async function createPetAction(input: PetInput) {
  const user = await requireUser();
  const parsed = petSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pets")
    .insert({ ...parsed, user_id: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function createDraftCaseAction(petId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cases")
    .insert({ user_id: user.id, pet_id: petId, status: "draft" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateSituationAction(caseId: string, input: SituationInput) {
  const user = await requireUser();
  const parsed = situationSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("cases")
    .update(parsed)
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function updateConsentsAction(caseId: string, input: ConsentInput) {
  const user = await requireUser();
  const parsed = consentSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("cases")
    .update({ ...parsed, status: "uploaded" })
    .eq("id", caseId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
