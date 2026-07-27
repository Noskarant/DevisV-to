# DevisVéto

Application Next.js permettant à un propriétaire d’animal de faire expliquer un devis ou une facture vétérinaire avant de préparer ses questions pour la clinique.

Le service explique le document. Il ne pose aucun diagnostic, ne juge pas la nécessité médicale d’un soin et ne qualifie jamais un prix de normal, anormal ou trop cher.

## Lancement local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir ensuite `http://localhost:3000`.

## Pipeline documentaire

Le tunnel public utilise une séparation stricte des responsabilités :

1. le PDF ou l’image est stocké dans le bucket Supabase privé ;
2. Mistral OCR extrait le texte du document ;
3. les noms, coordonnées, références et identifiants détectables sont masqués côté serveur ;
4. seul le texte anonymisé est envoyé à DeepSeek V4 Flash ;
5. DeepSeek fonctionne explicitement en mode non-thinking ;
6. les montants retournés sont comparés au texte OCR et les formulations interdites sont filtrées ;
7. le rapport payé reste soumis à une validation humaine.

Le texte OCR brut n’est pas enregistré dans `ai_raw_output` et n’est jamais envoyé à DeepSeek avant anonymisation.

## Variables d’environnement principales

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

MISTRAL_API_KEY=
MISTRAL_OCR_MODEL=mistral-ocr-4-0

DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_BASE_URL=https://api.deepseek.com

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_SINGLE=

RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

L’appel DeepSeek contient systématiquement :

```json
{
  "thinking": { "type": "disabled" },
  "response_format": { "type": "json_object" }
}
```

Sans les clés Mistral ou DeepSeek, l’application conserve un aperçu de secours prudent et n’invente aucune ligne du document.

## Vérifications

```bash
npm run lint
npm run build
```

## Déploiement

Le projet cible Vercel. Ajouter les variables d’environnement dans Production, Preview et Development, puis redéployer. Les migrations SQL Supabase se trouvent dans `supabase/migrations/`.
