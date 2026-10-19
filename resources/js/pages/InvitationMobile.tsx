import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import { Ticket } from 'lucide-react';
import HotelCarousel from '../components/HotelCarousel';
import MobileGalleryCarousel from '../components/MobileGalleryCarousel';
import DigitalPassCard, { GuestPassData } from '../components/DigitalPassCard';

interface GalleryImageItem {
    id: number;
    image_path: string;
    order?: number;
    is_active?: boolean;
}

interface HotelItem {
    id?: number;
    name: string;
    location?: string;
    description?: string;
    url?: string | null;
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
        timeline?: Array<{ time: string; title: string; description?: string; icon_url?: string }>;
        timeline_list?: Array<{ time: string; title: string; description?: string; icon_url?: string }>;
    };
    invitation?: InvitationData | null;
}

export default function InvitationMobile({ wedding, invitation }: WeddingProps) {
    const brideName = wedding?.bride_name || 'Adriana';
    const groomName = wedding?.groom_name || 'Joaquín';
    const dateText = wedding?.wedding_date
        ? new Date(wedding.wedding_date)
            .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
            .toUpperCase()
            .replace(/ DE /g, ' ')
        : '20 FEBRERO 2027';

    // Fecha dinámica para el footer en formato: 20 | FEB | 2027
    const footerDateText = useMemo(() => {
        if (!wedding?.wedding_date) return '20 | FEB | 2027';
        try {
            const d = new Date(wedding.wedding_date);
            if (isNaN(d.getTime())) return '20 | FEB | 2027';
            const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
            const day = d.getUTCDate();
            const month = months[d.getUTCMonth()] || 'FEB';
            const year = d.getUTCFullYear();
            return `${day} | ${month} | ${year}`;
        } catch {
            return '20 | FEB | 2027';
        }
    }, [wedding?.wedding_date]);

    const songTitle = wedding?.song_title || 'RESTO DE MI VIDA';

    // Mesas de regalos configurables dinámicamente desde el panel
    const giftRegistries = useMemo(() => {
        if (wedding?.gift_registries_list && wedding.gift_registries_list.length > 0) {
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
                { name: 'LIVERPOOL', url: 'https://mesaderegalos.liverpool.com.mx' },
                { name: 'AMAZON', url: 'https://www.amazon.com.mx' }
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
            { time: '15:00', title: 'MISA', description: '', icon_url: '/resources_canvas/images/5.svg' },
            { time: '16:30', title: 'ROMPEHIELOS', description: '', icon_url: '/resources_canvas/images/6.svg' },
            { time: '17:30', title: 'BRINDIS', description: '', icon_url: '/resources_canvas/images/7.svg' },
            { time: '18:30', title: 'CENA', description: '', icon_url: '/resources_canvas/images/8.svg' },
            { time: '20:00', title: 'FIESTA', description: '', icon_url: '/resources_canvas/images/9.svg' },
            { time: '02:00', title: 'CLAUSURA', description: '', icon_url: '/resources_canvas/images/10.svg' },
        ];
    }, [wedding?.timeline, wedding?.timeline_list]);

    // Nombres de los padres y padrinos
    const brideParents = wedding?.bride_parents && wedding.bride_parents.length > 0
        ? wedding.bride_parents
        : ['MARÍA ERMITA SALAZAR PERERA', 'WILBERTH ALFREDO GUILLERMO AKÉ', 'CARLOS MANUEL HERNÁNDEZ GUILLERMO'];

    const groomParents = wedding?.groom_parents && wedding.groom_parents.length > 0
        ? wedding.groom_parents
        : ['ANNA MARÍA BETANCOURT SERRANO', 'SATURNINO ROLANDO BAEZA ZETINA'];

    const brideGodparents = wedding?.bride_godparents && wedding.bride_godparents.length > 0
        ? wedding.bride_godparents
        : ['ALFREDO ANTONIO ARCEO CASTILLO'];

    const groomGodparents = wedding?.groom_godparents && wedding.groom_godparents.length > 0
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
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch((err) => {
                console.warn('Audio playback requires interaction:', err);
            });
        }
    };

    // Auto-reproducción al primer toque o interacción del usuario en la pantalla
    useEffect(() => {
        if (!wedding?.music_url) return;

        const startAudioOnInteraction = () => {
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(() => {});
            }
        };

        window.addEventListener('click', startAudioOnInteraction, { once: true });
        window.addEventListener('touchstart', startAudioOnInteraction, { once: true });
        window.addEventListener('scroll', startAudioOnInteraction, { once: true });

        return () => {
            window.removeEventListener('click', startAudioOnInteraction);
            window.removeEventListener('touchstart', startAudioOnInteraction);
            window.removeEventListener('scroll', startAudioOnInteraction);
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
        '/resources_canvas/images/11.svg',
        '/resources_canvas/images/12.svg',
        '/resources_canvas/images/13.svg',
        '/resources_canvas/images/14.svg',
    ];

    const rawGallery = wedding?.gallery_images || wedding?.galleryImages || [];
    const galleryList = rawGallery.length > 0
        ? rawGallery.map((img) => img.image_path)
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
                setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' });
                return;
            }

            const d = Math.floor(difference / (1000 * 60 * 60 * 24));
            const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
        const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
        if (elements.length === 0) return;

        // Revelar inmediatamente los que ya están en el viewport inicial
        const checkImmediate = () => {
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
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
                }
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
    const hotelList = rawHotels.length > 0
        ? rawHotels.map((h) => ({
            name: h.name,
            description: h.location || h.description || '',
            image: h.image_path || h.image || '/images/hotels/hotel_1.jpg',
            url: h.url || (h.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.location)}` : '#'),
        }))
        : defaultHotels;

    // Estado del Formulario de Asistencia (RSVP / ¿Nos acompañas?)
    const [rsvpName, setRsvpName] = useState(invitation?.name || '');

    // Determinar respuesta inicial si ya respondió previamente
    const getInitialAttending = (): 'yes' | 'no' | null => {
        if (!invitation?.guests || invitation.guests.length === 0) return null;
        const allYes = invitation.guests.every(g => g.is_attending === true);
        const allNo = invitation.guests.every(g => g.is_attending === false);
        if (allYes) return 'yes';
        if (allNo) return 'no';
        return null;
    };

    const [rsvpAttending, setRsvpAttending] = useState<'yes' | 'no' | null>(getInitialAttending());

    // Mapa de asistencia individual por invitado
    const [guestAttendingMap, setGuestAttendingMap] = useState<Record<number, boolean>>(() => {
        const map: Record<number, boolean> = {};
        if (invitation?.guests) {
            invitation.guests.forEach(g => {
                if (g.is_attending !== null && g.is_attending !== undefined) {
                    map[g.id] = g.is_attending;
                }
            });
        }
        return map;
    });

    const [guestAllergiesMap, setGuestAllergiesMap] = useState<Record<number, string>>(() => {
        const map: Record<number, string> = {};
        if (invitation?.guests) {
            invitation.guests.forEach(g => {
                map[g.id] = g.allergies || '';
            });
        }
        return map;
    });

    const [rsvpMessage, setRsvpMessage] = useState(invitation?.message_to_couple || '');
    const [rsvpSubmitted, setRsvpSubmitted] = useState(invitation?.status === 'responded');
    const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
    const [rsvpError, setRsvpError] = useState('');

    // Lista de invitados que confirmaron asistencia para generar sus pases
    const confirmedGuests = useMemo(() => {
        if (!invitation?.guests || invitation.guests.length === 0) {
            if (rsvpAttending === 'yes') {
                return [{
                    id: 0,
                    full_name: rsvpName || 'Invitado de Honor',
                    checkin_code: 'AJ-ACCESO',
                    is_attending: true,
                    type: 'adult' as const,
                }];
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

        const hasMultipleGuests = !!(invitation && invitation.guests && invitation.guests.length > 1);

        if (hasMultipleGuests) {
            const hasAnySelection = Object.keys(guestAttendingMap).length > 0;
            if (!hasAnySelection && !rsvpAttending) {
                setRsvpError('Por favor confirma la asistencia de tus invitados');
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
                    guests: invitation.guests?.map(g => ({
                        id: g.id,
                        is_attending: guestAttendingMap[g.id] !== undefined
                            ? guestAttendingMap[g.id]
                            : (rsvpAttending === 'yes'),
                        allergies: guestAllergiesMap[g.id] || null,
                    })),
                    message_to_couple: rsvpMessage,
                }
                : {
                    is_attending: rsvpAttending === 'yes',
                    guests: invitation.guests?.map(g => ({
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
                    setRsvpError(err?.rsvp || 'Ocurrió un error al guardar tu respuesta. Intenta de nuevo.');
                },
                onFinish: () => {
                    setRsvpSubmitting(false);
                }
            });
        } else {
            // Confirmación abierta en la landing (sin token)
            router.post('/public/rsvp/submit', {
                name: rsvpName.trim(),
                is_attending: rsvpAttending === 'yes',
                message: rsvpMessage,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setRsvpSubmitted(true);
                },
                onError: (err: any) => {
                    setRsvpError(err?.name || err?.message || 'Ocurrió un error al guardar tu confirmación.');
                },
                onFinish: () => {
                    setRsvpSubmitting(false);
                }
            });
        }
    };

    return (
        <>
            <Head title={`Boda de ${brideName} & ${groomName}`} />

            {/* Contenedor principal a pantalla completa real (Edge-to-Edge) */}
            <main className="min-h-screen w-full bg-[#fbf9f4] flex flex-col items-center justify-start select-none overflow-x-hidden">
                <div className="relative w-full flex flex-col">
                    {/* ========================================================= */}
                    {/* SECCIÓN 1: HERO NOVIOS (Cubre el 100% de la pantalla)     */}
                    {/* ========================================================= */}
                    <section className="relative w-full invitation-section h-[100svh] min-h-[100svh] sm:h-[890px] sm:min-h-[890px] md:h-screen md:min-h-screen flex flex-col justify-between shrink-0">
                        {/* Imagen de fondo de los novios con mayor zoom y encuadre idéntico al diseño */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <img
                                src="/images/canva_assets/backgroundhero1.jpg"
                                alt={`${brideName} & ${groomName}`}
                                className="w-full h-full object-cover object-[45%_22%] md:object-[50%_25%] scale-[1.08] md:scale-100 transform pointer-events-none translate-y-[3.5%] md:translate-y-0 will-change-transform"
                            />
                            {/* Neblina / degradado superior blanco ultra suave y progresivo */}
                            <div className="absolute top-0 inset-x-0 h-48 md:h-56 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.5)_35%,rgba(255,255,255,0.15)_70%,transparent_100%)] pointer-events-none z-10" />

                            {/* Neblina / degradado inferior difuminado ultra suave hacia el tono crema #fbf9f4 */}
                            <div className="absolute bottom-0 inset-x-0 h-36 sm:h-96 md:h-80 bg-[linear-gradient(to_top,#fbf9f4_0%,#fbf9f4_25%,rgba(251,249,244,0.75)_50%,rgba(251,249,244,0.35)_75%,rgba(251,249,244,0)_100%)] pointer-events-none z-10" />
                        </div>

                        {/* --- PARTE SUPERIOR: FECHA --- */}
                        <header className="relative z-20 pt-16 sm:pt-20 md:pt-24 text-center px-4" data-reveal="down">
                            <p className="font-serif tracking-[0.28em] md:tracking-[0.36em] text-xs sm:text-sm md:text-base text-white font-medium uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                {dateText}
                            </p>
                        </header>

                        {/* --- PARTE CENTRAL: NOMBRES DE LOS NOVIOS --- */}
                        <div className="relative z-20 w-full max-w-[340px] sm:max-w-[380px] md:max-w-[560px] lg:max-w-[660px] mx-auto px-4 my-auto flex flex-col select-none" data-reveal="scale" data-reveal-delay="200">
                            {/* Primera línea: Adriana & */}
                            <div className="flex items-baseline justify-start pl-2 sm:pl-4 md:pl-8">
                                <span className="font-script text-[3rem] sm:text-[3.5rem] md:text-[4.6rem] lg:text-[5.4rem] leading-[0.85] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                                    {brideName}
                                </span>
                                <span className="font-script text-[1.8rem] sm:text-[2.6rem] md:text-[3.2rem] lg:text-[3.8rem] leading-[0.2] ml-2 md:ml-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                                    &amp;
                                </span>
                            </div>

                            {/* Segunda línea: Joaquin */}
                            <div className="flex justify-start pl-12 sm:pl-16 md:pl-28 mt-3 sm:mt-4 md:mt-6 ml-5">
                                <span className="font-script text-[3rem] sm:text-[3.5rem] md:text-[4.6rem] lg:text-[5.4rem] leading-[0.85] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                                    {groomName}
                                </span>
                            </div>
                        </div>

                        {/* Espaciador inferior del Hero con audio tag persistente y señal interactiva de deslizamiento */}
                        <div className="relative z-20 pb-4 md:pb-6 text-center flex flex-col items-center justify-center pointer-events-none" data-reveal="fade" data-reveal-delay="400">
                            <span className="font-serif text-[9px] sm:text-[10px] tracking-[0.28em] text-white/90 uppercase font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] animate-pulse">
                                DESLIZA
                            </span>
                            <svg className="w-3.5 h-3.5 text-white/90 animate-bounce mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            {wedding?.music_url && (
                                <audio ref={audioRef} src={wedding.music_url} loop />
                            )}
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 2: NUESTROS PADRES & NUESTROS PADRINOS            */}
                    {/* (Pantalla completa tipo Canva con zoom en escritorio)     */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-center select-none shrink-0">
                        <div className="canvas-container min-h-[100svh] sm:min-h-[890px] flex flex-col justify-between px-6 pt-3 sm:pt-4 pb-0 select-none shrink-0">
                            {/* Decoración botánica rama derecha con balanceo suave */}
                            <img
                                src="/resources_canvas/images/plantaladoderecho.webp"
                                alt="Decoración botánica"
                                className="absolute -top-12 -right-10 -rotate-12 w-28 sm:w-32 object-contain pointer-events-none select-none z-30 animate-float-slow"
                            />

                            {/* Top: REPRODUCTOR DE MÚSICA */}
                            <div className="relative z-20 flex flex-col pt-1 sm:pt-2 items-center text-center" data-reveal="down">
                                <span className="font-serif text-[10px] sm:text-[11px] tracking-[0.28em] text-[#788a80] uppercase font-medium mb-1 drop-shadow-sm">
                                    {songTitle}
                                </span>

                                {/* Barra de progreso de música interactiva */}
                                <div
                                    onClick={togglePlay}
                                    className="w-56 sm:w-64 py-1 cursor-pointer group flex items-center justify-center"
                                    title={isPlaying ? 'Pausar música' : 'Reproducir música'}
                                >
                                    <div className="w-full h-[2.5px] bg-[#678d91]/50 group-hover:bg-[#678d91]/70 transition-colors rounded-full relative">
                                        <div
                                            className="h-full bg-[#52777c] rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#597e83] border-2 border-white shadow-md group-hover:scale-110 transition-transform"
                                            style={{ left: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Botones de control del reproductor */}
                                <div className="flex items-center justify-center gap-5 mt-1.5 text-[#6f8892]">
                                    {/* Shuffle */}
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors cursor-pointer" title="Aleatorio">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                                        </svg>
                                    </button>
                                    {/* Anterior */}
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors cursor-pointer" title="Anterior">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                                        </svg>
                                    </button>
                                    {/* Play / Pausa circular */}
                                    <button
                                        type="button"
                                        onClick={togglePlay}
                                        className="w-10 h-10 rounded-full bg-[#728c96] hover:bg-[#5f7a84] text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer hover:shadow-lg hover:scale-105"
                                        title={isPlaying ? "Pausar" : "Reproducir"}
                                    >
                                        {isPlaying ? (
                                             <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                 <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                             </svg>
                                         ) : (
                                             <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                                                 <path d="M8 5v14l11-7z" />
                                             </svg>
                                         )}
                                    </button>
                                    {/* Siguiente */}
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors cursor-pointer" title="Siguiente">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                        </svg>
                                    </button>
                                    {/* Repetir */}
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors cursor-pointer" title="Repetir">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Icono de huellitas con corazón con latido suave */}
                                <div className="w-18 h-18 sm:w-16 sm:h-16 mt-6 sm:mt-7 flex items-center justify-center">
                                    <img
                                        src="/resources_canvas/images/2.svg"
                                        alt="Huella de amor"
                                        className="w-full h-full object-contain opacity-90 animate-pulse-subtle"
                                    />
                                </div>
                            </div>

                            {/* Middle: Contenido de Padres y Padrinos en columna única centrada (idéntico a móvil) */}
                            <div className="relative z-20 flex flex-col items-center justify-center my-auto py-2 mt-4 w-full">
                                {/* --- BLOQUE: NUESTROS PADRES --- */}
                                <div className="flex flex-col items-center text-center w-full" data-reveal="up" data-reveal-delay="100">
                                    <h2 className="font-script text-[2.1rem] sm:text-[2.4rem] text-[#698175] leading-none mb-3 sm:mb-4 font-normal tracking-normal">
                                        Nuestros Padres
                                    </h2>

                                    {/* Padres de la novia */}
                                    <div className="space-y-1 mb-1.5">
                                        {brideParents.map((name, i) => (
                                            <p key={i} className="font-serif text-[10px] sm:text-[11px] tracking-[0.24em] text-[#788a80] font-medium uppercase">
                                                {name}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Ampersand & */}
                                    <span className="font-script text-2xl sm:text-3xl py-3 text-[#698175] leading-none my-1">
                                        &amp;
                                    </span>

                                    {/* Padres del novio */}
                                    <div className="space-y-1 mt-1">
                                        {groomParents.map((name, i) => (
                                            <p key={i} className="font-serif text-[10px] sm:text-[11px] tracking-[0.24em] text-[#788a80] font-medium uppercase">
                                                {name}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {/* --- BLOQUE: NUESTROS PADRINOS --- */}
                                <div className="flex flex-col items-center mt-12 sm:mt-8 text-center w-full" data-reveal="up" data-reveal-delay="200">
                                    <h2 className="font-script text-[2.1rem] sm:text-[2.4rem] text-[#698175] leading-none mb-6 sm:mb-8 font-normal tracking-normal">
                                        Nuestros Padrinos
                                    </h2>

                                    {/* Padrino(s) grupo 1 */}
                                    <div className="space-y-1 mb-1.5">
                                        {brideGodparents.map((name, i) => (
                                            <p key={i} className="font-serif text-[10px] sm:text-[11px] tracking-[0.24em] text-[#788a80] font-medium uppercase">
                                                {name}
                                            </p>
                                        ))}
                                    </div>

                                    {/* Ampersand & */}
                                    <span className="font-script text-2xl sm:text-3xl text-[#698175] leading-none my-1 py-3">
                                        &amp;
                                    </span>

                                    {/* Padrinos grupo 2 */}
                                    <div className="space-y-1 mt-1">
                                        {groomGodparents.map((name, i) => (
                                            <p key={i} className="font-serif text-[10px] sm:text-[11px] tracking-[0.24em] text-[#788a80] font-medium uppercase">
                                                {name}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom: Perrito con el anillo en la cabeza asomándose */}
                            <div className="relative z-20 w-full flex justify-center items-end mt-4 pointer-events-none select-none" data-reveal="up" data-reveal-delay="250">
                                <div
                                    className="w-[90%] max-w-[360px] relative overflow-hidden"
                                    style={{ aspectRatio: '810 / 397' }}
                                >
                                    <img
                                        src="/resources_canvas/images/3.svg"
                                        alt="Perrito con anillo"
                                        className="w-full absolute bottom-0 left-0 drop-shadow-sm select-none pointer-events-none block"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 3: GALERÍA & CUENTA REGRESIVA                     */}
                    {/* (Pantalla completa tipo Canva con zoom en escritorio)     */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-center select-none shrink-0 overflow-hidden">
                        <div className="canvas-container min-h-[65svh] sm:min-h-[640px] flex flex-col items-center justify-start pt-7 sm:pt-9 pb-8 px-0 select-none shrink-0">
                            {/* --- BLOQUE SUPERIOR: TÍTULO Y CARRUSEL DE GALERÍA --- */}
                            <div className="flex flex-col items-center w-full" data-reveal="fade" data-reveal-delay="100">
                                {/* Título de Galería */}
                                <h2 className="font-serif text-[12.3px] sm:text-[14px] tracking-[0.32em] text-[#788a80] uppercase font-medium mb-3 sm:mb-4 text-center px-4" data-reveal="down">
                                    GALERÍA
                                </h2>

                                {/* Carrusel interactivo y fluido con soporte táctil, arrastre con dedo y cambio activo */}
                                <MobileGalleryCarousel images={galleryList} />
                            </div>

                            {/* --- BLOQUE INFERIOR: CUENTA REGRESIVA SUBIDA Y COMPACTA --- */}
                            <div className="flex flex-col items-center text-center mt-5 sm:mt-7 px-4" data-reveal="up" data-reveal-delay="200">
                                {/* "FALTAN" */}
                                <span className="font-serif text-[10px] sm:text-[11px] tracking-[0.3em] text-[#788a80] uppercase font-medium mb-2 sm:mb-2.5 mt-3">
                                    FALTAN
                                </span>

                                {/* Contenedor de Tiempo: DÍAS, HORAS, MINS, SEGS */}
                                <div className="flex items-start justify-center gap-1 sm:gap-2">
                                    {/* Días */}
                                    <div className="flex flex-col items-center w-14 sm:w-16 p-1 rounded-xl transition-transform hover:scale-105 duration-200">
                                        <span className="font-serif text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#788a80] uppercase font-medium mb-1">
                                            DÍAS
                                        </span>
                                        <span className="font-serif text-3xl sm:text-4xl font-light text-[#698175] leading-none">
                                            {timeLeft.days}
                                        </span>
                                    </div>

                                    <span className="font-serif text-2xl sm:text-3xl font-light text-[#698175] leading-none mt-3.5 sm:mt-4">
                                        :
                                    </span>

                                    {/* Horas */}
                                    <div className="flex flex-col items-center w-14 sm:w-16 p-1 rounded-xl transition-transform hover:scale-105 duration-200">
                                        <span className="font-serif text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#788a80] uppercase font-medium mb-1">
                                            HORAS
                                        </span>
                                        <span className="font-serif text-3xl sm:text-4xl font-light text-[#698175] leading-none">
                                            {timeLeft.hours}
                                        </span>
                                    </div>

                                    <span className="font-serif text-2xl sm:text-3xl font-light text-[#698175] leading-none mt-3.5 sm:mt-4">
                                        :
                                    </span>

                                    {/* Minutos */}
                                    <div className="flex flex-col items-center w-14 sm:w-16 p-1 rounded-xl transition-transform hover:scale-105 duration-200">
                                        <span className="font-serif text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#788a80] uppercase font-medium mb-1">
                                            MINS
                                        </span>
                                        <span className="font-serif text-3xl sm:text-4xl font-light text-[#698175] leading-none">
                                            {timeLeft.minutes}
                                        </span>
                                    </div>

                                    <span className="font-serif text-2xl sm:text-3xl font-light text-[#698175] leading-none mt-3.5 sm:mt-4">
                                        :
                                    </span>

                                    {/* Segundos */}
                                    <div className="flex flex-col items-center w-14 sm:w-16 p-1 rounded-xl transition-transform hover:scale-105 duration-200">
                                        <span className="font-serif text-[8.5px] sm:text-[9.5px] tracking-[0.22em] text-[#788a80] uppercase font-medium mb-1">
                                            SEGS
                                        </span>
                                        <span className="font-serif text-3xl sm:text-4xl font-light text-[#698175] leading-none">
                                            {timeLeft.seconds}
                                        </span>
                                    </div>
                                </div>

                                {/* "PARA EL GRAN DÍA" */}
                                <span className="font-serif text-[9px] sm:text-[10px] tracking-[0.28em] text-[#788a80] uppercase font-medium mt-2.5 sm:mt-3">
                                    PARA EL GRAN DÍA
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 4: ITINERARIO                                     */}
                    {/* (Timeline elegante con círculos y línea vertical unida)   */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#748270] -mt-[1px] flex flex-col items-center justify-center py-10 sm:py-14 px-4 sm:px-6 select-none shrink-0 overflow-hidden min-h-[100svh] sm:min-h-[890px]">
                        {/* Fondo de textura auténtica de Canva sobre el verde olivo extendido borde a borde */}
                        <img
                            src="/images/canva_assets/asset_17_9c5d7925.png"
                            alt="Fondo textura Itinerario"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0 opacity-40 mix-blend-multiply"
                        />

                        {/* Huellitas decorativas en esquina superior izquierda */}
                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-14 h-14 sm:w-16 sm:h-16 pointer-events-none select-none z-20 opacity-80 animate-pulse-subtle">
                            <img
                                src="/resources_canvas/images/4.svg"
                                alt="Huellitas"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Perrito con anillo asomándose en la esquina inferior derecha */}
                        <div className="absolute -bottom-2 -right-4 sm:right-0 w-[170px] sm:w-[215px] pointer-events-none select-none z-10" data-reveal="fade" data-reveal-delay="250">
                            <img
                                src="/images/canva_assets/asset_13_254b129a.png"
                                alt="Perrito asomándose"
                                className="w-full h-auto object-contain drop-shadow-md"
                            />
                        </div>

                        {/* Contenedor Canva con zoom proporcional */}
                        <div className="canvas-container flex flex-col justify-between py-2 px-2 sm:px-4 select-none shrink-0 relative z-20 w-full max-w-[430px]">
                            {/* Título de la sección: Itinerario */}
                            <div className="w-full text-center mb-6 sm:mb-8" data-reveal="down">
                                <h2 className="font-script text-[2.8rem] sm:text-[3.5rem] text-[#fbf9f4] tracking-wide font-normal leading-none drop-shadow-sm">
                                    Itinerario
                                </h2>
                            </div>

                            {/* TIMELINE VERTICAL CON CÍRCULOS UNIDOS POR UNA LÍNEA */}
                            <div className="relative w-full py-2">
                                {/* Línea vertical continua que une todos los nodos */}
                                <div className="absolute left-1/2 top-6 bottom-6 -translate-x-1/2 w-[2px] bg-[#fbf9f4]/45 z-0" />

                                <div className="flex flex-col space-y-6 sm:space-y-7 relative z-10">
                                    {timelineEvents.map((event, index) => {
                                        const isEven = index % 2 === 0;
                                        const formattedTime = formatTimelineTime(event.time);
                                        const delay = Math.min((index % 4) * 100 + 100, 500);

                                        return (
                                            <div
                                                key={index}
                                                className="relative flex items-center justify-between w-full group"
                                            >
                                                {/* COLUMNA IZQUIERDA */}
                                                <div 
                                                    className="w-[calc(50%-1.75rem)] sm:w-[calc(50%-2.25rem)] text-right pr-2 sm:pr-3"
                                                    data-reveal="left"
                                                    data-reveal-delay={String(delay)}
                                                >
                                                    {isEven ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-serif text-[12px] sm:text-[13px] tracking-[0.2em] text-[#fbf9f4] font-bold uppercase drop-shadow-xs leading-tight">
                                                                {event.title}
                                                            </span>
                                                            {event.description && (
                                                                <span className="font-serif text-[10px] sm:text-[11px] text-[#fbf9f4]/85 font-light mt-0.5 leading-snug">
                                                                    {event.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end">
                                                            <span className="font-serif text-[10.5px] sm:text-[11.5px] tracking-[0.14em] text-[#fbf9f4] font-medium bg-[#fbf9f4]/15 px-2.5 py-0.5 rounded-full border border-[#fbf9f4]/25 shadow-xs backdrop-blur-xs">
                                                                {formattedTime}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* CÍRCULO CENTRAL CON ICONO */}
                                                <div 
                                                    className="relative z-10 flex items-center justify-center shrink-0"
                                                    data-reveal="scale"
                                                    data-reveal-delay={String(delay)}
                                                >
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#586755] border-2 border-[#fbf9f4] shadow-[0_4px_12px_rgba(0,0,0,0.18)] flex items-center justify-center p-2 sm:p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
                                                        <img
                                                            src={event.icon_url || '/resources_canvas/images/5.svg'}
                                                            alt={event.title || 'Itinerario'}
                                                            className="w-full h-full object-contain filter drop-shadow-xs"
                                                        />
                                                    </div>
                                                </div>

                                                {/* COLUMNA DERECHA */}
                                                <div 
                                                    className="w-[calc(50%-1.75rem)] sm:w-[calc(50%-2.25rem)] text-left pl-2 sm:pl-3"
                                                    data-reveal="right"
                                                    data-reveal-delay={String(delay)}
                                                >
                                                    {isEven ? (
                                                        <div className="flex justify-start">
                                                            <span className="font-serif text-[10.5px] sm:text-[11.5px] tracking-[0.14em] text-[#fbf9f4] font-medium bg-[#fbf9f4]/15 px-2.5 py-0.5 rounded-full border border-[#fbf9f4]/25 shadow-xs backdrop-blur-xs">
                                                                {formattedTime}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-serif text-[12px] sm:text-[13px] tracking-[0.2em] text-[#fbf9f4] font-bold uppercase drop-shadow-xs leading-tight">
                                                                {event.title}
                                                            </span>
                                                            {event.description && (
                                                                <span className="font-serif text-[10px] sm:text-[11px] text-[#fbf9f4]/85 font-light mt-0.5 leading-snug">
                                                                    {event.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 5: UBICACIÓN & MESA DE REGALOS                    */}
                    {/* (Pantalla tipo Canva: Marco de encaje con sello y plantas) */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 select-none shrink-0 overflow-hidden min-h-[100svh] sm:h-[890px] sm:min-h-[890px]">
                        <div className="canvas-container flex flex-col items-center justify-center">
                            {/* Contenedor del marco proporcionado al diseño de Canva */}
                            <div className="relative w-full max-w-[365px] h-[710px] sm:h-[750px] flex flex-col items-center justify-between p-4">

                                {/* 10.svg: Marco y fondo de encaje escalado para eliminar el margen transparente del SVG */}
                                <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none select-none z-0">
                                    <img
                                        src="/resources_canvas/images/10.svg"
                                        alt="Marco de encaje"
                                        className="w-[156%] max-w-none h-full object-fill -translate-y-20 sm:-translate-y-26 pointer-events-none select-none"
                                    />
                                </div>

                                {/* 12.svg: Planta lado izquierdo con flotación orgánica suave */}
                                <div className="absolute -left-7 sm:-left-8 top-[33%] w-24 sm:w-28 pointer-events-none select-none z-20 animate-float-slow">
                                    <img
                                        src="/resources_canvas/images/12.svg"
                                        alt="Decoración botánica izquierda"
                                        className="w-full h-auto object-contain"
                                    />
                                </div>

                                {/* 13.svg: Planta lado derecho inferior con balanceo opuesto */}
                                <div className="absolute -right-6 sm:-right-7 bottom-0 sm:bottom-1 w-36 sm:w-38 pointer-events-none select-none z-20 -mr-12 -mt-32 -translate-y-30 sm:-translate-y-32 animate-float-reverse">
                                    <img
                                        src="/resources_canvas/images/13.svg"
                                        alt="Decoración botánica derecha"
                                        className="w-full h-auto object-contain"
                                    />
                                </div>

                                {/* Contenido Interior */}
                                <div className="relative z-10 w-full h-full flex flex-col items-center justify-between text-center pt-2 pb-5 px-2">

                                    {/* Bloque Superior: Sello y Título Ubicación */}
                                    <div className="flex flex-col items-center w-full translate-y-6 sm:translate-y-8" data-reveal="down">
                                        {/* 11.svg: Sello de cera con huellita animado con pulso y sombra viva */}
                                        <div className="w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] shrink-0 flex items-center justify-center drop-shadow-md mb-0.5 animate-pulse-subtle">
                                            <img
                                                src="/resources_canvas/images/11.svg"
                                                alt="Sello de huellita"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>

                                        {/* Título: Ubicación */}
                                        <h2 className="font-script text-[1.9rem] sm:text-[2.4rem] text-[#617485] leading-none mb-1 mt-2 font-italic drop-shadow-sm tracking-normal">
                                            Ubicación
                                        </h2>
                                    </div>

                                    {/* Bloque 1: Ceremonia religiosa */}
                                    <div className="flex flex-col items-center my-auto" data-reveal="up" data-reveal-delay="100">
                                        <span className="font-cardo text-[1.0rem] sm:text-[1.22rem] text-[#6d8293] leading-none mb-0.5 font-italic">
                                            Ceremonia religiosa
                                        </span>
                                        <h3 className="font-serif text-[11.5px] sm:text-[12.5px] tracking-[0.1em] text-[#3f5263] font-semibold uppercase mb-2">
                                            {(wedding?.locations?.ceremony && wedding.locations.ceremony !== 'NOMBRE DE LA IGLESIA')
                                                ? wedding.locations.ceremony
                                                : 'CASA DE LA CRISTIANDAD'}
                                        </h3>
                                        <a
                                            href={wedding?.locations?.ceremony_maps || 'https://maps.google.com/?q=Casa+de+la+Cristiandad'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#4c6070] border border-[#cbd5df] shadow-sm rounded-[10px] px-3.5 py-2 transition-all active:scale-95 group hover-lift"
                                        >
                                            <span className="font-serif text-[11px] sm:text-[12px] tracking-[0.08em] font-bold uppercase">
                                                VER EN GOOGLE MAPS
                                            </span>
                                            <span className="ml-2 text-sm text-[#4c6070] group-hover:translate-x-0.5 transition-transform">
                                                →
                                            </span>
                                        </a>
                                    </div>

                                    {/* Bloque 2: Recepción */}
                                    <div className="flex flex-col items-center my-auto -translate-y-16 sm:-translate-y-22" data-reveal="up" data-reveal-delay="200">
                                        <span className="font-cardo text-[1.0rem] sm:text-[1.22rem] text-[#6d8293] leading-none mb-0.5 font-italic">
                                            Recepción
                                        </span>
                                        <h3 className="font-serif text-[11.5px] sm:text-[12.5px] tracking-[0.1em] text-[#3f5263] font-semibold uppercase mb-2">
                                            {(wedding?.locations?.reception && wedding.locations.reception !== 'NOMBRE DEL LOCAL')
                                                ? wedding.locations.reception
                                                : 'HOTEL HACIENDA SÁNCHEZ'}
                                        </h3>
                                        <a
                                            href={wedding?.locations?.reception_maps || 'https://maps.google.com/?q=Hotel+Hacienda+Sanchez'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#4c6070] border border-[#cbd5df] shadow-sm rounded-[10px] px-3.5 py-2 transition-all active:scale-95 group hover-lift"
                                        >
                                            <span className="font-serif text-[11px] sm:text-[12px] tracking-[0.08em] font-bold uppercase">
                                                VER EN GOOGLE MAPS
                                            </span>
                                            <span className="ml-2 text-sm text-[#4c6070] group-hover:translate-x-0.5 transition-transform">
                                                →
                                            </span>
                                        </a>
                                    </div>

                                    {/* Bloque 3: Mesa de regalos */}
                                    <div className="flex flex-col items-center my-auto -translate-y-32 sm:-translate-y-38" data-reveal="up" data-reveal-delay="300">
                                        <h2 className="font-script text-[1.9rem] sm:text-[1.8rem] text-[#617485] leading-none mb-2 font-normal drop-shadow-sm">
                                            Mesa de regalos
                                        </h2>
                                        <div className="flex flex-col gap-2.5 w-full max-w-[145px] sm:max-w-[160px]">
                                            {giftRegistries.map((reg, idx) => (
                                                <a
                                                    key={idx}
                                                    href={reg.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#4c6070] border border-[#cbd5df] shadow-sm rounded-[10px] px-3.5 py-1.5 transition-all active:scale-95 group hover-lift"
                                                >
                                                    <span className="font-serif text-[11px] sm:text-[12px] tracking-normal font-bold uppercase truncate max-w-[110px]">
                                                        {reg.name}
                                                    </span>
                                                    <span className="ml-2 text-sm text-[#4c6070] group-hover:translate-x-0.5 transition-transform">
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
                    <section className="relative w-full bg-[#fbf9f4] -mt-44 sm:-mt-52 flex flex-col items-center justify-center pt-0 pb-2 px-4 sm:px-6 select-none shrink-0">
                        <div className="canvas-container flex flex-col items-center justify-center">
                            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center" data-reveal="scale" data-reveal-delay="100">
                                {/* 14.svg: Sobre abierto con sello de cera */}
                                <img
                                    src="/resources_canvas/images/14.svg"
                                    alt="Sobre de regalos"
                                    className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
                                />

                                {/* Monograma en la solapa superior (AJ escalonado con sutil palpitación) */}
                                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 flex items-center font-script text-[#f7f4ea] opacity-95 drop-shadow-sm pointer-events-none select-none whitespace-nowrap leading-none mt-2 mr-6 animate-pulse-subtle">
                                    <span className="text-[32px] sm:text-[50px] translate-x-[4px] -translate-y-[8px] sm:-translate-y-[10px]">
                                        A
                                    </span>
                                    <span className="text-[28px] sm:text-[52px] -translate-x-[12px] translate-y-[10px] sm:translate-y-[12px]">
                                        J
                                    </span>
                                </div>

                                {/* Mensaje dentro de la tarjeta blanca del sobre */}
                                <div className="absolute top-[39.5%] left-1/2 -translate-x-1/2 -translate-y-3 w-[64%] sm:w-[58%] text-center pointer-events-none select-none" data-reveal="fade" data-reveal-delay="250">
                                    <p className="font-serif text-[8px] min-[360px]:text-[8.5px] sm:text-[10px] font-semibold tracking-[0.08em] uppercase text-[#556268] leading-[1.38]">
                                        <span className="block whitespace-nowrap">Tu presencia es nuestro mejor</span>
                                        <span className="block whitespace-nowrap">regalo. Si desean tener un</span>
                                        <span className="block whitespace-nowrap">detalle con nosotros,</span>
                                        <span className="block whitespace-nowrap">contaremos con mesa de regalos</span>
                                        <span className="block whitespace-nowrap">y lluvia de sobres.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* ========================================================= */}
                    {/* SECCIÓN 7: CÓDIGO DE VESTIMENTA / DRESSCODE               */}
                    {/* (Foto novios con degradados, nombres, título e iconos)     */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-center pt-8 sm:pt-12 pb-0 px-0 select-none shrink-0 overflow-hidden min-h-0">
                        {/* Foto de los novios a ancho completo de pantalla */}
                        <div className="relative w-full flex flex-col items-center overflow-hidden" data-reveal="fade">
                            <img
                                src="/images/canva_assets/asset_16_31fee922.jpeg"
                                alt="Adriana & Joaquín"
                                className="w-full h-auto block select-none pointer-events-none"
                            />

                            {/* Degradado superior y Nombres de los novios */}
                            <div className="absolute top-0 inset-x-0 h-40 sm:h-48 bg-gradient-to-b from-[#fbf9f4] via-[#fbf9f4]/80 to-transparent flex flex-col items-center justify-start pt-8 sm:pt-10 z-10 pointer-events-none select-none">
                                <h2 className="font-script text-[2.8rem] sm:text-[3.4rem] text-[#788e80] leading-[0.88] text-center flex flex-col items-center drop-shadow-sm font-normal" data-reveal="down" data-reveal-delay="150">
                                    <span>Adriana &</span>
                                    <span>Joaquín</span>
                                </h2>
                            </div>

                            {/* Degradado inferior difuminando hacia el fondo */}
                            <div className="absolute bottom-0 inset-x-0 h-36 sm:h-44 bg-gradient-to-t from-[#fbf9f4] via-[#fbf9f4]/85 to-transparent pointer-events-none z-0" />
                        </div>

                        {/* Bloque de Dresscode, Iconos y Paletas de Color */}
                        <div className="canvas-container relative z-10 -mt-16 sm:-mt-20 w-full flex flex-col items-center px-4 pb-14 sm:pb-20">
                                {/* Título: Dresscode */}
                                <h3 className="font-script text-[3.0rem] sm:text-[3.6rem] text-[#556c7d] leading-none mb-5 sm:mb-6 drop-shadow-sm font-normal text-center tracking-normal" data-reveal="down">
                                    Dresscode
                                </h3>

                                {/* Columnas de Guayabera y Vestido */}
                                <div className="grid grid-cols-2 gap-6 sm:gap-8 w-full max-w-[340px] sm:max-w-[360px] mb-8 sm:mb-9" data-reveal="up" data-reveal-delay="100">
                                    {/* 17.svg: Guayabera */}
                                    <div className="flex items-center gap-2.5 sm:gap-3 justify-center group transition-transform hover:scale-105 duration-300">
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <img
                                                src="/resources_canvas/images/17.svg"
                                                alt="Guayabera"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="font-serif text-[9.5px] sm:text-[11px] font-semibold tracking-[0.1em] uppercase text-[#556c7d] leading-[1.3] text-left">
                                            GUAYABERA<br />
                                            (MANGA LARGA<br />
                                            O CORTA)
                                        </div>
                                    </div>

                                    {/* 18.svg: Vestido de cóctel */}
                                    <div className="flex items-center gap-2.5 sm:gap-3 justify-center group transition-transform hover:scale-105 duration-300">
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <img
                                                src="/resources_canvas/images/18.svg"
                                                alt="Vestido de cóctel"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="font-serif text-[9.5px] sm:text-[11px] font-semibold tracking-[0.1em] uppercase text-[#556c7d] leading-[1.3] text-left">
                                            VESTIDO<br />
                                            DE COCTEL
                                        </div>
                                    </div>
                                </div>

                                {/* EXCLUSIVO NOVIOS */}
                                <h4 className="font-serif text-[11px] sm:text-[12.5px] font-semibold tracking-[0.2em] uppercase text-[#556c7d] text-center mb-3" data-reveal="up" data-reveal-delay="200">
                                    EXCLUSIVO NOVIOS
                                </h4>

                                {/* 6 Círculos de color con micro-interacción hover */}
                                <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-7" data-reveal="scale" data-reveal-delay="250">
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#ffffff] border border-[#d6cfc2] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                                        title="Blanco"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f4f1ec] border border-[#d6cfc2] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                                        title="Blanco hueso"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fff7ed] border border-[#d6cfc2] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                                        title="Marfil"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#b0c5ac] border border-[#9eb39a] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                                        title="Verde sage claro"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#9ba998] border border-[#8a9887] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                                        title="Verde sage medio"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#727f6e] border border-[#616e5d] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                                        title="Verde olivo oscuro"
                                    />
                                </div>

                                {/* COLORES A EVITAR */}
                                <h4 className="font-serif text-[11px] sm:text-[12.5px] font-semibold tracking-[0.2em] uppercase text-[#556c7d] text-center mb-3" data-reveal="up" data-reveal-delay="300">
                                    COLORES A EVITAR
                                </h4>

                                {/* Círculo Rojo */}
                                <div className="flex items-center justify-center mb-6 sm:mb-7" data-reveal="scale" data-reveal-delay="350">
                                    <div
                                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#a90f0f] border border-[#8f0c0c] shadow-md transition-all duration-300 hover:scale-125 hover:shadow-lg cursor-pointer"
                                        title="Rojo intenso"
                                    />
                                </div>

                                {/* Texto explicativo exacto en 3 líneas */}
                                <p className="font-serif text-[9px] sm:text-[10px] font-medium tracking-[0.06em] uppercase text-[#617482] leading-[1.6] text-center w-full max-w-[420px] px-2" data-reveal="fade" data-reveal-delay="400">
                                    Verde en todas sus tonalidades, blanco y marfil serán<br />
                                    colores exclusivos de los novios. Les pedimos amablemente<br />
                                    evitar el rojo intenso.
                                </p>
                            </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 8: CELEBRACIÓN PARA HUMANOS GRANDES (SOLO ADULTOS) */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#8e9fae] -mt-[1px] flex flex-col items-center justify-start pt-10 sm:pt-14 pb-0 px-0 select-none shrink-0 overflow-hidden min-h-0">
                        {/* Fondo con textura/patrón de huellitas y huesitos */}
                        <div
                            className="absolute inset-0 bg-repeat opacity-20 mix-blend-screen pointer-events-none z-0"
                            style={{
                                backgroundImage: "url('/images/canva_assets/asset_3_429a9a59.png')",
                                backgroundSize: "280px 280px",
                            }}
                        />

                        {/* Contenido superior: Icono, Título y Mensaje */}
                        <div className="canvas-container flex flex-col items-center relative z-10" data-reveal="up">
                            {/* Icono: Corazón con huella de perrito (26.svg) con suave palpitación */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-5 flex items-center justify-center animate-pulse-subtle">
                                <img
                                    src="/resources_canvas/images/26.svg"
                                    alt="Corazón con huella"
                                    className="w-full h-full object-contain drop-shadow-sm"
                                />
                            </div>

                            {/* Título: UNA CELEBRACIÓN PARA HUMANOS GRANDES */}
                            <h3 className="font-serif text-[12.5px] sm:text-[14.5px] font-semibold tracking-[0.2em] uppercase text-white/95 text-center leading-[1.35] mb-3 sm:mb-4 drop-shadow-sm">
                                UNA CELEBRACIÓN PARA<br />
                                HUMANOS GRANDES
                            </h3>

                            {/* Mensaje en Cormorant Garamond */}
                            <p
                                className="text-[14.5px] sm:text-[16px] font-normal text-white/95 leading-[1.35] text-center max-w-[360px] px-2 mb-2 sm:mb-3 drop-shadow-sm"
                                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                                Con cariño, les pedimos que esta ocasión<br />
                                sea disfrutada únicamente por adultos.
                            </p>
                        </div>

                        {/* Imagen de los novios con su perrito (29.svg) a ancho completo de pantalla */}
                        <div className="relative w-full flex flex-col items-center overflow-hidden z-10" data-reveal="up" data-reveal-delay="200">
                            <img
                                src="/resources_canvas/images/29.svg"
                                alt="Adriana, Joaquín y su perrito"
                                className="w-full h-auto object-cover block select-none pointer-events-none -mt-4 sm:-mt-6 -mb-1"
                            />

                            {/* Degradado inferior suave hacia el siguiente fondo (#fbf9f4) */}
                            <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-t from-[#fbf9f4] via-[#fbf9f4]/80 to-transparent pointer-events-none z-20" />
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 9: HOSPEDAJE (Hoteles recomendados con carrusel)  */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-start pt-10 sm:pt-14 pb-12 sm:pb-14 px-0 select-none overflow-hidden">
                        <div className="canvas-container flex flex-col items-center">
                            {/* Título: Hospedaje */}
                            <h2 className="font-script text-[3rem] sm:text-[3.6rem] text-[#788e80] leading-none mb-3 text-center tracking-normal" data-reveal="down">
                                Hospedaje
                            </h2>

                            {/* Subtítulo */}
                            <p className="font-serif text-[9.5px] sm:text-[11px] tracking-[0.22em] text-[#788a80] font-medium uppercase text-center max-w-[320px] sm:max-w-[390px] leading-relaxed mb-4 sm:mb-6 px-4" data-reveal="down" data-reveal-delay="100">
                                ESTAREMOS ENCANTADOS QUE NOS ACOMPAÑES Y DISFRUTES TODA LA EXPERIENCIA
                            </p>

                            {/* Carrusel fluido y accesible de hoteles */}
                            <div className="w-full" data-reveal="up" data-reveal-delay="200">
                                <HotelCarousel hotels={hotelList} />
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 10: CONFIRMACIÓN DE ASISTENCIA ("¿Nos acompañas?") */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-start pt-6 sm:pt-8 pb-14 sm:pb-16 px-4 select-none overflow-hidden">
                        <div className="canvas-container flex flex-col items-center">
                            {/* Título en letra cursiva */}
                            <h2 className="font-script text-[3.2rem] sm:text-[3.9rem] text-[#788e80] leading-none mb-2 text-center" data-reveal="down">
                                ¿Nos acompañas?
                            </h2>

                            {/* Subtítulo */}
                            <p className="font-serif text-[9.5px] sm:text-[11px] tracking-[0.24em] text-[#788a80] font-medium uppercase text-center mb-6 sm:mb-8 px-2" data-reveal="down" data-reveal-delay="100">
                                QUEREMOS CONTAR CONTIGO EN ESTE DÍA TAN ESPECIAL
                            </p>

                            {/* Tarjeta del formulario con borde suave azul/gris */}
                            <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#b8c9d9] shadow-sm p-5 sm:p-7" data-reveal="up" data-reveal-delay="200">
                                {rsvpSubmitted ? (
                                    <div className="flex flex-col items-center text-center py-4 animate-fadeIn">
                                        <div className="w-12 h-12 rounded-full bg-[#edf4f0] text-[#788e80] flex items-center justify-center text-2xl mb-3 shadow-xs">
                                            ✓
                                        </div>
                                        <h4 className="font-script text-3xl md:text-4xl text-[#788e80] mb-2">
                                            ¡Muchas Gracias, {rsvpName || invitation?.name}!
                                        </h4>
                                        <p className="font-serif text-[12px] sm:text-[13px] md:text-[14px] text-stone-600 tracking-wide mb-3 leading-relaxed">
                                            {confirmedGuests.length > 0
                                                ? '¡Nos emociona muchísimo contar con tu presencia en nuestro gran día!'
                                                : 'Lamentamos que no puedas acompañarnos físicamente, ¡te llevaremos en el corazón!'}
                                        </p>
                                        {rsvpMessage && (
                                            <p className="text-[12px] md:text-[13px] italic text-stone-500 bg-[#fbf9f4] p-3.5 md:p-4 rounded-xl border border-stone-200/60 mb-4 max-w-[340px]">
                                                "{rsvpMessage}"
                                            </p>
                                        )}

                                        {/* ========================================================= */}
                                        {/* PASES DE ACCESO INDIVIDUALES PARA CONFIRMADOS             */}
                                        {/* ========================================================= */}
                                        {confirmedGuests.length > 0 && (
                                            <div className="w-full mt-4 pt-5 border-t border-[#ded8cd] space-y-4">
                                                <div className="text-center px-1">
                                                    <span className="font-serif text-[10px] tracking-[0.25em] text-[#698175] uppercase font-bold block mb-1">
                                                        {confirmedGuests.length === 1 ? 'Tu Pase de Acceso Oficial' : `Pases Oficiales de Acceso (${confirmedGuests.length})`}
                                                    </span>
                                                    <p className="text-[11px] font-serif text-stone-500 leading-snug">
                                                        Presenta tu código QR al llegar a la recepción. Cada pase es personal y no requiere esperas.
                                                    </p>
                                                </div>

                                                <div className="space-y-6 pt-1">
                                                    {confirmedGuests.map((cg) => (
                                                        <DigitalPassCard
                                                            key={cg.id || cg.checkin_code}
                                                            guest={{
                                                                id: cg.id,
                                                                full_name: cg.full_name,
                                                                checkin_code: cg.checkin_code || 'AJ-ACCESO',
                                                                table_name: cg.table_name,
                                                                type: cg.type,
                                                                allergies: cg.allergies,
                                                                special_notes: cg.special_notes,
                                                            }}
                                                            weddingName={`${brideName} & ${groomName}`}
                                                            weddingDate={dateText}
                                                            receptionLocation={wedding?.locations?.reception || 'Hacienda San Diego Cutz'}
                                                            invitationName={invitation?.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-3 border-t border-stone-100 w-full text-center">
                                            <button
                                                type="button"
                                                onClick={() => setRsvpSubmitted(false)}
                                                className="font-serif text-[11px] tracking-wider uppercase text-[#788a80] underline hover:text-[#556c7d] cursor-pointer"
                                            >
                                                Modificar respuesta
                                            </button>
                                        </div>
                                    </div>
                                ) : !invitation ? (
                                    /* Si se visita la página general sin token de invitación privada */
                                    <div className="flex flex-col items-center text-center py-5 px-2 animate-fadeIn space-y-4">
                                        {/* Monograma de Gala */}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#28362e] via-[#33443a] to-[#28362e] text-[#f4ecd8] border-2 border-[#d4af37]/50 flex items-center justify-center font-serif font-bold text-lg shadow-lg">
                                            A&amp;J
                                        </div>

                                        <div>
                                            <span className="font-serif text-[10px] sm:text-[10.5px] tracking-[0.25em] text-[#698175] uppercase font-bold block mb-1">
                                                CONFIRMACIÓN PRIVADA
                                            </span>
                                            <h3 className="font-serif font-bold text-stone-900 text-xl leading-tight">
                                                Invitación Personal Requerida
                                            </h3>
                                        </div>

                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#ded8cd] to-transparent my-1" />

                                        <p className="font-serif text-[12.5px] text-stone-600 leading-relaxed max-w-[320px]">
                                            Para confirmar tu asistencia y obtener tus <strong>pases de acceso oficiales</strong>, por favor ingresa únicamente a través del <strong>enlace personalizado</strong> que te compartieron directamente <strong>{brideName} &amp; {groomName}</strong>.
                                        </p>

                                        {/* Tarjeta explicativa con icono */}
                                        <div className="bg-[#f7faf8] rounded-2xl border border-[#d2dfd7] p-3.5 text-stone-600 text-xs font-serif leading-relaxed w-full shadow-2xs">
                                            <div className="flex items-center justify-center gap-1.5 text-[#28362e] font-bold text-[12px] mb-1">
                                                <Ticket className="w-4 h-4 text-[#698175]" />
                                                <span>Pases de Acceso Exclusivos</span>
                                            </div>
                                            Cada invitación cuenta con boletos y códigos QR individuales asignados a los integrantes de tu familia o pase.
                                        </div>

                                        <p className="text-[11px] font-serif text-stone-400 italic max-w-[280px]">
                                            ¿No encuentras tu enlace privado? Comunícate con los novios para compartirte tu pase personalizado.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRsvpSubmit} className="flex flex-col space-y-4 sm:space-y-5">
                                        {/* Encabezado de la invitación personalizada */}
                                        <div className="bg-[#f0f4f2] border border-[#d2dfd7] rounded-xl p-3 text-center">
                                            <span className="font-serif text-[10px] tracking-[0.2em] uppercase text-[#698175] font-semibold block mb-0.5">
                                                {invitation.guests && invitation.guests.length > 1 ? 'Invitación Familiar' : 'Invitación Personal'}
                                            </span>
                                            <h3 className="font-serif font-bold text-stone-800 text-sm">
                                                {invitation.name}
                                            </h3>
                                            <p className="font-serif text-[11px] text-stone-600 mt-0.5">
                                                Hemos reservado <strong className="text-[#556c7d]">{invitation.guests?.length || 1} {invitation.guests?.length === 1 ? 'pase' : 'pases'}</strong> en su honor
                                            </p>
                                        </div>

                                        {/* Si hay múltiples integrantes asignados a la invitación */}
                                        {invitation?.guests && invitation.guests.length > 1 ? (
                                            <div className="space-y-2">
                                                <label className="font-serif text-[11px] sm:text-[11.5px] tracking-[0.12em] text-[#556c7d] uppercase font-semibold block mb-1">
                                                    Confirma la asistencia de cada persona:
                                                </label>
                                                <div className="space-y-2.5">
                                                    {invitation.guests.map((guest) => {
                                                        const isAtt = guestAttendingMap[guest.id];
                                                        return (
                                                            <div key={guest.id} className="p-2.5 rounded-xl border border-[#b8c9d9] bg-[#fafbfc] flex items-center justify-between">
                                                                <div className="pr-2">
                                                                    <p className="text-[12.5px] font-medium text-stone-800 leading-tight">
                                                                        {guest.full_name}
                                                                    </p>
                                                                    <span className="text-[9.5px] text-stone-400">
                                                                        {guest.type === 'child' ? 'Niño/a' : 'Adulto'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-1.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setGuestAttendingMap(prev => ({ ...prev, [guest.id]: true }))}
                                                                        className={`px-3 py-1.5 rounded-full text-[11px] font-serif transition-all cursor-pointer ${isAtt === true
                                                                            ? 'bg-[#698175] text-white shadow-xs font-semibold'
                                                                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                                                                            }`}
                                                                    >
                                                                        ✓ Sí
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setGuestAttendingMap(prev => ({ ...prev, [guest.id]: false }))}
                                                                        className={`px-3 py-1.5 rounded-full text-[11px] font-serif transition-all cursor-pointer ${isAtt === false
                                                                            ? 'bg-rose-600 text-white shadow-xs font-semibold'
                                                                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                                                                            }`}
                                                                    >
                                                                        ✗ No
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Campo: ¿Confirmas tu asistencia a nuestra boda? */
                                            <div>
                                                <label className="font-serif text-[11px] sm:text-[11.5px] tracking-[0.12em] text-[#556c7d] uppercase font-semibold block mb-2 leading-snug">
                                                    ¿Confirmas tu asistencia a nuestra boda?
                                                </label>
                                                <div className="space-y-2">
                                                    {/* Opción 1: Acepto con mucho gusto */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setRsvpAttending('yes')}
                                                        className={`w-full flex items-center px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer ${rsvpAttending === 'yes'
                                                            ? 'bg-[#edf3f7] border-[#6f879a] text-[#3c5061] shadow-xs'
                                                            : 'bg-[#fafbfc] border-[#b8c9d9] text-stone-600 hover:bg-stone-50'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2.5 shrink-0 ${rsvpAttending === 'yes'
                                                                ? 'border-[#6f879a] bg-[#6f879a]'
                                                                : 'border-[#94a3b8] bg-white'
                                                                }`}
                                                        >
                                                            {rsvpAttending === 'yes' && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            )}
                                                        </span>
                                                        <span className="text-[12.5px] sm:text-[13px] font-medium tracking-wide">
                                                            Acepto con mucho gusto
                                                        </span>
                                                    </button>

                                                    {/* Opción 2: Lamentablemente no puedo asistir */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setRsvpAttending('no')}
                                                        className={`w-full flex items-center px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer ${rsvpAttending === 'no'
                                                            ? 'bg-[#edf3f7] border-[#6f879a] text-[#3c5061] shadow-xs'
                                                            : 'bg-[#fafbfc] border-[#b8c9d9] text-stone-600 hover:bg-stone-50'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2.5 shrink-0 ${rsvpAttending === 'no'
                                                                ? 'border-[#6f879a] bg-[#6f879a]'
                                                                : 'border-[#94a3b8] bg-white'
                                                                }`}
                                                        >
                                                            {rsvpAttending === 'no' && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            )}
                                                        </span>
                                                        <span className="text-[12.5px] sm:text-[13px] font-medium tracking-wide">
                                                            Lamentablemente no puedo asistir
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Campo: Escribe una dedicatoria a los novios */}
                                        <div>
                                            <label className="font-serif text-[11px] sm:text-[11.5px] tracking-[0.12em] text-[#556c7d] uppercase font-semibold block mb-1.5">
                                                Escribe una dedicatoria a los novios
                                            </label>
                                            <textarea
                                                value={rsvpMessage}
                                                onChange={(e) => setRsvpMessage(e.target.value)}
                                                rows={3}
                                                placeholder="Déjanos unas palabras de cariño..."
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#b8c9d9] text-[13px] text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#788a80] focus:border-[#788a80] bg-[#fafbfc] resize-none transition-all"
                                            />
                                        </div>

                                        {/* Mensaje de error si falta llenar algo */}
                                        {rsvpError && (
                                            <p className="text-[11.5px] text-rose-500 font-serif tracking-wide text-center">
                                                {rsvpError}
                                            </p>
                                        )}

                                        {/* Botón Submit: Confirmar asistencia */}
                                        <button
                                            type="submit"
                                            disabled={rsvpSubmitting}
                                            className="w-full py-3 px-6 rounded-full bg-[#6f879a] hover:bg-[#5c7385] text-white font-serif text-[12px] sm:text-[13px] tracking-[0.18em] uppercase font-medium shadow transition-all duration-300 mt-2 disabled:opacity-60 cursor-pointer hover-lift active:scale-95"
                                        >
                                            {rsvpSubmitting ? 'Guardando confirmación...' : 'Confirmar asistencia'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* FOOTER: BANNER DE CIERRE CON HOJAS DE EUCALIPTO            */}
                    {/* ========================================================= */}
                    <footer className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-center pt-10 sm:pt-14 pb-16 sm:pb-20 px-4 select-none overflow-hidden">
                        <div className="canvas-container flex flex-col items-center justify-center text-center relative z-10 pb-2" data-reveal="up">
                            {/* "NUESTRA BODA" */}
                            <span className="font-serif text-[10.5px] sm:text-[12px] tracking-[0.32em] text-[#788a80] uppercase font-medium mb-1 drop-shadow-xs text-center">
                                NUESTRA BODA
                            </span>

                            {/* Nombres en cursiva centrados: Adriana & Joaquín */}
                            <h2 className="font-script text-[3.2rem] sm:text-[4.2rem] text-[#788e80] leading-tight my-1 drop-shadow-xs tracking-normal text-center flex items-center justify-center gap-2 flex-wrap">
                                <span>{brideName}</span>
                                <span className="text-[18px] sm:text-[22px] font-serif font-light text-[#788e80] -translate-y-0.5">&amp;</span>
                                <span>{groomName}</span>
                            </h2>

                            {/* Fecha más grande y dinámica: 20 | FEB | 2027 */}
                            <span className="font-serif text-[13.5px] sm:text-[16px] tracking-[0.28em] text-[#788a80] uppercase font-medium mt-1.5 mb-2 text-center">
                                {footerDateText}
                            </span>
                        </div>

                        {/* Hojas de eucalipto en la esquina inferior derecha con suave flotación */}
                        <img
                            src="/images/canva_assets/eucalipto_footer.png"
                            alt="Hojas de eucalipto"
                            className="absolute bottom-0 right-0 w-36 min-[400px]:w-44 sm:w-56 md:w-64 h-auto object-contain pointer-events-none select-none z-0 opacity-90 animate-float-slow"
                            data-reveal="fade"
                            data-reveal-delay="200"
                        />
                    </footer>

                    {/* Botón flotante de control musical */}
                    {wedding?.music_url && (
                        <aside className="fixed bottom-5 right-5 z-50 select-none pointer-events-auto">
                            <button
                                type="button"
                                onClick={togglePlay}
                                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-xl backdrop-blur-md transition-all duration-300 border cursor-pointer hover:scale-105 active:scale-95 ${
                                    isPlaying
                                        ? 'bg-[#2c4537]/90 text-[#fcf8ed] border-[#cfbe95]/60 hover:bg-[#2c4537] animate-glow-breathe'
                                        : 'bg-white/95 text-stone-700 border-[#ded8cd] hover:border-[#cfbe95] animate-pulse'
                                }`}
                                title={isPlaying ? "Pausar música" : "Reproducir nuestra canción"}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPlaying ? 'bg-[#cfbe95] text-[#2c4537] animate-spin' : 'bg-stone-200 text-stone-600'}`} style={{ animationDuration: '4s' }}>
                                    <span className="text-xs">🎵</span>
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider text-[#cfbe95] leading-none">
                                        {isPlaying ? 'Sonando' : 'Música'}
                                    </span>
                                    <span className="text-[11px] font-sans font-medium truncate max-w-[110px] leading-tight">
                                        {songTitle}
                                    </span>
                                </div>
                                <span className="text-xs opacity-75 font-mono">
                                    {isPlaying ? '⏸' : '▶'}
                                </span>
                            </button>
                        </aside>
                    )}
                </div>
            </main>
        </>
    );
}

