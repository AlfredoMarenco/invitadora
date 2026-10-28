import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HotelItem {
    id?: number;
    name: string;
    location?: string;
    description?: string;
    url?: string | null;
    phone?: string | null;
    maps_url?: string | null;
    mapsUrl?: string | null;
    image?: string;
    image_path?: string;
    order?: number;
    is_active?: boolean;
}

interface HotelCarouselProps {
    hotels: HotelItem[];
    autoPlayInterval?: number;
}

export default function HotelCarousel({
    hotels,
    autoPlayInterval = 4000,
}: HotelCarouselProps) {
    if (!hotels || hotels.length === 0) return null;

    // Caso de un solo hotel: tarjeta centrada estática sin carrusel
    if (hotels.length === 1) {
        const hotel = hotels[0];
        const hotelImg = hotel.image_path || hotel.image || '/images/hotels/hotel_1.jpg';
        const hotelDesc = hotel.description || hotel.location || '';
        const reserveHref = hotel.phone ? `tel:${hotel.phone.replace(/[^+\d]/g, '')}` : (hotel.url || '#');
        const mapsHref = hotel.maps_url || hotel.mapsUrl || (hotel.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ' ' + hotel.location)}` : '#');

        return (
            <div className="w-full flex flex-col items-center justify-center px-4 py-2">
                <div className="flex flex-col items-center w-[260px] sm:w-[290px] transition-all duration-300">
                    <div className="w-full h-[165px] sm:h-[185px] rounded-2xl overflow-hidden shadow-xl ring-2 ring-[#788a80] bg-stone-100 border border-transparent relative group">
                        <img
                            src={hotelImg}
                            alt={hotel.name}
                            className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/hotels/hotel_1.jpg';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-3.5 sm:p-4 text-white">
                            <span className="font-serif text-[12px] sm:text-[13px] font-semibold tracking-wider uppercase drop-shadow-sm leading-tight">
                                {hotel.name}
                            </span>
                            {hotelDesc && (
                                <span className="text-[9.5px] sm:text-[10px] text-white/90 font-light tracking-wide mt-0.5 line-clamp-1">
                                    {hotelDesc}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3.5 flex flex-col items-center gap-1.5">
                        <a
                            href={reserveHref}
                            target={reserveHref.startsWith('tel:') ? undefined : '_blank'}
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#788a80] text-[#476070] font-semibold font-serif text-[9.5px] sm:text-[10.5px] tracking-[0.16em] uppercase shadow-xs transition-all duration-300 hover:shadow-sm hover:scale-[1.02]"
                        >
                            <span>{hotel.phone ? '📞 RESERVAR AHORA' : 'RESERVAR AHORA'}</span>
                        </a>
                        <a
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-1 font-serif text-[9px] sm:text-[9.5px] tracking-[0.14em] uppercase text-[#476070] underline underline-offset-2"
                        >
                            <span>📍 VER UBICACIÓN</span>
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Aseguramos al menos 4 elementos base para que el loop infinito de 3 bloques funcione fluidamente
    const baseList = useMemo(() => {
        let list = [...hotels];
        while (list.length < 4) {
            list = [...list, ...hotels];
        }
        return list;
    }, [hotels]);

    const baseCount = baseList.length;
    const originalCount = hotels.length;

    // 3 bloques consecutivos: [prevBlock, centerBlock, nextBlock]
    const items = useMemo(() => [...baseList, ...baseList, ...baseList], [baseList]);

    // Iniciar en el primer elemento del bloque central
    const [currentIndex, setCurrentIndex] = useState(baseCount);
    const [isTransitioning, setIsTransitioning] = useState(true);

    // Dimensiones dinámicas del contenedor
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Drag y Swipe interactivo
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const hasDraggedRef = useRef(false);
    const isPausedRef = useRef(false);
    const pauseTimeoutRef = useRef<any>(null);

    // Bloqueo direccional para gestos táctiles (evita colisiones con scroll vertical de la página)
    const touchStartPosRef = useRef({ x: 0, y: 0, time: 0 });
    const touchDirectionRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
    const mouseStartXRef = useRef(0);

    // Medición del ancho del contenedor
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        const observer = new ResizeObserver(updateWidth);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateWidth);
            observer.disconnect();
        };
    }, []);

    // Pausar auto-slide temporalmente tras interacción del usuario
    const pauseTemporarily = useCallback((duration = 6000) => {
        isPausedRef.current = true;
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
            isPausedRef.current = false;
        }, duration);
    }, []);

    // Navegación siguiente / anterior
    const handleNext = useCallback(() => {
        pauseTemporarily(6000);
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    }, [pauseTemporarily]);

    const handlePrev = useCallback(() => {
        pauseTemporarily(6000);
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    }, [pauseTemporarily]);

    const handleDotClick = useCallback((targetOriginalIndex: number) => {
        pauseTemporarily(6000);
        setIsTransitioning(true);
        const currentRelative = ((currentIndex % originalCount) + originalCount) % originalCount;
        let diff = targetOriginalIndex - currentRelative;
        // Camino más corto alrededor del círculo
        if (diff > originalCount / 2) diff -= originalCount;
        if (diff < -originalCount / 2) diff += originalCount;
        setCurrentIndex((prev) => prev + diff);
    }, [currentIndex, originalCount, pauseTemporarily]);

    // Reseteo silencioso al cruzar los límites del bloque central (efecto infinito sin cortes)
    const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
        // Filtrar transiciones que provengan de elementos hijos (cards, imágenes, hover)
        if (e.target !== e.currentTarget) return;
        if (e.propertyName !== 'transform') return;

        if (currentIndex >= baseCount * 2) {
            setIsTransitioning(false);
            setCurrentIndex((prev) => prev - baseCount);
        } else if (currentIndex < baseCount) {
            setIsTransitioning(false);
            setCurrentIndex((prev) => prev + baseCount);
        }
    };

    // Auto-slide periódico
    useEffect(() => {
        if (hotels.length <= 1) return;

        const timer = setInterval(() => {
            if (!isPausedRef.current && !isDragging) {
                setIsTransitioning(true);
                setCurrentIndex((prev) => prev + 1);
            }
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [autoPlayInterval, hotels.length, isDragging]);

    // Touch Swipe con detección precisa de dirección
    const onTouchStart = (e: React.TouchEvent) => {
        pauseTemporarily(6000);
        const touch = e.touches[0];
        touchStartPosRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
        touchDirectionRef.current = 'none';
        hasDraggedRef.current = false;
        setDragOffset(0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchDirectionRef.current === 'vertical') {
            // El usuario está haciendo scroll vertical en la página: no interferir
            return;
        }

        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartPosRef.current.x;
        const diffY = touch.clientY - touchStartPosRef.current.y;

        if (touchDirectionRef.current === 'none') {
            // Tolerancia mínima para detectar intención
            if (Math.abs(diffX) < 6 && Math.abs(diffY) < 6) return;

            if (Math.abs(diffY) > Math.abs(diffX)) {
                touchDirectionRef.current = 'vertical';
                return;
            } else {
                touchDirectionRef.current = 'horizontal';
                setIsDragging(true);
                setIsTransitioning(false);
            }
        }

        if (touchDirectionRef.current === 'horizontal') {
            hasDraggedRef.current = true;
            setDragOffset(diffX);
        }
    };

    const onTouchEnd = () => {
        const wasHorizontal = touchDirectionRef.current === 'horizontal';
        touchDirectionRef.current = 'none';

        if (!wasHorizontal) {
            setIsDragging(false);
            setDragOffset(0);
            return;
        }

        setIsDragging(false);
        setIsTransitioning(true);

        const timeElapsed = Date.now() - touchStartPosRef.current.time;
        // Detección de flick rápido o superación de umbral
        const isQuickFlick = timeElapsed < 280 && Math.abs(dragOffset) > 25;
        const isThresholdPassed = Math.abs(dragOffset) > 40;

        if (isQuickFlick || isThresholdPassed) {
            if (dragOffset < 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
        setDragOffset(0);
    };

    // Mouse Drag
    const onMouseDown = (e: React.MouseEvent) => {
        pauseTemporarily(6000);
        setIsDragging(true);
        setIsTransitioning(false);
        hasDraggedRef.current = false;
        mouseStartXRef.current = e.clientX;
        setDragOffset(0);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const delta = e.clientX - mouseStartXRef.current;
        if (Math.abs(delta) > 6) {
            hasDraggedRef.current = true;
        }
        setDragOffset(delta);
    };

    const onMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        setIsTransitioning(true);

        const threshold = 45;
        if (dragOffset < -threshold) {
            handleNext();
        } else if (dragOffset > threshold) {
            handlePrev();
        }
        setDragOffset(0);
    };

    const onMouseLeave = () => {
        if (isDragging) {
            onMouseUp();
        }
    };

    // Dimensiones y centrado de las tarjetas
    const effectiveWidth = containerWidth || 380;
    const cardWidth = Math.min(270, Math.max(230, Math.round(effectiveWidth * 0.65)));
    const cardHeight = Math.round(cardWidth * 0.62); // ~145px - 170px
    const cardGap = 14;
    const cardStep = cardWidth + cardGap;
    const centerOffset = (effectiveWidth - cardWidth) / 2;
    const currentTranslateX = centerOffset - currentIndex * cardStep + dragOffset;

    // Índice activo dentro de la lista original para los dots
    const activeDotIndex = ((currentIndex % originalCount) + originalCount) % originalCount;

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden select-none py-3"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; onMouseLeave(); }}
        >
            {/* Flecha izquierda */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                }}
                aria-label="Hotel anterior"
                className="absolute left-1 sm:left-2 top-[78px] sm:top-[85px] -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#788a80] shadow-md border border-[#788a80]/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            >
                <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Flecha derecha */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                }}
                aria-label="Hotel siguiente"
                className="absolute right-1 sm:right-2 top-[78px] sm:top-[85px] -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#788a80] shadow-md border border-[#788a80]/20 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
            >
                <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Track deslizante continuo con CSS transform */}
            <div
                className="flex items-start cursor-grab active:cursor-grabbing will-change-transform"
                style={{
                    transform: `translate3d(${currentTranslateX}px, 0, 0)`,
                    transition: isTransitioning ? 'transform 420ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                    gap: `${cardGap}px`,
                    touchAction: 'pan-y',
                    overscrollBehaviorX: 'contain',
                }}
                onTransitionEnd={handleTransitionEnd}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
            >
                {items.map((hotel, idx) => {
                    const isCenter = idx === currentIndex;
                    const isNeighbor = Math.abs(idx - currentIndex) === 1;
                    const hotelImg = hotel.image_path || hotel.image || '/images/hotels/hotel_1.jpg';
                    const hotelDesc = hotel.description || hotel.location || '';
                    const reserveHref = hotel.phone ? `tel:${hotel.phone.replace(/[^+\d]/g, '')}` : (hotel.url || '#');
                    const mapsHref = hotel.maps_url || hotel.mapsUrl || (hotel.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + ' ' + hotel.location)}` : '#');

                    return (
                        <div
                            key={idx}
                            style={{ width: `${cardWidth}px` }}
                            onClick={() => {
                                if (hasDraggedRef.current) return;
                                if (idx === currentIndex + 1) handleNext();
                                else if (idx === currentIndex - 1) handlePrev();
                                else if (!isCenter) {
                                    pauseTemporarily();
                                    setIsTransitioning(true);
                                    setCurrentIndex(idx);
                                }
                            }}
                            className="flex flex-col items-center shrink-0 cursor-pointer select-none"
                        >
                            {/* Tarjeta horizontal con foto del hotel */}
                            <div
                                style={{ height: `${cardHeight}px` }}
                                className={`w-full rounded-2xl overflow-hidden bg-stone-100 border relative group transition-all duration-400 ease-out ${
                                    isCenter
                                        ? 'scale-105 shadow-xl ring-2 ring-[#788a80] border-transparent opacity-100 z-20'
                                        : isNeighbor
                                        ? 'scale-90 shadow-md border-stone-200/60 opacity-65 hover:opacity-90 z-10'
                                        : 'scale-85 shadow-sm border-stone-200/40 opacity-40 z-0'
                                }`}
                            >
                                <img
                                    src={hotelImg}
                                    alt={hotel.name}
                                    className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/hotels/hotel_1.jpg';
                                    }}
                                />
                                {/* Overlay inferior con nombre y descripción */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-3.5 text-white">
                                    <span className="font-serif text-[11.5px] sm:text-[12.5px] font-semibold tracking-wider uppercase drop-shadow-sm leading-tight">
                                        {hotel.name}
                                    </span>
                                    {hotelDesc && (
                                        <span className="text-[9.5px] sm:text-[10px] text-white/90 font-light tracking-wide mt-0.5 line-clamp-1">
                                            {hotelDesc}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Botón: RESERVA AQUÍ -> */}
                            <div className="mt-3 flex flex-col items-center gap-1.5">
                                <a
                                    href={reserveHref}
                                    target={reserveHref.startsWith('tel:') ? undefined : '_blank'}
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        if (hasDraggedRef.current) {
                                            e.preventDefault();
                                            return;
                                        }
                                        e.stopPropagation();
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border font-serif text-[9.5px] sm:text-[10px] tracking-[0.16em] uppercase shadow-xs transition-all duration-300 hover:shadow-sm ${
                                        isCenter
                                            ? 'opacity-100 border-[#788a80] text-[#476070] font-semibold shadow-xs hover:scale-105'
                                            : 'opacity-60 border-[#788a80]/35 text-[#556c7d] hover:border-[#788a80]'
                                    }`}
                                >
                                    <span>{hotel.phone ? '📞 RESERVAR AHORA' : 'RESERVAR AHORA'}</span>
                                </a>
                                <a
                                    href={mapsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        if (hasDraggedRef.current) {
                                            e.preventDefault();
                                            return;
                                        }
                                        e.stopPropagation();
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-transparent font-serif text-[9px] sm:text-[9.5px] tracking-[0.14em] uppercase underline underline-offset-2 transition-all duration-300 ${isCenter ? 'opacity-100 text-[#476070]' : 'opacity-60 text-[#556c7d]'}`}
                                >
                                    <span>📍 VER UBICACIÓN</span>
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Indicadores de paginación (Dots) */}
            <div className="flex items-center justify-center gap-1.5 mt-3 sm:mt-4 px-4">
                {hotels.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => handleDotClick(idx)}
                        aria-label={`Ir a hotel ${idx + 1}`}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                            activeDotIndex === idx
                                ? 'w-5 h-1.5 bg-[#788a80]'
                                : 'w-1.5 h-1.5 bg-[#cbd5cc] hover:bg-[#a8b8ae]'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
