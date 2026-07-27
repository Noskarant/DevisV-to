function layout(title: string, bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
    <h1 style="font-size: 20px; margin-bottom: 8px;">${title}</h1>
    <div style="font-size: 14px; line-height: 1.6; color: #334155;">${bodyHtml}</div>
    <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">
      DevisVéto — explication de devis vétérinaire, ne remplace pas l'avis de votre vétérinaire.
    </p>
  </div>`;
}

export function documentReceivedTemplate(petName: string) {
  return layout(
    "Votre document a bien été reçu",
    `<p>Nous avons bien reçu le devis concernant ${petName}. Il est en cours de lecture.</p>
     <p>Vous pourrez consulter un aperçu gratuit puis débloquer l'explication complète depuis votre espace.</p>`
  );
}

export function paymentConfirmedTemplate(petName: string) {
  return layout(
    "Paiement confirmé",
    `<p>Votre paiement a bien été validé. L'analyse du devis de ${petName} est en cours de vérification par notre équipe.</p>
     <p>Vous recevrez un email dès que votre rapport sera prêt.</p>`
  );
}

export function needsInformationTemplate(petName: string) {
  return layout(
    "Information complémentaire nécessaire",
    `<p>Pour terminer l'analyse du dossier de ${petName}, il nous manque une information.</p>
     <p>Connectez-vous à votre espace pour voir le détail et compléter votre dossier.</p>`
  );
}

export function reportReadyTemplate(petName: string, reportUrl: string) {
  return layout(
    "Votre rapport est disponible",
    `<p>L'explication du devis de ${petName} est prête et a été relue par notre équipe.</p>
     <p><a href="${reportUrl}" style="color:#0f172a;">Consulter mon rapport</a></p>`
  );
}

export function feedbackRequestTemplate(petName: string) {
  return layout(
    "Votre avis nous intéresse",
    `<p>Vous avez consulté l'explication du devis de ${petName}. Cette explication vous a-t-elle été utile ?</p>
     <p>Deux minutes suffisent pour nous aider à améliorer le service.</p>`
  );
}

export function dataDeletionConfirmedTemplate() {
  return layout(
    "Suppression de vos données confirmée",
    `<p>Vos documents et données personnelles ont bien été supprimés de nos systèmes, conformément à votre demande.</p>`
  );
}
