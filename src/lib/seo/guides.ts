export type GuideSource = {
  label: string;
  href: string;
};

export type GuideSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: {
    title: string;
    body: string;
  };
};

export type GuideFaq = {
  question: string;
  answer: string;
};

export type SeoGuide = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  intro: string;
  takeaway: string[];
  sections: GuideSection[];
  faqs: GuideFaq[];
  relatedSlugs: string[];
  sources?: GuideSource[];
  publishedAt: string;
  updatedAt: string;
};

const publishedAt = "2026-07-31";
const updatedAt = "2026-07-31";

export const guides: SeoGuide[] = [
  {
    slug: "comprendre-devis-veterinaire",
    title: "Comment comprendre un devis vétérinaire ligne par ligne",
    metaTitle: "Comprendre un devis vétérinaire ligne par ligne",
    description:
      "Méthode simple pour lire un devis vétérinaire, identifier les postes importants, vérifier le total et préparer les bonnes questions à poser à la clinique.",
    eyebrow: "Guide essentiel",
    intro:
      "Un devis vétérinaire peut réunir des actes, des analyses, des médicaments, du matériel et plusieurs hypothèses de prise en charge. L’objectif n’est pas de décider si les soins sont nécessaires ni de juger le tarif, mais de savoir précisément ce que le document prévoit.",
    takeaway: [
      "Distinguer le devis prévisionnel de la facture finale.",
      "Regrouper les lignes par étape de prise en charge.",
      "Repérer les quantités, options et montants conditionnels.",
      "Préparer des questions factuelles avant de donner son accord.",
    ],
    sections: [
      {
        title: "1. Vérifier qu’il s’agit bien d’un devis",
        paragraphs: [
          "Un devis présente une estimation avant la réalisation des soins. Une facture décrit les prestations effectivement réalisées. Les deux documents peuvent se ressembler, mais le devis peut contenir des options, des fourchettes ou des lignes qui ne seront utilisées que si la situation l’exige.",
          "Commencez par repérer la date, la durée de validité éventuelle, l’identité de l’animal, le total annoncé et les conditions d’acceptation. Si plusieurs scénarios figurent sur le document, vérifiez lequel correspond au total principal.",
        ],
      },
      {
        title: "2. Regrouper les lignes par grandes étapes",
        paragraphs: [
          "Lire chaque libellé isolément est difficile. Il est plus utile de reconstruire le parcours prévu : consultation et bilan, examens, préparation, anesthésie, intervention, surveillance, médicaments puis contrôle.",
        ],
        bullets: [
          "Consultation ou examen clinique.",
          "Analyses de laboratoire et imagerie.",
          "Anesthésie, monitoring et consommables.",
          "Acte médical ou chirurgical principal.",
          "Hospitalisation et surveillance.",
          "Médicaments, pansements et contrôle ultérieur.",
        ],
      },
      {
        title: "3. Repérer ce qui peut modifier le total",
        paragraphs: [
          "Les mots « selon besoin », « à confirmer », « par jour », « par unité » ou « à partir de » indiquent que le montant final peut évoluer. Une quantité peut aussi dépendre de la durée, du poids de l’animal, du matériel utilisé ou de ce qui est constaté pendant l’intervention.",
          "Demandez si le document correspond à un scénario minimal, probable ou maximal. Une question simple comme « dans quel cas cette ligne serait-elle ajoutée ? » permet souvent de comprendre l’incertitude sans contester le soin.",
        ],
      },
      {
        title: "4. Refaire le chemin du total",
        paragraphs: [
          "Vérifiez les quantités, les prix unitaires, les sous-totaux, la TVA, les remises éventuelles et l’acompte demandé. Une ligne peut être affichée hors taxes alors que le total est toutes taxes comprises.",
          "Si le total ne semble pas correspondre à l’addition visible, il peut exister une remise, un forfait ou une page annexe. La clinique peut vous expliquer la construction du montant.",
        ],
      },
      {
        title: "5. Préparer les questions utiles",
        bullets: [
          "Qu’est-ce qui est inclus dans l’acte principal ?",
          "Quelles lignes sont certaines et lesquelles restent conditionnelles ?",
          "Le contrôle, les médicaments de sortie et l’hospitalisation sont-ils inclus ?",
          "Dans quelles circonstances le montant peut-il augmenter ?",
          "La clinique me recontactera-t-elle avant de dépasser le devis ?",
        ],
        callout: {
          title: "Ce qu’un devis ne permet pas de conclure",
          body: "Le document seul ne permet pas de juger la nécessité d’un soin, la qualité d’une clinique ou le caractère normal d’un tarif. Ces questions nécessitent un échange avec un vétérinaire qui connaît l’animal et le contexte clinique.",
        },
      },
    ],
    faqs: [
      {
        question: "Un devis vétérinaire peut-il changer après signature ?",
        answer:
          "Le montant peut évoluer si des prestations prévues comme conditionnelles deviennent nécessaires ou si la situation change. Demandez à la clinique comment elle vous informe avant toute modification importante.",
      },
      {
        question: "Pourquoi plusieurs lignes semblent-elles concerner la même intervention ?",
        answer:
          "L’intervention principale, l’anesthésie, le monitoring, le matériel, les médicaments et la surveillance peuvent être facturés séparément. La clinique peut préciser ce que couvre chaque libellé.",
      },
      {
        question: "DevisVéto peut-il dire si le prix est trop élevé ?",
        answer:
          "Non. DevisVéto explique le contenu du document et aide à préparer des questions, sans comparer les cliniques ni juger leurs honoraires.",
      },
    ],
    relatedSlugs: [
      "facture-veterinaire",
      "devis-veterinaire-operation",
      "devis-veterinaire-trop-cher",
    ],
    sources: [
      {
        label: "Code rural, article R242-49 — information sur les honoraires",
        href: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030361100",
      },
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "devis-veterinaire-obligatoire",
    title: "Le devis vétérinaire est-il obligatoire ?",
    metaTitle: "Devis vétérinaire obligatoire : ce que prévoit le cadre français",
    description:
      "Ce que prévoit le cadre français sur l’information des prix, le devis vétérinaire et les questions que le propriétaire peut poser avant les soins.",
    eyebrow: "Cadre et transparence",
    intro:
      "Il n’existe pas une règle simple selon laquelle un devis écrit serait automatiquement obligatoire avant chaque soin. En revanche, le vétérinaire doit fournir une information claire sur le prix ou sa méthode de calcul et répondre aux demandes concernant ses honoraires.",
    takeaway: [
      "Le prix doit être communiqué lorsqu’il est déterminé à l’avance.",
      "À défaut, une méthode de calcul ou un devis pour un type de service doit être fourni.",
      "Le propriétaire peut demander des explications sur le coût du traitement.",
      "Pour un acte important, un devis écrit détaillé sécurise l’accord des deux parties.",
    ],
    sections: [
      {
        title: "Ce que dit le code de déontologie vétérinaire",
        paragraphs: [
          "L’article R242-49 du Code rural prévoit que le vétérinaire fournit le prix du service lorsque celui-ci est déterminé au préalable. Lorsque le prix ne peut pas être fixé à l’avance, il fournit une méthode de calcul ou un devis pour un type de service donné.",
          "Le même article précise que le vétérinaire doit répondre aux demandes d’information sur ses honoraires ou sur le coût d’un traitement. Cela permet au propriétaire de demander ce qui est inclus, ce qui reste incertain et comment le total peut évoluer.",
        ],
      },
      {
        title: "Quand demander un devis écrit ?",
        paragraphs: [
          "Un document écrit est particulièrement utile lorsque plusieurs étapes sont prévues, que des options peuvent être ajoutées, qu’une hospitalisation est possible ou que le montant dépend de ce qui sera constaté pendant l’acte.",
          "Le commentaire de l’Ordre national des vétérinaires indique qu’un devis détaillé et signé est vivement conseillé pour les actes importants afin d’éviter les malentendus sur les honoraires et le consentement.",
        ],
      },
      {
        title: "Les informations à faire préciser",
        bullets: [
          "Le montant est-il fixe, estimatif ou présenté sous forme de fourchette ?",
          "Quelles prestations sont déjà incluses ?",
          "Quelles lignes peuvent être ajoutées après votre accord ?",
          "Un acompte est-il demandé ?",
          "Comment serez-vous contacté si le scénario change ?",
        ],
      },
      {
        title: "Et en cas d’urgence ?",
        paragraphs: [
          "Une urgence ne doit pas être retardée par la lecture d’un document en ligne. Lorsque l’état de l’animal inquiète, contactez directement une clinique vétérinaire. L’information financière reste importante, mais elle doit être adaptée aux contraintes de la situation et à la possibilité réelle d’anticiper les actes.",
        ],
        callout: {
          title: "Information générale, pas conseil juridique",
          body: "Cette page résume des textes publics en vigueur à la date indiquée. Elle ne remplace pas un avis juridique adapté à une situation particulière.",
        },
      },
    ],
    faqs: [
      {
        question: "Puis-je demander un devis avant une opération vétérinaire ?",
        answer:
          "Oui. Vous pouvez demander une estimation détaillée, les prestations incluses et les circonstances pouvant modifier le montant.",
      },
      {
        question: "Le vétérinaire doit-il répondre aux questions sur ses honoraires ?",
        answer:
          "Oui. L’article R242-49 prévoit qu’il répond aux demandes d’information sur ses honoraires ou sur le coût d’un traitement.",
      },
      {
        question: "Un devis signé garantit-il un montant absolument fixe ?",
        answer:
          "Pas nécessairement. Le document peut prévoir des prestations conditionnelles ou une évolution liée à la situation. Il faut lire les réserves et demander comment un dépassement éventuel sera autorisé.",
      },
    ],
    relatedSlugs: [
      "comprendre-devis-veterinaire",
      "devis-veterinaire-operation",
      "devis-veterinaire-trop-cher",
    ],
    sources: [
      {
        label: "Légifrance — Code rural, article R242-49",
        href: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000030361100",
      },
      {
        label: "Ordre national des vétérinaires — commentaire de l’article R242-49",
        href: "https://www.veterinaire.fr/la-profession-veterinaire/la-reglementation-professionnelle/le-code-de-deontologie-commente/sous-section-3-dispositions-propres-differents-modes-dexercice/paragraphe-1er-exercice-de-la-medecine-et-de-la-chirurgie-des-animaux-et-de-la-pharmacie-14",
      },
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "facture-veterinaire",
    title: "Comment lire et vérifier une facture vétérinaire",
    metaTitle: "Facture vétérinaire : comprendre chaque ligne",
    description:
      "Guide pour comprendre une facture vétérinaire, la comparer au devis initial et repérer les actes, quantités, médicaments et frais ajoutés.",
    eyebrow: "Après les soins",
    intro:
      "La facture reprend ce qui a réellement été réalisé. Elle peut donc différer du devis initial : certaines options n’ont pas été utilisées, tandis que d’autres prestations ont pu être ajoutées après une évolution de la prise en charge.",
    takeaway: [
      "Comparer la facture au devis sans se limiter au total.",
      "Vérifier les quantités, dates et prestations réellement réalisées.",
      "Identifier les lignes ajoutées, retirées ou modifiées.",
      "Conserver les documents utiles pour l’assurance et le suivi de l’animal.",
    ],
    sections: [
      {
        title: "1. Comparer les libellés, pas seulement les montants",
        paragraphs: [
          "Placez le devis et la facture côte à côte. Repérez les lignes identiques, celles qui ont disparu et celles qui apparaissent uniquement sur la facture. Une variation du total peut venir d’une quantité différente, d’un jour d’hospitalisation supplémentaire ou d’un médicament finalement utilisé.",
        ],
      },
      {
        title: "2. Vérifier les quantités et les unités",
        bullets: [
          "Nombre de jours ou de nuits d’hospitalisation.",
          "Nombre d’analyses, clichés ou examens.",
          "Quantité de médicaments ou de consommables.",
          "Prix unitaire et total de chaque ligne.",
          "TVA, remise, acompte déjà versé et solde restant.",
        ],
      },
      {
        title: "3. Comprendre les ajouts par rapport au devis",
        paragraphs: [
          "Une facture peut contenir une prestation qui n’était pas certaine au moment du devis. Demandez à quoi elle correspond, quand elle a été décidée et si elle était couverte par une autorisation donnée à la clinique.",
          "L’objectif est de reconstituer le déroulement réel : préparation, acte principal, surveillance, médicaments et contrôle. Une explication chronologique est souvent plus claire qu’une lecture ligne par ligne.",
        ],
      },
      {
        title: "4. Conserver les justificatifs",
        paragraphs: [
          "Gardez ensemble le devis, la facture, le compte rendu, l’ordonnance et les éventuelles feuilles de soins destinées à l’assurance. Ils n’ont pas la même fonction et peuvent être demandés séparément.",
        ],
        callout: {
          title: "Une différence n’est pas automatiquement une erreur",
          body: "Le devis est prévisionnel et la facture décrit la prise en charge réelle. La bonne démarche consiste à demander l’explication précise des lignes différentes, sans conclure à partir du seul montant.",
        },
      },
    ],
    faqs: [
      {
        question: "Pourquoi ma facture vétérinaire est-elle supérieure au devis ?",
        answer:
          "Cela peut venir d’une prestation conditionnelle, d’une quantité différente, d’une durée de surveillance plus longue ou d’un acte ajouté. Demandez à la clinique de relier chaque différence au déroulement réel.",
      },
      {
        question: "Puis-je demander le détail d’une ligne de facture ?",
        answer:
          "Oui. Vous pouvez demander à quoi correspond le libellé, la quantité, le prix unitaire et la prestation réalisée.",
      },
      {
        question: "Quels documents transmettre à mon assurance animale ?",
        answer:
          "Cela dépend du contrat. La facture acquittée et une feuille de soins sont souvent demandées, mais il faut vérifier la procédure propre à votre assureur.",
      },
    ],
    relatedSlugs: [
      "comprendre-devis-veterinaire",
      "devis-veterinaire-chien",
      "devis-veterinaire-chat",
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "devis-veterinaire-trop-cher",
    title: "Que faire si un devis vétérinaire semble trop élevé ?",
    metaTitle: "Devis vétérinaire trop cher : les questions à poser",
    description:
      "Étapes concrètes si un devis vétérinaire semble trop élevé : comprendre les lignes, demander les options, clarifier les priorités et les modalités de paiement.",
    eyebrow: "Budget et compréhension",
    intro:
      "Un montant important peut être difficile à absorber et à comprendre. Avant de conclure qu’un devis est « trop cher », il faut vérifier ce qu’il couvre, ce qui est certain, ce qui reste optionnel et quelles solutions peuvent être discutées avec la clinique.",
    takeaway: [
      "Demander une explication du périmètre exact du devis.",
      "Séparer les prestations certaines des prestations conditionnelles.",
      "Clarifier ce qui est urgent et ce qui peut éventuellement être planifié.",
      "Aborder directement les modalités de paiement avec la clinique.",
    ],
    sections: [
      {
        title: "1. Demander ce que couvre réellement le total",
        paragraphs: [
          "Un devis d’intervention peut inclure la consultation, les analyses, l’anesthésie, le matériel, l’acte principal, la surveillance, les médicaments et le contrôle. Un autre document peut présenter ces postes séparément.",
          "Demandez un résumé simple : « quelles étapes sont comprises dans ce total ? ». Cette question évite de comparer deux montants qui ne couvrent pas les mêmes prestations.",
        ],
      },
      {
        title: "2. Distinguer le certain du conditionnel",
        bullets: [
          "Quelles lignes seront réalisées dans tous les cas ?",
          "Quelles lignes dépendent de ce qui sera constaté ?",
          "Existe-t-il un scénario bas et un scénario haut ?",
          "À partir de quel montant la clinique vous recontacte-t-elle ?",
        ],
      },
      {
        title: "3. Parler du budget sans retarder les soins urgents",
        paragraphs: [
          "Vous pouvez expliquer clairement votre contrainte financière et demander quelles modalités existent dans l’établissement. Certaines cliniques proposent un acompte, un échéancier ou une solution de financement ; d’autres non. Ces possibilités doivent être vérifiées directement.",
          "Si l’état de l’animal inquiète, contactez la clinique sans attendre. Une page en ligne ne peut pas déterminer ce qui peut être différé. Seul un vétérinaire connaissant la situation peut expliquer les priorités médicales.",
        ],
      },
      {
        title: "4. Demander un autre avis lorsque le contexte le permet",
        paragraphs: [
          "Lorsque la situation n’est pas urgente et que vous disposez des informations médicales nécessaires, vous pouvez demander à un autre vétérinaire d’évaluer la prise en charge. Il ne s’agit pas de comparer une ligne isolée, mais de vérifier que les périmètres et hypothèses sont comparables.",
        ],
        callout: {
          title: "DevisVéto ne classe pas les tarifs",
          body: "Le service aide à comprendre le document et à préparer des questions. Il ne dit pas qu’un prix est normal ou anormal et ne recommande pas une clinique plutôt qu’une autre.",
        },
      },
    ],
    faqs: [
      {
        question: "Puis-je demander à retirer une ligne du devis ?",
        answer:
          "Vous pouvez demander si la ligne est obligatoire, optionnelle ou conditionnelle. Seul le vétérinaire peut expliquer les conséquences médicales d’une modification de la prise en charge.",
      },
      {
        question: "Puis-je demander un paiement en plusieurs fois ?",
        answer:
          "Vous pouvez le demander, mais chaque clinique définit ses propres modalités. Vérifiez les conditions, les frais éventuels et l’échéancier avant de vous engager.",
      },
      {
        question: "Est-il utile de comparer plusieurs devis ?",
        answer:
          "Cela peut être pertinent lorsque la situation le permet, mais uniquement si les actes, le niveau de surveillance, le matériel et les prestations incluses sont réellement comparables.",
      },
    ],
    relatedSlugs: [
      "devis-veterinaire-obligatoire",
      "comprendre-devis-veterinaire",
      "devis-veterinaire-operation",
    ],
    sources: [
      {
        label: "Ordre national des vétérinaires — information sur les honoraires",
        href: "https://www.veterinaire.fr/la-profession-veterinaire/la-reglementation-professionnelle/le-code-de-deontologie-commente/sous-section-3-dispositions-propres-differents-modes-dexercice/paragraphe-1er-exercice-de-la-medecine-et-de-la-chirurgie-des-animaux-et-de-la-pharmacie-14",
      },
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "devis-veterinaire-operation",
    title: "Comment lire un devis vétérinaire avant une opération",
    metaTitle: "Devis vétérinaire pour une opération : lignes à vérifier",
    description:
      "Les postes fréquents d’un devis vétérinaire avant une opération : bilan, anesthésie, intervention, matériel, surveillance, médicaments et contrôle.",
    eyebrow: "Intervention chirurgicale",
    intro:
      "Le prix d’une opération ne correspond pas uniquement au geste chirurgical. Le devis peut réunir plusieurs phases avant, pendant et après l’intervention. Les identifier permet de comprendre ce qui est inclus et ce qui pourrait être ajouté.",
    takeaway: [
      "Reconstituer les étapes préopératoires, opératoires et postopératoires.",
      "Vérifier si l’anesthésie et le monitoring sont inclus.",
      "Repérer le matériel, l’hospitalisation et les médicaments.",
      "Demander comment sont autorisés les actes supplémentaires.",
    ],
    sections: [
      {
        title: "Avant l’intervention",
        paragraphs: [
          "Le document peut mentionner une consultation, un bilan préopératoire, des analyses, une imagerie ou une préparation spécifique. Chaque ligne doit être rattachée à son objectif dans le parcours prévu.",
        ],
      },
      {
        title: "Pendant l’intervention",
        bullets: [
          "Anesthésie ou sédation.",
          "Monitoring et surveillance des paramètres.",
          "Acte chirurgical principal.",
          "Matériel, implants ou consommables stériles.",
          "Médicaments administrés pendant l’acte.",
        ],
      },
      {
        title: "Après l’intervention",
        paragraphs: [
          "Le réveil, la surveillance, l’hospitalisation, les pansements, les médicaments de sortie et le contrôle peuvent apparaître séparément. Vérifiez la durée incluse et ce qui est prévu si l’animal doit rester plus longtemps.",
        ],
      },
      {
        title: "Questions à poser avant de signer",
        bullets: [
          "Le devis inclut-il le bilan préopératoire et le contrôle ?",
          "Quelle durée d’hospitalisation est comprise ?",
          "Quels éléments peuvent faire varier le montant ?",
          "Existe-t-il un seuil au-delà duquel vous serez rappelé ?",
          "Les médicaments et le matériel de sortie sont-ils inclus ?",
        ],
        callout: {
          title: "Le devis n’évalue pas le choix médical",
          body: "Comprendre les lignes ne permet pas de décider si une opération est indiquée. Cette décision doit être discutée avec le vétérinaire à partir de l’état de l’animal.",
        },
      },
    ],
    faqs: [
      {
        question: "Pourquoi l’anesthésie est-elle séparée de l’opération ?",
        answer:
          "Parce qu’elle peut couvrir une phase distincte avec ses médicaments, son matériel et sa surveillance. Demandez ce que le forfait d’anesthésie comprend exactement.",
      },
      {
        question: "Une nuit d’hospitalisation est-elle toujours incluse ?",
        answer:
          "Non. Le devis doit être lu précisément : la surveillance peut être comprise pour quelques heures, une journée ou une nuit, ou être facturée séparément.",
      },
      {
        question: "Pourquoi le matériel apparaît-il sur une ligne séparée ?",
        answer:
          "Certains consommables ou implants sont identifiés séparément. La clinique peut préciser s’ils sont fixes ou susceptibles de changer pendant l’intervention.",
      },
    ],
    relatedSlugs: [
      "devis-veterinaire-anesthesie",
      "devis-veterinaire-dentaire",
      "comprendre-devis-veterinaire",
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "devis-veterinaire-anesthesie",
    title: "Comprendre la ligne d’anesthésie sur un devis vétérinaire",
    metaTitle: "Anesthésie sur un devis vétérinaire : que comprend la ligne ?",
    description:
      "Ce que peut couvrir une ligne d’anesthésie vétérinaire : préparation, induction, maintien, monitoring, consommables et surveillance du réveil.",
    eyebrow: "Libellé fréquent",
    intro:
      "Le mot « anesthésie » peut désigner un forfait global ou seulement une partie du protocole. La seule façon de connaître le périmètre exact est de demander à la clinique ce que la ligne comprend dans le cas de votre animal.",
    takeaway: [
      "Identifier si la préparation et le réveil sont inclus.",
      "Vérifier si le monitoring apparaît dans la même ligne ou séparément.",
      "Repérer les consommables et médicaments facturés à part.",
      "Ne pas déduire le protocole médical à partir du prix seul.",
    ],
    sections: [
      {
        title: "Ce que la ligne peut regrouper",
        bullets: [
          "Préparation et mise en place du matériel.",
          "Induction de l’anesthésie.",
          "Maintien pendant l’intervention.",
          "Monitoring et surveillance.",
          "Oxygène, consommables et médicaments.",
          "Accompagnement du réveil.",
        ],
      },
      {
        title: "Pourquoi plusieurs lignes peuvent apparaître",
        paragraphs: [
          "Certaines cliniques utilisent un forfait, tandis que d’autres séparent l’anesthésie, le monitoring, les médicaments, la perfusion et le réveil. Deux devis ne sont donc pas comparables à partir du seul libellé « anesthésie ».",
        ],
      },
      {
        title: "Questions utiles à poser",
        bullets: [
          "Le monitoring est-il inclus dans cette ligne ?",
          "La surveillance du réveil est-elle comprise ?",
          "La durée prévue peut-elle modifier le montant ?",
          "Les analyses préopératoires figurent-elles ailleurs ?",
          "Quels éléments resteraient facturés séparément ?",
        ],
        callout: {
          title: "Aucune interprétation médicale automatique",
          body: "DevisVéto peut expliquer le vocabulaire présent sur le document, mais ne choisit pas un protocole et n’évalue pas sa nécessité ou sa sécurité pour l’animal.",
        },
      },
    ],
    faqs: [
      {
        question: "Le prix de l’anesthésie dépend-il toujours du poids ?",
        answer:
          "Le poids peut être pris en compte dans certaines quantités ou modalités, mais la construction du tarif dépend de la clinique et du protocole. Demandez la méthode utilisée pour ce devis précis.",
      },
      {
        question: "Le bilan préopératoire fait-il partie de l’anesthésie ?",
        answer:
          "Pas nécessairement. Il peut être inclus dans un forfait ou apparaître sur une ligne séparée. Le document et la clinique doivent le préciser.",
      },
      {
        question: "Monitoring et anesthésie sont-ils la même chose ?",
        answer:
          "Ils sont liés mais peuvent être présentés séparément. Le monitoring correspond à la surveillance réalisée pendant la prise en charge anesthésique.",
      },
    ],
    relatedSlugs: [
      "devis-veterinaire-operation",
      "devis-veterinaire-dentaire",
      "comprendre-devis-veterinaire",
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "devis-veterinaire-dentaire",
    title: "Comment comprendre un devis vétérinaire dentaire",
    metaTitle: "Devis vétérinaire dentaire : détartrage, radios et extractions",
    description:
      "Guide pour lire un devis dentaire vétérinaire : anesthésie, détartrage, radiographies, extractions, médicaments, surveillance et variations possibles.",
    eyebrow: "Soins dentaires",
    intro:
      "Un devis dentaire peut commencer par un détartrage prévu et comporter des lignes conditionnelles pour des radiographies ou des extractions. Le document doit être lu comme un scénario de prise en charge, pas comme une simple liste de prix.",
    takeaway: [
      "Séparer l’anesthésie, le soin dentaire et la surveillance.",
      "Repérer les actes conditionnels comme les extractions.",
      "Demander si les radiographies et médicaments sont inclus.",
      "Clarifier le seuil d’accord si le traitement évolue pendant l’acte.",
    ],
    sections: [
      {
        title: "Les lignes fréquemment rencontrées",
        bullets: [
          "Consultation ou bilan préalable.",
          "Analyses préopératoires.",
          "Anesthésie et monitoring.",
          "Détartrage et polissage.",
          "Radiographies dentaires si prévues.",
          "Extractions, parfois facturées par dent ou par niveau de difficulté.",
          "Médicaments, surveillance et contrôle.",
        ],
      },
      {
        title: "Pourquoi le montant peut évoluer",
        paragraphs: [
          "Certaines décisions ne peuvent être confirmées qu’après un examen plus complet réalisé pendant la prise en charge. Le devis peut donc distinguer un socle certain et des actes possibles.",
          "Demandez comment la clinique recueille votre accord si une extraction ou une prestation supplémentaire devient nécessaire et quel montant maximal a été envisagé.",
        ],
      },
      {
        title: "Les questions à poser",
        bullets: [
          "Les radiographies dentaires sont-elles incluses ?",
          "Comment les extractions éventuelles sont-elles calculées ?",
          "Quel scénario minimal et quel scénario maximal sont envisagés ?",
          "Les médicaments et le contrôle sont-ils compris ?",
          "Comment serez-vous contacté si le plan change ?",
        ],
        callout: {
          title: "Le nombre d’extractions ne se déduit pas du devis",
          body: "Un document prévisionnel peut présenter des options sans permettre de savoir lesquelles seront nécessaires. Cette information relève de l’évaluation vétérinaire.",
        },
      },
    ],
    faqs: [
      {
        question: "Pourquoi les extractions sont-elles parfois indiquées en option ?",
        answer:
          "Parce que leur nécessité ou leur nombre peut ne pas être confirmé avant l’examen complet. Le devis doit expliquer comment elles seraient facturées et autorisées.",
      },
      {
        question: "Le détartrage inclut-il automatiquement l’anesthésie ?",
        answer:
          "Pas toujours dans la présentation du document. L’anesthésie peut être incluse dans un forfait ou apparaître séparément.",
      },
      {
        question: "Les médicaments de sortie sont-ils compris ?",
        answer:
          "Cela dépend du devis. Vérifiez s’ils figurent dans le forfait, sur une ligne dédiée ou s’ils seront facturés selon ce qui est prescrit.",
      },
    ],
    relatedSlugs: [
      "devis-veterinaire-anesthesie",
      "devis-veterinaire-operation",
      "facture-veterinaire",
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "devis-veterinaire-chien",
    title: "Comment lire un devis vétérinaire pour un chien",
    metaTitle: "Devis vétérinaire pour chien : comprendre les lignes",
    description:
      "Guide pratique pour lire un devis vétérinaire pour chien : examens, anesthésie, chirurgie, médicaments, hospitalisation et questions à poser.",
    eyebrow: "Document pour un chien",
    intro:
      "Un devis pour un chien peut comporter de nombreuses lignes et quantités. La taille, le poids, la durée de prise en charge et les actes prévus peuvent intervenir dans la construction du document, sans que le prix seul permette d’interpréter le choix médical.",
    takeaway: [
      "Vérifier l’identité, le poids et la date du document.",
      "Regrouper les lignes par étape de prise en charge.",
      "Repérer les quantités susceptibles de varier.",
      "Demander les conditions d’ajout d’une prestation.",
    ],
    sections: [
      {
        title: "Commencer par les informations de l’animal",
        paragraphs: [
          "Vérifiez le nom du chien, son poids indiqué, la date et le motif du devis. Une erreur d’identité ou une donnée ancienne peut compliquer la lecture des quantités ou des documents de suivi.",
        ],
      },
      {
        title: "Identifier les postes principaux",
        bullets: [
          "Consultation et examens complémentaires.",
          "Imagerie ou analyses de laboratoire.",
          "Anesthésie, monitoring et perfusion.",
          "Intervention ou soin principal.",
          "Hospitalisation et surveillance.",
          "Médicaments, pansements et contrôle.",
        ],
      },
      {
        title: "Repérer les quantités variables",
        paragraphs: [
          "Certaines lignes peuvent être calculées par unité, par jour ou selon une quantité utilisée. Le poids peut être un élément parmi d’autres pour certaines prestations, mais il ne faut pas supposer la méthode de calcul : demandez-la à la clinique.",
        ],
      },
      {
        title: "Préparer une discussion claire",
        bullets: [
          "Quelles lignes sont certaines ?",
          "Quelle durée de surveillance est prévue ?",
          "Le contrôle et les médicaments de sortie sont-ils inclus ?",
          "Dans quel cas le total pourrait-il évoluer ?",
        ],
        callout: {
          title: "Urgence : contactez une clinique",
          body: "Si l’état du chien inquiète, ne retardez pas la prise de contact pour analyser un devis. DevisVéto n’évalue pas l’urgence et ne remplace pas un vétérinaire.",
        },
      },
    ],
    faqs: [
      {
        question: "Pourquoi le poids du chien figure-t-il sur le devis ?",
        answer:
          "Il identifie l’animal et peut être pertinent pour certaines quantités ou modalités. La clinique peut préciser son rôle dans le calcul du document.",
      },
      {
        question: "Puis-je utiliser le même devis plusieurs mois plus tard ?",
        answer:
          "Vérifiez sa durée de validité et demandez une actualisation si l’état de l’animal, son poids, les actes prévus ou les tarifs ont changé.",
      },
      {
        question: "Une ligne d’hospitalisation correspond-elle forcément à une nuit ?",
        answer:
          "Non. Elle peut couvrir quelques heures, une journée ou une nuit. La durée et le niveau de surveillance doivent être précisés.",
      },
    ],
    relatedSlugs: [
      "comprendre-devis-veterinaire",
      "devis-veterinaire-operation",
      "facture-veterinaire",
    ],
    publishedAt,
    updatedAt,
  },
  {
    slug: "devis-veterinaire-chat",
    title: "Comment lire un devis vétérinaire pour un chat",
    metaTitle: "Devis vétérinaire pour chat : comprendre les lignes",
    description:
      "Guide pratique pour comprendre un devis vétérinaire pour chat : examens, sédation ou anesthésie, soins, hospitalisation et médicaments.",
    eyebrow: "Document pour un chat",
    intro:
      "Un devis pour un chat peut associer consultation, analyses, imagerie, sédation ou anesthésie, soin principal et surveillance. Pour le comprendre, il faut relier les lignes au déroulement prévu plutôt que chercher un prix moyen isolé.",
    takeaway: [
      "Vérifier les informations de l’animal et le motif du devis.",
      "Identifier les lignes liées à la préparation et à la surveillance.",
      "Repérer les actes conditionnels et les quantités.",
      "Clarifier le suivi et les médicaments après les soins.",
    ],
    sections: [
      {
        title: "Lire le document dans l’ordre de la prise en charge",
        paragraphs: [
          "Commencez par la consultation et les examens, puis repérez la préparation, le soin principal, la surveillance et les médicaments. Cette lecture chronologique rend les libellés plus compréhensibles.",
        ],
      },
      {
        title: "Distinguer sédation, anesthésie et surveillance",
        paragraphs: [
          "Ces termes peuvent apparaître dans une même ligne ou séparément. Ne déduisez pas le protocole à partir du vocabulaire seul : demandez ce que chaque poste couvre pour le chat concerné.",
        ],
      },
      {
        title: "Repérer les lignes conditionnelles",
        bullets: [
          "Examen ou analyse supplémentaire selon le résultat initial.",
          "Durée d’hospitalisation ajustée à l’évolution.",
          "Médicaments facturés selon la prescription finale.",
          "Acte supplémentaire soumis à votre accord.",
        ],
      },
      {
        title: "Questions à poser avant l’accord",
        bullets: [
          "Qu’est-ce qui est inclus dans le total principal ?",
          "Quelles prestations restent possibles mais non certaines ?",
          "La surveillance et le contrôle sont-ils compris ?",
          "Comment serai-je informé si le montant change ?",
        ],
        callout: {
          title: "Ne pas retarder une prise en charge urgente",
          body: "Si le comportement ou l’état du chat vous inquiète, contactez directement une clinique. Le service explique des documents mais n’évalue aucun symptôme.",
        },
      },
    ],
    faqs: [
      {
        question: "Pourquoi une sédation peut-elle apparaître sur le devis ?",
        answer:
          "Elle peut être prévue pour permettre un examen ou un acte dans de bonnes conditions. Seul le vétérinaire peut expliquer pourquoi elle est envisagée dans cette situation.",
      },
      {
        question: "Les médicaments sont-ils toujours détaillés ?",
        answer:
          "Ils peuvent être listés séparément, regroupés dans un forfait ou ajoutés selon la prescription finale. Demandez ce qui est inclus.",
      },
      {
        question: "Une hospitalisation est-elle facturée par jour ?",
        answer:
          "Souvent la durée apparaît dans la quantité, mais la présentation varie. Vérifiez l’unité et la période réellement couverte.",
      },
    ],
    relatedSlugs: [
      "comprendre-devis-veterinaire",
      "devis-veterinaire-dentaire",
      "facture-veterinaire",
    ],
    publishedAt,
    updatedAt,
  },
];

export const guidesBySlug = new Map(guides.map((guide) => [guide.slug, guide]));

export function getGuide(slug: string) {
  return guidesBySlug.get(slug);
}

export function getRelatedGuides(guide: SeoGuide) {
  return guide.relatedSlugs
    .map((slug) => guidesBySlug.get(slug))
    .filter((item): item is SeoGuide => Boolean(item));
}
