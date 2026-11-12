import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from 'react';
import { Head, router } from '@inertiajs/react';
import { Ticket } from 'lucide-react';
import HotelCarousel from '../components/HotelCarousel';
import MobileGalleryCarousel from '../components/MobileGalleryCarousel';
import DigitalPassCard, { GuestPassData } from '../components/DigitalPassCard';

interface GalleryImageItem {
    id: number;
    image_path: string;
    thumb_path?: string | null;
    order?: number;
    is_active?: boolean;
}

interface HotelItem {
    id?: number;
    name: string;
    location?: string;
    description?: string;
    url?: string | null;
    phone?: string | null;
    maps_url?: string | null;
    image?: string;
    image_path?: string;
    order?: number;
    is_active?: boolean;
}

interface GuestItem {
    id: number;
    full_name: string;
    type?: 'adult' | 'child';
    is_attending?: boolean | null;
    allergies?: string | null;
    checkin_code?: string;
    table_name?: string | null;
    special_notes?: string | null;
}

interface InvitationData {
    id: number;
    name: string;
    phone?: string;
    token: string;
    status: 'pending' | 'viewed' | 'responded';
    category?: string;
    message_to_couple?: string;
    guests?: GuestItem[];
}

export interface WeddingProps {
    wedding?: {
        bride_name?: string;
        groom_name?: string;
        wedding_date?: string;
        music_url?: string;
        song_title?: string;
        bride_parents?: string[];
        groom_parents?: string[];
        bride_godparents?: string[];
        groom_godparents?: string[];
        gallery_images?: GalleryImageItem[];
        galleryImages?: GalleryImageItem[];
        hotels?: HotelItem[];
        locations?: {
            ceremony?: string;
            ceremony_maps?: string;
            ceremony_waze?: string;
            reception?: string;
            reception_maps?: string;
            reception_waze?: string;
        };
        gift_registry_url?: string;
        gift_registry_button_text?: string;
        gift_registry_url_2?: string;
        gift_registry_button_text_2?: string;
        gift_registries_list?: Array<{ name: string; url: string }>;
        timeline?: Array<{
            time: string;
            title: string;
            description?: string;
            icon_url?: string;
        }>;
        timeline_mode?: string | null;
        timeline_image_path?: string | null;
        timeline_list?: Array<{
            time: string;
            title: string;
            description?: string;
            icon_url?: string;
        }>;
    };
    invitation?: InvitationData | null;
    /** Ventana de confirmación calculada en el servidor (fecha límite efectiva Y-m-d y si ya cerró) */
    rsvp?: { deadline: string | null; closed: boolean } | null;
    meta?: {
        title?: string;
        description?: string;
        image?: string;
        url?: string;
    } | null;
}

export default function InvitationMobile({
    wedding,
    invitation,
    rsvp,
    meta,
}: WeddingProps) {
    const brideName = wedding?.bride_name || 'Adriana';
    const groomName = wedding?.groom_name || 'Joaquín';
    const dateText = wedding?.wedding_date
        ? new Date(wedding.wedding_date)
              .toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
              })
              .toUpperCase()
              .replace(/ DE /g, ' ')
        : '20 FEBRERO 2027';

    // Fecha dinámica para el footer en formato: 20 | FEB | 2027
    const footerDateText = useMemo(() => {
        if (!wedding?.wedding_date) return '20 | FEB | 2027';
        try {
            const d = new Date(wedding.wedding_date);
            if (isNaN(d.getTime())) return '20 | FEB | 2027';
            const months = [
                'ENE',
                'FEB',
                'MAR',
                'ABR',
                'MAY',
                'JUN',
                'JUL',
                'AGO',
                'SEP',
                'OCT',
                'NOV',
                'DIC',
            ];
            const day = d.getUTCDate();
            const month = months[d.getUTCMonth()] || 'FEB';
            const year = d.getUTCFullYear();
            return `${day} | ${month} | ${year}`;
        } catch {
            return '20 | FEB | 2027';
        }
    }, [wedding?.wedding_date]);

    // Fecha límite de confirmación (llega como "Y-m-d"; se formatea sin desfase de zona horaria)
    const rsvpClosed = !!rsvp?.closed;
    const rsvpDeadlineText = useMemo(() => {
        if (!rsvp?.deadline) return '';
        const [y, m, d] = rsvp.deadline.split('-').map(Number);
        if (!y || !m || !d) return '';
        return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        });
    }, [rsvp?.deadline]);

    const songTitle = wedding?.song_title || 'RESTO DE MI VIDA';

    // Mesas de regalos configurables dinámicamente desde el panel
    const giftRegistries = useMemo(() => {
        if (
            wedding?.gift_registries_list &&
            wedding.gift_registries_list.length > 0
        ) {
            return wedding.gift_registries_list;
        }
        const list: Array<{ name: string; url: string }> = [];
        if (wedding?.gift_registry_url) {
            list.push({
                name: wedding.gift_registry_button_text || 'LIVERPOOL',
                url: wedding.gift_registry_url,
            });
        }
        if (wedding?.gift_registry_url_2) {
            list.push({
                name: wedding.gift_registry_button_text_2 || 'AMAZON',
                url: wedding.gift_registry_url_2,
            });
        }
        if (list.length === 0) {
            list.push(
                {
                    name: 'LIVERPOOL',
                    url: 'https://mesaderegalos.liverpool.com.mx',
                },
                { name: 'AMAZON', url: 'https://www.amazon.com.mx' },
            );
        }
        return list;
    }, [
        wedding?.gift_registries_list,
        wedding?.gift_registry_url,
        wedding?.gift_registry_button_text,
        wedding?.gift_registry_url_2,
        wedding?.gift_registry_button_text_2,
    ]);

    // Formateador de hora amigable para el itinerario
    const formatTimelineTime = useCallback((timeStr?: string) => {
        if (!timeStr) return '';
        const trimmed = timeStr.trim();
        if (/am|pm/i.test(trimmed)) {
            return trimmed.toUpperCase();
        }
        const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
            let hours = parseInt(match[1], 10);
            const minutes = match[2];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${hours}:${minutes} ${ampm}`;
        }
        return trimmed;
    }, []);

    // Itinerario dinámico con fallback a presets canónicos de Canva
    const timelineEvents = useMemo(() => {
        if (wedding?.timeline && wedding.timeline.length > 0) {
            return wedding.timeline;
        }
        if (wedding?.timeline_list && wedding.timeline_list.length > 0) {
            return wedding.timeline_list;
        }
        return [
            {
                time: '15:00',
                title: 'MISA',
                description: '',
                icon_url: '/resources_canvas/images/5.svg',
            },
            {
                time: '16:30',
                title: 'ROMPEHIELOS',
                description: '',
                icon_url: '/resources_canvas/images/6.svg',
            },
            {
                time: '17:30',
                title: 'BRINDIS',
                description: '',
                icon_url: '/resources_canvas/images/7.svg',
            },
            {
                time: '18:30',
                title: 'CENA',
                description: '',
                icon_url: '/resources_canvas/images/8.svg',
            },
            {
                time: '20:00',
                title: 'FIESTA',
                description: '',
                icon_url: '/resources_canvas/images/9.svg',
            },
            {
                time: '02:00',
                title: 'CLAUSURA',
                description: '',
                icon_url: '/resources_canvas/images/10.svg',
            },
        ];
    }, [wedding?.timeline, wedding?.timeline_list]);

    // Nombres de los padres y padrinos
    const brideParents =
        wedding?.bride_parents && wedding.bride_parents.length > 0
            ? wedding.bride_parents
            : [
                  'MARÍA ERMITA SALAZAR PERERA',
                  'WILBERTH ALFREDO GUILLERMO AKÉ',
                  'CARLOS MANUEL HERNÁNDEZ GUILLERMO',
              ];

    const groomParents =
        wedding?.groom_parents && wedding.groom_parents.length > 0
            ? wedding.groom_parents
            : [
                  'ANNA MARÍA BETANCOURT SERRANO',
                  'SATURNINO ROLANDO BAEZA ZETINA',
              ];

    const brideGodparents =
        wedding?.bride_godparents && wedding.bride_godparents.length > 0
            ? wedding.bride_godparents
            : ['ALFREDO ANTONIO ARCEO CASTILLO'];

    const groomGodparents =
        wedding?.groom_godparents && wedding.groom_godparents.length > 0
            ? wedding.groom_godparents
            : ['YARA IVONNE BAEZA ZETINA', 'VÍCTOR SÁNCHEZ GONZÁLEZ'];

    // Estado del reproductor de música
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current
                .play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((err) => {
                    console.warn('Audio playback requires interaction:', err);
                });
        }
    };

    // Auto-reproducción inteligente y desbloqueo confiable al primer gesto del usuario
    useEffect(() => {
        if (!wedding?.music_url) return;

        let unlocked = false;

        const removeListeners = () => {
            window.removeEventListener('pointerdown', handleUserInteraction);
            window.removeEventListener('touchstart', handleUserInteraction);
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('keydown', handleUserInteraction);
        };

        const tryPlay = () => {
            const audio = audioRef.current;
            if (!audio) return;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        unlocked = true;
                        setIsPlaying(true);
                        removeListeners();
                    })
                    .catch(() => {
                        // El navegador bloqueó el autoplay sin interacción previa; mantenemos los listeners activos
                    });
            }
        };

        const handleUserInteraction = () => {
            if (unlocked) return;
            tryPlay();
        };

        // 1. Intento inmediato al cargar el componente
        tryPlay();

        // 2. Si las políticas del navegador lo bloquean, escuchar interacciones reales del usuario
        window.addEventListener('pointerdown', handleUserInteraction, {
            passive: true,
        });
        window.addEventListener('touchstart', handleUserInteraction, {
            passive: true,
        });
        window.addEventListener('click', handleUserInteraction, {
            passive: true,
        });
        window.addEventListener('keydown', handleUserInteraction, {
            passive: true,
        });

        return () => {
            removeListeners();
        };
    }, [wedding?.music_url]);

    // Seguimiento del progreso real de la canción
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Galería conectada al panel de administración (con fallback al template del canvas si aún no hay fotos)
    const defaultGalleryImages = [
        '/images/canva_assets/backgroundhero1.jpg',
        '/images/canva_assets/novios_perrito.webp',
        '/images/canva_assets/perropregalery.webp',
        '/images/canva_assets/herooriginal.webp',
    ];

    const rawGallery = wedding?.gallery_images || wedding?.galleryImages || [];
    const galleryList =
        rawGallery.length > 0
            ? rawGallery.map((img) => img.thumb_path || img.image_path)
            : defaultGalleryImages;

    // Cuenta regresiva hacia wedding_date (o 20 de febrero de 2027 por defecto)
    const [timeLeft, setTimeLeft] = useState({
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
    });

    useEffect(() => {
        const calculateCountdown = () => {
            const weddingTime = wedding?.wedding_date
                ? new Date(wedding.wedding_date).getTime()
                : new Date('2027-02-20T17:00:00').getTime();
            const now = new Date().getTime();
            const difference = weddingTime - now;

            if (difference <= 0) {
                setTimeLeft({
                    days: '00',
                    hours: '00',
                    minutes: '00',
                    seconds: '00',
                });
                return;
            }

            const d = Math.floor(difference / (1000 * 60 * 60 * 24));
            const h = Math.floor(
                (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({
                days: String(d).padStart(2, '0'),
                hours: String(h).padStart(2, '0'),
                minutes: String(m).padStart(2, '0'),
                seconds: String(s).padStart(2, '0'),
            });
        };

        calculateCountdown();
        const timer = setInterval(calculateCountdown, 1000);
        return () => clearInterval(timer);
    }, [wedding?.wedding_date]);

    // Transiciones y animaciones al hacer scroll (Scroll Reveal de alta gama)
    useEffect(() => {
        const elements =
            document.querySelectorAll<HTMLElement>('[data-reveal]');
        if (elements.length === 0) return;

        // Revelar inmediatamente los que ya están en el viewport inicial
        const checkImmediate = () => {
            const windowHeight =
                window.innerHeight || document.documentElement.clientHeight;
            elements.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top <= windowHeight * 0.95 && rect.bottom >= 0) {
                    el.classList.add('is-revealed');
                }
            });
        };

        checkImmediate();

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-revealed');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    rootMargin: '0px 0px -30px 0px',
                    threshold: 0.05,
                },
            );

            elements.forEach((el) => {
                if (!el.classList.contains('is-revealed')) {
                    observer.observe(el);
                }
            });

            return () => observer.disconnect();
        } else {
            elements.forEach((el) => el.classList.add('is-revealed'));
        }
    }, []);

    // Hoteles recomendados para Hospedaje
    const defaultHotels = [
        {
            name: 'Hacienda Misné',
            description: 'Hotel colonial y exuberantes jardines',
            image: '/images/hotels/hotel_1.jpg',
            url: 'https://www.haciendamisne.com.mx/',
        },
        {
            name: 'Hotel Casa Lucia',
            description: 'Boutique hotel en el centro histórico',
            image: '/images/hotels/hotel_2.jpg',
            url: 'https://casalucia.com.mx/',
        },
        {
            name: 'Mansión Mérida',
            description: 'Elegancia clásica frente al parque',
            image: '/images/hotels/hotel_3.jpg',
            url: 'https://mansionmerida.com/',
        },
        {
            name: 'Villa Mercedes Curio',
            description: 'Estilo contemporáneo y confort',
            image: '/images/hotels/hotel_4.jpg',
            url: 'https://www.hilton.com/',
        },
    ];

    const rawHotels = wedding?.hotels || [];
    const hotelList =
        rawHotels.length > 0
            ? rawHotels.map((h) => ({
                  name: h.name,
                  description: h.location || h.description || '',
                  image:
                      h.image_path || h.image || '/images/hotels/hotel_1.jpg',
                  url: h.url || '',
                  phone: h.phone || '',
                  mapsUrl:
                      h.maps_url ||
                      (h.location
                          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.location)}`
                          : ''),
              }))
            : defaultHotels;

    // Estado del Formulario de Asistencia (RSVP / ¿Nos acompañas?)
    const [rsvpName, setRsvpName] = useState(invitation?.name || '');

    // Determinar respuesta inicial si ya respondió previamente
    const getInitialAttending = (): 'yes' | 'no' | null => {
        if (!invitation?.guests || invitation.guests.length === 0) return null;
        const allYes = invitation.guests.every((g) => g.is_attending === true);
        const allNo = invitation.guests.every((g) => g.is_attending === false);
        if (allYes) return 'yes';
        if (allNo) return 'no';
        return null;
    };

    const [rsvpAttending, setRsvpAttending] = useState<'yes' | 'no' | null>(
        getInitialAttending(),
    );

    // Mapa de asistencia individual por invitado
    const [guestAttendingMap, setGuestAttendingMap] = useState<
        Record<number, boolean>
    >(() => {
        const map: Record<number, boolean> = {};
        if (invitation?.guests) {
            invitation.guests.forEach((g) => {
                if (g.is_attending !== null && g.is_attending !== undefined) {
                    map[g.id] = g.is_attending;
                }
            });
        }
        return map;
    });

    const [guestAllergiesMap, setGuestAllergiesMap] = useState<
        Record<number, string>
    >(() => {
        const map: Record<number, string> = {};
        if (invitation?.guests) {
            invitation.guests.forEach((g) => {
                map[g.id] = g.allergies || '';
            });
        }
        return map;
    });

    const [rsvpMessage, setRsvpMessage] = useState(
        invitation?.message_to_couple || '',
    );
    const [rsvpSubmitted, setRsvpSubmitted] = useState(
        invitation?.status === 'responded',
    );
    const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
    const [rsvpError, setRsvpError] = useState('');

    // Lista de invitados que confirmaron asistencia para generar sus pases
    const confirmedGuests = useMemo(() => {
        if (!invitation?.guests || invitation.guests.length === 0) {
            if (rsvpAttending === 'yes') {
                return [
                    {
                        id: 0,
                        full_name: rsvpName || 'Invitado de Honor',
                        checkin_code: 'AJ-ACCESO',
                        is_attending: true,
                        type: 'adult' as const,
                    },
                ];
            }
            return [];
        }
        return invitation.guests.filter((g) => {
            if (guestAttendingMap[g.id] !== undefined) {
                return guestAttendingMap[g.id] === true;
            }
            return g.is_attending === true;
        });
    }, [invitation?.guests, guestAttendingMap, rsvpAttending, rsvpName]);

    const handleRsvpSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!invitation && !rsvpName.trim()) {
            setRsvpError('Por favor ingresa tu nombre completo');
            return;
        }

        const hasMultipleGuests = !!(
            invitation &&
            invitation.guests &&
            invitation.guests.length > 1
        );

        if (hasMultipleGuests) {
            const hasAnySelection = Object.keys(guestAttendingMap).length > 0;
            if (!hasAnySelection && !rsvpAttending) {
                setRsvpError(
                    'Por favor confirma la asistencia de tus invitados',
                );
                return;
            }
        } else {
            if (!rsvpAttending) {
                setRsvpError('Por favor confirma si asistirás a nuestra boda');
                return;
            }
        }

        setRsvpError('');
        setRsvpSubmitting(true);

        if (invitation?.token) {
            // Invitación personalizada con token
            const payload = hasMultipleGuests
                ? {
                      guests: invitation.guests?.map((g) => ({
                          id: g.id,
                          is_attending:
                              guestAttendingMap[g.id] !== undefined
                                  ? guestAttendingMap[g.id]
                                  : rsvpAttending === 'yes',
                          allergies: guestAllergiesMap[g.id] || null,
                      })),
                      message_to_couple: rsvpMessage,
                  }
                : {
                      is_attending: rsvpAttending === 'yes',
                      guests: invitation.guests?.map((g) => ({
                          id: g.id,
                          is_attending: rsvpAttending === 'yes',
                          allergies: guestAllergiesMap[g.id] || null,
                      })),
                      message_to_couple: rsvpMessage,
                  };

            router.put(`/public/rsvp/${invitation.token}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setRsvpSubmitted(true);
                },
                onError: (err: any) => {
                    setRsvpError(
                        err?.rsvp ||
                            'Ocurrió un error al guardar tu respuesta. Intenta de nuevo.',
                    );
                },
                onFinish: () => {
                    setRsvpSubmitting(false);
                },
            });
        } else {
            // Confirmación abierta en la landing (sin token)
            router.post(
                '/public/rsvp/submit',
                {
                    name: rsvpName.trim(),
                    is_attending: rsvpAttending === 'yes',
                    message: rsvpMessage,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setRsvpSubmitted(true);
                    },
                    onError: (err: any) => {
                        setRsvpError(
                            err?.name ||
                                err?.message ||
                                'Ocurrió un error al guardar tu confirmación.',
                        );
                    },
                    onFinish: () => {
                        setRsvpSubmitting(false);
                    },
                },
            );
        }
    };

    return (
        <>
            <Head
                title={
                    meta?.title ||
                    (invitation?.name
                        ? `Invitación para ${invitation.name} • Boda de ${brideName} & ${groomName}`
                        : `Boda de ${brideName} & ${groomName} • Nuestra Invitación`)
                }
            />

            {/* Contenedor principal a pantalla completa real (Edge-to-Edge) */}
            <main className="flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden bg-[#fbf9f4] select-none">
                <div className="relative flex w-full flex-col">
                    {/* ========================================================= */}
                    {/* SECCIÓN 1: HERO NOVIOS (Cubre el 100% de la pantalla)     */}
                    {/* ========================================================= */}
                    <section className="relative flex invitation-section h-[100svh] min-h-[100svh] w-full shrink-0 flex-col justify-between sm:h-[890px] sm:min-h-[890px] md:h-screen md:min-h-screen">
                        {/* Imagen de fondo de los novios con mayor zoom y encuadre idéntico al diseño */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <img
                                src="/images/canva_assets/backgroundhero1.jpg"
                                alt={`${brideName} & ${groomName}`}
                                loading="eager"
                                fetchPriority="high"
                                decoding="async"
                                className="hero-bg-reveal pointer-events-none h-full w-full translate-y-[3.5%] scale-[1.08] transform object-cover object-[45%_22%] md:translate-y-0 md:scale-100 md:object-[50%_25%]"
                            />
                            {/* Neblina / degradado superior blanco ultra suave y progresivo */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.5)_35%,rgba(255,255,255,0.15)_70%,transparent_100%)] md:h-56" />

                            {/* Neblina / degradado inferior difuminado ultra suave hacia el tono crema #fbf9f4 */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-[linear-gradient(to_top,#fbf9f4_0%,#fbf9f4_25%,rgba(251,249,244,0.75)_50%,rgba(251,249,244,0.35)_75%,rgba(251,249,244,0)_100%)] sm:h-96 md:h-80" />
                        </div>

                        {/* --- PARTE SUPERIOR: FECHA --- */}
                        <header
                            className="relative z-20 px-4 pt-16 text-center sm:pt-20 md:pt-24"
                            data-reveal="down"
                        >
                            <p className="font-serif text-xs font-medium tracking-[0.28em] text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] sm:text-sm md:text-base md:tracking-[0.36em]">
                                {dateText}
                            </p>
                        </header>

                        {/* --- PARTE CENTRAL: NOMBRES DE LOS NOVIOS --- */}
                        <div
                            className="relative z-20 mx-auto my-auto flex w-full max-w-[340px] flex-col px-4 select-none sm:max-w-[380px] md:max-w-[560px] lg:max-w-[660px]"
                            data-reveal="scale"
                            data-reveal-delay="200"
                        >
                            {/* Primera línea: Adriana & */}
                            <div className="flex items-baseline justify-start pl-2 sm:pl-4 md:pl-8">
                                <span className="-mx-2 -my-2 px-2 py-2 font-script text-[3rem] leading-[1.15] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] sm:text-[3.5rem] md:text-[4.6rem] lg:text-[5.4rem]">
                                    {brideName}
                                </span>
                                <span className="-my-2 ml-1 px-2 py-2 font-script text-[1.8rem] leading-none text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] sm:text-[2.6rem] md:ml-3 md:text-[3.2rem] lg:text-[3.8rem]">
                                    &amp;
                                </span>
                            </div>

                            {/* Segunda línea: Joaquin */}
                            <div className="mt-3 ml-5 flex justify-start pl-12 sm:mt-4 sm:pl-16 md:mt-6 md:pl-28">
                                <span className="-mx-2 -my-2 px-2 py-2 font-script text-[3rem] leading-[1.15] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] sm:text-[3.5rem] md:text-[4.6rem] lg:text-[5.4rem]">
                                    {groomName}
                                </span>
                            </div>
                        </div>

                        {/* Espaciador inferior del Hero y señal interactiva de deslizamiento */}
                        <div
                            className="pointer-events-none relative z-20 flex flex-col items-center justify-center pb-4 text-center md:pb-6"
                            data-reveal="fade"
                            data-reveal-delay="400"
                        >
                            <span className="animate-pulse font-serif text-[9px] font-medium tracking-[0.28em] text-white/90 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] sm:text-[10px]">
                                DESLIZA
                            </span>
                            <svg
                                className="mt-1 h-3.5 w-3.5 animate-bounce text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 2: NUESTROS PADRES & NUESTROS PADRINOS            */}
                    {/* (Pantalla completa tipo Canva con zoom en escritorio)     */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex w-full shrink-0 flex-col items-center justify-center bg-[#fbf9f4] select-none">
                        <div className="canvas-container flex min-h-[100svh] shrink-0 flex-col justify-between px-6 pt-3 pb-0 select-none sm:min-h-[890px] sm:pt-4">
                            {/* Decoración botánica rama derecha con balanceo suave */}
                            <img
                                src="/resources_canvas/images/plantaladoderecho.webp"
                                alt="Decoración botánica"
                                loading="lazy"
                                decoding="async"
                                className="animate-float-slow pointer-events-none absolute -top-12 -right-10 z-30 w-28 -rotate-12 object-contain select-none sm:w-32"
                            />

                            {/* Top: REPRODUCTOR DE MÚSICA */}
                            <div
                                className="relative z-20 flex flex-col items-center pt-1 text-center sm:pt-2"
                                data-reveal="down"
                            >
                                <span className="mb-1 font-serif text-[10px] font-medium tracking-[0.28em] text-[#788a80] uppercase drop-shadow-sm sm:text-[11px]">
                                    {songTitle}
                                </span>

                                {/* Barra de progreso de música interactiva */}
                                <div
                                    onClick={togglePlay}
                                    className="group flex w-56 cursor-pointer items-center justify-center py-1 sm:w-64"
                                    title={
                                        isPlaying
                                            ? 'Pausar música'
                                            : 'Reproducir música'
                                    }
                                >
                                    <div className="relative h-[2.5px] w-full rounded-full bg-[#678d91]/50 transition-colors group-hover:bg-[#678d91]/70">
                                        <div
                                            className="h-full rounded-full bg-[#52777c] transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                        <div
                                            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#597e83] shadow-md transition-transform group-hover:scale-110"
                                            style={{ left: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Botones de control del reproductor */}
                                <div className="mt-1.5 flex items-center justify-center gap-5 text-[#6f8892]">
                                    {/* Shuffle */}
                                    <button
                                        type="button"
                                        className="cursor-pointer text-[#78929b] transition-colors hover:text-[#52777c]"
                                        title="Aleatorio"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                                        </svg>
                                    </button>
                                    {/* Anterior */}
                                    <button
                                        type="button"
                                        className="cursor-pointer text-[#78929b] transition-colors hover:text-[#52777c]"
                                        title="Anterior"
                                    >
                                        <svg
                                            className="h-4 w-4 fill-current"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                                        </svg>
                                    </button>
                                    {/* Play / Pausa circular */}
                                    <button
                                        type="button"
                                        onClick={togglePlay}
                                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#728c96] text-white shadow-md transition-all hover:scale-105 hover:bg-[#5f7a84] hover:shadow-lg active:scale-95"
                                        title={
                                            isPlaying ? 'Pausar' : 'Reproducir'
                                        }
                                    >
                                        {isPlaying ? (
                                            <svg
                                                className="h-4 w-4 fill-current"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="ml-0.5 h-4 w-4 fill-current"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>
                                    {/* Siguiente */}
                                    <button
                                        type="button"
                                        className="cursor-pointer text-[#78929b] transition-colors hover:text-[#52777c]"
                                        title="Siguiente"
                                    >
                                        <svg
                                            className="h-4 w-4 fill-current"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                        </svg>
                                    </button>
                                    {/* Repetir */}
                                    <button
                                        type="button"
                                        className="cursor-pointer text-[#78929b] transition-colors hover:text-[#52777c]"
                                        title="Repetir"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Icono de huellitas con corazón con latido suave */}
                                <div className="mt-6 flex h-18 w-18 items-center justify-center sm:mt-7 sm:h-16 sm:w-16">
                                    <img
                                        src="/resources_canvas/images/2.svg"
                                        alt="Huella de amor"
                                        loading="lazy"
                                        decoding="async"
                                        className="animate-pulse-subtle h-full w-full object-contain opacity-90"
                                    />
                                </div>
                            </div>

                            {/* Middle: Contenido de Padres y Padrinos en columna única centrada (idéntico a móvil) */}
                            <div className="relative z-20 my-auto mt-4 flex w-full flex-col items-center justify-center py-2">
                                {/* --- BLOQUE: NUESTROS PADRES --- */}
                                <div
                                    className="flex w-full flex-col items-center text-center"
                                    data-reveal="up"
                                    data-reveal-delay="100"
                                >
                                    <h2 className="-my-1.5 mb-3 px-3 py-1.5 font-script text-[2.1rem] leading-[1.2] font-normal tracking-normal text-[#698175] sm:mb-4 sm:text-[2.4rem]">
                                        Nuestros Padres
                                    </h2>

                                    {/* Padres de la novia */}
                                    <div className="mb-1.5 space-y-1">
                                        {brideParents.map((name, i) => (
                                            <p
                                                key={i}
                                                className="font-serif text-[10px] font-medium tracking-[0.24em] text-[#788a80] uppercase sm:text-[11px]"
                                            >
                                                {name}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Ampersand & */}
                                    <span className="my-1 px-2 py-3 font-script text-2xl leading-none text-[#698175] sm:text-3xl">
                                        &amp;
                                    </span>

                                    {/* Padres del novio */}
                                    <div className="mt-1 space-y-1">
                                        {groomParents.map((name, i) => (
                                            <p
                                                key={i}
                                                className="font-serif text-[10px] font-medium tracking-[0.24em] text-[#788a80] uppercase sm:text-[11px]"
                                            >
                                                {name}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {/* --- BLOQUE: NUESTROS PADRINOS --- */}
                                <div
                                    className="mt-12 flex w-full flex-col items-center text-center sm:mt-8"
                                    data-reveal="up"
                                    data-reveal-delay="200"
                                >
                                    <h2 className="-my-1.5 mb-6 px-3 py-1.5 font-script text-[2.1rem] leading-[1.2] font-normal tracking-normal text-[#698175] sm:mb-8 sm:text-[2.4rem]">
                                        Nuestros Padrinos
                                    </h2>

                                    {/* Padrino(s) grupo 1 */}
                                    <div className="mb-1.5 space-y-1">
                                        {brideGodparents.map((name, i) => (
                                            <p
                                                key={i}
                                                className="font-serif text-[10px] font-medium tracking-[0.24em] text-[#788a80] uppercase sm:text-[11px]"
                                            >
                                                {name}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Ampersand & */}
                                    <span className="my-1 px-2 py-3 font-script text-2xl leading-none text-[#698175] sm:text-3xl">
                                        &amp;
                                    </span>

                                    {/* Padrinos grupo 2 */}
                                    <div className="mt-1 space-y-1">
                                        {groomGodparents.map((name, i) => (
                                            <p
                                                key={i}
                                                className="font-serif text-[10px] font-medium tracking-[0.24em] text-[#788a80] uppercase sm:text-[11px]"
                                            >
                                                {name}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom: Perrito con el anillo en la cabeza asomándose */}
                            <div
                                className="pointer-events-none relative z-20 mt-4 flex w-full items-end justify-center select-none"
                                data-reveal="up"
                                data-reveal-delay="250"
                            >
                                <div
                                    className="relative w-[90%] max-w-[360px] overflow-hidden"
                                    style={{ aspectRatio: '810 / 397' }}
                                >
                                    <img
                                        src="/images/canva_assets/perropregalery.webp"
                                        alt="Perrito con anillo"
                                        loading="lazy"
                                        decoding="async"
                                        className="pointer-events-none absolute bottom-0 left-0 block w-full drop-shadow-sm select-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 3: GALERÍA & CUENTA REGRESIVA                     */}
                    {/* (Pantalla completa tipo Canva con zoom en escritorio)     */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex w-full shrink-0 flex-col items-center justify-center overflow-hidden bg-[#fbf9f4] select-none">
                        <div className="canvas-container flex min-h-[65svh] shrink-0 flex-col items-center justify-start px-0 pt-7 pb-8 select-none sm:min-h-[640px] sm:pt-9">
                            {/* --- BLOQUE SUPERIOR: TÍTULO Y CARRUSEL DE GALERÍA --- */}
                            <div
                                className="flex w-full flex-col items-center"
                                data-reveal="fade"
                                data-reveal-delay="100"
                            >
                                {/* Título de Galería */}
                                <h2
                                    className="mb-3 px-4 text-center font-serif text-[12.3px] font-medium tracking-[0.32em] text-[#788a80] uppercase sm:mb-4 sm:text-[14px]"
                                    data-reveal="down"
                                >
                                    GALERÍA
                                </h2>

                                {/* Carrusel interactivo y fluido con soporte táctil, arrastre con dedo y cambio activo */}
                                <MobileGalleryCarousel images={galleryList} />
                            </div>

                            {/* --- BLOQUE INFERIOR: CUENTA REGRESIVA SUBIDA Y COMPACTA --- */}
                            <div
                                className="mt-5 flex flex-col items-center px-4 text-center sm:mt-7"
                                data-reveal="up"
                                data-reveal-delay="200"
                            >
                                {/* "FALTAN" */}
                                <span className="mt-3 mb-2 font-serif text-[10px] font-medium tracking-[0.3em] text-[#788a80] uppercase sm:mb-2.5 sm:text-[11px]">
                                    FALTAN
                                </span>

                                {/* Contenedor de Tiempo: DÍAS, HORAS, MINS, SEGS */}
                                <div className="flex items-start justify-center gap-1 sm:gap-2">
                                    {/* Días */}
                                    <div className="flex w-14 flex-col items-center rounded-xl p-1 transition-transform duration-200 hover:scale-105 sm:w-16">
                                        <span className="mb-1 font-serif text-[8.5px] font-medium tracking-[0.22em] text-[#788a80] uppercase sm:text-[9.5px]">
                                            DÍAS
                                        </span>
                                        <span className="font-serif text-3xl leading-none font-light text-[#698175] sm:text-4xl">
                                            {timeLeft.days}
                                        </span>
                                    </div>

                                    <span className="mt-3.5 font-serif text-2xl leading-none font-light text-[#698175] sm:mt-4 sm:text-3xl">
                                        :
                                    </span>

                                    {/* Horas */}
                                    <div className="flex w-14 flex-col items-center rounded-xl p-1 transition-transform duration-200 hover:scale-105 sm:w-16">
                                        <span className="mb-1 font-serif text-[8.5px] font-medium tracking-[0.22em] text-[#788a80] uppercase sm:text-[9.5px]">
                                            HORAS
                                        </span>
                                        <span className="font-serif text-3xl leading-none font-light text-[#698175] sm:text-4xl">
                                            {timeLeft.hours}
                                        </span>
                                    </div>

                                    <span className="mt-3.5 font-serif text-2xl leading-none font-light text-[#698175] sm:mt-4 sm:text-3xl">
                                        :
                                    </span>

                                    {/* Minutos */}
                                    <div className="flex w-14 flex-col items-center rounded-xl p-1 transition-transform duration-200 hover:scale-105 sm:w-16">
                                        <span className="mb-1 font-serif text-[8.5px] font-medium tracking-[0.22em] text-[#788a80] uppercase sm:text-[9.5px]">
                                            MINS
                                        </span>
                                        <span className="font-serif text-3xl leading-none font-light text-[#698175] sm:text-4xl">
                                            {timeLeft.minutes}
                                        </span>
                                    </div>

                                    <span className="mt-3.5 font-serif text-2xl leading-none font-light text-[#698175] sm:mt-4 sm:text-3xl">
                                        :
                                    </span>

                                    {/* Segundos */}
                                    <div className="flex w-14 flex-col items-center rounded-xl p-1 transition-transform duration-200 hover:scale-105 sm:w-16">
                                        <span className="mb-1 font-serif text-[8.5px] font-medium tracking-[0.22em] text-[#788a80] uppercase sm:text-[9.5px]">
                                            SEGS
                                        </span>
                                        <span className="font-serif text-3xl leading-none font-light text-[#698175] sm:text-4xl">
                                            {timeLeft.seconds}
                                        </span>
                                    </div>
                                </div>

                                {/* "PARA EL GRAN DÍA" */}
                                <span className="mt-2.5 font-serif text-[9px] font-medium tracking-[0.28em] text-[#788a80] uppercase sm:mt-3 sm:text-[10px]">
                                    PARA EL GRAN DÍA
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 4: ITINERARIO                                     */}
                    {/* (Timeline elegante con círculos y línea vertical unida)   */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex min-h-[100svh] w-full shrink-0 flex-col items-center justify-center overflow-hidden bg-[#748270] px-4 py-10 select-none sm:min-h-[890px] sm:px-6 sm:py-14">
                        {/* Fondo de textura auténtica de Canva sobre el verde olivo extendido borde a borde */}
                        <img
                            src="/images/canva_assets/asset_17_9c5d7925.webp"
                            alt="Fondo textura Itinerario"
                            loading="lazy"
                            decoding="async"
                            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-40 mix-blend-multiply select-none"
                        />

                        {/* Huellitas decorativas en esquina superior izquierda */}
                        <div className="animate-pulse-subtle pointer-events-none absolute top-4 left-4 z-20 h-14 w-14 opacity-80 select-none sm:top-6 sm:left-6 sm:h-16 sm:w-16">
                            <img
                                src="/resources_canvas/images/4.svg"
                                alt="Huellitas"
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        {/* Perrito con anillo asomándose en la esquina inferior derecha */}
                        <div
                            className="pointer-events-none absolute -right-4 -bottom-2 z-30 w-[170px] select-none sm:right-0 sm:w-[215px]"
                            data-reveal="fade"
                            data-reveal-delay="250"
                        >
                            <img
                                src="/images/canva_assets/asset_13_254b129a.webp"
                                alt="Perrito asomándose"
                                loading="lazy"
                                decoding="async"
                                className="h-auto w-full object-contain drop-shadow-md"
                            />
                        </div>

                        {/* Contenedor Canva con zoom proporcional */}
                        <div className="canvas-container relative z-20 flex w-full max-w-[430px] shrink-0 flex-col justify-between px-2 py-2 select-none sm:px-4">
                            {/* Título de la sección: Itinerario */}
                            <div
                                className="mb-6 w-full text-center sm:mb-8"
                                data-reveal="down"
                            >
                                <h2 className="-my-2 px-3 py-2 font-script text-[2.8rem] leading-[1.2] font-normal tracking-wide text-[#fbf9f4] [text-shadow:0_1px_2px_rgba(0,0,0,0.12)] sm:text-[3.5rem]">
                                    Itinerario
                                </h2>
                            </div>

                            {wedding?.timeline_mode !== 'items' ? (
                                <div
                                    className="flex w-full justify-center py-2 pb-16 sm:pb-20"
                                    data-reveal="up"
                                >
                                    <img
                                        src={
                                            wedding?.timeline_image_path ||
                                            '/images/canva_assets/itinerario_final.svg'
                                        }
                                        alt="Itinerario"
                                        loading="lazy"
                                        decoding="async"
                                        className="h-auto w-full max-w-[380px] object-contain drop-shadow-sm"
                                    />
                                </div>
                            ) : (
                                <>
                                    {/* TIMELINE VERTICAL CON CÍRCULOS UNIDOS POR UNA LÍNEA */}
                                    <div className="relative w-full py-2">
                                        {/* Línea vertical continua que une todos los nodos */}
                                        <div className="absolute top-6 bottom-6 left-1/2 z-0 w-[2px] -translate-x-1/2 bg-[#fbf9f4]/45" />

                                        <div className="relative z-10 flex flex-col space-y-6 sm:space-y-7">
                                            {timelineEvents.map(
                                                (event, index) => {
                                                    const isEven =
                                                        index % 2 === 0;
                                                    const formattedTime =
                                                        formatTimelineTime(
                                                            event.time,
                                                        );
                                                    const delay = Math.min(
                                                        (index % 4) * 100 + 100,
                                                        500,
                                                    );

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="group relative flex w-full items-center justify-between"
                                                        >
                                                            {/* COLUMNA IZQUIERDA */}
                                                            <div
                                                                className="w-[calc(50%-1.75rem)] pr-2 text-right sm:w-[calc(50%-2.25rem)] sm:pr-3"
                                                                data-reveal="left"
                                                                data-reveal-delay={String(
                                                                    delay,
                                                                )}
                                                            >
                                                                {isEven ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="font-serif text-[12px] leading-tight font-bold tracking-[0.2em] text-[#fbf9f4] uppercase drop-shadow-xs sm:text-[13px]">
                                                                            {
                                                                                event.title
                                                                            }
                                                                        </span>
                                                                        {event.description && (
                                                                            <span className="mt-0.5 font-serif text-[10px] leading-snug font-light text-[#fbf9f4]/85 sm:text-[11px]">
                                                                                {
                                                                                    event.description
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex justify-end">
                                                                        <span className="rounded-full border border-[#fbf9f4]/25 bg-[#fbf9f4]/15 px-2.5 py-0.5 font-serif text-[10.5px] font-medium tracking-[0.14em] text-[#fbf9f4] shadow-xs backdrop-blur-xs sm:text-[11.5px]">
                                                                            {
                                                                                formattedTime
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* CÍRCULO CENTRAL CON ICONO */}
                                                            <div
                                                                className="relative z-10 flex shrink-0 items-center justify-center"
                                                                data-reveal="scale"
                                                                data-reveal-delay={String(
                                                                    delay,
                                                                )}
                                                            >
                                                                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#fbf9f4] bg-[#586755] p-2 shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)] sm:h-14 sm:w-14 sm:p-2.5">
                                                                    <img
                                                                        src={
                                                                            event.icon_url ||
                                                                            '/resources_canvas/images/5.svg'
                                                                        }
                                                                        alt={
                                                                            event.title ||
                                                                            'Itinerario'
                                                                        }
                                                                        loading="lazy"
                                                                        decoding="async"
                                                                        className="h-full w-full object-contain drop-shadow-xs filter"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* COLUMNA DERECHA */}
                                                            <div
                                                                className="w-[calc(50%-1.75rem)] pl-2 text-left sm:w-[calc(50%-2.25rem)] sm:pl-3"
                                                                data-reveal="right"
                                                                data-reveal-delay={String(
                                                                    delay,
                                                                )}
                                                            >
                                                                {isEven ? (
                                                                    <div className="flex justify-start">
                                                                        <span className="rounded-full border border-[#fbf9f4]/25 bg-[#fbf9f4]/15 px-2.5 py-0.5 font-serif text-[10.5px] font-medium tracking-[0.14em] text-[#fbf9f4] shadow-xs backdrop-blur-xs sm:text-[11.5px]">
                                                                            {
                                                                                formattedTime
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="font-serif text-[12px] leading-tight font-bold tracking-[0.2em] text-[#fbf9f4] uppercase drop-shadow-xs sm:text-[13px]">
                                                                            {
                                                                                event.title
                                                                            }
                                                                        </span>
                                                                        {event.description && (
                                                                            <span className="mt-0.5 font-serif text-[10px] leading-snug font-light text-[#fbf9f4]/85 sm:text-[11px]">
                                                                                {
                                                                                    event.description
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 5: UBICACIÓN & MESA DE REGALOS                    */}
                    {/* (Pantalla tipo Canva: Marco de encaje con sello y plantas) */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex min-h-[100svh] w-full shrink-0 flex-col items-center justify-center overflow-hidden bg-[#fbf9f4] px-4 py-8 select-none sm:h-[890px] sm:min-h-[890px] sm:px-6 sm:py-12">
                        <div className="canvas-container flex flex-col items-center justify-center">
                            {/* Contenedor del marco proporcionado al diseño de Canva */}
                            <div className="relative flex h-[710px] w-full max-w-[365px] flex-col items-center justify-between p-4 sm:h-[750px]">
                                {/* 10.svg: Marco y fondo de encaje escalado para eliminar el margen transparente del SVG */}
                                <div className="pointer-events-none absolute inset-0 z-0 flex h-full w-full items-center justify-center select-none">
                                    <img
                                        src="/resources_canvas/images/10.svg"
                                        alt="Marco de encaje"
                                        loading="lazy"
                                        decoding="async"
                                        className="pointer-events-none h-full w-[156%] max-w-none -translate-y-20 object-fill select-none sm:-translate-y-26"
                                    />
                                </div>

                                {/* Planta lado izquierdo con flotación orgánica suave */}
                                <div className="animate-float-slow pointer-events-none absolute top-[33%] -left-7 z-20 w-24 select-none sm:-left-8 sm:w-28">
                                    <img
                                        src="/images/canva_assets/hojasubicacionizquierda.webp"
                                        alt="Decoración botánica izquierda"
                                        loading="lazy"
                                        decoding="async"
                                        className="h-auto w-full object-contain"
                                    />
                                </div>

                                {/* Planta lado derecho inferior con balanceo opuesto */}
                                <div className="animate-float-reverse pointer-events-none absolute -right-6 bottom-0 z-20 -mt-32 -mr-12 w-36 -translate-y-30 select-none sm:-right-7 sm:bottom-1 sm:w-38 sm:-translate-y-32">
                                    <img
                                        src="/images/canva_assets/hojasubicacionderecha.webp"
                                        alt="Decoración botánica derecha"
                                        loading="lazy"
                                        decoding="async"
                                        className="h-auto w-full object-contain"
                                    />
                                </div>

                                {/* Contenido Interior */}
                                <div className="relative z-10 flex h-full w-full flex-col items-center justify-between px-2 pt-2 pb-5 text-center">
                                    {/* Bloque Superior: Sello y Título Ubicación */}
                                    <div
                                        className="flex w-full translate-y-6 flex-col items-center sm:translate-y-8"
                                        data-reveal="down"
                                    >
                                        {/* Sello de cera con huellita animado con pulso y sombra viva */}
                                        <div className="animate-pulse-subtle mb-0.5 flex h-[66px] w-[66px] shrink-0 items-center justify-center drop-shadow-md sm:h-[74px] sm:w-[74px]">
                                            <img
                                                src="/images/canva_assets/sello_huellita.webp"
                                                alt="Sello de huellita"
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-contain"
                                            />
                                        </div>

                                        {/* Título: Ubicación */}
                                        <h2 className="-my-1.5 mt-2 mb-1 px-3 py-1.5 font-script text-[1.9rem] leading-[1.2] tracking-normal text-[#617485] font-italic [text-shadow:0_1px_2px_rgba(0,0,0,0.08)] sm:text-[2.4rem]">
                                            Ubicación
                                        </h2>
                                    </div>

                                    {/* Bloque 1: Ceremonia religiosa */}
                                    <div
                                        className="my-auto flex flex-col items-center"
                                        data-reveal="up"
                                        data-reveal-delay="100"
                                    >
                                        <span className="mb-0.5 font-cardo text-[1.0rem] leading-none text-[#6d8293] font-italic sm:text-[1.22rem]">
                                            Ceremonia religiosa
                                        </span>
                                        <h3 className="mb-2 font-serif text-[11.5px] font-semibold tracking-[0.1em] text-[#3f5263] uppercase sm:text-[12.5px]">
                                            {wedding?.locations?.ceremony &&
                                            wedding.locations.ceremony !==
                                                'NOMBRE DE LA IGLESIA'
                                                ? wedding.locations.ceremony
                                                : 'CASA DE LA CRISTIANDAD'}
                                        </h3>
                                        <a
                                            href={
                                                wedding?.locations
                                                    ?.ceremony_maps ||
                                                'https://maps.google.com/?q=Casa+de+la+Cristiandad'
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group hover-lift inline-flex items-center justify-center rounded-[10px] border border-[#cbd5df] bg-white px-3.5 py-2 text-[#4c6070] shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                                        >
                                            <span className="font-serif text-[11px] font-bold tracking-[0.08em] uppercase sm:text-[12px]">
                                                VER EN GOOGLE MAPS
                                            </span>
                                            <span className="ml-2 text-sm text-[#4c6070] transition-transform group-hover:translate-x-0.5">
                                                →
                                            </span>
                                        </a>
                                    </div>

                                    {/* Bloque 2: Recepción */}
                                    <div
                                        className="my-auto flex -translate-y-16 flex-col items-center sm:-translate-y-22"
                                        data-reveal="up"
                                        data-reveal-delay="200"
                                    >
                                        <span className="mb-0.5 font-cardo text-[1.0rem] leading-none text-[#6d8293] font-italic sm:text-[1.22rem]">
                                            Recepción
                                        </span>
                                        <h3 className="mb-2 font-serif text-[11.5px] font-semibold tracking-[0.1em] text-[#3f5263] uppercase sm:text-[12.5px]">
                                            {wedding?.locations?.reception &&
                                            wedding.locations.reception !==
                                                'NOMBRE DEL LOCAL'
                                                ? wedding.locations.reception
                                                : 'HOTEL HACIENDA SÁNCHEZ'}
                                        </h3>
                                        <a
                                            href={
                                                wedding?.locations
                                                    ?.reception_maps ||
                                                'https://maps.google.com/?q=Hotel+Hacienda+Sanchez'
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group hover-lift inline-flex items-center justify-center rounded-[10px] border border-[#cbd5df] bg-white px-3.5 py-2 text-[#4c6070] shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                                        >
                                            <span className="font-serif text-[11px] font-bold tracking-[0.08em] uppercase sm:text-[12px]">
                                                VER EN GOOGLE MAPS
                                            </span>
                                            <span className="ml-2 text-sm text-[#4c6070] transition-transform group-hover:translate-x-0.5">
                                                →
                                            </span>
                                        </a>
                                    </div>

                                    {/* Bloque 3: Mesa de regalos */}
                                    <div
                                        className="my-auto flex -translate-y-32 flex-col items-center sm:-translate-y-38"
                                        data-reveal="up"
                                        data-reveal-delay="300"
                                    >
                                        <h2 className="-my-1.5 mb-2 px-3 py-1.5 font-script text-[1.9rem] leading-[1.2] font-normal text-[#617485] [text-shadow:0_1px_2px_rgba(0,0,0,0.08)] sm:text-[1.8rem]">
                                            Mesa de regalos
                                        </h2>
                                        <div className="flex w-full max-w-[145px] flex-col gap-2.5 sm:max-w-[160px]">
                                            {giftRegistries.map((reg, idx) => (
                                                <a
                                                    key={idx}
                                                    href={reg.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group hover-lift inline-flex items-center justify-center rounded-[10px] border border-[#cbd5df] bg-white px-3.5 py-1.5 text-[#4c6070] shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                                                >
                                                    <span className="max-w-[110px] truncate font-serif text-[11px] font-bold tracking-normal uppercase sm:text-[12px]">
                                                        {reg.name}
                                                    </span>
                                                    <span className="ml-2 text-sm text-[#4c6070] transition-transform group-hover:translate-x-0.5">
                                                        →
                                                    </span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 6: LLUVIA DE SOBRES / REGALO                      */}
                    {/* (Sobre abierto con solapa monograma AJ y tarjeta con texto) */}
                    {/* ========================================================= */}
                    <section className="relative -mt-44 flex w-full shrink-0 flex-col items-center justify-center bg-[#fbf9f4] px-4 pt-0 pb-2 select-none sm:-mt-52 sm:px-6">
                        <div className="canvas-container flex flex-col items-center justify-center">
                            <div
                                className="relative flex aspect-square w-full max-w-[420px] items-center justify-center"
                                data-reveal="scale"
                                data-reveal-delay="100"
                            >
                                {/* Sobre abierto con solapa monograma */}
                                <img
                                    src="/images/canva_assets/sobre.webp"
                                    alt="Sobre de regalos"
                                    loading="lazy"
                                    decoding="async"
                                    className="envelope-shadow pointer-events-none h-full w-full object-contain select-none"
                                />

                                {/* Monograma en la solapa superior (AJ escalonado con sutil palpitación) */}
                                <div className="animate-pulse-subtle pointer-events-none absolute top-[15%] left-1/2 mt-2 mr-6 flex -translate-x-1/2 items-center font-script leading-none whitespace-nowrap text-[#f7f4ea] opacity-95 drop-shadow-sm select-none">
                                    <span className="translate-x-[4px] -translate-y-[8px] text-[32px] sm:-translate-y-[9px] sm:text-[34px]">
                                        A
                                    </span>
                                    <span className="-translate-x-[12px] translate-y-[10px] text-[28px] sm:translate-y-[11px] sm:text-[30px]">
                                        J
                                    </span>
                                </div>

                                {/* Mensaje dentro de la tarjeta blanca del sobre */}
                                <div
                                    className="pointer-events-none absolute top-[39.5%] left-1/2 w-[64%] -translate-x-1/2 -translate-y-3 text-center select-none sm:w-[58%]"
                                    data-reveal="fade"
                                    data-reveal-delay="250"
                                >
                                    <p className="font-serif text-[8px] leading-[1.38] font-semibold tracking-[0.08em] text-[#556268] uppercase min-[360px]:text-[8.5px] sm:text-[10px]">
                                        <span className="block whitespace-nowrap">
                                            Tu presencia es nuestro mejor
                                        </span>
                                        <span className="block whitespace-nowrap">
                                            regalo. Si desean tener un
                                        </span>
                                        <span className="block whitespace-nowrap">
                                            detalle con nosotros,
                                        </span>
                                        <span className="block whitespace-nowrap">
                                            contaremos con mesa de regalos
                                        </span>
                                        <span className="block whitespace-nowrap">
                                            y lluvia de sobres.
                                        </span>
                                    </p>
                                </div>

                                {/* Sello de cera en el cierre del sobre verde */}
                                <div
                                    className="pointer-events-none absolute top-[55%] left-1/2 z-20 h-[88px] w-[88px] -translate-x-1/2 drop-shadow-[0_6px_14px_rgba(0,0,0,0.28)] select-none sm:h-[110px] sm:w-[110px]"
                                    data-reveal="scale"
                                    data-reveal-delay="300"
                                >
                                    <img
                                        src="/images/canva_assets/sello_sobre.webp"
                                        alt="Sello del sobre"
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* ========================================================= */}
                    {/* SECCIÓN 7: CÓDIGO DE VESTIMENTA / DRESSCODE               */}
                    {/* (Foto novios con degradados, nombres, título e iconos)     */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex min-h-0 w-full shrink-0 flex-col items-center justify-center overflow-hidden bg-[#fbf9f4] px-0 pt-8 pb-0 select-none sm:pt-12">
                        {/* Foto de los novios a ancho completo de pantalla */}
                        <div
                            className="relative flex w-full flex-col items-center overflow-hidden"
                            data-reveal="fade"
                        >
                            <img
                                src="/images/canva_assets/asset_16_31fee922.jpeg"
                                alt="Adriana & Joaquín"
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none block h-auto w-full select-none"
                            />

                            {/* Degradado superior y Nombres de los novios */}
                            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-44 flex-col items-center justify-start bg-gradient-to-b from-[#fbf9f4] via-[#fbf9f4]/80 to-transparent pt-5 select-none sm:h-52 sm:pt-7">
                                <h2
                                    className="flex flex-col items-center px-4 pt-3 pb-2 text-center font-script text-[2.8rem] leading-[1.15] font-normal text-[#788e80] [text-shadow:0_1px_2px_rgba(0,0,0,0.06)] sm:text-[3.4rem]"
                                    data-reveal="down"
                                    data-reveal-delay="150"
                                >
                                    <span className="block px-2 pt-1">
                                        Adriana &amp;
                                    </span>
                                    <span className="-mt-3 block px-2 pb-1 sm:-mt-3.5">
                                        Joaquín
                                    </span>
                                </h2>
                            </div>

                            {/* Degradado inferior difuminando hacia el fondo */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-36 bg-gradient-to-t from-[#fbf9f4] via-[#fbf9f4]/85 to-transparent sm:h-44" />
                        </div>

                        {/* Bloque de Dresscode, Iconos y Paletas de Color */}
                        <div className="canvas-container relative z-10 -mt-16 flex w-full flex-col items-center px-4 pb-14 sm:-mt-20 sm:pb-20">
                            {/* Título: Dresscode */}
                            <h3
                                className="-mt-3 mb-3 px-4 pt-3 pb-2 text-center font-script text-[3.0rem] leading-[1.2] font-normal tracking-normal text-[#556c7d] [text-shadow:0_1px_2px_rgba(0,0,0,0.06)] sm:mb-4 sm:text-[3.6rem]"
                                data-reveal="down"
                            >
                                Dresscode
                            </h3>

                            {/* Columnas de Guayabera y Vestido */}
                            <div
                                className="mb-8 grid w-full max-w-[340px] grid-cols-2 gap-6 sm:mb-9 sm:max-w-[360px] sm:gap-8"
                                data-reveal="up"
                                data-reveal-delay="100"
                            >
                                {/* 17.svg: Guayabera */}
                                <div className="group flex items-center justify-center gap-2.5 transition-transform duration-300 hover:scale-105 sm:gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
                                        <img
                                            src="/resources_canvas/images/17.svg"
                                            alt="Guayabera"
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                    <div className="text-left font-serif text-[9.5px] leading-[1.3] font-semibold tracking-[0.1em] text-[#556c7d] uppercase sm:text-[11px]">
                                        GUAYABERA
                                        <br />
                                        (MANGA LARGA
                                        <br />
                                        O CORTA)
                                    </div>
                                </div>

                                {/* 18.svg: Vestido de cóctel */}
                                <div className="group flex items-center justify-center gap-2.5 transition-transform duration-300 hover:scale-105 sm:gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center transition-transform group-hover:scale-110 sm:h-12 sm:w-12">
                                        <img
                                            src="/resources_canvas/images/18.svg"
                                            alt="Vestido de cóctel"
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                    <div className="text-left font-serif text-[9.5px] leading-[1.3] font-semibold tracking-[0.1em] text-[#556c7d] uppercase sm:text-[11px]">
                                        VESTIDO
                                        <br />
                                        DE COCTEL
                                    </div>
                                </div>
                            </div>

                            {/* COLORES A EVITAR */}
                            <h4
                                className="mb-3 text-center font-serif text-[11px] font-semibold tracking-[0.2em] text-[#556c7d] uppercase sm:text-[12.5px]"
                                data-reveal="up"
                                data-reveal-delay="200"
                            >
                                COLORES A EVITAR
                            </h4>

                            {/* 6 Círculos de color con micro-interacción hover */}
                            <div
                                className="mb-6 flex items-center justify-center gap-2.5 sm:mb-7 sm:gap-3"
                                data-reveal="scale"
                                data-reveal-delay="250"
                            >
                                <div
                                    className="h-7 w-7 cursor-pointer rounded-full border border-[#d6cfc2] bg-[#ffffff] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg sm:h-8 sm:w-8"
                                    title="Blanco"
                                />
                                <div
                                    className="h-7 w-7 cursor-pointer rounded-full border border-[#d6cfc2] bg-[#f4f1ec] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg sm:h-8 sm:w-8"
                                    title="Blanco hueso"
                                />
                                <div
                                    className="h-7 w-7 cursor-pointer rounded-full border border-[#d6cfc2] bg-[#fff7ed] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg sm:h-8 sm:w-8"
                                    title="Marfil"
                                />
                                <div
                                    className="h-7 w-7 cursor-pointer rounded-full border border-[#9eb39a] bg-[#b0c5ac] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg sm:h-8 sm:w-8"
                                    title="Verde sage claro"
                                />
                                <div
                                    className="h-7 w-7 cursor-pointer rounded-full border border-[#8a9887] bg-[#9ba998] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg sm:h-8 sm:w-8"
                                    title="Verde sage medio"
                                />
                                <div
                                    className="h-7 w-7 cursor-pointer rounded-full border border-[#616e5d] bg-[#727f6e] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg sm:h-8 sm:w-8"
                                    title="Verde olivo oscuro"
                                />
                                <div
                                    className="h-7 w-7 cursor-pointer rounded-full border border-[#8f0c0c] bg-[#a90f0f] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg sm:h-9 sm:w-9"
                                    title="Rojo intenso"
                                />
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 8: CELEBRACIÓN PARA HUMANOS GRANDES (SOLO ADULTOS) */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex min-h-0 w-full shrink-0 flex-col items-center justify-start overflow-hidden bg-[#8e9fae] px-0 pt-10 pb-0 select-none sm:pt-14">
                        {/* Fondo con textura/patrón de huellitas y huesitos */}
                        <div
                            className="pointer-events-none absolute inset-0 z-0 bg-repeat opacity-20 mix-blend-screen"
                            style={{
                                backgroundImage:
                                    "url('/images/canva_assets/asset_3_429a9a59.png')",
                                backgroundSize: '280px 280px',
                            }}
                        />

                        {/* Contenido superior: Icono, Título y Mensaje */}
                        <div
                            className="canvas-container relative z-10 flex flex-col items-center"
                            data-reveal="up"
                        >
                            {/* Icono: Corazón con huella de perrito (26.svg) con suave palpitación */}
                            <div className="animate-pulse-subtle mb-4 flex h-12 w-12 items-center justify-center sm:mb-5 sm:h-14 sm:w-14">
                                <img
                                    src="/resources_canvas/images/26.svg"
                                    alt="Corazón con huella"
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-contain drop-shadow-sm"
                                />
                            </div>

                            {/* Título: UNA CELEBRACIÓN PARA HUMANOS GRANDES */}
                            <h3 className="mb-3 text-center font-serif text-[12.5px] leading-[1.35] font-semibold tracking-[0.2em] text-white/95 uppercase drop-shadow-sm sm:mb-4 sm:text-[14.5px]">
                                UNA CELEBRACIÓN PARA
                                <br />
                                HUMANOS GRANDES
                            </h3>

                            {/* Mensaje en Cormorant Garamond */}
                            <p
                                className="mb-2 max-w-[360px] px-2 text-center text-[14.5px] leading-[1.35] font-normal text-white/95 drop-shadow-sm sm:mb-3 sm:text-[16px]"
                                style={{
                                    fontFamily:
                                        "'Cormorant Garamond', Georgia, serif",
                                }}
                            >
                                Con cariño, les pedimos que esta ocasión
                                <br />
                                sea disfrutada únicamente por adultos.
                            </p>
                        </div>

                        {/* Imagen de los novios con su perrito a ancho completo de pantalla */}
                        <div
                            className="relative z-10 flex w-full flex-col items-center overflow-hidden"
                            data-reveal="up"
                            data-reveal-delay="200"
                        >
                            <img
                                src="/images/canva_assets/novios_perrito.webp"
                                alt="Adriana, Joaquín y su perrito"
                                width={1080}
                                height={1350}
                                loading="eager"
                                decoding="async"
                                style={{ aspectRatio: '1080 / 1350' }}
                                className="pointer-events-none -mt-4 -mb-1 block h-auto w-full object-cover select-none sm:-mt-6"
                            />

                            {/* Degradado inferior suave hacia el siguiente fondo (#fbf9f4) */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-[#fbf9f4] via-[#fbf9f4]/80 to-transparent sm:h-36" />
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 9: HOSPEDAJE (Hoteles recomendados con carrusel)  */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex w-full flex-col items-center justify-start overflow-hidden bg-[#fbf9f4] px-0 pt-10 pb-12 select-none sm:pt-14 sm:pb-14">
                        <div className="canvas-container flex flex-col items-center">
                            {/* Título: Hospedaje */}
                            <h2
                                className="-mt-3 mb-1 px-4 pt-3 pb-2 text-center font-script text-[3rem] leading-[1.2] tracking-normal text-[#788e80] sm:text-[3.6rem]"
                                data-reveal="down"
                            >
                                Hospedaje
                            </h2>

                            {/* Subtítulo */}
                            <p
                                className="mb-4 max-w-[320px] px-4 text-center font-serif text-[9.5px] leading-relaxed font-medium tracking-[0.22em] text-[#788a80] uppercase sm:mb-6 sm:max-w-[390px] sm:text-[11px]"
                                data-reveal="down"
                                data-reveal-delay="100"
                            >
                                ESTAREMOS ENCANTADOS QUE NOS ACOMPAÑES Y
                                DISFRUTES TODA LA EXPERIENCIA
                            </p>

                            {/* Disclaimer de descuento en hoteles */}
                            <p
                                className="mb-5 max-w-[300px] rounded-xl border border-[#788a80]/40 bg-white/70 px-4 py-2 text-center font-serif text-[10.5px] leading-relaxed text-[#476070] italic sm:mb-6 sm:max-w-[380px] sm:text-[12px]"
                                data-reveal="down"
                                data-reveal-delay="150"
                            >
                                Menciona{' '}
                                <strong className="font-semibold not-italic">
                                    &ldquo;Reserva para la boda de {brideName} y{' '}
                                    {groomName}&rdquo;
                                </strong>{' '}
                                para recibir un descuento o precio preferencial
                                en los hoteles.
                            </p>

                            {/* Carrusel fluido y accesible de hoteles */}
                            <div
                                className="w-full"
                                data-reveal="up"
                                data-reveal-delay="200"
                            >
                                <HotelCarousel hotels={hotelList} />
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 10: CONFIRMACIÓN DE ASISTENCIA ("¿Nos acompañas?") */}
                    {/* ========================================================= */}
                    <section className="relative -mt-[1px] flex w-full flex-col items-center justify-start overflow-hidden bg-[#fbf9f4] px-4 pt-6 pb-14 select-none sm:pt-8 sm:pb-16">
                        <div className="canvas-container flex flex-col items-center">
                            {/* Título en letra cursiva */}
                            <h2
                                className="-mt-3 mb-0.5 px-4 pt-3 pb-2 text-center font-script text-[3.2rem] leading-[1.2] text-[#788e80] sm:text-[3.9rem]"
                                data-reveal="down"
                            >
                                ¿Nos acompañas?
                            </h2>

                            {/* Subtítulo */}
                            <p
                                className="mb-6 px-2 text-center font-serif text-[9.5px] font-medium tracking-[0.24em] text-[#788a80] uppercase sm:mb-8 sm:text-[11px]"
                                data-reveal="down"
                                data-reveal-delay="100"
                            >
                                QUEREMOS CONTAR CONTIGO EN ESTE DÍA TAN ESPECIAL
                            </p>

                            {/* Tarjeta del formulario con borde suave azul/gris */}
                            <div
                                className="w-full max-w-[420px] rounded-2xl border border-[#b8c9d9] bg-white p-5 shadow-sm sm:p-7"
                                data-reveal="up"
                                data-reveal-delay="200"
                            >
                                {rsvpSubmitted ? (
                                    <div className="animate-fadeIn flex flex-col items-center py-4 text-center">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4f0] text-2xl text-[#788e80] shadow-xs">
                                            ✓
                                        </div>
                                        <h4 className="mb-2 font-script text-3xl text-[#788e80] md:text-4xl">
                                            ¡Muchas Gracias,{' '}
                                            {rsvpName || invitation?.name}!
                                        </h4>
                                        <p className="mb-3 font-serif text-[12px] leading-relaxed tracking-wide text-stone-600 sm:text-[13px] md:text-[14px]">
                                            {confirmedGuests.length > 0
                                                ? '¡Nos emociona muchísimo contar con tu presencia en nuestro gran día!'
                                                : 'Lamentamos que no puedas acompañarnos físicamente, ¡te llevaremos en el corazón!'}
                                        </p>
                                        {rsvpMessage && (
                                            <p className="mb-4 max-w-[340px] rounded-xl border border-stone-200/60 bg-[#fbf9f4] p-3.5 text-[12px] text-stone-500 italic md:p-4 md:text-[13px]">
                                                "{rsvpMessage}"
                                            </p>
                                        )}

                                        {/* ========================================================= */}
                                        {/* PASES DE ACCESO INDIVIDUALES PARA CONFIRMADOS             */}
                                        {/* ========================================================= */}
                                        {confirmedGuests.length > 0 && (
                                            <div className="mt-4 w-full space-y-4 border-t border-[#ded8cd] pt-5">
                                                <div className="px-1 text-center">
                                                    <span className="mb-1 block font-serif text-[10px] font-bold tracking-[0.25em] text-[#698175] uppercase">
                                                        {confirmedGuests.length ===
                                                        1
                                                            ? 'Tu Pase de Acceso Oficial'
                                                            : `Pases Oficiales de Acceso (${confirmedGuests.length})`}
                                                    </span>
                                                    <p className="font-serif text-[11px] leading-snug text-stone-500">
                                                        Presenta tu código QR al
                                                        llegar a la recepción.
                                                        Cada pase es personal y
                                                        no requiere esperas.
                                                    </p>
                                                </div>

                                                <div className="space-y-6 pt-1">
                                                    {confirmedGuests.map(
                                                        (cg) => (
                                                            <DigitalPassCard
                                                                key={
                                                                    cg.id ||
                                                                    cg.checkin_code
                                                                }
                                                                guest={{
                                                                    id: cg.id,
                                                                    full_name:
                                                                        cg.full_name,
                                                                    checkin_code:
                                                                        cg.checkin_code ||
                                                                        'AJ-ACCESO',
                                                                    table_name:
                                                                        cg.table_name,
                                                                    type: cg.type,
                                                                    allergies:
                                                                        cg.allergies,
                                                                    special_notes:
                                                                        cg.special_notes,
                                                                }}
                                                                weddingName={`${brideName} & ${groomName}`}
                                                                weddingDate={
                                                                    dateText
                                                                }
                                                                receptionLocation={
                                                                    wedding
                                                                        ?.locations
                                                                        ?.reception ||
                                                                    'Hacienda San Diego Cutz'
                                                                }
                                                                invitationName={
                                                                    invitation?.name
                                                                }
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 w-full border-t border-stone-100 pt-3 text-center">
                                            {rsvpClosed ? (
                                                <p className="font-serif text-[11px] text-stone-400 italic">
                                                    Las confirmaciones cerraron
                                                    {rsvpDeadlineText
                                                        ? ` el ${rsvpDeadlineText}`
                                                        : ''}
                                                    . Para cualquier cambio,
                                                    contacta a los novios.
                                                </p>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRsvpSubmitted(false)
                                                    }
                                                    className="cursor-pointer font-serif text-[11px] tracking-wider text-[#788a80] uppercase underline hover:text-[#556c7d]"
                                                >
                                                    Modificar respuesta
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : !invitation ? (
                                    /* Si se visita la página general sin token de invitación privada */
                                    <div className="animate-fadeIn flex flex-col items-center space-y-4 px-2 py-5 text-center">
                                        {/* Monograma de Gala */}
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d4af37]/50 bg-gradient-to-br from-[#28362e] via-[#33443a] to-[#28362e] font-serif text-lg font-bold text-[#f4ecd8] shadow-lg">
                                            A&amp;J
                                        </div>

                                        <div>
                                            <span className="mb-1 block font-sans text-[10px] font-bold tracking-[0.25em] text-[#698175] uppercase sm:text-[10.5px]">
                                                CONFIRMACIÓN PRIVADA
                                            </span>
                                            <h3 className="font-sans text-lg leading-tight font-bold text-stone-900 sm:text-xl">
                                                Invitación Personal Requerida
                                            </h3>
                                        </div>

                                        <div className="my-1 h-px w-full bg-gradient-to-r from-transparent via-[#ded8cd] to-transparent" />

                                        <p className="max-w-[320px] font-sans text-[12.5px] leading-relaxed text-stone-600">
                                            Para confirmar tu asistencia y
                                            obtener tus{' '}
                                            <strong className="font-semibold text-stone-800">
                                                pases de acceso oficiales
                                            </strong>
                                            , por favor ingresa únicamente a
                                            través del{' '}
                                            <strong className="font-semibold text-stone-800">
                                                enlace personalizado
                                            </strong>{' '}
                                            que te compartieron directamente{' '}
                                            <strong className="font-semibold text-[#28362e]">
                                                {brideName} &amp; {groomName}
                                            </strong>
                                            .
                                        </p>

                                        {/* Tarjeta explicativa con icono */}
                                        <div className="w-full rounded-2xl border border-[#d2dfd7] bg-[#f7faf8] p-3.5 font-sans text-xs leading-relaxed text-stone-600 shadow-2xs">
                                            <div className="mb-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#28362e]">
                                                <Ticket className="h-4 w-4 text-[#698175]" />
                                                <span>
                                                    Pases de Acceso Exclusivos
                                                </span>
                                            </div>
                                            Cada invitación cuenta con boletos y
                                            códigos QR individuales asignados a
                                            los integrantes de tu familia o
                                            pase.
                                        </div>

                                        <p className="max-w-[280px] font-sans text-[11px] text-stone-400 italic">
                                            ¿No encuentras tu enlace privado?
                                            Comunícate con los novios para
                                            compartirte tu pase personalizado.
                                        </p>
                                    </div>
                                ) : rsvpClosed ? (
                                    /* La fecha límite para confirmar ya pasó */
                                    <div className="animate-fadeIn flex flex-col items-center space-y-3 px-2 py-5 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e2d6bd] bg-[#f3efe6] text-xl text-[#a08a5c] shadow-xs">
                                            ⏳
                                        </div>
                                        <span className="font-serif text-[10px] font-bold tracking-[0.25em] text-[#698175] uppercase">
                                            Confirmaciones cerradas
                                        </span>
                                        <h3 className="font-serif text-base font-bold text-stone-800">
                                            {invitation.name}
                                        </h3>
                                        <p className="max-w-[300px] font-serif text-[12.5px] leading-relaxed text-stone-600">
                                            La fecha límite para confirmar{' '}
                                            {rsvpDeadlineText ? (
                                                <>
                                                    fue el{' '}
                                                    <strong className="text-[#28362e]">
                                                        {rsvpDeadlineText}
                                                    </strong>
                                                </>
                                            ) : (
                                                'ya pasó'
                                            )}
                                            . Si necesitas hacer algún cambio,
                                            comunícate directamente con{' '}
                                            <strong className="text-[#28362e]">
                                                {brideName} &amp; {groomName}
                                            </strong>
                                            .
                                        </p>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleRsvpSubmit}
                                        className="flex flex-col space-y-4 sm:space-y-5"
                                    >
                                        {/* Encabezado de la invitación personalizada */}
                                        <div className="rounded-xl border border-[#d2dfd7] bg-[#f0f4f2] p-3 text-center">
                                            <span className="mb-0.5 block font-serif text-[10px] font-semibold tracking-[0.2em] text-[#698175] uppercase">
                                                {invitation.guests &&
                                                invitation.guests.length > 1
                                                    ? 'Invitación Familiar'
                                                    : 'Invitación Personal'}
                                            </span>
                                            <h3 className="font-serif text-sm font-bold text-stone-800">
                                                {invitation.name}
                                            </h3>
                                            <p className="mt-0.5 font-serif text-[11px] text-stone-600">
                                                Hemos reservado{' '}
                                                <strong className="text-[#556c7d]">
                                                    {invitation.guests
                                                        ?.length || 1}{' '}
                                                    {invitation.guests
                                                        ?.length === 1
                                                        ? 'pase'
                                                        : 'pases'}
                                                </strong>{' '}
                                                en su honor
                                            </p>
                                            {rsvpDeadlineText && (
                                                <p className="mt-1.5 font-serif text-[10.5px] tracking-wide text-[#a08a5c]">
                                                    Por favor confirma antes del{' '}
                                                    <strong className="font-semibold">
                                                        {rsvpDeadlineText}
                                                    </strong>
                                                </p>
                                            )}
                                        </div>

                                        {/* Si hay múltiples integrantes asignados a la invitación */}
                                        {invitation?.guests &&
                                        invitation.guests.length > 1 ? (
                                            <div className="space-y-2">
                                                <label className="mb-1 block font-serif text-[11px] font-semibold tracking-[0.12em] text-[#556c7d] uppercase sm:text-[11.5px]">
                                                    Confirma la asistencia de
                                                    cada persona:
                                                </label>
                                                <div className="space-y-2.5">
                                                    {invitation.guests.map(
                                                        (guest) => {
                                                            const isAtt =
                                                                guestAttendingMap[
                                                                    guest.id
                                                                ];
                                                            return (
                                                                <div
                                                                    key={
                                                                        guest.id
                                                                    }
                                                                    className="flex items-center justify-between rounded-xl border border-[#b8c9d9] bg-[#fafbfc] p-2.5"
                                                                >
                                                                    <div className="pr-2">
                                                                        <p className="text-[12.5px] leading-tight font-medium text-stone-800">
                                                                            {
                                                                                guest.full_name
                                                                            }
                                                                        </p>
                                                                        <span className="text-[9.5px] text-stone-400">
                                                                            {guest.type ===
                                                                            'child'
                                                                                ? 'Niño/a'
                                                                                : 'Adulto'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex shrink-0 gap-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setGuestAttendingMap(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [guest.id]: true,
                                                                                    }),
                                                                                )
                                                                            }
                                                                            className={`cursor-pointer rounded-full px-3 py-1.5 font-serif text-[11px] transition-all ${
                                                                                isAtt ===
                                                                                true
                                                                                    ? 'bg-[#698175] font-semibold text-white shadow-xs'
                                                                                    : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                                                                            }`}
                                                                        >
                                                                            ✓ Sí
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setGuestAttendingMap(
                                                                                    (
                                                                                        prev,
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [guest.id]: false,
                                                                                    }),
                                                                                )
                                                                            }
                                                                            className={`cursor-pointer rounded-full px-3 py-1.5 font-serif text-[11px] transition-all ${
                                                                                isAtt ===
                                                                                false
                                                                                    ? 'bg-rose-600 font-semibold text-white shadow-xs'
                                                                                    : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                                                                            }`}
                                                                        >
                                                                            ✗ No
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Campo: ¿Confirmas tu asistencia a nuestra boda? */
                                            <div>
                                                <label className="mb-2 block font-serif text-[11px] leading-snug font-semibold tracking-[0.12em] text-[#556c7d] uppercase sm:text-[11.5px]">
                                                    ¿Confirmas tu asistencia a
                                                    nuestra boda?
                                                </label>
                                                <div className="space-y-2">
                                                    {/* Opción 1: Acepto con mucho gusto */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRsvpAttending(
                                                                'yes',
                                                            )
                                                        }
                                                        className={`flex w-full cursor-pointer items-center rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 ${
                                                            rsvpAttending ===
                                                            'yes'
                                                                ? 'border-[#6f879a] bg-[#edf3f7] text-[#3c5061] shadow-xs'
                                                                : 'border-[#b8c9d9] bg-[#fafbfc] text-stone-600 hover:bg-stone-50'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                                rsvpAttending ===
                                                                'yes'
                                                                    ? 'border-[#6f879a] bg-[#6f879a]'
                                                                    : 'border-[#94a3b8] bg-white'
                                                            }`}
                                                        >
                                                            {rsvpAttending ===
                                                                'yes' && (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            )}
                                                        </span>
                                                        <span className="text-[12.5px] font-medium tracking-wide sm:text-[13px]">
                                                            Acepto con mucho
                                                            gusto
                                                        </span>
                                                    </button>

                                                    {/* Opción 2: Lamentablemente no puedo asistir */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRsvpAttending(
                                                                'no',
                                                            )
                                                        }
                                                        className={`flex w-full cursor-pointer items-center rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 ${
                                                            rsvpAttending ===
                                                            'no'
                                                                ? 'border-[#6f879a] bg-[#edf3f7] text-[#3c5061] shadow-xs'
                                                                : 'border-[#b8c9d9] bg-[#fafbfc] text-stone-600 hover:bg-stone-50'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                                rsvpAttending ===
                                                                'no'
                                                                    ? 'border-[#6f879a] bg-[#6f879a]'
                                                                    : 'border-[#94a3b8] bg-white'
                                                            }`}
                                                        >
                                                            {rsvpAttending ===
                                                                'no' && (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                            )}
                                                        </span>
                                                        <span className="text-[12.5px] font-medium tracking-wide sm:text-[13px]">
                                                            Lamentablemente no
                                                            puedo asistir
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Campo: Escribe una dedicatoria a los novios */}
                                        <div>
                                            <label className="mb-1.5 block font-serif text-[11px] font-semibold tracking-[0.12em] text-[#556c7d] uppercase sm:text-[11.5px]">
                                                Escribe una dedicatoria a los
                                                novios
                                            </label>
                                            <textarea
                                                value={rsvpMessage}
                                                onChange={(e) =>
                                                    setRsvpMessage(
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                placeholder="Déjanos unas palabras de cariño..."
                                                className="w-full resize-none rounded-xl border border-[#b8c9d9] bg-[#fafbfc] px-3.5 py-2.5 text-[13px] text-stone-700 transition-all placeholder:text-stone-400 focus:border-[#788a80] focus:ring-1 focus:ring-[#788a80] focus:outline-none"
                                            />
                                        </div>

                                        {/* Mensaje de error si falta llenar algo */}
                                        {rsvpError && (
                                            <p className="text-center font-serif text-[11.5px] tracking-wide text-rose-500">
                                                {rsvpError}
                                            </p>
                                        )}

                                        {/* Botón Submit: Confirmar asistencia */}
                                        <button
                                            type="submit"
                                            disabled={rsvpSubmitting}
                                            className="hover-lift mt-2 w-full cursor-pointer rounded-full bg-[#6f879a] px-6 py-3 font-serif text-[12px] font-medium tracking-[0.18em] text-white uppercase shadow transition-all duration-300 hover:bg-[#5c7385] active:scale-95 disabled:opacity-60 sm:text-[13px]"
                                        >
                                            {rsvpSubmitting
                                                ? 'Guardando confirmación...'
                                                : 'Confirmar asistencia'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* FOOTER: BANNER DE CIERRE CON HOJAS DE EUCALIPTO            */}
                    {/* ========================================================= */}
                    <footer className="relative -mt-[1px] flex w-full flex-col items-center justify-center overflow-hidden bg-[#fbf9f4] px-4 pt-10 pb-16 select-none sm:pt-14 sm:pb-20">
                        <div
                            className="canvas-container relative z-10 flex flex-col items-center justify-center pb-2 text-center"
                            data-reveal="up"
                        >
                            {/* "NUESTRA BODA" */}
                            <span className="mb-1 text-center font-serif text-[10.5px] font-medium tracking-[0.32em] text-[#788a80] uppercase drop-shadow-xs sm:text-[12px]">
                                NUESTRA BODA
                            </span>

                            {/* Nombres en cursiva centrados: Adriana & Joaquín */}
                            <h2 className="-my-1 flex flex-wrap items-center justify-center gap-2 px-3 py-2 text-center font-script text-[3.2rem] leading-[1.2] tracking-normal text-[#788e80] [text-shadow:0_1px_2px_rgba(0,0,0,0.05)] sm:text-[4.2rem]">
                                <span className="px-1">{brideName}</span>
                                <span className="-translate-y-0.5 font-serif text-[18px] font-light text-[#788e80] sm:text-[22px]">
                                    &amp;
                                </span>
                                <span className="px-1">{groomName}</span>
                            </h2>

                            {/* Fecha más grande y dinámica: 20 | FEB | 2027 */}
                            <span className="mt-1.5 mb-2 text-center font-serif text-[13.5px] font-medium tracking-[0.28em] text-[#788a80] uppercase sm:text-[16px]">
                                {footerDateText}
                            </span>
                        </div>

                        {/* Hojas de eucalipto en la esquina inferior derecha con suave flotación */}
                        <img
                            src="/images/canva_assets/eucalipto_footer.webp"
                            alt="Hojas de eucalipto"
                            loading="lazy"
                            decoding="async"
                            className="animate-float-slow pointer-events-none absolute right-0 bottom-0 z-0 h-auto w-36 object-contain opacity-90 select-none min-[400px]:w-44 sm:w-56 md:w-64"
                            data-reveal="fade"
                            data-reveal-delay="200"
                        />
                    </footer>

                    {/* Audio element y Botón flotante de control musical */}
                    {wedding?.music_url && (
                        <>
                            <audio
                                ref={audioRef}
                                src={wedding.music_url}
                                loop
                                preload="metadata"
                                playsInline
                            />
                            <aside className="pointer-events-auto fixed right-5 bottom-5 z-50 select-none">
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className={`flex cursor-pointer items-center gap-2.5 rounded-full border px-3.5 py-2 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
                                        isPlaying
                                            ? 'animate-glow-breathe border-[#cfbe95]/60 bg-[#2c4537]/90 text-[#fcf8ed] hover:bg-[#2c4537]'
                                            : 'animate-pulse border-[#ded8cd] bg-white/95 text-stone-700 hover:border-[#cfbe95]'
                                    }`}
                                    title={
                                        isPlaying
                                            ? 'Pausar música'
                                            : 'Reproducir nuestra canción'
                                    }
                                >
                                    <div
                                        className={`flex h-6 w-6 items-center justify-center rounded-full ${isPlaying ? 'animate-spin bg-[#cfbe95] text-[#2c4537]' : 'bg-stone-200 text-stone-600'}`}
                                        style={{ animationDuration: '4s' }}
                                    >
                                        <span className="text-xs">🎵</span>
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-sans text-[9.5px] leading-none font-bold tracking-wider text-[#cfbe95] uppercase">
                                            {isPlaying ? 'Sonando' : 'Música'}
                                        </span>
                                        <span className="max-w-[110px] truncate font-sans text-[11px] leading-tight font-medium">
                                            {songTitle}
                                        </span>
                                    </div>
                                    <span className="font-mono text-xs opacity-75">
                                        {isPlaying ? '⏸' : '▶'}
                                    </span>
                                </button>
                            </aside>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
