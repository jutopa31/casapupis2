// =============================================================================
// Wedding Configuration - Julian & Jacqueline
// Centralized configuration for the wedding web application
// =============================================================================

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface CoupleInfo {
  groomName: string;
  brideName: string;
  weddingDate: string;
  location: LocationDetails;
}

export interface LocationDetails {
  venue: string;
  address?: string;
  neighborhood: string;
  city: string;
  province: string;
  mapUrl: string;
  wazeUrl: string;
  coordinates: {
    lat: string;
    lng: string;
  };
}

export interface BankDetails {
  alias: string;
  cbu: string;
  holderName: string;
}

export interface HistoryMilestone {
  date: string;
  title: string;
  description: string;
  imageUrl: string;
  spotifyUrl?: string;
}

export interface BingoChallenge {
  id: number;
  challenge: string;
}

export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  icon: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
}

export interface WeddingConfig {
  couple: CoupleInfo;
  bankDetails: BankDetails;
  thankYouText: string;
  collaborationText: string;
  history: HistoryMilestone[];
  bingoChallenges: BingoChallenge[];
  timeline: TimelineEvent[];
  navigation: NavigationItem[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const weddingConfig: WeddingConfig = {
  // -------------------------------------------------------------------------
  // Couple & Venue
  // -------------------------------------------------------------------------
  couple: {
    groomName: "Julian",
    brideName: "Jacqueline",
    weddingDate: "2026-02-21",
    location: {
      venue: "Quinta de Vero y Pablo",
      address: "Calle 617, n° 5176",
      neighborhood: "El Pato",
      city: "Berazategui",
      province: "Buenos Aires",
      mapUrl: "https://maps.app.goo.gl/PPZn9vsMf2qnAMQo8?g_st=aw",
      wazeUrl: "https://waze.com/ul?ll=-34.890674,-58.149847&navigate=yes",
      coordinates: {
        lat: "-34.890674",
        lng: "-58.149847",
      },
    },
  },

  // -------------------------------------------------------------------------
  // Datos Bancarios
  // -------------------------------------------------------------------------
  bankDetails: {
    alias: "casapupis",
    cbu: "",
    holderName: "Julian Martin Alonso / Jacqueline Messmer",
  },

  // -------------------------------------------------------------------------
  // Textos
  // -------------------------------------------------------------------------
  thankYouText:
    "Queremos agradecer a nuestra familia y amigos quienes nos acompañaron para hacer posible este evento, pero sobretodo a Vero y Pablo que nos prestaron su quinta. Su carino y apoyo hacen posible este festejo. Gracias de corazon!",

  collaborationText:
    "Te pedimos tener cuidado con las instalaciones y si llegas a notar que algo se rompio, avisanos! Ademas, si queres colaborar con nosotros, con los gastos de limpieza o reparacion, te dejamos nuestros datos. No es una obligacion, tu presencia es el mejor regalo.",

  // -------------------------------------------------------------------------
  // Nuestra Historia - Hitos
  // -------------------------------------------------------------------------
  history: [
    {
      date: "[COMPLETAR_FECHA]",
      title: "Nos conocimos",
      description:
        "El destino nos cruzo y desde ese momento supimos que algo especial estaba por comenzar.",
      imageUrl: "[COMPLETAR_IMAGE_URL]",
    },
    {
      date: "[COMPLETAR_FECHA]",
      title: "Primera cita",
      description:
        "Nervios, risas y la certeza de que queriamos seguir conociéndonos.",
      imageUrl: "[COMPLETAR_IMAGE_URL]",
    },
    {
      date: "[COMPLETAR_FECHA]",
      title: "Primer viaje juntos",
      description:
        "Descubrimos que viajar juntos era tan natural como respirar. La aventura recien empezaba.",
      imageUrl: "[COMPLETAR_IMAGE_URL]",
    },
    {
      date: "[COMPLETAR_FECHA]",
      title: "Nos mudamos juntos",
      description:
        "Armamos nuestro hogar, un lugar lleno de amor, proyectos y suenos compartidos.",
      imageUrl: "[COMPLETAR_IMAGE_URL]",
    },
    {
      date: "[COMPLETAR_FECHA]",
      title: "La propuesta",
      description:
        "Con el corazon latiendo a mil, llego la pregunta mas importante. Y la respuesta fue si!",
      imageUrl: "[COMPLETAR_IMAGE_URL]",
    },
    {
      date: "2026-02-21",
      title: "Nos casamos!",
      description:
        "El gran dia llego. Rodeados de quienes mas queremos, celebramos nuestro amor para siempre.",
      imageUrl: "[COMPLETAR_IMAGE_URL]",
    },
  ],

  // -------------------------------------------------------------------------
  // Bingo de la Boda - Desafios
  // -------------------------------------------------------------------------
  bingoChallenges: [
    { id: 1, challenge: "Foto con los novios" },
    { id: 2, challenge: "Alguien bailando" },
    { id: 3, challenge: "El brindis" },
    { id: 4, challenge: "Un abrazo grupal" },
    { id: 5, challenge: "Los zapatos de la novia" },
    { id: 6, challenge: "Foto con el DJ" },
    { id: 7, challenge: "Un selfie en el espejo" },
    { id: 8, challenge: "La torta" },
    { id: 9, challenge: "Un invitado llorando de emocion" },
    { id: 10, challenge: "El ramo de la novia" },
    { id: 11, challenge: "Foto grupal de amigos" },
    { id: 12, challenge: "Los anillos" },
    { id: 13, challenge: "Alguien cantando" },
    { id: 14, challenge: "Una foto divertida" },
    { id: 15, challenge: "El primer baile" },
    { id: 16, challenge: "La familia completa" },
  ],

  // -------------------------------------------------------------------------
  // Programa del Evento - Linea de Tiempo
  // -------------------------------------------------------------------------
  timeline: [
    {
      time: "16:00",
      title: "Recepcion",
      description:
        "Llegada de los invitados. Los esperamos con una bienvenida especial.",
      icon: "DoorOpen",
    },
    {
      time: "17:00",
      title: "Ceremonia",
      description:
        "El momento mas emotivo: nos damos el si rodeados de nuestros seres queridos.",
      icon: "Heart",
    },
    {
      time: "17:30",
      title: "Brindis",
      description:
        "Levantamos las copas para celebrar este nuevo comienzo juntos.",
      icon: "Wine",
    },
    {
      time: "18:00",
      title: "Cena",
      description:
        "A disfrutar de una noche deliciosa compartiendo la mesa con familia y amigos.",
      icon: "UtensilsCrossed",
    },
    {
      time: "19:00",
      title: "Primer baile",
      description:
        "Nuestro primer baile como esposos. Un momento para recordar siempre.",
      icon: "Music",
    },
    {
      time: "19:30",
      title: "Fiesta",
      description:
        "A bailar toda la noche! La pista es de todos. Que no pare la musica!",
      icon: "PartyPopper",
    },
  ],

  // -------------------------------------------------------------------------
  // Navegacion
  // -------------------------------------------------------------------------
  navigation: [
    { label: "Inicio", href: "/", icon: "Home" },
    { label: "Nuestra Historia", href: "/nuestra-historia", icon: "BookHeart" },
    { label: "Fotos", href: "/fotos-invitados", icon: "Camera" },
    { label: "Confirmar", href: "/confirmar", icon: "CheckCircle" },
    { label: "Como Llegar", href: "/como-llegar", icon: "MapPin" },
    { label: "Muro", href: "/muro", icon: "MessageSquare" },
    { label: "Bingo", href: "/bingo", icon: "Grid3X3" },
    { label: "Playlist", href: "/playlist", icon: "ListMusic" },
    { label: "Programa", href: "/programa", icon: "Clock" },
    { label: "Agradecimiento", href: "/agradecimiento", icon: "HeartHandshake" },
  ],
};
