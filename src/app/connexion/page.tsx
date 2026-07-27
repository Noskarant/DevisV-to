import { LoginForm } from "./login-form";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
      <p className="mt-2 text-sm text-slate-600">
        Recevez un lien de connexion par email, aucun mot de passe nécessaire.
      </p>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          Le lien de connexion n&apos;est plus valide, merci de réessayer.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
