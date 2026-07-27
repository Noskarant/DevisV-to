function layout(title: string, bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; color: #173b35;">
    <div style="padding: 24px; border: 1px solid #dce7e2; border-radius: 20px; background: #ffffff;">
      <div style="font-size: 18px; font-weight: 800; color: #0c5b50; margin-bottom: 20px;">DevisVéto</div>
      <h1 style="font-size: 24px; line-height: 1.25; margin: 0 0 12px; color: #123f38;">${title}</h1>
      <div style="font-size: 14px; line-height: 1.7; color: #526f68;">${bodyHtml}</div>
    </div>
    <p style="margin-top: 20px; font-size: 12px; line-height: 1.5; color: #829791; text-align: center;">
      DevisVéto explique les documents vétérinaires et ne remplace pas l'avis de votre vétérinaire.
    </p>
  </div>`;
}

function button(url: string, label: string) {
  return `<p style="margin: 24px 0 8px;"><a href="${url}" style="display:inline-block;background:#0c5b50;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">${label}</a></p>`;
}

export function documentReceivedTemplate(petName: string) {
  return layout(
    "Votre document a bien été reçu",
    `<p>Nous avons bien reçu le devis concernant ${petName}. Il est en cours de lecture.</p>
     <p>Vous pourrez consulter un aperçu gratuit puis débloquer l'explication complète depuis votre espace.</p>`
  );
}

export function previewReadyTemplate(petName: string, previewUrl: string) {
  return layout(
    `L'aperçu de ${petName} est disponible`,
    `<p>Le document a été lu et organisé. Vous pouvez consulter gratuitement plusieurs explications, les premières questions à poser et les points à faire préciser.</p>
     ${button(previewUrl, "Consulter mon aperçu privé")}
     <p style="font-size:12px;color:#829791;">Le rapport complet est proposé à 6,90 €, en paiement unique et sans abonnement.</p>`
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
     ${button(reportUrl, "Consulter mon rapport")}`
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
