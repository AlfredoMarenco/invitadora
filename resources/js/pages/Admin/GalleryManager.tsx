import React, { useRef, useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Trash2, 
    UploadCloud, 
    Image as ImageIcon, 
    GripVertical, 
    Sparkles, 
    Clock, 
    Star, 
    Info, 
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';

interface GalleryImageItem {
    id: number;
    image_path: string;
    order: number;
    wedding_id?: number;
}

interface GalleryManagerProps {
    wedding?: {
        id?: number;
        bride_name?: string;
        groom_name?: string;
    };
    images: GalleryImageItem[];
}

export default function GalleryManager({ wedding, images: initialImages = [] }: GalleryManagerProps) {
    const { auth } = usePage().props as any;
    const isPlanner = auth?.user?.role === 'wedding_planner';

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [images, setImages] = useState<GalleryImageItem[]>(initialImages);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Reloj en tiempo real para el ambiente de gala
    const [currentTime, setCurrentTime] = useState<string>('');
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // Sincronizar con props
    useEffect(() => {
        setImages(initialImages);
    }, [initialImages]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        // Subimos todos los archivos en una sola petición
        router.post('/admin/gallery', {
            images: Array.from(files)
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setIsUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        });
    };

    const confirmDelete = () => {
        if (!deleteConfirmId) return;
        router.delete(`/admin/gallery/${deleteConfirmId}`, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setDeleteConfirmId(null)
        });
    };

    // Funciones de Drag and Drop
    const handleDragStart = (index: number) => {
        if (isPlanner) return;
        setDraggedItemIndex(index);
    };

    const handleDragEnter = (index: number) => {
        if (isPlanner || draggedItemIndex === null || draggedItemIndex === index) return;
        const newImages = [...images];
        const item = newImages[draggedItemIndex];
        newImages.splice(draggedItemIndex, 1);
        newImages.splice(index, 0, item);
        setDraggedItemIndex(index);
        setImages(newImages);
    };

    const handleDragEnd = () => {
        if (isPlanner) return;
        setDraggedItemIndex(null);
        // Guardar el nuevo orden en el servidor
        const orders = images.map((img, idx) => ({ id: img.id, order: idx }));
        router.put('/admin/gallery/reorder', { orders }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 py-6 w-full">
            <Head title={`Galería de Boda - ${wedding?.bride_name || 'Boda'} & ${wedding?.groom_name || ''}`} />

            {/* ========================================================= */}
            {/* 1. HERO HEADER: AMBIENTE DE GALA Y ÁLBUM OFICIAL          */}
            {/* ========================================================= */}
            <header className="bg-gradient-to-r from-[#28362e] via-[#33443a] to-[#28362e] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-[#405448] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
                {/* Monograma decorativo de fondo */}
                <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none w-48 h-48">
                    <img 
                        src="/resources_canvas/images/15.svg" 
                        alt="Monograma" 
                        className="w-full h-full object-contain filter invert" 
                    />
                </div>

                <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-serif uppercase tracking-widest bg-[#698175]/40 text-[#d8e2dc] border border-[#698175]/50">
                            <Sparkles className="w-3 h-3 text-[#e6d0aa]" />
                            {isPlanner ? 'Modo Wedding Planner (Lectura)' : 'Álbum Oficial de Recuerdos'}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[#a2b5aa] bg-black/30 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-[#a2b5aa]" />
                            <span>{currentTime || 'Galería de Boda'}</span>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                        Galería de Boda • Álbum Fotográfico
                    </h1>
                    <p className="text-xs sm:text-sm text-[#c8d4cc] font-light max-w-xl">
                        {wedding ? `${wedding.bride_name} & ${wedding.groom_name} — ` : ''}Sube y organiza las fotografías de su historia de amor. La primera imagen será la portada de la invitación.
                    </p>
                </div>

                {/* Métricas y Acción de Subida */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end z-10">
                    {/* Tarjeta de contador */}
                    <div className="bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex flex-col items-end min-w-[140px]">
                        <span className="text-[10px] uppercase font-serif tracking-widest text-[#a2b5aa]">
                            Total de Fotos
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-2xl font-bold font-serif text-[#f4ecd8]">
                                {images.length}
                            </span>
                            <span className="text-xs text-[#a2b5aa] font-sans">
                                {images.length === 1 ? 'fotografía' : 'fotografías'}
                            </span>
                        </div>
                        <span className="text-[9.5px] font-mono text-[#e6d0aa] mt-1 flex items-center gap-1">
                            {images.length > 0 ? (
                                <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    Portada activa
                                </>
                            ) : (
                                'Sin portada'
                            )}
                        </span>
                    </div>

                    {/* Botón de Subir Fotos */}
                    {!isPlanner && (
                        <div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button
                                type="button"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-[#698175] to-[#556c7d] hover:from-[#586e63] hover:to-[#475b6a] text-white font-serif text-xs uppercase tracking-wider font-semibold px-4 py-2.5 h-11 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 border border-white/10"
                            >
                                <UploadCloud className="w-4 h-4 text-[#e6d0aa]" />
                                <span>{isUploading ? 'Subiendo...' : 'Subir Fotos'}</span>
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* ========================================================= */}
            {/* 2. BARRA INFORMATIVA / TIP DE ORDENAMIENTO                */}
            {/* ========================================================= */}
            <div className="bg-[#f7f5f0] border border-[#ded8cd] rounded-xl p-3.5 px-4 text-xs text-stone-600 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#28362e] text-[#e6d0aa] flex items-center justify-center shrink-0 shadow-xs">
                        <Info className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="font-serif font-bold text-stone-800">
                            Secuencia visual y portada:
                        </span>{' '}
                        <span>
                            Arrastra las fotos para cambiar su orden en la invitación web. La <strong>primera foto</strong> (destacada en dorado) será el fondo de apertura.
                        </span>
                    </div>
                </div>

                <Badge variant="outline" className="font-serif text-[10px] uppercase border-[#ded8cd] text-stone-500 hidden sm:inline-flex">
                    Drag &amp; Drop Activo
                </Badge>
            </div>

            {/* ========================================================= */}
            {/* 3. REJILLA DE FOTOGRAFÍAS                                 */}
            {/* ========================================================= */}
            {images.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-[#ded8cd] rounded-3xl p-16 text-center max-w-2xl mx-auto my-8">
                    <div className="w-20 h-20 bg-[#f4f7f5] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c8d4cc]">
                        <ImageIcon className="w-10 h-10 text-[#698175]" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-[#28362e] mb-2">
                        Aún no hay fotos en la galería
                    </h3>
                    <p className="text-stone-500 font-sans text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                        Sube las mejores imágenes de la pareja para ilustrar la invitación web digital y darle un toque emotivo y elegante a su gran día.
                    </p>
                    {!isPlanner && (
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-6 bg-[#28362e] hover:bg-[#1d2721] text-[#f4ecd8] font-serif text-xs uppercase tracking-wider font-semibold px-6 py-2.5 rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
                        >
                            <UploadCloud className="w-4 h-4 text-[#e6d0aa]" />
                            Subir Primera Fotografía
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {images.map((img, index) => {
                        const isCover = index === 0;

                        return (
                            <div 
                                key={img.id} 
                                className={`group relative aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-300 ${
                                    isCover
                                        ? 'border-2 border-[#d4af37] ring-4 ring-[#d4af37]/20 shadow-lg'
                                        : 'border border-stone-200 hover:border-[#698175] shadow-xs hover:shadow-md'
                                } bg-stone-100`}
                                draggable={!isPlanner}
                                onDragStart={() => handleDragStart(index)}
                                onDragEnter={() => handleDragEnter(index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <img 
                                    src={img.image_path} 
                                    alt={`Foto de boda ${index + 1}`} 
                                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                />
                                
                                {/* Insignia de Portada Principal o Número */}
                                {isCover ? (
                                    <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-[#28362e] to-[#3a4d41] text-[#e6d0aa] border border-[#d4af37]/50 text-[10px] font-serif font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                                        <Star className="w-3 h-3 fill-[#e6d0aa] text-[#e6d0aa]" />
                                        Portada Principal
                                    </div>
                                ) : (
                                    <div className="absolute top-2.5 left-2.5 bg-black/60 text-white/90 text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs">
                                        #{index + 1}
                                    </div>
                                )}

                                {/* Overlay de Acciones (Hover) */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                                    {!isPlanner && (
                                        <div 
                                            className="bg-white/95 text-stone-700 p-2.5 rounded-full hover:bg-white transition shadow-lg cursor-grab active:cursor-grabbing hover:scale-110"
                                            title="Arrastrar para reordenar"
                                        >
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                    )}
                                    {!isPlanner && (
                                        <button 
                                            type="button"
                                            onClick={() => setDeleteConfirmId(img.id)}
                                            className="bg-white/95 text-rose-600 p-2.5 rounded-full hover:bg-rose-50 hover:text-rose-700 transition shadow-lg cursor-pointer hover:scale-110"
                                            title="Eliminar fotografía"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================= */}
            {/* 4. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN                   */}
            {/* ========================================================= */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="max-w-md bg-white rounded-2xl p-6">
                    <DialogHeader className="text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <DialogTitle className="font-serif text-xl font-bold text-stone-900">
                            Eliminar Fotografía
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                            ¿Estás seguro de que deseas eliminar esta fotografía del álbum? 
                            Esta acción no se puede deshacer y la foto ya no se mostrará en la invitación interactiva de los invitados.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setDeleteConfirmId(null)}
                            className="font-serif text-stone-600 cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            onClick={confirmDelete}
                            className="bg-rose-700 hover:bg-rose-800 text-white font-serif text-xs uppercase tracking-wider font-semibold cursor-pointer shadow"
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Sí, Eliminar Foto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

GalleryManager.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Galería', href: '/admin/gallery' }
    ],
};
