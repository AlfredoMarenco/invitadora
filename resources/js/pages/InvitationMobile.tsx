import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import HotelCarousel from '../components/HotelCarousel';

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
    const [progress, setProgress] = useState(24); // 24% como en la imagen de referencia
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(() => {
                // Si no hay archivo real aún o requiere interacción, simulamos
                setIsPlaying(true);
            });
        }
    };

    // Si está reproduciendo simulado o real, avanza el progreso
    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

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

    const [activeImageIndex, setActiveImageIndex] = useState(1);
    const galleryScrollRef = useRef<HTMLDivElement | null>(null);
    const isPausedRef = useRef(false);
    const pauseTimeoutRef = useRef<any>(null);

    const handleUserInteraction = () => {
        isPausedRef.current = true;
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
            isPausedRef.current = false;
        }, 4000); // Reanuda el auto-deslizamiento tras 4 segundos de inactividad
    };

    const handleGalleryScroll = () => {
        if (!galleryScrollRef.current) return;
        const container = galleryScrollRef.current;
        const centerPoint = container.scrollLeft + container.clientWidth / 2;
        const cards = Array.from(container.children) as HTMLElement[];

        let closestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, idx) => {
            const cardCenter = card.offsetLeft + card.clientWidth / 2;
            const dist = Math.abs(centerPoint - cardCenter);
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = idx;
            }
        });

        setActiveImageIndex(closestIndex);
    };

    const scrollToImage = (index: number) => {
        if (!galleryScrollRef.current) return;
        handleUserInteraction();
        const container = galleryScrollRef.current;
        const cards = container.children;
        if (!cards[index]) return;
        const card = cards[index] as HTMLElement;
        const targetLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
        container.scrollTo({
            left: Math.max(0, targetLeft),
            behavior: 'smooth',
        });
        setActiveImageIndex(index);
    };

    // Inicializa centrado en la imagen del medio (índice 1) para mostrar 3 imágenes (izq cortada, centro resaltada, der cortada)
    useEffect(() => {
        const centerMiddleImage = () => {
            if (galleryScrollRef.current) {
                const container = galleryScrollRef.current;
                const initialIndex = galleryList.length >= 2 ? 1 : 0;
                const cards = container.children;
                if (cards[initialIndex]) {
                    const card = cards[initialIndex] as HTMLElement;
                    const targetLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
                    container.scrollLeft = Math.max(0, targetLeft);
                    setActiveImageIndex(initialIndex);
                }
            }
        };

        const t1 = setTimeout(centerMiddleImage, 60);
        const t2 = setTimeout(centerMiddleImage, 250);
        const t3 = setTimeout(centerMiddleImage, 600);

        window.addEventListener('resize', centerMiddleImage);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener('resize', centerMiddleImage);
        };
    }, [galleryList]);

    // Auto-deslizamiento continuo cada 3.5 segundos rotando por las imágenes
    useEffect(() => {
        if (galleryList.length <= 1) return;

        const autoSlideTimer = setInterval(() => {
            if (isPausedRef.current || !galleryScrollRef.current) return;
            setActiveImageIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % galleryList.length;
                scrollToImage(nextIndex);
                return nextIndex;
            });
        }, 3500);

        return () => clearInterval(autoSlideTimer);
    }, [galleryList.length]);

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
                        <header className="relative z-20 pt-16 sm:pt-20 md:pt-24 text-center px-4">
                            <p className="font-serif tracking-[0.28em] md:tracking-[0.36em] text-xs sm:text-sm md:text-base text-white font-medium uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                {dateText}
                            </p>
                        </header>

                        {/* --- PARTE CENTRAL: NOMBRES DE LOS NOVIOS --- */}
                        <div className="relative z-20 w-full max-w-[340px] sm:max-w-[380px] md:max-w-[560px] lg:max-w-[660px] mx-auto px-4 my-auto flex flex-col select-none">
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

                        {/* Espaciador inferior del Hero con audio tag persistente */}
                        <div className="relative z-20 pb-4 md:pb-6 text-center">
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
                        <div className="canvas-container invitation-section flex flex-col justify-between px-6 pt-3 sm:pt-4 pb-0 select-none shrink-0">
                            {/* Decoración botánica rama derecha */}
                            <img
                                src="/resources_canvas/images/plantaladoderecho.webp"
                                alt="Decoración botánica"
                                className="absolute -top-12 -right-10 -rotate-12 w-28 sm:w-32 object-contain pointer-events-none select-none z-30"
                            />

                            {/* Top: REPRODUCTOR DE MÚSICA */}
                            <div className="relative z-20 flex flex-col pt-1 sm:pt-2 items-center text-center">
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
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors" title="Aleatorio">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                                        </svg>
                                    </button>
                                    {/* Anterior */}
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors" title="Anterior">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                                        </svg>
                                    </button>
                                    {/* Play / Pausa circular */}
                                    <button
                                        type="button"
                                        onClick={togglePlay}
                                        className="w-10 h-10 rounded-full bg-[#728c96] hover:bg-[#5f7a84] text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
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
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors" title="Siguiente">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                        </svg>
                                    </button>
                                    {/* Repetir */}
                                    <button type="button" className="text-[#78929b] hover:text-[#52777c] transition-colors" title="Repetir">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Icono de huellitas con corazón */}
                                <div className="w-18 h-18 sm:w-16 sm:h-16 mt-6 sm:mt-7 flex items-center justify-center">
                                    <img
                                        src="/resources_canvas/images/2.svg"
                                        alt="Huella de amor"
                                        className="w-full h-full object-contain opacity-90"
                                    />
                                </div>
                            </div>

                            {/* Middle: Contenido de Padres y Padrinos en columna única centrada (idéntico a móvil) */}
                            <div className="relative z-20 flex flex-col items-center justify-center my-auto py-2 mt-4 w-full">
                                {/* --- BLOQUE: NUESTROS PADRES --- */}
                                <div className="flex flex-col items-center text-center w-full">
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
                                <div className="flex flex-col items-center mt-12 sm:mt-8 text-center w-full">
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
                            <div className="relative z-20 w-full flex justify-center items-end -mb-1 pointer-events-none select-none">
                                <img
                                    src="/resources_canvas/images/3.svg"
                                    alt="Perrito con anillo"
                                    className="w-full object-contain drop-shadow-sm scale-[0.9] transform origin-bottom -translate-y-50 sm:-translate-y-50"
                                />
                            </div>
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 3: GALERÍA & CUENTA REGRESIVA                     */}
                    {/* (Pantalla completa tipo Canva con zoom en escritorio)     */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-center select-none shrink-0 overflow-hidden">
                        <div className="canvas-container min-h-[65svh] sm:min-h-[640px] flex flex-col items-center justify-start pt-3 sm:pt-5 pb-8 px-0 select-none shrink-0">
                            {/* --- BLOQUE SUPERIOR: TÍTULO Y CARRUSEL DE GALERÍA --- */}
                            <div className="flex flex-col items-center w-full mt-8">
                                {/* Título de Galería */}
                                <h2 className="font-serif text-[12.3px] sm:text-[14px] tracking-[0.32em] text-[#788a80] uppercase font-medium mt-8 mb-3 sm:mb-4 text-center px-4">
                                    GALERÍA
                                </h2>

                                {/* Contenedor del Carrusel Horizontal con snap touch scroll */}
                                <div
                                    ref={galleryScrollRef}
                                    onScroll={handleGalleryScroll}
                                    onTouchStart={handleUserInteraction}
                                    onMouseDown={handleUserInteraction}
                                    className="w-full flex items-center gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar py-3 px-[24%]"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {galleryList.map((imageSrc, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => scrollToImage(idx)}
                                            className={`w-[52%] max-w-[280px] h-[210px] sm:h-[260px] shrink-0 rounded-2xl overflow-hidden shadow-md bg-stone-100 snap-center border border-stone-200/60 cursor-pointer transition-all duration-300 ${activeImageIndex === idx
                                                ? 'scale-105 shadow-2xl ring-2 ring-[#788a80] opacity-100 z-20'
                                                : 'scale-90 opacity-60 hover:opacity-85 z-10'
                                                }`}
                                        >
                                            <img
                                                src={imageSrc}
                                                alt={`Foto galería ${idx + 1}`}
                                                className="w-full h-full object-cover select-none pointer-events-none"
                                                loading="lazy"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Indicadores de paginación (Dots) */}
                                <div className="flex items-center justify-center gap-1.5 mt-2.5 sm:mt-3 px-4">
                                    {galleryList.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => scrollToImage(idx)}
                                            aria-label={`Ir a foto ${idx + 1}`}
                                            className={`transition-all duration-300 rounded-full ${activeImageIndex === idx
                                                ? 'w-5 h-1.5 bg-[#788a80]'
                                                : 'w-1.5 h-1.5 bg-[#cbd5cc] hover:bg-[#a8b8ae]'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* --- BLOQUE INFERIOR: CUENTA REGRESIVA SUBIDA Y COMPACTA --- */}
                            <div className="flex flex-col items-center text-center mt-5 sm:mt-7 px-4">
                                {/* "FALTAN" */}
                                <span className="font-serif text-[10px] sm:text-[11px] tracking-[0.3em] text-[#788a80] uppercase font-medium mb-2 sm:mb-2.5 mt-3">
                                    FALTAN
                                </span>

                                {/* Contenedor de Tiempo: DÍAS, HORAS, MINS, SEGS */}
                                <div className="flex items-start justify-center gap-1 sm:gap-2">
                                    {/* Días */}
                                    <div className="flex flex-col items-center w-14 sm:w-16">
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
                                    <div className="flex flex-col items-center w-14 sm:w-16">
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
                                    <div className="flex flex-col items-center w-14 sm:w-16">
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
                                    <div className="flex flex-col items-center w-14 sm:w-16">
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
                    {/* (Camino punteado original de Canva con zoom en escritorio) */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#748270] -mt-[1px] flex flex-col items-center justify-center select-none shrink-0 overflow-hidden">
                        {/* Fondo de textura auténtica de Canva sobre el verde olivo extendido borde a borde */}
                        <img
                            src="/images/canva_assets/asset_17_9c5d7925.png"
                            alt="Fondo textura Itinerario"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0 opacity-40 mix-blend-multiply"
                        />

                        {/* Huellitas decorativas en esquina superior izquierda */}
                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-14 h-14 sm:w-16 sm:h-16 pointer-events-none select-none z-20 opacity-80">
                            <img
                                src="/resources_canvas/images/4.svg"
                                alt="Huellitas"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Perrito con anillo asomándose en la esquina inferior derecha */}
                        <div className="absolute -bottom-2 -right-4 sm:right-0 w-[170px] sm:w-[215px] pointer-events-none select-none z-30">
                            <img
                                src="/images/canva_assets/asset_13_254b129a.png"
                                alt="Perrito asomándose"
                                className="w-full h-auto object-contain drop-shadow-md"
                            />
                        </div>

                        {/* Contenedor Canva con zoom proporcional */}
                        <div className="canvas-container invitation-section flex flex-col justify-between pt-6 sm:pt-8 pb-4 px-4 sm:px-6 select-none shrink-0 relative z-20">
                            {/* Título de la sección: Itinerario */}
                            <div className="w-full text-center pt-2 sm:pt-4">
                                <h2 className="font-script text-[2.8rem] sm:text-[3.5rem] text-[#fbf9f4] tracking-wide font-normal leading-none drop-shadow-sm">
                                    Itinerario
                                </h2>
                            </div>

                            {/* Camino punteado auténtico de Canva en todas las pantallas */}
                            <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-10 flex items-center justify-center">
                                <img
                                    src="/images/canva_assets/asset_14_2f7e2899.svg"
                                    alt="Camino punteado"
                                    className="w-full h-full object-fill opacity-80 brightness-110"
                                />
                            </div>

                            {/* 6 Paradas a lo largo de la ruta curva */}
                            <div className="flex flex-1 flex-col justify-around py-2 sm:py-4 relative z-20">
                                {/* 1. MISA - 3:00 PM */}
                                <div className="flex items-center justify-center -translate-x-2 sm:-translate-x-3 gap-3.5 sm:gap-4">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                                        <img
                                            src="/resources_canvas/images/5.svg"
                                            alt="Misa"
                                            className="w-full h-full object-contain filter drop-shadow"
                                        />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-serif text-[11px] sm:text-[12.5px] tracking-[0.24em] text-[#fbf9f4] font-semibold uppercase">
                                            MISA
                                        </span>
                                        <span className="font-serif text-[10px] sm:text-[11.5px] tracking-[0.18em] text-[#fbf9f4]/90 font-light mt-0.5">
                                            3:00 PM
                                        </span>
                                    </div>
                                </div>

                                {/* 2. ROMPEHIELOS - 4:30 PM */}
                                <div className="flex items-center justify-start pl-7 sm:pl-14 gap-3.5 sm:gap-4">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                                        <img
                                            src="/resources_canvas/images/6.svg"
                                            alt="Rompehielos"
                                            className="w-full h-full object-contain filter drop-shadow"
                                        />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-serif text-[11px] sm:text-[12.5px] tracking-[0.22em] text-[#fbf9f4] font-semibold uppercase">
                                            ROMPEHIELOS
                                        </span>
                                        <span className="font-serif text-[10px] sm:text-[11.5px] tracking-[0.18em] text-[#fbf9f4]/90 font-light mt-0.5">
                                            4:30 PM
                                        </span>
                                    </div>
                                </div>

                                {/* 3. BRINDIS - 5:30 PM */}
                                <div className="flex items-center justify-end pr-8 sm:pr-16 gap-3.5 sm:gap-4">
                                    <div className="flex flex-col text-right">
                                        <span className="font-serif text-[11px] sm:text-[12.5px] tracking-[0.24em] text-[#fbf9f4] font-semibold uppercase">
                                            BRINDIS
                                        </span>
                                        <span className="font-serif text-[10px] sm:text-[11.5px] tracking-[0.18em] text-[#fbf9f4]/90 font-light mt-0.5">
                                            5:30 PM
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                                        <img
                                            src="/resources_canvas/images/7.svg"
                                            alt="Brindis"
                                            className="w-full h-full object-contain filter drop-shadow"
                                        />
                                    </div>
                                </div>

                                {/* 4. CENA - 6:00 PM */}
                                <div className="flex items-center justify-center translate-x-5 sm:translate-x-7 gap-3.5 sm:gap-4">
                                    <div className="flex flex-col text-right">
                                        <span className="font-serif text-[11px] sm:text-[12.5px] tracking-[0.24em] text-[#fbf9f4] font-semibold uppercase">
                                            CENA
                                        </span>
                                        <span className="font-serif text-[10px] sm:text-[11.5px] tracking-[0.18em] text-[#fbf9f4]/90 font-light mt-0.5">
                                            6:00 PM
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                                        <img
                                            src="/resources_canvas/images/8.svg"
                                            alt="Cena"
                                            className="w-full h-full object-contain filter drop-shadow"
                                        />
                                    </div>
                                </div>

                                {/* 5. FIESTA - 7:00 PM */}
                                <div className="flex items-center justify-end pr-16 sm:pr-24 gap-3.5 sm:gap-4">
                                    <div className="flex flex-col text-right">
                                        <span className="font-serif text-[11px] sm:text-[12.5px] tracking-[0.24em] text-[#fbf9f4] font-semibold uppercase">
                                            FIESTA
                                        </span>
                                        <span className="font-serif text-[10px] sm:text-[11.5px] tracking-[0.18em] text-[#fbf9f4]/90 font-light mt-0.5">
                                            7:00 PM
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                                        <img
                                            src="/resources_canvas/images/9.svg"
                                            alt="Fiesta"
                                            className="w-full h-full object-contain filter drop-shadow"
                                        />
                                    </div>
                                </div>

                                {/* 6. CLAUSURA - 10:30 PM */}
                                <div className="flex items-center justify-start pl-8 sm:pl-16 gap-3.5 sm:gap-4 mb-2 sm:mb-3">
                                    <div className="flex flex-col text-right">
                                        <span className="font-serif text-[11px] sm:text-[12.5px] tracking-[0.22em] text-[#fbf9f4] font-semibold uppercase">
                                            CLAUSURA
                                        </span>
                                        <span className="font-serif text-[10px] sm:text-[11.5px] tracking-[0.18em] text-[#fbf9f4]/90 font-light mt-0.5">
                                            10:30 PM
                                        </span>
                                    </div>
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                                        <img
                                            src="/resources_canvas/images/10.svg"
                                            alt="Clausura"
                                            className="w-full h-full object-contain brightness-0 invert opacity-95 filter drop-shadow"
                                        />
                                    </div>
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

                                {/* 12.svg: Planta lado izquierdo */}
                                <div className="absolute -left-7 sm:-left-8 top-[33%] w-24 sm:w-28 pointer-events-none select-none z-20">
                                    <img
                                        src="/resources_canvas/images/12.svg"
                                        alt="Decoración botánica izquierda"
                                        className="w-full h-auto object-contain"
                                    />
                                </div>

                                {/* 13.svg: Planta lado derecho inferior */}
                                <div className="absolute -right-6 sm:-right-7 bottom-0 sm:bottom-1 w-36 sm:w-38 pointer-events-none select-none z-20 -mr-12 -mt-32 -translate-y-30 sm:-translate-y-32">
                                    <img
                                        src="/resources_canvas/images/13.svg"
                                        alt="Decoración botánica derecha"
                                        className="w-full h-auto object-contain"
                                    />
                                </div>

                                {/* Contenido Interior */}
                                <div className="relative z-10 w-full h-full flex flex-col items-center justify-between text-center pt-2 pb-5 px-2">

                                    {/* Bloque Superior: Sello y Título Ubicación */}
                                    <div className="flex flex-col items-center w-full translate-y-6 sm:translate-y-8">
                                        {/* 11.svg: Sello de cera con huellita */}
                                        <div className="w-[66px] h-[66px] sm:w-[74px] sm:h-[74px] shrink-0 flex items-center justify-center drop-shadow-md mb-0.5">
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
                                    <div className="flex flex-col items-center my-auto">
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
                                            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#4c6070] border border-[#cbd5df] shadow-sm rounded-[10px] px-3.5 py-2 transition-all active:scale-95 group"
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
                                    <div className="flex flex-col items-center my-auto -translate-y-16 sm:-translate-y-22">
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
                                            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#4c6070] border border-[#cbd5df] shadow-sm rounded-[10px] px-3.5 py-2 transition-all active:scale-95 group"
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
                                    <div className="flex flex-col items-center my-auto -translate-y-32 sm:-translate-y-38">
                                        <h2 className="font-script text-[1.9rem] sm:text-[1.8rem] text-[#617485] leading-none mb-2 font-normal drop-shadow-sm">
                                            Mesa de regalos
                                        </h2>
                                        <div className="flex flex-col gap-2.5 w-full max-w-[145px] sm:max-w-[160px]">
                                            <a
                                                href={wedding?.gift_registry_url || 'https://mesaderegalos.liverpool.com.mx'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#4c6070] border border-[#cbd5df] shadow-sm rounded-[10px] px-3.5 py-1.5 transition-all active:scale-95 group"
                                            >
                                                <span className="font-serif text-[11px] sm:text-[12px] tracking-normal font-bold uppercase">
                                                    LIVERPOOL
                                                </span>
                                                <span className="ml-2 text-sm text-[#4c6070] group-hover:translate-x-0.5 transition-transform">
                                                    →
                                                </span>
                                            </a>
                                            <a
                                                href={wedding?.gift_registry_url || 'https://www.amazon.com.mx'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#4c6070] border border-[#cbd5df] shadow-sm rounded-[10px] px-3.5 py-1.5 transition-all active:scale-95 group"
                                            >
                                                <span className="font-serif text-[11px] sm:text-[12px] tracking-[0.08em] font-bold uppercase">
                                                    AMAZON
                                                </span>
                                                <span className="ml-2 text-sm text-[#4c6070] group-hover:translate-x-0.5 transition-transform">
                                                    →
                                                </span>
                                            </a>
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
                            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
                                {/* 14.svg: Sobre abierto con sello de cera */}
                                <img
                                    src="/resources_canvas/images/14.svg"
                                    alt="Sobre de regalos"
                                    className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
                                />

                                {/* Monograma en la solapa superior (AJ escalonado) */}
                                <div className="absolute top-[15%] left-1/2 -translate-x-1/2 flex items-center font-script text-[#f7f4ea] opacity-95 drop-shadow-sm pointer-events-none select-none whitespace-nowrap leading-none mt-2 mr-6">
                                    <span className="text-[32px] sm:text-[50px] translate-x-[4px] -translate-y-[8px] sm:-translate-y-[10px]">
                                        A
                                    </span>
                                    <span className="text-[28px] sm:text-[52px] -translate-x-[12px] translate-y-[10px] sm:translate-y-[12px]">
                                        J
                                    </span>
                                </div>

                                {/* Mensaje dentro de la tarjeta blanca del sobre */}
                                <div className="absolute top-[39.5%] left-1/2 -translate-x-1/2 -translate-y-3 w-[64%] sm:w-[58%] text-center pointer-events-none select-none">
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
                    {/* SECCIÓN 7: CÓDIGO DE VESTIMENTA / DRESSCODE               */}
                    {/* (Foto novios con degradados, nombres, título e iconos)     */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-center pt-8 sm:pt-12 pb-0 px-0 select-none shrink-0 overflow-hidden min-h-0">
                        {/* Foto de los novios a ancho completo de pantalla */}
                        <div className="relative w-full flex flex-col items-center overflow-hidden">
                            <img
                                src="/images/canva_assets/asset_16_31fee922.jpeg"
                                alt="Adriana & Joaquín"
                                className="w-full h-auto block select-none pointer-events-none"
                            />

                            {/* Degradado superior y Nombres de los novios */}
                            <div className="absolute top-0 inset-x-0 h-40 sm:h-48 bg-gradient-to-b from-[#fbf9f4] via-[#fbf9f4]/80 to-transparent flex flex-col items-center justify-start pt-8 sm:pt-10 z-10 pointer-events-none select-none">
                                <h2 className="font-script text-[2.8rem] sm:text-[3.4rem] text-[#788e80] leading-[0.88] text-center flex flex-col items-center drop-shadow-sm font-normal">
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
                                <h3 className="font-script text-[3.0rem] sm:text-[3.6rem] text-[#556c7d] leading-none mb-5 sm:mb-6 drop-shadow-sm font-normal text-center tracking-normal">
                                    Dresscode
                                </h3>

                                {/* Columnas de Guayabera y Vestido */}
                                <div className="grid grid-cols-2 gap-6 sm:gap-8 w-full max-w-[340px] sm:max-w-[360px] mb-8 sm:mb-9">
                                    {/* 17.svg: Guayabera */}
                                    <div className="flex items-center gap-2.5 sm:gap-3 justify-center">
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
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
                                    <div className="flex items-center gap-2.5 sm:gap-3 justify-center">
                                        <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
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
                                <h4 className="font-serif text-[11px] sm:text-[12.5px] font-semibold tracking-[0.2em] uppercase text-[#556c7d] text-center mb-3">
                                    EXCLUSIVO NOVIOS
                                </h4>

                                {/* 6 Círculos de color */}
                                <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-7">
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#ffffff] border border-[#d6cfc2] shadow-md transition-transform hover:scale-105"
                                        title="Blanco"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f4f1ec] border border-[#d6cfc2] shadow-md transition-transform hover:scale-105"
                                        title="Blanco hueso"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#fff7ed] border border-[#d6cfc2] shadow-md transition-transform hover:scale-105"
                                        title="Marfil"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#b0c5ac] border border-[#9eb39a] shadow-md transition-transform hover:scale-105"
                                        title="Verde sage claro"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#9ba998] border border-[#8a9887] shadow-md transition-transform hover:scale-105"
                                        title="Verde sage medio"
                                    />
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#727f6e] border border-[#616e5d] shadow-md transition-transform hover:scale-105"
                                        title="Verde olivo oscuro"
                                    />
                                </div>

                                {/* COLORES A EVITAR */}
                                <h4 className="font-serif text-[11px] sm:text-[12.5px] font-semibold tracking-[0.2em] uppercase text-[#556c7d] text-center mb-3">
                                    COLORES A EVITAR
                                </h4>

                                {/* Círculo Rojo */}
                                <div className="flex items-center justify-center mb-6 sm:mb-7">
                                    <div
                                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#a90f0f] border border-[#8f0c0c] shadow-md transition-transform hover:scale-105"
                                        title="Rojo intenso"
                                    />
                                </div>

                                {/* Texto explicativo exacto en 3 líneas */}
                                <p className="font-serif text-[9px] sm:text-[10px] font-medium tracking-[0.06em] uppercase text-[#617482] leading-[1.6] text-center w-full max-w-[420px] px-2">
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
                        <div className="canvas-container flex flex-col items-center relative z-10">
                            {/* Icono: Corazón con huella de perrito (26.svg) */}
                            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-5 flex items-center justify-center">
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
                        <div className="relative w-full flex flex-col items-center overflow-hidden z-10">
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
                            <h2 className="font-script text-[3rem] sm:text-[3.6rem] text-[#788e80] leading-none mb-3 text-center tracking-normal">
                                Hospedaje
                            </h2>

                            {/* Subtítulo */}
                            <p className="font-serif text-[9.5px] sm:text-[11px] tracking-[0.22em] text-[#788a80] font-medium uppercase text-center max-w-[320px] sm:max-w-[390px] leading-relaxed mb-4 sm:mb-6 px-4">
                                ESTAREMOS ENCANTADOS QUE NOS ACOMPAÑES Y DISFRUTES TODA LA EXPERIENCIA
                            </p>

                            {/* Carrusel fluido y accesible de hoteles */}
                            <HotelCarousel hotels={hotelList} />
                        </div>
                    </section>

                    {/* ========================================================= */}
                    {/* SECCIÓN 10: CONFIRMACIÓN DE ASISTENCIA ("¿Nos acompañas?") */}
                    {/* ========================================================= */}
                    <section className="relative w-full bg-[#fbf9f4] -mt-[1px] flex flex-col items-center justify-start pt-6 sm:pt-8 pb-14 sm:pb-16 px-4 select-none overflow-hidden">
                        <div className="canvas-container flex flex-col items-center">
                            {/* Título en letra cursiva */}
                            <h2 className="font-script text-[3.2rem] sm:text-[3.9rem] text-[#788e80] leading-none mb-2 text-center">
                                ¿Nos acompañas?
                            </h2>

                            {/* Subtítulo */}
                            <p className="font-serif text-[9.5px] sm:text-[11px] tracking-[0.24em] text-[#788a80] font-medium uppercase text-center mb-6 sm:mb-8 px-2">
                                QUEREMOS CONTAR CONTIGO EN ESTE DÍA TAN ESPECIAL
                            </p>

                            {/* Tarjeta del formulario con borde suave azul/gris */}
                            <div className="w-full max-w-[390px] bg-white rounded-2xl border border-[#b8c9d9] shadow-sm p-6 sm:p-7">
                                {rsvpSubmitted ? (
                                    <div className="flex flex-col items-center text-center py-6 animate-fadeIn">
                                        <div className="w-12 h-12 rounded-full bg-[#edf4f0] text-[#788e80] flex items-center justify-center text-2xl mb-3">
                                            ✓
                                        </div>
                                        <h4 className="font-script text-3xl md:text-4xl text-[#788e80] mb-2">
                                            ¡Muchas Gracias, {rsvpName || invitation?.name}!
                                        </h4>
                                        <p className="font-serif text-[12px] sm:text-[13px] md:text-[14px] text-stone-600 tracking-wide mb-4 leading-relaxed">
                                            {rsvpAttending === 'yes' || Object.values(guestAttendingMap).some(Boolean)
                                                ? '¡Nos emociona muchísimo contar con tu presencia en nuestro gran día!'
                                                : 'Lamentamos que no puedas acompañarnos físicamente, ¡te llevaremos en el corazón!'}
                                        </p>
                                        {rsvpMessage && (
                                            <p className="text-[12px] md:text-[13px] italic text-stone-500 bg-[#fbf9f4] p-3.5 md:p-4 rounded-xl border border-stone-200/60 mb-5 max-w-[320px] md:max-w-md">
                                                "{rsvpMessage}"
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setRsvpSubmitted(false)}
                                            className="font-serif text-[11px] md:text-[12px] tracking-wider uppercase text-[#788a80] underline hover:text-[#556c7d] cursor-pointer"
                                        >
                                            Modificar respuesta
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRsvpSubmit} className="flex flex-col space-y-4 sm:space-y-5">
                                        {/* Si es una invitación personalizada recibida con token */}
                                        {invitation ? (
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
                                        ) : (
                                            /* Campo: Nombre (en caso de landing abierta sin token) */
                                            <div>
                                                <label className="font-serif text-[11px] sm:text-[11.5px] tracking-[0.14em] text-[#556c7d] uppercase font-semibold block mb-1.5">
                                                    Nombre
                                                </label>
                                                <input
                                                    type="text"
                                                    value={rsvpName}
                                                    onChange={(e) => setRsvpName(e.target.value)}
                                                    placeholder="Escribe tu nombre completo"
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#b8c9d9] text-[13px] text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#788a80] focus:border-[#788a80] bg-[#fafbfc] transition-all"
                                                />
                                            </div>
                                        )}

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
                                            className="w-full py-3 px-6 rounded-full bg-[#6f879a] hover:bg-[#5c7385] active:scale-[0.99] text-white font-serif text-[12px] sm:text-[13px] tracking-[0.18em] uppercase font-medium shadow transition-all duration-300 mt-2 disabled:opacity-60 cursor-pointer"
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
                        <div className="canvas-container flex flex-col items-center justify-center text-center relative z-10 pb-2">
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

                        {/* Hojas de eucalipto en la esquina inferior derecha sin dejar bordes en la pantalla */}
                        <img
                            src="/images/canva_assets/eucalipto_footer.png"
                            alt="Hojas de eucalipto"
                            className="absolute bottom-0 right-0 w-36 min-[400px]:w-44 sm:w-56 md:w-64 h-auto object-contain pointer-events-none select-none z-0 opacity-90"
                        />
                    </footer>

                </div>
            </main>
        </>
    );
}

