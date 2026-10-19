import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InfiniteDesktopGalleryProps {
    images: string[];
    title?: string;
    autoPlayInterval?: number; // ms entre cambios automáticos (por defecto 3500)
}

export default function InfiniteDesktopGallery({
    images,
    title = 'GALERÍA',
    autoPlayInterval = 3500,
}: InfiniteDesktopGalleryProps) {
    // Si no hay imágenes, no renderizamos nada
    if (!images || images.length === 0) return null;

    // Aseguramos tener al menos 4 elementos base para que el efecto infinito de 3 tarjetas funcione perfectamente
    const baseList = useMemo(() => {
        let list = [...images];
        while (list.length < 4) {
            list = [...list, ...images];
        }
        return list;
    }, [images]);

    const baseCount = baseList.length;
    // Creamos 3 bloques para el loop infinito: [prevBlock, centerBlock, nextBlock]
    const items = useMemo(() => [...baseList, ...baseList, ...baseList], [baseList]);

    // Iniciamos en el primer elemento del bloque central
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

    // Bloqueo direccional de touch
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

    // Avance y retroceso
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
        const currentRelative = ((currentIndex % baseCount) + baseCount) % baseCount;
        const diff = targetOriginalIndex - currentRelative;
        setCurrentIndex((prev) => prev + diff);
    }, [baseCount, currentIndex, pauseTemporarily]);

    // Reseteo silencioso al cruzar los límites del bloque central (efecto infinito continuo)
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
        const timer = setInterval(() => {
            if (!isPausedRef.current && !isDragging) {
                setIsTransitioning(true);
                setCurrentIndex((prev) => prev + 1);
            }
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [autoPlayInterval, isDragging]);

    // Manejo de eventos Touch con detección direccional
    const onTouchStart = (e: React.TouchEvent) => {
        pauseTemporarily(6000);
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
                touchDirectionRef.current = 'vertical';
                return;
            } else {
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
        const isQuickFlick = timeElapsed < 280 && Math.abs(dragOffset) > 25;
        const isThresholdPassed = Math.abs(dragOffset) > 45;

        if (isQuickFlick || isThresholdPassed) {
            if (dragOffset < 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
        setDragOffset(0);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        pauseTemporarily(6000);
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

        const threshold = 55;
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

    // Cálculo de dimensiones verticales proporcionales (estilo tarjeta Canva: ~1 : 1.55)
    // Para que se vean 3 tarjetas con las de los extremos cortadas a la mitad:
    const effectiveWidth = containerWidth || 1200;
    const cardWidth = Math.min(Math.max(effectiveWidth * 0.34, 270), 430);
    // Altura vertical proporcional para que sean marcadamente rectangulares en vertical
    const cardHeight = Math.round(cardWidth * 1.55);
    const cardGap = Math.max(16, Math.min(effectiveWidth * 0.025, 36));
    const cardStep = cardWidth + cardGap;
    const centerOffset = (effectiveWidth - cardWidth) / 2;
    const currentTranslateX = centerOffset - currentIndex * cardStep + dragOffset;

    // Índice activo dentro de la lista original de imágenes para los dots
    const activeDotIndex = ((currentIndex % images.length) + images.length) % images.length;

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden select-none pt-4 pb-8 my-2"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; onMouseLeave(); }}
        >
            {/* Título de Galería con tipografía serif y espaciado generoso */}
            {title && (
                <div className="w-full flex justify-center mb-8 md:mb-10">
                    <h2 className="font-serif text-sm sm:text-lg md:text-2xl lg:text-3xl tracking-[0.38em] text-[#788a80] uppercase font-semibold text-center px-4 py-18">
                        {title}
                    </h2>
                </div>
            )}

            {/* Track deslizante continuo con CSS transform */}
            <div
                className="flex items-center cursor-grab active:cursor-grabbing will-change-transform"
                style={{
                    transform: `translate3d(${currentTranslateX}px, 0, 0)`,
                    transition: isTransitioning ? 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
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
                            className={`shrink-0 rounded-3xl overflow-hidden bg-stone-100 transition-all duration-500 ease-out select-none border border-stone-200/80 cursor-pointer ${
                                isCenter
                                    ? 'scale-105 md:scale-108 shadow-2xl z-20 ring-1 ring-stone-300 opacity-100'
                                    : isNeighbor
                                    ? 'scale-95 md:scale-92 shadow-md z-10 opacity-80 hover:opacity-95'
                                    : 'scale-90 opacity-60 z-0'
                            }`}
                        >
                            <img
                                src={src}
                                alt={`Foto galería ${idx + 1}`}
                                className="w-full h-full object-cover pointer-events-none select-none block"
                                draggable={false}
                                loading="lazy"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Flechas de navegación laterales flotantes (sutiles y elegantes) */}
            <button
                type="button"
                onClick={handlePrev}
                aria-label="Foto anterior"
                className="hidden md:flex absolute left-4 lg:left-8 top-[55%] -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-white/75 backdrop-blur-md text-[#556960] shadow-lg border border-white/80 hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
                <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <button
                type="button"
                onClick={handleNext}
                aria-label="Siguiente foto"
                className="hidden md:flex absolute right-4 lg:right-8 top-[55%] -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-white/75 backdrop-blur-md text-[#556960] shadow-lg border border-white/80 hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
                <ChevronRight className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Indicadores de paginación (Dots) */}
            <div className="flex items-center justify-center gap-2 py-8 mt-8 md:mt-10">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => handleDotClick(idx)}
                        aria-label={`Ir a foto ${idx + 1}`}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                            activeDotIndex === idx
                                ? 'w-7 h-2 bg-[#788a80]'
                                : 'w-2 h-2 bg-[#cbd5cc] hover:bg-[#a8b8ae]'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
