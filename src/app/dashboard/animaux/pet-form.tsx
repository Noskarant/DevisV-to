type PetFormValue = {
  id?: string;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  approximate_age?: string | null;
  weight_kg?: number | string | null;
  color?: string | null;
  identification_number?: string | null;
  sterilized?: boolean | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  current_treatments?: string | null;
  diet_notes?: string | null;
  behavior_notes?: string | null;
  veterinarian_name?: string | null;
  veterinarian_phone?: string | null;
  insurance_provider?: string | null;
  insurance_contract?: string | null;
  general_notes?: string | null;
  photo_path?: string | null;
};

type Props = {
  pet?: PetFormValue | null;
  photoUrl?: string | null;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3 text-sm text-[#173b35] outline-none transition placeholder:text-[#9aaba7] focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]";
const labelClass = "text-sm font-semibold text-[#315f57]";

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#dce7e2] bg-white p-5 shadow-[0_14px_40px_rgba(31,78,67,0.06)] sm:p-7">
      <p className="text-[11px] font-semibold uppercase text-[#5d8179]">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl text-[#123f38]">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#78908a]">{description}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function PetForm({ pet, photoUrl = null, action, submitLabel }: Props) {
  const sterilizedValue = pet?.sterilized === true ? "true" : pet?.sterilized === false ? "false" : "unknown";
  const initial = pet?.name?.trim().charAt(0).toUpperCase() || "🐾";

  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {pet?.id && <input type="hidden" name="pet_id" value={pet.id} />}

      <Section
        eyebrow="Photo — facultatif"
        title="Ajoutez un visage à sa fiche"
        description="La photo reste privée dans votre espace. JPG, PNG ou WebP, 5 Mo maximum."
      >
        <div className="sm:col-span-2 flex flex-col gap-5 rounded-2xl bg-[#f5f9f7] p-4 sm:flex-row sm:items-center">
          <div
            role="img"
            aria-label={pet?.name ? `Photo de ${pet.name}` : "Aperçu de la photo de l’animal"}
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-[#dfeee8] bg-cover bg-center text-3xl font-semibold text-[#245f55] shadow-inner"
            style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
          >
            {!photoUrl && initial}
          </div>
          <div className="flex-1">
            <label className="block">
              <span className={labelClass}>{photoUrl ? "Remplacer la photo" : "Choisir une photo"}</span>
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="mt-2 block w-full rounded-2xl border border-[#ccdcd6] bg-white px-3 py-2.5 text-sm text-[#45665f] file:mr-3 file:rounded-full file:border-0 file:bg-[#e7f3ee] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#205b51]"
              />
            </label>
            {pet?.photo_path && (
              <label className="mt-3 flex items-center gap-2 text-sm text-[#6c837d]">
                <input type="checkbox" name="remove_photo" value="true" className="h-4 w-4 accent-[#0c5b50]" />
                Supprimer la photo actuelle
              </label>
            )}
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Informations de base"
        title="Parlez-nous de votre animal"
        description="Commencez par son nom et son espèce. Les autres champs peuvent rester vides."
      >
        <label>
          <span className={labelClass}>Nom de votre animal *</span>
          <input name="name" required maxLength={80} defaultValue={pet?.name ?? ""} className={inputClass} placeholder="Ex. Nala" />
        </label>
        <label>
          <span className={labelClass}>Espèce *</span>
          <select name="species" defaultValue={pet?.species ?? "chien"} className={inputClass}>
            <option value="chien">Chien</option>
            <option value="chat">Chat</option>
            <option value="autre">Autre animal</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Race <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
          <input name="breed" maxLength={180} defaultValue={pet?.breed ?? ""} className={inputClass} placeholder="Ex. Labrador, européen…" />
        </label>
        <label>
          <span className={labelClass}>Couleur ou robe <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
          <input name="color" maxLength={180} defaultValue={pet?.color ?? ""} className={inputClass} placeholder="Ex. noir et blanc" />
        </label>
        <label>
          <span className={labelClass}>Sexe <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
          <select name="sex" defaultValue={pet?.sex ?? "inconnu"} className={inputClass}>
            <option value="inconnu">Je ne sais pas</option>
            <option value="male">Mâle</option>
            <option value="femelle">Femelle</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Stérilisé(e) ? <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
          <select name="sterilized" defaultValue={sterilizedValue} className={inputClass}>
            <option value="unknown">Je ne sais pas</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Date de naissance, si vous la connaissez</span>
          <input type="date" name="birth_date" defaultValue={pet?.birth_date ?? ""} className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Âge approximatif, si la date est inconnue</span>
          <input name="approximate_age" maxLength={180} defaultValue={pet?.approximate_age ?? ""} className={inputClass} placeholder="Ex. environ 7 ans" />
        </label>
        <label>
          <span className={labelClass}>Poids actuel <span className="font-normal text-[#8a9e99]">(kg, facultatif)</span></span>
          <input type="number" min="0.1" max="299" step="0.01" name="weight_kg" defaultValue={pet?.weight_kg ?? ""} className={inputClass} placeholder="Ex. 12,5" />
        </label>
        <label>
          <span className={labelClass}>N° de puce ou de tatouage <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
          <input name="identification_number" maxLength={180} defaultValue={pet?.identification_number ?? ""} className={inputClass} placeholder="Ex. 250269…" />
        </label>
      </Section>

      <Section
        eyebrow="Santé et habitudes — facultatif"
        title="Ce qu’il peut être utile de noter"
        description="Renseignez seulement ce que vous savez. Ces informations ne servent pas à poser un diagnostic."
      >
        <label className="sm:col-span-2">
          <span className={labelClass}>Allergies ou intolérances connues</span>
          <textarea name="allergies" rows={3} defaultValue={pet?.allergies ?? ""} className={inputClass} placeholder="Ex. allergie déclarée à un médicament, intolérance alimentaire…" />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Antécédents importants</span>
          <textarea name="chronic_conditions" rows={3} defaultValue={pet?.chronic_conditions ?? ""} className={inputClass} placeholder="Ex. opération passée, affection connue ou information indiquée par la clinique." />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Traitements en cours</span>
          <textarea name="current_treatments" rows={3} defaultValue={pet?.current_treatments ?? ""} className={inputClass} placeholder="Ex. nom du traitement, dose et fréquence, si vous les connaissez." />
        </label>
        <label>
          <span className={labelClass}>Alimentation</span>
          <textarea name="diet_notes" rows={4} defaultValue={pet?.diet_notes ?? ""} className={inputClass} placeholder="Ex. alimentation habituelle, régime indiqué…" />
        </label>
        <label>
          <span className={labelClass}>Comportement et habitudes</span>
          <textarea name="behavior_notes" rows={4} defaultValue={pet?.behavior_notes ?? ""} className={inputClass} placeholder="Ex. anxieux en clinique, difficulté à prendre des comprimés…" />
        </label>
      </Section>

      <Section
        eyebrow="Contacts — facultatif"
        title="Clinique et assurance"
        description="Gardez ici les coordonnées que vous souhaitez retrouver facilement."
      >
        <label>
          <span className={labelClass}>Clinique habituelle</span>
          <input name="veterinarian_name" maxLength={180} defaultValue={pet?.veterinarian_name ?? ""} className={inputClass} placeholder="Nom de la clinique" />
        </label>
        <label>
          <span className={labelClass}>Téléphone de la clinique</span>
          <input name="veterinarian_phone" maxLength={180} defaultValue={pet?.veterinarian_phone ?? ""} className={inputClass} placeholder="Ex. 04 00 00 00 00" />
        </label>
        <label>
          <span className={labelClass}>Assurance animale</span>
          <input name="insurance_provider" maxLength={180} defaultValue={pet?.insurance_provider ?? ""} className={inputClass} placeholder="Nom de l’assureur" />
        </label>
        <label>
          <span className={labelClass}>Numéro de contrat</span>
          <input name="insurance_contract" maxLength={180} defaultValue={pet?.insurance_contract ?? ""} className={inputClass} placeholder="Ex. contrat n° 123456" />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClass}>Autres informations utiles</span>
          <textarea name="general_notes" rows={4} defaultValue={pet?.general_notes ?? ""} className={inputClass} placeholder="Ex. habitudes en clinique, personne à contacter ou consigne pratique." />
        </label>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-[#d6e5df] bg-white/95 p-3 shadow-[0_15px_45px_rgba(18,63,56,0.15)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="px-2 text-xs leading-5 text-[#78908a]">Vous pourrez revenir compléter cette fiche quand vous le souhaitez.</p>
        <button type="submit" className="shrink-0 rounded-full bg-[#0c5b50] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(12,91,80,0.2)] transition hover:-translate-y-0.5 hover:bg-[#084d44]">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
