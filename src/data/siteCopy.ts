// src/data/siteCopy.ts
// ============================================================================
// ARCHIVO CENTRAL DE TEXTOS (COPY) DE LA WEB
// Podés editar cualquier frase entre comillas acá mismo y se actualizará
// automáticamente en toda la aplicación.
// ============================================================================

export const SITE_COPY = {
  // 1. BARRA SUPERIOR (HEADER)
  header: {
    brandTitle: 'LA RENGA · EL BANQUETE',
    navBuilder: 'Armar Setlist',
    navOracleAndDuels: 'Oráculo & Duelos',
    navTicketsAndRanking: 'Entradas & Ranking',
    navAlbums: 'Tapas de Discos (11)',
    navListen: 'Escuchar Setlist',
    ctaMainButton: 'Jugar Duelo / Oráculo',
  },

  // 2. CARTEL ARRIBA A LA IZQUIERDA (SOBRE EL ESCENARIO 3D)
  stageBadge: {
    locationLabel: 'PLAYA NECOCHEA',
    songsCounterUnit: 'TEMAS',
    howToPlayButton: '¿Cómo jugar? / Guía',
  },

  // 3. CONTROLES DE ABAJO (DOCK INFERIOR)
  bottomDock: {
    showControlsLabel: 'Mostrar Controles de la Playa (H)',
    hideControlsLabel: 'Ocultar Controles / Modo Cine (H)',
    setlistProgressPrefix: 'SETLIST:',
    chooseSongsButton: 'Elegir Canciones',
    freeSlotsSuffix: 'libres',
    oracleButton: 'Oráculo & Duelos',
    ticketsAndEffectsButton: 'Entradas & Efectos 3D',
    autoFillButton: 'Completar 36',
    listenButton: 'Escuchar',
    agitarButtonIdle: '¡Agitar!',
    agitarButtonActive: '¡Agitando el Campo!',
    cameras: {
      general: 'Playa & Mar',
      stage: 'Pantallas & Batería',
      pogo: 'Olla del Pogo',
      entrance: 'Costa & Olas (Izq.)',
    },
    effects: {
      stageFire: 'Fuego',
      stadiumLasers: 'Luces Huracán',
      guestMusician: 'Invitado',
      goldenPyro: 'Chispas',
    },
  },

  // 4. ARMADOR VISUAL DE SETLIST (BATEA DE DISCOS)
  builderModal: {
    mainTitle: 'Batea de Discos & Armador del Banquete',
    mainSubtitle:
      'Arrastrá canciones para cambiar el orden o soltalas encima de un puesto para reemplazarlo. También podés tocar un puesto de tu lista para reemplazarlo.',
    historicShowsButton: 'Shows Históricos',
    clearButton: 'Vaciar',
    doneButton: 'Listo',
    backToCoversButton: '← Volver a las Portadas',
    largeCoversButton: 'Portadas Grandes (11 Discos)',
    viewAllSongsButton: 'Ver Todos los Temas',
    searchPlaceholder: 'Buscar canción en todos los discos...',
    bateaHeading: 'Seleccioná un Disco para Meterte en su Lista de Temas',
    bateaSubheading:
      'Cada portada te abre todos los temas de ese álbum en orden original.',
    rightColumnTitle: 'Tu Lista en Orden',
    rightColumnHint:
      'Arrastrá entre medio para agregar, o encima de un tema para reemplazarlo',
    emptySetlistTitle: 'Tu lista del Banquete está esperando el primer tema',
    emptySetlistSubtitle:
      'Entrá a cualquiera de las portadas grandes a la izquierda y hacé clic o arrastrá canciones hacia acá.',
    autoFill36Button: 'Armar 36 Canciones Automáticamente',
  },

  // 5. ONBOARDING / GUÍA RÁPIDA (4 PASOS)
  onboarding: {
    badgePrefix: 'GUÍA RÁPIDA · PASO',
    skipButton: 'Saltar introducción',
    steps: [
      {
        number: '01',
        tag: 'EL CONCEPTO',
        title: '¡Bienvenidos al Banquete!',
        subtitle:
          'Un simulador interactivo y juego musical de La Renga donde vos sos el encargado de armar la lista de 36 canciones para hacer temblar la costa de Necochea.',
      },
      {
        number: '02',
        tag: 'ARMAR LA PLAYLIST',
        title: '¿Cómo se arma un Setlist Legendario?',
        subtitle:
          'No alcanza con tirar temas al azar: el motor del Banquete evalúa la mística, el recorrido por los 11 discos y el equilibrio del pogo.',
      },
      {
        number: '03',
        tag: 'MODO JUEGO',
        title: 'El Oráculo de Shows Reales & Duelo de Setlists',
        subtitle:
          'Poné a prueba tu sabiduría renguera adivinando listas históricas reales o enfrentando tu Banquete mano a mano contra otros curadores.',
      },
      {
        number: '04',
        tag: 'RECOMPENSAS & CÁMARAS',
        title: 'Entradas Coleccionables y Efectos 3D en Vivo',
        subtitle:
          'Desbloqueá entradas históricas numeradas, trofeos y 4 efectos escénicos para encender el escenario mientras suena tu lista.',
      },
    ],
  },
};
