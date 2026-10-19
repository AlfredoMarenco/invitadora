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
    AlertTriangle,
    Zap,
    Loader2
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

/**
 * Función para comprimir y redimensionar imágenes en el navegador antes de enviarlas al servidor.
 * Convierte formatos pesados a WebP calidad 82 y escala a máximo 1920px.
 */
const compressImageClient = async (file: File): Promise<File> => {
    // Si es SVG o GIF animado, preservamos el archivo original
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 1920;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width >= height) {
                        height = Math.round((height / width) * maxDim);
                        width = maxDim;
                    } else {
                        width = Math.round((width / height) * maxDim);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob && (blob.size < file.size || file.type !== 'image/webp')) {
                            const newFileName = file.name.replace(/\.[^.]+$/, '.webp');
                            const compressedFile = new File([blob], newFileName, { type: 'image/webp' });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/webp',
                    0.82
                );
            };
            img.onerror = () => resolve(file);
            img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
};

export default function GalleryManager({ wedding, images: initialImages = [] }: GalleryManagerProps) {
    const { auth } = usePage().props as any;
    const isPlanner = auth?.user?.role === 'wedding_planner';

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [images, setImages] = useState<GalleryImageItem[]>(initialImages);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [uploadError, setUploadError] = useState<string | null>(null);

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

    const uploadBatch = (batchFiles: File[]): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            router.post('/admin/gallery', {
                images: batchFiles
            }, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => resolve(true),
                onError: (errors: any) => reject(errors),
            });
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setUploadError(null);
        const totalFiles = files.length;
        setUploadStatus(`Optimizando y comprimiendo ${totalFiles} ${totalFiles === 1 ? 'fotografía' : 'fotografías'}...`);

        try {
            const fileList = Array.from(files);
            const compressedFiles: File[] = [];

            // 1. Compresión del lado del cliente para reducir tamaño ~90%
            for (let i = 0; i < fileList.length; i++) {
                setUploadStatus(`Comprimiendo foto ${i + 1} de ${totalFiles}...`);
                const compressed = await compressImageClient(fileList[i]);
                compressedFiles.push(compressed);
            }

            // 2. División en lotes de 10 fotos para no sobrepasar el límite max_file_uploads del servidor
            const chunkSize = 10;
            const batches: File[][] = [];
            for (let i = 0; i < compressedFiles.length; i += chunkSize) {
                batches.push(compressedFiles.slice(i, i + chunkSize));
            }

            for (let b = 0; b < batches.length; b++) {
                setUploadStatus(`Subiendo lote ${b + 1} de ${batches.length} (${batches[b].length} fotos optimizadas)...`);
                await uploadBatch(batches[b]);
            }

            setUploadStatus('');
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            setIsUploading(false);
            setUploadStatus('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (typeof err === 'object' && err !== null) {
                const msg = Object.values(err).flat().join(', ');
                setUploadError(msg || 'Ocurrió un error al subir algunas imágenes.');
            } else {
                setUploadError('Error al procesar las fotografías.');
            }
        }
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
            {/* 1. HERO HEADER: AMBIENTE Y ÁLBUM OFICIAL CLARO            */}
            {/* ========================================================= */}
            <header className="bg-gradient-to-r from-[#2c4537] via-[#385645] to-[#2c4537] dark:from-[#1b2b22] dark:via-[#24392d] dark:to-[#1b2b22] text-[#fcf8ed] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#486b55] dark:border-[#2d4234] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-10 opacity-[0.14] pointer-events-none w-48 h-48 select-none brightness-150">
                    <img 
                        src="/resources_canvas/images/15.svg" 
                        alt="Monograma" 
                        className="w-full h-full object-contain" 
                    />
                </div>

                <div className="space-y-1.5 z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans uppercase tracking-wider font-semibold bg-[#16271e]/75 backdrop-blur-sm text-[#f4ecd8] border border-[#cfbe95]/40 shadow-xs">
                            <Sparkles className="w-3 h-3 text-[#cfbe95]" />
                            {isPlanner ? 'Modo Wedding Planner (Lectura)' : 'Álbum Oficial de Recuerdos'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#f4ecd8] bg-[#16271e]/75 backdrop-blur-sm px-3 py-1 rounded-full border border-[#cfbe95]/40 shadow-xs font-semibold">
                            <Clock className="w-3 h-3 text-[#cfbe95]" />
                            <span>{currentTime || 'Galería de Boda'}</span>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#fcf8ed]">
                        Galería de Boda • Álbum Fotográfico
                    </h1>
                    <p className="text-xs sm:text-sm text-[#dfd4c0] font-sans font-medium max-w-xl">
                        {wedding ? `${wedding.bride_name} & ${wedding.groom_name} — ` : ''}Sube y organiza las fotografías de su historia de amor. La primera imagen será la portada de la invitación.
                    </p>
                </div>

                {/* Métricas y Acción de Subida */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end z-10">
                    {/* Tarjeta de contador */}
                    <div className="bg-[#16271e]/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#cfbe95]/30 shadow-md flex flex-col items-end min-w-[140px]">
                        <span className="text-[10.5px] uppercase font-sans font-semibold tracking-wider text-[#cfbe95]">
                            Total de Fotos
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-2xl font-bold font-sans text-[#fcf8ed]">
                                {images.length}
                            </span>
                            <span className="text-xs text-[#cfbe95]/85 font-sans font-medium">
                                {images.length === 1 ? 'fotografía' : 'fotografías'}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#e8d5aa] font-bold mt-1 flex items-center gap-1">
                            {images.length > 0 ? (
                                <>
                                    <CheckCircle2 className="w-3 h-3 text-[#cfbe95]" />
                                    Portada activa
                                </>
                            ) : (
                                'Sin portada'
                            )}
                        </span>
                    </div>

                    {/* Botón de Subir Fotos con formatos amplios */}
                    {!isPlanner && (
                        <div>
                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,image/jpg,image/webp,image/gif,image/heic,image/heif,image/*" 
                                multiple 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button
                                type="button"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-[#fcf8ee] hover:bg-[#f3ebd9] text-[#24352a] font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 h-11 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 border border-[#e6dbc5]"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 text-[#24352a] animate-spin" />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-4 h-4 text-[#24352a]" />
                                        <span>Subir Fotos</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* ========================================================= */}
            {/* 2. ALERTA DE ESTADO DE SUBIDA / PROGRESO                  */}
            {/* ========================================================= */}
            {isUploading && uploadStatus && (
                <div className="bg-[#eef5f1] dark:bg-stone-900 border border-[#a8c5b2] dark:border-stone-800 rounded-xl p-3.5 px-4 text-xs text-[#2c4537] dark:text-[#a8c5b2] flex items-center gap-3 shadow-xs animate-in fade-in-50">
                    <Loader2 className="w-4 h-4 text-[#2c4537] animate-spin shrink-0" />
                    <div className="flex-1">
                        <span className="font-bold">{uploadStatus}</span>
                        <p className="text-[11px] opacity-80 mt-0.5">
                            Comprimiendo y optimizando imágenes para no saturar el servidor y acelerar la visualización en celulares.
                        </p>
                    </div>
                </div>
            )}

            {uploadError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl p-3.5 px-4 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{uploadError}</span>
                    </div>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setUploadError(null)} 
                        className="h-6 text-xs text-rose-700 hover:text-rose-900"
                    >
                        Cerrar
                    </Button>
                </div>
            )}

            {/* ========================================================= */}
            {/* 3. BARRA INFORMATIVA: FORMATOS Y COMPRESIÓN ACTIVA        */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#f7f5f0] dark:bg-stone-900/60 border border-[#ded8cd] dark:border-stone-800 rounded-xl p-3.5 px-4 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2.5 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-[#2c4537] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Info className="w-4 h-4 text-[#cfbe95]" />
                    </div>
                    <div>
                        <span className="font-sans font-bold text-[#70531c] dark:text-[#f4ecd8]">
                            Secuencia visual y portada:
                        </span>{' '}
                        <span>
                            Arrastra las fotos para cambiar su orden. La <strong>primera foto</strong> (con borde dorado) será la portada principal de apertura.
                        </span>
                    </div>
                </div>

                <div className="bg-[#faf8f2] dark:bg-stone-900/60 border border-[#cfbe95]/50 dark:border-stone-800 rounded-xl p-3.5 px-4 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2.5 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-[#8f6d28] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <span className="font-sans font-bold text-[#8f6d28] dark:text-[#dfc588]">
                            Compresión automática y formatos:
                        </span>{' '}
                        <span>
                            Acepta <strong>PNG, JPG, JPEG, WEBP, GIF, HEIC</strong>. Se optimizan automáticamente a WebP para reducir hasta un 90% el consumo de almacenamiento. Puedes subir lotes de cualquier cantidad de fotos.
                        </span>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* 4. REJILLA DE FOTOGRAFÍAS                                 */}
            {/* ========================================================= */}
            {images.length === 0 ? (
                <div className="bg-white dark:bg-stone-900 border-2 border-dashed border-[#ded8cd] dark:border-stone-800 rounded-3xl p-16 text-center max-w-2xl mx-auto my-8">
                    <div className="w-20 h-20 bg-[#f4f7f5] dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#c8d4cc] dark:border-stone-700">
                        <ImageIcon className="w-10 h-10 text-[#698175]" />
                    </div>
                    <h3 className="font-sans text-2xl font-bold text-[#28362e] dark:text-[#f4ecd8] mb-2">
                        Aún no hay fotos en la galería
                    </h3>
                    <p className="text-stone-500 font-sans text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                        Sube las mejores imágenes de la pareja para ilustrar la invitación web digital y darle un toque emotivo y elegante a su gran día.
                    </p>
                    {!isPlanner && (
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-6 bg-[#2c4537] hover:bg-[#385645] text-white font-sans text-xs uppercase tracking-wider font-semibold px-6 py-2.5 rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
                        >
                            <UploadCloud className="w-4 h-4" />
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
                                        : 'border border-stone-200 dark:border-stone-800 hover:border-[#698175] shadow-xs hover:shadow-md'
                                } bg-stone-100 dark:bg-stone-950`}
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
                                    loading="lazy"
                                />
                                
                                {/* Insignia de Portada Principal o Número */}
                                {isCover ? (
                                    <div className="absolute top-2.5 left-2.5 bg-[#2c4537] text-white border border-[#2c4537]/60 text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
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
            {/* 5. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN                   */}
            {/* ========================================================= */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="max-w-md bg-white dark:bg-stone-900 rounded-2xl p-6">
                    <DialogHeader className="text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <DialogTitle className="font-sans text-xl font-bold text-stone-900 dark:text-stone-100">
                            Eliminar Fotografía
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                            ¿Estás seguro de que deseas eliminar esta fotografía del álbum? 
                            Esta acción no se puede deshacer y la foto ya no se mostrará en la invitación interactiva de los invitados.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setDeleteConfirmId(null)}
                            className="font-sans text-stone-600 dark:text-stone-400 cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            onClick={confirmDelete}
                            className="bg-rose-700 hover:bg-rose-800 text-white font-sans text-xs uppercase tracking-wider font-semibold cursor-pointer shadow"
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
