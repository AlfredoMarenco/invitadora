import React, { useRef, useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Trash2, UploadCloud, Image as ImageIcon, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface GalleryManagerProps {
    images: any[];
}

export default function GalleryManager({ images: initialImages }: GalleryManagerProps) {
    const { auth } = usePage().props;
    const isPlanner = auth.user.role === 'wedding_planner';

    const fileInputRef = useRef(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [images, setImages] = useState(initialImages);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    // Sync with props
    useEffect(() => {
        setImages(initialImages);
    }, [initialImages]);

    const handleFileUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Subimos todos los archivos en una sola petición
        router.post('/admin/gallery', {
            images: Array.from(files)
        }, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
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
    const handleDragStart = (index) => {
        if (isPlanner) return;
        setDraggedItemIndex(index);
    };

    const handleDragEnter = (index) => {
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
        <>
            <Head title="Galería de Fotos" />
            
            <div className="w-full px-4 md:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Galería de la Boda {isPlanner && "(Modo Lectura)"}</h1>
                        <p className="text-zinc-500 mt-1">Sube y arrastra las fotos para ordenarlas. La primera será el fondo de la invitación.</p>
                    </div>
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
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-zinc-800 transition flex items-center shadow-sm"
                            >
                                <UploadCloud className="w-5 h-5 mr-2" />
                                Subir Fotos
                            </button>
                        </div>
                    )}
                </div>

                {images.length === 0 ? (
                    <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-16 text-center">
                        <div className="w-25 h-25 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ImageIcon className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-xl font-medium text-zinc-800 mb-2">No hay fotos en la galería</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto">Sube algunas fotos para darle vida a la invitación digital de los novios.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {images.map((img, index) => (
                            <div 
                                key={img.id} 
                                className="group relative aspect-[4/3] bg-zinc-100 rounded-xl overflow-hidden shadow-sm border border-zinc-200"
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragEnter={() => handleDragEnter(index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <img 
                                    src={img.image_path} 
                                    alt="Foto de la boda" 
                                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                />
                                
                                {/* Botones Flotantes (Mostrar al hover) */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-4">
                                    <div 
                                        className={`bg-white text-zinc-600 p-2.5 rounded-full hover:bg-zinc-100 transition shadow-lg ${!isPlanner ? 'cursor-grab active:cursor-grabbing' : 'opacity-50'}`}
                                        title={!isPlanner ? "Arrastrar para ordenar" : ""}
                                    >
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    {!isPlanner && (
                                        <button 
                                            onClick={() => setDeleteConfirmId(img.id)}
                                            className="bg-white text-red-600 p-2.5 rounded-full hover:bg-red-50 hover:text-red-700 transition shadow-lg"
                                            title="Eliminar foto"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Badge para la primera imagen (Fondo) */}
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                        Fondo Principal
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Fotografía</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar esta fotografía? Esta acción no se puede deshacer y desaparecerá de la invitación pública.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 border rounded-md text-zinc-700 hover:bg-zinc-50 transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                        >
                            Sí, Eliminar
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

GalleryManager.layout = ({ images }) => ({
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Galería', href: '/admin/gallery' }
    ],
});
