import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileGalleryCarouselProps {
    images: string[];
    autoPlayInterval?: number;
}

export default function MobileGalleryCarousel({
    images,
    autoPlayInterval = 4000,
}: MobileGalleryCarouselProps) {
    if (!images || images.length === 0) return null;

    // Caso de una sola imagen
    if (images.length === 1) {
        return (
            <div className="w-full flex justify-center py-2 px-4">
                <div className="w-[54%] max-w-[270px] aspect-[4/5] rounded-2xl overflow-hidden shadow-xl ring-2 ring-[#788a80] bg-stone-100 border border-stone-200/60">
                    <img
                        src={images[0]}
                        alt="Foto galería"
                        className="w-full h-full object-cover select-none pointer-events-none"
                    />
                </div>
            </div>
        );
    }

    // Asegurar al menos 4 elementos base para que el carrusel infinito funcione fluidamente
    const baseList = useMemo(() => {
        let list = [...images];
        while (list.length < 4) {
            list = [...list, ...images];
        }
        return list;
    }, [images]);

    const baseCount = baseList.length;
    const originalCount = images.length;

    // 3 bloques consecutivos para loop infinito: [prevBlock, centerBlock, nextBlock]
    const items = useMemo(() => [...baseList, ...baseList, ...baseList], [baseList]);

    // Iniciar en el primer elemento del bloque central
    const [currentIndex, setCurrentIndex] = useState(baseCount);
    const [isTransitioning, setIsTransitioning] = useState(true);

    // Dimensiones dinámicas
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Drag / Swipe interactivo
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
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
    const pauseTemporarily = useCallback((duration = 7000) => {
        isPausedRef.current = true;
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
            isPausedRef.current = false;
        }, duration);
    }, []);

    // Navegación
    const handleNext = useCallback(() => {
        pauseTemporarily(7000);
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev + 1);
    }, [pauseTemporarily]);

    const handlePrev = useCallback(() => {
        pauseTemporarily(7000);
        setIsTransitioning(true);
        setCurrentIndex((prev) => prev - 1);
    }, [pauseTemporarily]);

    const handleDotClick = useCallback((targetOriginalIndex: number) => {
        pauseTemporarily(7000);
        setIsTransitioning(true);
        const currentRelative = ((currentIndex % originalCount) + originalCount) % originalCount;
        let diff = targetOriginalIndex - currentRelative;
        if (diff > originalCount / 2) diff -= originalCount;
        if (diff < -originalCount / 2) diff += originalCount;
        setCurrentIndex((prev) => prev + diff);
    }, [currentIndex, originalCount, pauseTemporarily]);

    // Reseteo silencioso al cruzar los límites del bloque central (efecto infinito)
    const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
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
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            if (!isPausedRef.current && !isDragging) {
                setIsTransitioning(true);
                setCurrentIndex((prev) => prev + 1);
            }
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [autoPlayInterval, images.length, isDragging]);

    // Gesto táctil (Touch Swipe)
    const onTouchStart = (e: React.TouchEvent) => {
        pauseTemporarily(7000);
        const touch = e.touches[0];
        touchStartPosRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
        touchDirectionRef.current = 'none';
        setDragOffset(0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchDirectionRef.current === 'vertical') return;

        const touch = e.touches[0];
        const diffX = touch.clientX - touchStartPosRef.current.x;
        const diffY = touch.clientY - touchStartPosRef.current.y;

        if (touchDirectionRef.current === 'none') {
            if (Math.abs(diffX) < 6 && Math.abs(diffY) < 6) return;

            if (Math.abs(diffY) > Math.abs(diffX)) {
                // Scroll vertical natural de la página
                touchDirectionRef.current = 'vertical';
                return;
            } else {
                // Gesto horizontal: capturar y deslizar carrusel
                touchDirectionRef.current = 'horizontal';
                setIsDragging(true);
                setIsTransitioning(false);
            }
        }

        if (touchDirectionRef.current === 'horizontal') {
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
        // Flick rápido (< 280ms y > 25px) o arrastre superado (> 38px)
        const isQuickFlick = timeElapsed < 280 && Math.abs(dragOffset) > 25;
        const isThresholdPassed = Math.abs(dragOffset) > 38;

        if (isQuickFlick || isThresholdPassed) {
            if (dragOffset < 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
        setDragOffset(0);
    };

    // Gesto de ratón (Desktop preview / emulador)
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        pauseTemporarily(7000);
        setIsDragging(true);
        setIsTransitioning(false);
        mouseStartXRef.current = e.clientX;
        setDragOffset(0);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setDragOffset(e.clientX - mouseStartXRef.current);
    };

    const onMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        setIsTransitioning(true);

        const threshold = 40;
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

    // Dimensiones proporcionales para móvil (~54% ancho de pantalla para ver laterales)
    const effectiveWidth = containerWidth || 360;
    const cardWidth = Math.min(270, Math.max(195, Math.round(effectiveWidth * 0.54)));
    const cardHeight = Math.round(cardWidth * 1.25); // Relación vertical armónica
    const cardGap = 12;
    const cardStep = cardWidth + cardGap;
    const centerOffset = (effectiveWidth - cardWidth) / 2;
    const currentTranslateX = centerOffset - currentIndex * cardStep + dragOffset;

    // Índice activo dentro de la lista original para los dots
    const activeDotIndex = ((currentIndex % originalCount) + originalCount) % originalCount;

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden select-none py-2"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; onMouseLeave(); }}
        >
            {/* Botón flotante anterior */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                }}
                aria-label="Foto anterior"
                className="absolute left-2 top-[46%] -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#788a80] shadow-md border border-[#788a80]/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
                <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Botón flotante siguiente */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                }}
                aria-label="Siguiente foto"
                className="absolute right-2 top-[46%] -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#788a80] shadow-md border border-[#788a80]/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
                <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Track deslizante continuo con CSS transform acelerado por hardware */}
            <div
                className="flex items-center cursor-grab active:cursor-grabbing will-change-transform py-2"
                style={{
                    transform: `translate3d(${currentTranslateX}px, 0, 0)`,
                    transition: isTransitioning ? 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                    gap: `${cardGap}px`,
                    touchAction: 'pan-y',
                    overscrollBehaviorX: 'contain',
                }}
                onTransitionEnd={handleTransitionEnd}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
            >
                {items.map((src, idx) => {
                    const isCenter = idx === currentIndex;
                    const isNeighbor = Math.abs(idx - currentIndex) === 1;

                    return (
                        <div
                            key={idx}
                            onClick={() => {
                                if (idx === currentIndex + 1) handleNext();
                                else if (idx === currentIndex - 1) handlePrev();
                            }}
                            style={{
                                width: `${cardWidth}px`,
                                height: `${cardHeight}px`,
                            }}
                            className={`shrink-0 rounded-2xl overflow-hidden bg-stone-100 transition-all duration-300 ease-out select-none border border-stone-200/70 cursor-pointer ${
                                isCenter
                                    ? 'scale-105 shadow-xl z-20 ring-2 ring-[#788a80] opacity-100'
                                    : isNeighbor
                                    ? 'scale-90 shadow-md z-10 opacity-60'
                                    : 'scale-85 opacity-40 z-0'
                            }`}
                        >
                            <img
                                src={src}
                                alt={`Foto galería ${idx + 1}`}
                                className="w-full h-full object-cover select-none pointer-events-none block"
                                draggable={false}
                                loading="lazy"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Indicadores de paginación (Dots) */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5 sm:mt-3 px-4">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => handleDotClick(idx)}
                        aria-label={`Ir a foto ${idx + 1}`}
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
