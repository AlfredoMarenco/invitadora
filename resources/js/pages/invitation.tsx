import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    MapPin, 
    Navigation, 
    Calendar, 
    Clock, 
    Music, 
    Pause, 
    Gift, 
    CheckCircle2, 
    Copy, 
    Check, 
    Heart, 
    ExternalLink, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    Building2,
    Users
} from 'lucide-react';
import TimelineSvg from '../Components/TimelineSvg';

interface Guest {
    id: number;
    full_name: string;
    is_attending?: boolean | null;
    allergies?: string | null;
}

interface InvitationData {
    id: number;
    token: string;
    status: 'pending' | 'viewed' | 'responded';
    message_to_couple?: string | null;
    rsvp_deadline?: string | null;
    guests: Guest[];
}

interface WeddingData {
    bride_name: string;
    groom_name: string;
    wedding_date: string;
    rsvp_deadline?: string | null;
    background_music_path?: string | null;
    hero_image?: string | null;
    bride_parents?: string[] | null;
    groom_parents?: string[] | null;
    bride_godparents?: string[] | null;
    groom_godparents?: string[] | null;
    galleryImages?: { image_path: string }[];
    timeline?: { time: string; title: string; description?: string }[];
    locations?: {
        ceremony?: string;
        ceremony_address?: string;
        ceremony_maps?: string;
        reception?: string;
        reception_address?: string;
        reception_maps?: string;
    };
    gift_registry_url?: string | null;
    bank_transfer_info?: string | null;
    dress_code?: string | null;
    no_children_message?: string | null;
    accommodations?: {
        name: string;
        address?: string;
        phone?: string;
        booking_url?: string;
        discount_code?: string;
    }[];
}

interface Props {
    wedding: WeddingData;
    invitation?: InvitationData | null;
}

export default function Invitation({ wedding, invitation }: Props) {
    // 1. Formateo de Fechas
    const dateParts = wedding?.wedding_date 
        ? wedding.wedding_date.split('T')[0].split(' ')[0].split('-')
        : ['2027', '02', '20'];
    const eventDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    const shortMonth = eventDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
    const year = eventDate.getFullYear();
    const formattedDate = `${day} ${month} ${year}`;

    // Nombres de los novios
    const brideName = wedding?.bride_name 
        ? wedding.bride_name.charAt(0).toUpperCase() + wedding.bride_name.slice(1) 
        : 'Adriana';
    const groomName = wedding?.groom_name 
        ? wedding.groom_name.charAt(0).toUpperCase() + wedding.groom_name.slice(1) 
        : 'Joaquín';

    // 2. Audio Player
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(() => {
                setIsPlaying(false);
            });
        }
    };

    // 3. Cuenta Regresiva
    function calculateTimeLeft() {
        const difference = +eventDate - +new Date();
        if (difference > 0) {
            return {
                días: Math.floor(difference / (1000 * 60 * 60 * 24)),
                horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutos: Math.floor((difference / (1000 * 60)) % 60),
                segundos: Math.floor((difference / 1000) % 60)
            };
        }
        return { días: 0, horas: 0, minutos: 0, segundos: 0 };
    }

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [eventDate]);

    // 4. Galería con drag-to-scroll
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
    };
    const onMouseLeave = () => setIsDragging(false);
    const onMouseUp = () => setIsDragging(false);
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !sliderRef.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        sliderRef.current.scrollLeft = scrollLeft - walk;
    };

    const mockupGallery = [
        '/images/canva_assets/asset_11_757d9c15.jpeg',
        '/images/canva_assets/asset_12_b621e78d.jpeg',
        '/images/canva_assets/asset_10_a4d57a87.jpeg',
        '/images/canva_assets/asset_9_bae68936.jpeg',
        '/images/canva_assets/asset_16_31fee922.jpeg'
    ];

    const galleryPhotos = wedding?.galleryImages && wedding.galleryImages.length > 0 
        ? wedding.galleryImages.map(img => img.image_path) 
        : mockupGallery;

    // 5. Itinerario
    const mockupTimeline = [
        { time: '16:00', title: 'Misa', description: 'Ceremonia religiosa' },
        { time: '17:30', title: 'Rompehielos', description: 'Cóctel de bienvenida' },
        { time: '18:30', title: 'Baile de novios', description: 'Primer vals' },
        { time: '19:00', title: 'Brindis', description: 'Palabras y buenos deseos' },
        { time: '19:30', title: 'Cena', description: 'Banquete nupcial' },
        { time: '21:00', title: 'Fiesta', description: 'Música y celebración' },
        { time: '02:00', title: 'Clausura', description: 'Fin de la velada' },
    ];

    const timelineEvents = wedding?.timeline && wedding.timeline.length > 0 
        ? wedding.timeline 
        : mockupTimeline;

    // 6. Estado de Copiado de Datos Bancarios
    const [copiedBank, setCopiedBank] = useState(false);
    const [showBankDetails, setShowBankDetails] = useState(false);

    const copyBankInfo = () => {
        if (!wedding?.bank_transfer_info) return;
        navigator.clipboard.writeText(wedding.bank_transfer_info).then(() => {
            setCopiedBank(true);
            setTimeout(() => setCopiedBank(false), 2500);
        });
    };

    // 7. Swatches de colores de Dresscode
    const dresscodeSwatches = [
        { color: '#38493b', label: 'Verde Bosque', svg: '/resources_canvas/images/19.svg' },
        { color: '#526656', label: 'Verde Oliva', svg: '/resources_canvas/images/20.svg' },
        { color: '#748677', label: 'Salvia Medio', svg: '/resources_canvas/images/21.svg' },
        { color: '#97a698', label: 'Salvia Claro', svg: '/resources_canvas/images/22.svg' },
        { color: '#c4d0c5', label: 'Eucalipto Suave', svg: '/resources_canvas/images/23.svg' },
        { color: '#b99d7f', label: 'Dorado Antiguo', svg: '/resources_canvas/images/24.svg' },
        { color: '#decebe', label: 'Champaña', svg: '/resources_canvas/images/25.svg' },
    ];

    // 8. Hoteles sugeridos
    const defaultAccommodations = [
        {
            name: 'Hotel Misión Grand',
            address: 'Av. Principal #100, Zona Centro',
            phone: '+52 (442) 123 4567',
            booking_url: 'https://www.hotelesmision.com.mx',
            discount_code: 'BODA-AYJ'
        },
        {
            name: 'Fiesta Americana Hacienda',
            address: 'Carretera al Campanario Km 2.5',
            phone: '+52 (442) 987 6543',
            booking_url: 'https://www.fiestamericana.com',
            discount_code: 'ADRIANAYJOAQUIN'
        },
        {
            name: 'Hotel Boutique Casa Nupcial',
            address: 'Calle de las Rosas #42',
            phone: '+52 (442) 555 0199',
            booking_url: 'https://booking.com',
            discount_code: 'CONVENIO2027'
        }
    ];

    const accommodations = wedding?.accommodations && wedding.accommodations.length > 0
        ? wedding.accommodations
        : defaultAccommodations;

    // Fecha límite para RSVP
    const effectiveDeadline = invitation?.rsvp_deadline || wedding?.rsvp_deadline;
    const isDeadlinePassed = effectiveDeadline ? new Date() > new Date(effectiveDeadline) : false;

    return (
        <div className="min-h-screen text-[#2a3b4c] font-sans selection:bg-[#728675] selection:text-white pb-16 relative overflow-x-hidden" style={{ backgroundColor: '#f9f8f5' }}>
            <Head title={`Boda de ${brideName} & ${groomName} | Invitación`} />

            {/* Estilos tipográficos y utilitarios acordes a Canva */}
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
                .font-script { font-family: 'New Icon Script', 'Great Vibes', cursive; }
                .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
                .font-sans { font-family: 'Montserrat', system-ui, sans-serif; }
                
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .arch-frame {
                    border-radius: 200px 200px 16px 16px;
                }
            `}} />

            {/* Audio oculto */}
            <audio 
                ref={audioRef} 
                src={wedding?.background_music_path || '/images/canva_assets/ambient.mp3'} 
                preload="metadata" 
                loop 
            />

            {/* Botón flotante de Música */}
            <div className="fixed top-5 right-5 z-50">
                <button
                    type="button"
                    onClick={toggleAudio}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-md text-[#728675] shadow-lg border border-[#728675]/20 hover:scale-105 active:scale-95 transition-all duration-300 group"
                    title={isPlaying ? "Pausar música" : "Reproducir música"}
                >
                    <span className="relative flex h-3 w-3">
                        {isPlaying && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#728675] opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-[#728675]' : 'bg-gray-300'}`}></span>
                    </span>
                    {isPlaying ? (
                        <Volume2 className="w-4 h-4 text-[#728675] animate-pulse" />
                    ) : (
                        <VolumeX className="w-4 h-4 text-[#728675]/70" />
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#728675] pr-1">
                        {isPlaying ? 'Música' : 'Play'}
                    </span>
                </button>
            </div>

            {/* CONTENEDOR MÁXIMO CENTRADO */}
            <div className="w-full max-w-[620px] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto shadow-2xl relative bg-[#f9f8f5] overflow-hidden">

                {/* ========================================================
                    SECCIÓN 1: HERO / PORTADA & CUENTA REGRESIVA
                ======================================================== */}
                <section className="relative px-6 pt-16 pb-20 text-center flex flex-col items-center overflow-hidden bg-[#f3f1ea]">
                    {/* Hojas decorativas de fondo (superior) */}
                    <img 
                        src="/resources_canvas/images/4.svg" 
                        alt="Decoración" 
                        className="absolute -top-6 -right-6 w-32 md:w-44 opacity-40 pointer-events-none" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                    />
                    <img 
                        src="/resources_canvas/images/2.svg" 
                        alt="Decoración" 
                        className="absolute -top-6 -left-6 w-32 md:w-44 opacity-40 pointer-events-none" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                    />

                    {/* Marco de Foto Principal / Retrato */}
                    <div className="relative w-full max-w-[320px] md:max-w-[380px] aspect-[3/4] arch-frame overflow-hidden shadow-xl mb-10 border-4 border-white/80">
                        <img 
                            src={wedding?.hero_image || '/images/canva_assets/backgroundhero1.jpg'} 
                            alt={`Boda de ${brideName} y ${groomName}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback a foto 1 de Canva
                                (e.target as HTMLImageElement).src = '/resources_canvas/images/1.svg';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    </div>

                    {/* Título de los Novios (Caligrafía Canva) */}
                    <div className="mb-6 relative z-10">
                        <h1 className="font-script text-7xl md:text-8xl lg:text-9xl text-[#728675] leading-none drop-shadow-sm">
                            {brideName}
                        </h1>
                        <div className="my-1">
                            <span className="font-script text-4xl md:text-5xl text-[#8ba2b8] opacity-80">&amp;</span>
                        </div>
                        <h1 className="font-script text-7xl md:text-8xl lg:text-9xl text-[#728675] leading-none drop-shadow-sm">
                            {groomName}
                        </h1>
                    </div>

                    {/* Fecha del Evento */}
                    <div className="mb-12">
                        <p className="font-serif text-sm md:text-base tracking-[0.35em] uppercase text-[#55697d] font-semibold">
                            {formattedDate}
                        </p>
                    </div>

                    {/* Cuenta Regresiva estilo Canva */}
                    <div className="w-full max-w-md mx-auto bg-white/70 backdrop-blur-sm py-6 px-4 rounded-2xl border border-[#728675]/15 shadow-sm">
                        <div className="flex justify-center items-center gap-2 md:gap-4 text-[#728675]">
                            <div className="flex flex-col items-center min-w-[50px] md:min-w-[65px]">
                                <span className="text-3xl md:text-4xl font-serif font-bold">{timeLeft.días.toString().padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#55697d] font-semibold mt-1">Días</span>
                            </div>
                            <span className="text-xl font-serif text-[#8ba2b8] -mt-4">:</span>
                            <div className="flex flex-col items-center min-w-[50px] md:min-w-[65px]">
                                <span className="text-3xl md:text-4xl font-serif font-bold">{timeLeft.horas.toString().padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#55697d] font-semibold mt-1">Horas</span>
                            </div>
                            <span className="text-xl font-serif text-[#8ba2b8] -mt-4">:</span>
                            <div className="flex flex-col items-center min-w-[50px] md:min-w-[65px]">
                                <span className="text-3xl md:text-4xl font-serif font-bold">{timeLeft.minutos.toString().padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#55697d] font-semibold mt-1">Minutos</span>
                            </div>
                            <span className="text-xl font-serif text-[#8ba2b8] -mt-4">:</span>
                            <div className="flex flex-col items-center min-w-[50px] md:min-w-[65px]">
                                <span className="text-3xl md:text-4xl font-serif font-bold text-[#8ba2b8]">{timeLeft.segundos.toString().padStart(2, '0')}</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#55697d] font-semibold mt-1">Segundos</span>
                            </div>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[#728675] font-bold mt-5 font-serif">
                            Para el gran día
                        </p>
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 2: NUESTROS PADRES Y PADRINOS
                ======================================================== */}
                <section className="px-6 py-20 text-center relative bg-[#f9f8f5] border-t border-[#e8e6df]">
                    {/* Adorno superior */}
                    <div className="flex justify-center mb-8">
                        <img 
                            src="/images/canva_assets/asset_14_2f7e2899.svg" 
                            alt="Ornamento" 
                            className="h-10 opacity-70"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                        />
                    </div>

                    <div className="max-w-lg mx-auto">
                        <h2 className="text-6xl md:text-7xl font-script text-[#728675] mb-8">
                            Nuestros Padres
                        </h2>

                        {/* Padres de la novia */}
                        <div className="space-y-2 mb-6">
                            {(wedding?.bride_parents && wedding.bride_parents.length > 0 
                                ? wedding.bride_parents 
                                : ['MÓNICA SÁNCHEZ GONZÁLEZ', 'ROBERTO HERRERA LÓPEZ']
                            ).map((parent, idx) => (
                                <p key={`bp_${idx}`} className="font-serif text-xs md:text-sm tracking-[0.22em] uppercase text-[#55697d] font-medium">
                                    {parent}
                                </p>
                            ))}
                        </div>

                        {/* Ampersand divisorio */}
                        <div className="py-2">
                            <span className="text-3xl font-script text-[#728675] opacity-75">&amp;</span>
                        </div>

                        {/* Padres del novio */}
                        <div className="space-y-2 mb-14">
                            {(wedding?.groom_parents && wedding.groom_parents.length > 0 
                                ? wedding.groom_parents 
                                : ['CARMEN TREVIÑO MORALES', 'JOAQUÍN VARGAS RÍOS']
                            ).map((parent, idx) => (
                                <p key={`gp_${idx}`} className="font-serif text-xs md:text-sm tracking-[0.22em] uppercase text-[#55697d] font-medium">
                                    {parent}
                                </p>
                            ))}
                        </div>

                        {/* Padrinos (si existen o mockup de Canva) */}
                        <div className="pt-4 border-t border-[#728675]/15">
                            <h2 className="text-6xl md:text-7xl font-script text-[#728675] mb-8 mt-6">
                                Nuestros Padrinos
                            </h2>

                            <div className="space-y-2">
                                {(wedding?.bride_godparents && wedding.bride_godparents.length > 0
                                    ? wedding.bride_godparents
                                    : ['ANA PAOLA HERRERA SÁNCHEZ', 'CARLOS EDUARDO VARGAS TREVIÑO']
                                ).map((godparent, idx) => (
                                    <p key={`bgp_${idx}`} className="font-serif text-xs md:text-sm tracking-[0.22em] uppercase text-[#728675] font-semibold">
                                        {godparent}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 3: GALERÍA DE FOTOS
                ======================================================== */}
                <section className="px-0 py-16 bg-[#f3f1ea] relative text-center border-t border-[#e8e6df]">
                    {/* Imagen de portada de galería (Perro con anillos o foto de los novios) */}
                    <div className="mb-6 px-6">
                        <img 
                            src="/images/canva_assets/perropregalery.png" 
                            alt="Galería Preview" 
                            className="w-full max-w-xs md:max-w-sm mx-auto object-contain arch-frame shadow-md opacity-95" 
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/resources_canvas/images/3.svg';
                            }} 
                        />
                    </div>
                    
                    <h2 className="text-xs md:text-sm tracking-[0.35em] uppercase text-[#728675] font-bold mb-8">
                        Galería
                    </h2>
                    
                    {/* Carrusel interactivo arrastrable */}
                    <div 
                        ref={sliderRef}
                        onMouseDown={onMouseDown}
                        onMouseLeave={onMouseLeave}
                        onMouseUp={onMouseUp}
                        onMouseMove={onMouseMove}
                        className={`flex overflow-x-auto gap-4 snap-x snap-mandatory hide-scrollbar pb-6 px-6 max-w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    >
                        {galleryPhotos.map((photo, idx) => (
                            <div key={idx} className="snap-center shrink-0 w-36 md:w-56 lg:w-64 rounded-2xl overflow-hidden shadow-md pointer-events-none border border-white">
                                <img 
                                    src={photo} 
                                    alt={`Foto ${idx + 1}`} 
                                    className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform duration-500" 
                                    loading="lazy"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center gap-2 mt-2">
                        {galleryPhotos.slice(0, 5).map((_, idx) => (
                            <div key={`dot-${idx}`} className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#728675]' : 'bg-[#d1dbed]'}`}></div>
                        ))}
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 4: ITINERARIO TEMÁTICO
                ======================================================== */}
                <section 
                    className="py-16 relative overflow-hidden flex flex-col items-center bg-[#728675] text-[#f3f1ea] border-t border-[#e8e6df]"
                    style={{
                        backgroundImage: "url('/images/canva_assets/asset_17_9c5d7925.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="w-full max-w-4xl mx-auto relative z-10 flex flex-col items-center px-4">
                        <h2 className="text-6xl md:text-7xl lg:text-8xl font-script text-[#f3f1ea] drop-shadow-md mb-8">
                            Itinerario
                        </h2>

                        {/* Contenedor de curva y eventos */}
                        <div className="relative flex justify-center w-[380px] sm:w-[480px] md:w-[600px] lg:w-[700px] min-h-[750px]">
                            {/* SVG de la curva como guía */}
                            <TimelineSvg className="w-full h-full pointer-events-none text-[#f3f1ea]/90 drop-shadow-sm" />
                            
                            {timelineEvents.map((event, index) => {
                                // Posiciones calculadas sobre el path curvo
                                const positions = [
                                    { top: '13%', left: '46%', align: 'right' },  // MISA
                                    { top: '26%', left: '26%', align: 'left' },   // ROMPEHIELOS
                                    { top: '38%', left: '42%', align: 'right' },  // BAILE DE NOVIOS
                                    { top: '52%', left: '56%', align: 'left' },   // BRINDIS
                                    { top: '65%', left: '46%', align: 'right' },  // CENA
                                    { top: '78%', left: '58%', align: 'left' },   // FIESTA
                                    { top: '91%', left: '48%', align: 'right' }   // CLAUSURA
                                ];
                                
                                const pos = positions[index] || { top: `${15 + (index * 12)}%`, left: '50%', align: 'right' };
                                const row = Math.floor(index / 4);
                                const col = index % 4;
                                const bgPosX = col * 33.3333;
                                const bgPosY = row * 100;
                                
                                return (
                                    <div 
                                        key={index} 
                                        className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2" 
                                        style={{ top: pos.top, left: pos.left }}
                                    >
                                        {/* Texto alineado a la izquierda del icono */}
                                        {pos.align === 'right' && (
                                            <div className="absolute right-full mr-3 md:mr-6 text-right w-max flex flex-col items-end">
                                                <span className="text-[10px] md:text-xs font-sans tracking-widest text-[#f3f1ea]/80">{event.time}</span>
                                                <h4 className="text-xs md:text-sm font-serif tracking-[0.2em] uppercase text-[#f3f1ea] font-bold drop-shadow-md">{event.title}</h4>
                                            </div>
                                        )}

                                        {/* Icono temático */}
                                        <div className="relative z-10 w-14 h-14 md:w-20 md:h-20 bg-white/10 backdrop-blur-sm rounded-full p-2.5 flex items-center justify-center border border-white/20 shadow-lg transform hover:scale-110 transition-transform">
                                            <div 
                                                className="w-full h-full"
                                                style={{
                                                    backgroundImage: "url('/images/canva_assets/asset_1_b790d454.png')",
                                                    backgroundSize: '400% 200%',
                                                    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                                                    backgroundRepeat: 'no-repeat',
                                                    filter: 'brightness(0) invert(1)'
                                                }}
                                            />
                                        </div>

                                        {/* Texto alineado a la derecha del icono */}
                                        {pos.align === 'left' && (
                                            <div className="absolute left-full ml-3 md:ml-6 text-left w-max flex flex-col items-start">
                                                <span className="text-[10px] md:text-xs font-sans tracking-widest text-[#f3f1ea]/80">{event.time}</span>
                                                <h4 className="text-xs md:text-sm font-serif tracking-[0.2em] uppercase text-[#f3f1ea] font-bold drop-shadow-md">{event.title}</h4>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Ilustración de esquina (Mascota / Detalle) */}
                    <img 
                        src="/images/canva_assets/asset_13_254b129a.png" 
                        className="absolute -bottom-6 -right-10 md:right-4 w-[180px] md:w-[280px] z-20 pointer-events-none drop-shadow-2xl opacity-95" 
                        alt="Detalle" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                </section>


                {/* ========================================================
                    SECCIÓN 5: UBICACIONES (IGLESIA Y RECEPCIÓN)
                ======================================================== */}
                <section className="px-6 py-20 bg-[#f9f8f5] relative text-center flex flex-col items-center overflow-hidden border-t border-[#e8e6df]">
                    <div className="relative w-full max-w-xl mx-auto py-12 px-6 md:px-12 z-10 flex flex-col items-center">
                        {/* Marco de encaje */}
                        <img 
                            src="/images/canva_assets/asset_15_e0a5b4ef.png" 
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-80" 
                            alt="Marco" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />

                        {/* Sello de cera azul con huella */}
                        <div className="relative w-20 h-20 md:w-24 md:h-24 mb-6">
                            <img 
                                src="/images/canva_assets/selloazul.webp" 
                                className="absolute inset-0 w-full h-full object-contain drop-shadow-md z-10" 
                                alt="Sello" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/resources_canvas/images/26.svg';
                                }}
                            />
                            <img 
                                src="/images/canva_assets/huellaselloazul.webp" 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] object-contain z-20" 
                                alt="Huella" 
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                        </div>

                        {/* Título */}
                        <h2 className="text-6xl md:text-7xl font-script text-[#8ba2b8] mb-10">
                            Ubicación
                        </h2>

                        <div className="space-y-12 w-full">
                            {/* Ceremonia / Iglesia */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] tracking-[0.25em] uppercase text-[#728675] font-bold mb-1">Ceremonia Religiosa</span>
                                <h3 className="font-serif text-sm md:text-base tracking-[0.2em] uppercase text-[#55697d] font-bold mb-2">
                                    {wedding?.locations?.ceremony || 'PARROQUIA DE SAN FRANCISCO'}
                                </h3>
                                {wedding?.locations?.ceremony_address && (
                                    <p className="font-sans text-xs text-[#55697d]/80 max-w-sm mb-4">
                                        {wedding.locations.ceremony_address}
                                    </p>
                                )}
                                <a 
                                    href={wedding?.locations?.ceremony_maps || `https://maps.google.com/?q=${encodeURIComponent(wedding?.locations?.ceremony || 'Parroquia San Francisco')}`}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-[#728675] text-[10px] uppercase tracking-[0.2em] font-bold border border-[#728675]/30 shadow-sm hover:shadow-md hover:bg-[#728675] hover:text-white transition duration-300 rounded-full"
                                >
                                    Ver en Google Maps ➔
                                </a>
                            </div>

                            {/* Recepción / Local */}
                            <div className="flex flex-col items-center pt-4 border-t border-[#728675]/15">
                                <span className="text-[10px] tracking-[0.25em] uppercase text-[#728675] font-bold mb-1">Recepción & Fiesta</span>
                                <h3 className="font-serif text-sm md:text-base tracking-[0.2em] uppercase text-[#55697d] font-bold mb-2">
                                    {wedding?.locations?.reception || 'HACIENDA LOS LAURELES'}
                                </h3>
                                {wedding?.locations?.reception_address && (
                                    <p className="font-sans text-xs text-[#55697d]/80 max-w-sm mb-4">
                                        {wedding.locations.reception_address}
                                    </p>
                                )}
                                <a 
                                    href={wedding?.locations?.reception_maps || `https://maps.google.com/?q=${encodeURIComponent(wedding?.locations?.reception || 'Hacienda Los Laureles')}`}
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-[#728675] text-[10px] uppercase tracking-[0.2em] font-bold border border-[#728675]/30 shadow-sm hover:shadow-md hover:bg-[#728675] hover:text-white transition duration-300 rounded-full"
                                >
                                    Ver en Google Maps ➔
                                </a>
                            </div>
                        </div>
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 6: MESA DE REGALOS & SOBRE INTERACTIVO
                ======================================================== */}
                <section className="px-6 py-20 bg-[#f3f1ea] relative text-center flex flex-col items-center overflow-hidden border-t border-[#e8e6df]">
                    <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
                        <h2 className="text-6xl md:text-7xl font-script text-[#8ba2b8] mb-8">
                            Mesa de regalos
                        </h2>

                        {/* Ilustración de Sobre de Canva */}
                        <div className="relative w-full aspect-square max-w-[340px] flex items-center justify-center mb-8">
                            {/* Tarjeta de fondo */}
                            <div className="absolute top-[28%] bottom-[25%] left-[12%] right-[12%] bg-[#fcfbf8] shadow-sm z-0 rounded-sm"></div>

                            {/* Imagen del Sobre */}
                            <img 
                                src="/images/canva_assets/sobre.png" 
                                className="absolute inset-0 w-full h-full object-contain z-10 drop-shadow-lg" 
                                alt="Sobre" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/resources_canvas/images/27.svg';
                                }}
                            />
                            
                            {/* Iniciales en solapa */}
                            <div className="absolute top-[18%] left-0 right-0 z-20 flex justify-center pointer-events-none">
                                <h3 className="text-3xl md:text-4xl font-script text-[#e8e6df] opacity-90 drop-shadow-sm">
                                    {brideName.charAt(0)}{groomName.charAt(0)}
                                </h3>
                            </div>

                            {/* Mensaje dentro del sobre */}
                            <div className="absolute top-[38%] left-[16%] right-[16%] z-20 flex flex-col items-center justify-center pointer-events-none">
                                <p className="font-serif text-[8.5px] md:text-[10px] uppercase text-[#728675] text-center tracking-[0.16em] leading-[1.8] font-semibold">
                                    Tu presencia es nuestro mejor<br/>regalo. Si desean tener un<br/>detalle con nosotros,<br/>contaremos con mesa de regalos<br/>y lluvia de sobres.
                                </p>
                            </div>

                            {/* Sello de Cera */}
                            <div className="absolute top-[58%] left-0 right-0 z-30 flex justify-center pointer-events-none">
                                <img 
                                    src="/images/canva_assets/sellocrema.webp" 
                                    className="w-16 md:w-20 drop-shadow-lg" 
                                    alt="Sello de Cera" 
                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                            </div>
                        </div>

                        {/* Botones de acción de regalos */}
                        <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
                            {wedding?.gift_registry_url && (
                                <a 
                                    href={wedding.gift_registry_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#728675] text-[10px] uppercase tracking-[0.2em] font-bold border border-[#728675]/30 shadow-sm hover:shadow-md hover:bg-[#728675] hover:text-white transition duration-300 w-full rounded-full"
                                >
                                    LIVERPOOL ➔
                                </a>
                            )}

                            {/* Botón para ver/copiar datos bancarios */}
                            {wedding?.bank_transfer_info && (
                                <button
                                    type="button"
                                    onClick={() => setShowBankDetails(!showBankDetails)}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#728675] text-white text-[10px] uppercase tracking-[0.2em] font-bold shadow-sm hover:shadow-md hover:bg-[#5f7061] transition duration-300 w-full rounded-full"
                                >
                                    <Gift className="w-3.5 h-3.5" />
                                    {showBankDetails ? 'Ocultar Datos' : 'Datos Bancarios'}
                                </button>
                            )}

                            {/* Caja desplegable de datos bancarios con botón de copiado rápido */}
                            {showBankDetails && wedding?.bank_transfer_info && (
                                <div className="mt-3 bg-white p-5 rounded-2xl border border-[#728675]/20 shadow-md w-full text-left animate-[fadeIn_0.3s_ease-out]">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] uppercase text-[#728675] font-bold tracking-widest">
                                            Transferencia / CLABE
                                        </p>
                                        <button
                                            type="button"
                                            onClick={copyBankInfo}
                                            className="text-[10px] uppercase font-bold tracking-wider text-[#728675] hover:text-[#55697d] flex items-center gap-1 bg-[#f3f1ea] px-2.5 py-1 rounded-md transition"
                                        >
                                            {copiedBank ? (
                                                <>
                                                    <Check className="w-3 h-3 text-green-600" />
                                                    <span className="text-green-600">¡Copiado!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" />
                                                    <span>Copiar</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <pre className="font-sans text-xs text-[#55697d] whitespace-pre-wrap leading-relaxed">
                                        {wedding.bank_transfer_info}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 7: DRESSCODE & EXCLUSIVIDAD DE COLORES
                ======================================================== */}
                <section className="px-6 py-20 bg-[#f9f8f5] relative text-center border-t border-[#e8e6df]">
                    <div className="max-w-md mx-auto">
                        <h2 className="text-6xl md:text-7xl font-script text-[#8ba2b8] mb-4">
                            Dresscode
                        </h2>
                        
                        <p className="font-serif tracking-[0.25em] uppercase text-sm md:text-base text-[#55697d] font-bold mb-8">
                            {wedding?.dress_code || 'RIGUROSA ETIQUETA / FORMAL'}
                        </p>

                        <div className="py-2 mb-6">
                            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#728675] font-bold font-serif">
                                EXCLUSIVIDAD DE COLORES
                            </p>
                        </div>

                        {/* Muestras circulares de la paleta de colores */}
                        <div className="flex justify-center items-center gap-2.5 md:gap-3.5 flex-wrap mb-6">
                            {dresscodeSwatches.map((swatch, idx) => (
                                <div key={idx} className="group flex flex-col items-center">
                                    <div 
                                        className="w-9 h-9 md:w-11 md:h-11 rounded-full shadow-md border-2 border-white transition-transform transform group-hover:scale-115 flex items-center justify-center"
                                        style={{ backgroundColor: swatch.color }}
                                        title={swatch.label}
                                    />
                                </div>
                            ))}
                        </div>

                        <p className="font-sans text-[11px] text-[#55697d]/80 leading-relaxed max-w-sm mx-auto">
                            Agradecemos reservar la gama de tonos verdes para nuestro cortejo nupcial, y el color blanco exclusivamente para la novia.
                        </p>
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 8: SOLO ADULTOS ("HUMANOS GRANDES")
                ======================================================== */}
                <section className="px-6 py-16 bg-[#f3f1ea] relative text-center border-t border-[#e8e6df]">
                    <div className="max-w-md mx-auto">
                        <span className="font-serif text-xs md:text-sm tracking-[0.25em] uppercase text-[#728675] font-semibold block mb-1">
                            Una celebración para
                        </span>
                        
                        <h2 className="text-5xl md:text-6xl font-script text-[#728675] mb-4">
                            humanos grandes
                        </h2>
                        
                        <p className="font-serif text-xs md:text-sm text-[#55697d] leading-relaxed tracking-wider max-w-sm mx-auto">
                            {wedding?.no_children_message || 'Con cariño, les pedimos que esta ocasión sea disfrutada únicamente por adultos.'}
                        </p>
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 9: HOSPEDAJE & HOTELES RECOMENDADOS
                ======================================================== */}
                <section className="px-6 py-20 bg-[#f9f8f5] relative text-center border-t border-[#e8e6df]">
                    <div className="max-w-lg mx-auto">
                        <h2 className="text-6xl md:text-7xl font-script text-[#8ba2b8] mb-3">
                            Hospedaje
                        </h2>
                        
                        <p className="font-serif text-xs md:text-sm text-[#728675] tracking-wider mb-10 max-w-md mx-auto leading-relaxed">
                            Estaremos encantados que nos acompañes y disfrutes toda la experiencia.
                        </p>

                        {/* Tarjetas de Hoteles */}
                        <div className="space-y-4">
                            {accommodations.map((hotel, idx) => (
                                <div 
                                    key={idx} 
                                    className="bg-white p-5 rounded-2xl border border-[#728675]/15 shadow-sm text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-[#728675]" />
                                            <h4 className="font-serif text-sm font-bold tracking-wider text-[#2a3b4c] uppercase">
                                                {hotel.name}
                                            </h4>
                                        </div>
                                        {hotel.address && (
                                            <p className="text-xs text-[#55697d] font-sans">
                                                {hotel.address}
                                            </p>
                                        )}
                                        {hotel.discount_code && (
                                            <p className="text-[10px] text-[#728675] font-sans font-semibold">
                                                Código de descuento: <span className="underline">{hotel.discount_code}</span>
                                            </p>
                                        )}
                                    </div>

                                    {hotel.booking_url && (
                                        <a 
                                            href={hotel.booking_url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#f3f1ea] hover:bg-[#728675] text-[#728675] hover:text-white text-[10px] uppercase font-bold tracking-widest rounded-full transition whitespace-nowrap self-start sm:self-center"
                                        >
                                            Reserva aquí ➔
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 10: CONFIRMACIÓN DE ASISTENCIA (RSVP)
                ======================================================== */}
                <section className="px-6 py-20 bg-[#f3f1ea] relative text-center border-t border-[#e8e6df]">
                    <div className="max-w-md mx-auto relative z-10">
                        <h2 className="text-6xl md:text-7xl font-script text-[#8c9fa6] mb-2">
                            ¿Nos acompañas?
                        </h2>
                        
                        <p className="text-center text-[10px] md:text-xs font-serif uppercase tracking-[0.25em] text-[#8c9fa6] mb-8 font-bold">
                            Queremos contar contigo en este día tan especial
                        </p>

                        {/* Manejo de fecha límite */}
                        {isDeadlinePassed ? (
                            <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-[#d1dbed]">
                                <AlertCircle className="w-10 h-10 text-[#8c9fa6] mx-auto mb-3" />
                                <p className="text-[#8c9fa6] font-serif text-2xl mb-2">La fecha límite ha expirado</p>
                                <p className="text-xs text-[#55697d] font-sans">
                                    Por favor contacta directamente a los novios para cualquier consulta sobre tu asistencia.
                                </p>
                            </div>
                        ) : invitation ? (
                            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-[#c4d0d6]/60 text-left">
                                <RSVPForm invitation={invitation} />
                            </div>
                        ) : (
                            /* Modo Vista Previa cuando se entra a la invitación general sin token */
                            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-[#c4d0d6]/60 text-center">
                                <div className="p-3 bg-[#f3f1ea] rounded-full inline-block text-[#8c9fa6] mb-3">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="font-serif text-lg font-bold text-[#2a3b4c] mb-2 uppercase tracking-wide">
                                    Confirmación Personalizada
                                </h3>
                                <p className="text-xs text-[#55697d] leading-relaxed mb-4 font-sans">
                                    Cada uno de tus invitados recibirá un enlace único y exclusivo para confirmar su nombre y el número de pases asignados.
                                </p>
                                <div className="p-3 bg-[#f9f8f5] rounded-xl text-left border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                                        Demostración de confirmación:
                                    </p>
                                    <p className="text-xs text-[#728675] font-serif font-bold">
                                        Pases individuales • Confirmación Sí/No • Alergias/Dieta • Dedicatoria
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>


                {/* ========================================================
                    SECCIÓN 11: MONOGRAMA & PIE DE PÁGINA
                ======================================================== */}
                <footer className="px-6 pt-16 pb-20 bg-[#f9f8f5] text-center relative border-t border-[#e8e6df]">
                    <div className="max-w-md mx-auto">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8c9fa6] font-bold mb-4">
                            Nuestra Boda
                        </p>

                        <h2 className="text-6xl md:text-7xl font-script text-[#728675] mb-4">
                            {brideName} <span className="text-4xl text-[#8c9fa6]">&amp;</span> {groomName}
                        </h2>

                        <p className="font-serif tracking-[0.25em] text-[#8c9fa6] text-sm md:text-base font-medium mb-8">
                            {day} | {shortMonth} | {year}
                        </p>

                        <div className="flex justify-center items-center gap-1.5 text-xs text-[#55697d]/60 font-sans">
                            <span>Con amor para nuestros familiares y amigos</span>
                            <Heart className="w-3.5 h-3.5 text-[#728675] fill-[#728675]" />
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
}

// -------------------------------------------------------------
// Componente de Formulario de RSVP
// -------------------------------------------------------------
function RSVPForm({ invitation }: { invitation: InvitationData }) {
    const [guests, setGuests] = useState<Guest[]>(invitation.guests || []);
    const [messageToCouple, setMessageToCouple] = useState(invitation.message_to_couple || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(invitation.status !== 'responded');

    const updateGuest = (index: number, field: keyof Guest, value: any) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar que todos los invitados tengan una selección
        const allAnswered = guests.every(g => g.is_attending !== null && g.is_attending !== undefined);
        if (!allAnswered) {
            alert('Por favor selecciona si asiste o no cada uno de los invitados en tu lista.');
            return;
        }

        setIsSubmitting(true);
        router.put(`/public/rsvp/${invitation.token}`, { 
            guests, 
            message_to_couple: messageToCouple 
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsEditing(false);
            }
        });
    };

    // Si ya respondió y no está en modo edición
    if (!isEditing && invitation.status === 'responded') {
        const attendingCount = guests.filter(g => g.is_attending).length;

        return (
            <div className="text-center py-6">
                <div className="inline-block p-4 rounded-full bg-[#f3f1ea] text-[#728675] mb-4 shadow-sm">
                    <CheckCircle2 className="w-10 h-10 text-[#728675]" />
                </div>
                <h3 className="text-3xl font-script text-[#728675] mb-2">¡Gracias por confirmar!</h3>
                <p className="text-[#55697d] font-sans text-xs mb-4">
                    Tu respuesta ha sido guardada con éxito.
                </p>
                <div className="bg-[#f9f8f5] p-4 rounded-xl mb-6 text-left border border-gray-100">
                    <p className="text-[11px] font-bold text-[#728675] uppercase tracking-wider mb-2">
                        Resumen de pases confirmados:
                    </p>
                    <ul className="space-y-1.5 text-xs text-[#55697d]">
                        {guests.map((g, i) => (
                            <li key={i} className="flex justify-between items-center">
                                <span>{g.full_name}</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${g.is_attending ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'}`}>
                                    {g.is_attending ? 'Asistirá' : 'No asistirá'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs uppercase font-bold tracking-widest text-[#728675] underline hover:text-[#55697d] transition"
                >
                    Modificar mi respuesta
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
                {guests.map((guest, idx) => (
                    <div key={guest.id} className="pb-5 border-b border-[#f3f1ea] last:border-0 last:pb-0">
                        {/* Nombre del invitado */}
                        <div className="mb-3">
                            <label className="block text-[#8c9fa6] font-serif text-xs uppercase tracking-wider mb-1">
                                Nombre del Invitado
                            </label>
                            <div className="w-full border border-[#e5e3db] rounded-xl px-4 py-2.5 text-[#2a3b4c] font-sans text-sm bg-white font-medium">
                                {guest.full_name}
                            </div>
                        </div>

                        {/* Opciones de asistencia */}
                        <div className="mb-3">
                            <label className="block text-[#8c9fa6] font-serif text-xs mb-2">
                                ¿Confirmas tu asistencia?
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => updateGuest(idx, 'is_attending', true)}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-center font-serif text-sm transition-all border ${
                                        guest.is_attending === true 
                                            ? 'bg-[#728675] text-white border-[#728675] shadow-sm font-semibold' 
                                            : 'bg-[#f4f5f6] text-[#55697d] border-transparent hover:bg-[#e5e8ea]'
                                    }`}
                                >
                                    Acepto con gusto
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => updateGuest(idx, 'is_attending', false)}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-center font-serif text-sm transition-all border ${
                                        guest.is_attending === false 
                                            ? 'bg-[#8c9fa6] text-white border-[#8c9fa6] shadow-sm font-semibold' 
                                            : 'bg-[#f4f5f6] text-[#55697d] border-transparent hover:bg-[#e5e8ea]'
                                    }`}
                                >
                                    No podré asistir
                                </button>
                            </div>
                        </div>

                        {/* Alergias o restricciones dietéticas */}
                        {guest.is_attending && (
                            <div className="mt-3 animate-[fadeIn_0.3s_ease-out]">
                                <label className="block text-[#8c9fa6] font-serif text-xs mb-1">
                                    ¿Alergias o dieta especial? (Opcional)
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Ej. Vegetariano, celíaco, mariscos..."
                                    className="w-full border border-[#e5e3db] rounded-xl px-3.5 py-2 text-[#55697d] font-sans text-xs focus:border-[#728675] focus:ring-0 bg-white placeholder:text-[#c4d0d6]"
                                    value={guest.allergies || ''}
                                    onChange={(e) => updateGuest(idx, 'allergies', e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Dedicatoria a los novios */}
            <div className="pt-2">
                <label className="block text-[#8c9fa6] font-serif text-xs mb-1.5">
                    Escribe una dedicatoria a los novios
                </label>
                <textarea 
                    rows={3}
                    placeholder="Escribe tus buenos deseos..."
                    className="w-full border border-[#e5e3db] rounded-xl px-4 py-2.5 text-[#55697d] font-sans text-xs focus:border-[#728675] focus:ring-0 bg-white placeholder:text-[#c4d0d6] resize-none"
                    value={messageToCouple}
                    onChange={e => setMessageToCouple(e.target.value)}
                />
            </div>

            {/* Botón de Envío */}
            <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-[#728675] hover:bg-[#5f7061] text-white font-sans font-bold py-3.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-98"
            >
                {isSubmitting ? 'Guardando respuesta...' : 'Confirmar Asistencia'}
            </button>
        </form>
    );
}
