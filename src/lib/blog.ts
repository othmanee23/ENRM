export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readingTime: string;
  publishedAt: string;
  introduction: string;
  sections: BlogSection[];
  conclusion: string;
  sources: { label: string; url: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'huile-moteur-chaleur-maroc-viscosite',
    category: 'Guide pratique',
    title: 'Chaleur au Maroc : faut-il choisir une huile moteur plus épaisse ?',
    excerpt:
      'La température extérieure ne suffit pas pour choisir un grade. Voici comment vérifier les viscosités autorisées et les spécifications de votre moteur.',
    readingTime: '4 min',
    publishedAt: '2026-11-22',
    introduction:
      'Quand il fait chaud, on peut être tenté de remplacer une huile 5W-30 par une 5W-40. Ce changement n’est pertinent que si le constructeur autorise ce grade pour le moteur et les conditions d’utilisation concernés.',
    sections: [
      {
        heading: 'Le grade SAE ne se résume pas à la température de la journée',
        paragraphs: [
          'Dans un grade multigrade, le nombre avant le W décrit le comportement mesuré à basse température. Le nombre après le tiret indique une classe de viscosité à température élevée. Ces repères aident à comparer les huiles, mais ne disent pas à eux seuls si une huile convient à un moteur.',
          'La viscosité de fonctionnement dépend aussi de la conception du moteur et des exigences fixées par son constructeur. Une huile plus épaisse n’est donc pas automatiquement une meilleure protection contre la chaleur.',
        ],
      },
      {
        heading: 'Vérifiez les grades autorisés pour votre motorisation',
        paragraphs: [
          'Consultez le manuel d’entretien ou la documentation officielle du véhicule. Certains constructeurs indiquent plusieurs grades possibles selon la plage de température extérieure ou l’utilisation. Utilisez uniquement une option autorisée pour votre moteur précis.',
          'Si le manuel ne donne qu’un grade, ne le remplacez pas par un grade plus élevé sur la seule base du climat local. En cas d’incertitude, demandez confirmation au constructeur ou à un professionnel qualifié.',
        ],
      },
      {
        heading: 'Contrôlez aussi les normes et homologations',
        paragraphs: [
          'Deux huiles de même viscosité peuvent répondre à des exigences différentes. Après avoir vérifié le grade, comparez les normes API ou ACEA et les homologations constructeur mentionnées dans le manuel avec celles de la fiche technique du produit.',
          'Les mentions « recommandé pour » et « homologué par » ne sont pas toujours équivalentes. Lorsque le constructeur exige une homologation précise, cherchez cette homologation dans la documentation officielle du lubrifiant.',
        ],
      },
      {
        heading: 'Gardez l’intervalle d’entretien prévu',
        paragraphs: [
          'Les trajets courts, les embouteillages et les conditions de conduite sévères peuvent être pris en compte dans le plan d’entretien du véhicule. Suivez les intervalles applicables à votre usage tels qu’ils sont définis dans le manuel; une huile annoncée pour un intervalle prolongé ne modifie pas, à elle seule, les consignes du constructeur.',
        ],
        bullets: [
          'Relever la motorisation exacte, pas seulement le modèle de voiture',
          'Noter les grades SAE permis et la plage de température indiquée',
          'Vérifier les normes et homologations demandées',
          'Respecter l’échéance d’entretien prévue pour votre usage',
        ],
      },
    ],
    conclusion:
      'Avant de choisir une huile pour l’été ou pour un trajet exigeant, partez des consignes correspondant à votre moteur. ENRM peut vous aider à comparer une référence du catalogue avec les informations du manuel; la compatibilité reste à confirmer selon les préconisations du constructeur.',
    sources: [
      {
        label: 'Castrol — quelle huile moteur choisir pour sa voiture ?',
        url: 'https://www.castrol.com/en_us/united-states/home/learn/car-maintenance/what-kind-of-oil-does-my-car-need.html',
      },
      {
        label: 'Castrol — comprendre les grades de viscosité',
        url: 'https://www.castrol.com/en_nz/new-zealand/home/products/our-brands/viscosity-grades.html',
      },
      {
        label: 'API — catégories et classifications des huiles moteur',
        url: 'https://www.api.org/products-and-services/engine-oil/eolcs-categories-and-classifications/oil-categories',
      },
    ],
  },
  {
    slug: 'comprendre-viscosite-huile-moteur',
    category: 'Comprendre',
    title: 'Comment lire la viscosité d’une huile moteur, comme 5W-30 ?',
    excerpt:
      'À quoi correspondent les chiffres et la lettre W sur un bidon d’huile, et pourquoi ce grade ne suffit pas à choisir seul ?',
    readingTime: '4 min',
    publishedAt: '2026-11-22',
    introduction:
      'Le grade SAE décrit le comportement de viscosité d’une huile multigrade à différentes températures. Il aide à comparer les huiles, mais ne remplace pas les recommandations du constructeur.',
    sections: [
      {
        heading: 'Que signifient les chiffres et la lettre W ?',
        paragraphs: [
          'Dans un grade comme 5W-30, le chiffre avant le W concerne le comportement de l’huile à basse température selon les essais SAE. Le W signifie « winter ». Le chiffre après le tiret indique la classe de viscosité à température élevée.',
          'Une huile 5W-30 et une 5W-40 ont le même grade côté basse température, mais pas la même classe à température élevée. Ce code décrit la viscosité, pas à lui seul la qualité globale ni la compatibilité avec un moteur.',
        ],
      },
      {
        heading: 'Le grade ne suffit pas pour choisir',
        paragraphs: [
          'Deux huiles ayant le même grade SAE peuvent répondre à des spécifications différentes. Un moteur peut demander une norme ACEA ou API précise, ou une homologation propre à son constructeur.',
          'Vérifiez donc les exigences du manuel d’entretien et la fiche technique du produit. Une huile dont la viscosité semble proche n’est pas automatiquement un remplacement adapté.',
        ],
      },
      {
        heading: 'Le bon réflexe avant l’achat',
        paragraphs: [
          'Notez le grade SAE, les normes et les homologations demandés pour votre motorisation. Comparez ces informations à la référence choisie, puis demandez conseil si une spécification vous manque.',
        ],
        bullets: [
          'Marque, modèle, année et motorisation du véhicule',
          'Grade SAE recommandé dans le manuel',
          'Normes et homologations exigées',
        ],
      },
    ],
    conclusion:
      'Retrouvez les grades disponibles dans le catalogue ENRM. En cas de doute, partagez les informations de votre véhicule avec notre équipe avant de confirmer votre demande.',
    sources: [
      {
        label: 'Castrol France — comprendre les grades de viscosité',
        url: 'https://www.castrol.com/fr_fr/france/home/products/our-brands/viscosity-grades.html',
      },
      {
        label: 'API — catégories et classifications des huiles moteur',
        url: 'https://www.api.org/products-and-services/engine-oil/eolcs-categories-and-classifications/oil-categories',
      },
    ],
  },
  {
    slug: 'choisir-huile-moteur-voiture',
    category: 'Guide pratique',
    title: 'Choisir une huile moteur : les points à vérifier avant de comparer les marques',
    excerpt:
      'Une méthode simple pour partir des préconisations du véhicule, puis comparer grade, normes et homologations sans se fier uniquement au bidon.',
    readingTime: '5 min',
    publishedAt: '2026-11-22',
    introduction:
      'Le bon choix commence par le moteur et ses exigences. La marque ou le prix ne remplacent pas les caractéristiques demandées par le constructeur.',
    sections: [
      {
        heading: '1. Identifiez précisément votre véhicule',
        paragraphs: [
          'Relevez la marque, le modèle, l’année et la motorisation exacte. Une même famille de voitures peut recevoir plusieurs moteurs qui ne demandent pas les mêmes huiles.',
        ],
      },
      {
        heading: '2. Consultez le manuel d’entretien',
        paragraphs: [
          'Cherchez les grades SAE autorisés ainsi que les normes et homologations exigées. Si le constructeur donne plusieurs possibilités selon les températures ou les conditions d’utilisation, suivez ses indications pour votre cas.',
          'La chaleur, le kilométrage ou une préférence personnelle ne suffisent pas à justifier un changement de grade. Référez-vous aux choix documentés par le constructeur.',
        ],
      },
      {
        heading: '3. Comparez les fiches techniques',
        paragraphs: [
          'Vérifiez que la fiche technique du produit indique les exigences recherchées. Les mentions « recommandé pour » et les homologations formelles ne sont pas toujours équivalentes : consultez la documentation du fabricant et du véhicule.',
        ],
      },
      {
        heading: '4. Confirmez la référence et le format',
        paragraphs: [
          'Une fois les caractéristiques confirmées, choisissez la gamme et la contenance qui correspondent à votre besoin. ENRM peut vous aider à relire les informations avant de préparer votre demande.',
        ],
        bullets: [
          'Préparez les informations du véhicule',
          'Comparez grade SAE, normes et homologations',
          'Confirmez la contenance et la référence exacte',
        ],
      },
    ],
    conclusion:
      'Vous pouvez joindre ENRM avec les informations du véhicule et, si possible, une photo de la page « lubrifiants » du manuel. Nous confirmerons la référence, le prix réel et la disponibilité avant toute suite.',
    sources: [
      {
        label: 'Shell — questions fréquentes sur les lubrifiants',
        url: 'https://www.shell.com/motorist/oils-lubricants/faq.html',
      },
      {
        label: 'ACEA — séquences d’huile pour moteurs légers',
        url: 'https://www.acea.auto/publication/acea-oil-sequences-2023/',
      },
    ],
  },
  {
    slug: 'quand-changer-huile-moteur',
    category: 'Entretien',
    title: 'Quand changer l’huile moteur et le filtre ?',
    excerpt:
      'L’intervalle dépend du véhicule, du temps et de l’usage. Voici comment retrouver la bonne échéance sans appliquer une règle universelle.',
    readingTime: '4 min',
    publishedAt: '2026-11-22',
    introduction:
      'Il n’existe pas un kilométrage unique qui convient à toutes les voitures. La référence à suivre est l’échéance prévue par le constructeur pour votre moteur.',
    sections: [
      {
        heading: 'Suivez l’échéance prévue pour votre moteur',
        paragraphs: [
          'Le manuel d’entretien précise généralement un intervalle en kilomètres et/ou en durée. Respectez l’échéance qui s’applique en premier, ainsi que les alertes de maintenance du véhicule.',
          'Certains véhicules distinguent un usage normal d’un usage sévère. Consultez les définitions et intervalles du manuel : ils varient selon le modèle et le moteur.',
        ],
      },
      {
        heading: 'Gardez une trace de l’entretien',
        paragraphs: [
          'Notez la date, le kilométrage, la référence d’huile utilisée et les travaux réalisés. Cet historique aide à planifier la prochaine échéance et facilite le suivi du véhicule.',
          'Lors d’une vidange, vérifiez dans le plan d’entretien si le filtre à huile doit également être remplacé. Les instructions du constructeur restent prioritaires.',
        ],
      },
      {
        heading: 'Ne choisissez pas l’huile uniquement selon l’intervalle',
        paragraphs: [
          'Une huile annoncée pour un long intervalle ne modifie pas automatiquement les consignes d’entretien de votre voiture. Utilisez la qualité et les homologations prescrites, puis gardez l’échéance constructeur.',
        ],
      },
    ],
    conclusion:
      'Si vous ne retrouvez plus le plan d’entretien, indiquez à ENRM le modèle, l’année et la motorisation. Nous vous aiderons à identifier les caractéristiques à vérifier, sans remplacer les consignes officielles du constructeur.',
    sources: [
      {
        label: 'Shell — intervalles de vidange recommandés par le constructeur',
        url: 'https://www.shell.com/motorist/oils-lubricants/faq.html',
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
