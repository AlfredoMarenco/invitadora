import React, { useState, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Hotel, 
    Plus, 
    Pencil, 
    Trash2, 
    MapPin, 
    Globe, 
    ExternalLink, 
    ArrowUp, 
    ArrowDown, 
    Eye, 
    EyeOff, 
    UploadCloud, 
    Sparkles, 
    Building2, 
    CheckCircle2, 
    AlertTriangle,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';

interface HotelItem {
    id: number;
    name: string;
    location: string;
    url?: string | null;
    image_path: string;
    order: number;
    is_active: boolean;
}

interface HotelManagerProps {
    wedding?: {
        id?: number;
        bride_name?: string;
        groom_name?: string;
    };
    hotels: HotelItem[];
}

export default function HotelManager({ wedding, hotels: initialHotels = [] }: HotelManagerProps) {
    const { auth } = usePage().props as any;
    const isPlanner = auth?.user?.role === 'wedding_planner';

    const [hotels, setHotels] = useState<HotelItem[]>(initialHotels);

    // Sincronizar si cambian los props
    React.useEffect(() => {
        setHotels(initialHotels);
    }, [initialHotels]);

    // Estados para Modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<HotelItem | null>(null);

    // Estados de Formulario de Creación
    const [createName, setCreateName] = useState('');
    const [createLocation, setCreateLocation] = useState('');
    const [createUrl, setCreateUrl] = useState('');
    const [createImageFile, setCreateImageFile] = useState<File | null>(null);
    const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
    const [createIsActive, setCreateIsActive] = useState(true);
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    // Estados de Formulario de Edición
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editIsActive, setEditIsActive] = useState(true);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});

    const createFileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Handlers para Creación
    const openCreateModal = () => {
        setCreateName('');
        setCreateLocation('');
        setCreateUrl('');
        setCreateImageFile(null);
        setCreateImagePreview(null);
        setCreateIsActive(true);
        setCreateErrors({});
        setIsCreateOpen(true);
    };

    const handleCreateImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCreateImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setCreateImagePreview(previewUrl);
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateErrors({});

        if (!createName.trim()) {
            setCreateErrors(prev => ({ ...prev, name: 'El nombre del hotel es obligatorio' }));
            return;
        }
        if (!createLocation.trim()) {
            setCreateErrors(prev => ({ ...prev, location: 'La ubicación o dirección es obligatoria' }));
            return;
        }
        if (!createImageFile) {
            setCreateErrors(prev => ({ ...prev, image: 'Debes seleccionar una imagen para el hotel' }));
            return;
        }

        setIsSubmittingCreate(true);

        const formData = new FormData();
        formData.append('name', createName.trim());
        formData.append('location', createLocation.trim());
        if (createUrl.trim()) {
            formData.append('url', createUrl.trim());
        }
        formData.append('image', createImageFile);
        formData.append('is_active', createIsActive ? '1' : '0');

        router.post('/admin/hotels', formData, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                setIsCreateOpen(false);
            },
            onError: (errs) => {
                setCreateErrors(errs as Record<string, string>);
            },
            onFinish: () => {
                setIsSubmittingCreate(false);
            }
        });
    };

    // Handlers para Edición
    const openEditModal = (hotel: HotelItem) => {
        setSelectedHotel(hotel);
        setEditName(hotel.name);
        setEditLocation(hotel.location);
        setEditUrl(hotel.url || '');
        setEditImageFile(null);
        setEditImagePreview(hotel.image_path);
        setEditIsActive(hotel.is_active);
        setEditErrors({});
        setIsEditOpen(true);
    };

    const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setEditImagePreview(previewUrl);
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHotel) return;
        setEditErrors({});

        if (!editName.trim()) {
            setEditErrors(prev => ({ ...prev, name: 'El nombre del hotel es obligatorio' }));
            return;
        }
        if (!editLocation.trim()) {
            setEditErrors(prev => ({ ...prev, location: 'La ubicación es obligatoria' }));
            return;
        }

        setIsSubmittingEdit(true);

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', editName.trim());
        formData.append('location', editLocation.trim());
        formData.append('url', editUrl.trim() || '');
        formData.append('is_active', editIsActive ? '1' : '0');
        if (editImageFile) {
            formData.append('image', editImageFile);
        }

        router.post(`/admin/hotels/${selectedHotel.id}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedHotel(null);
            },
            onError: (errs) => {
                setEditErrors(errs as Record<string, string>);
            },
            onFinish: () => {
                setIsSubmittingEdit(false);
            }
        });
    };

    // Handlers para Eliminación
    const openDeleteModal = (hotel: HotelItem) => {
        setSelectedHotel(hotel);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedHotel) return;
        router.delete(`/admin/hotels/${selectedHotel.id}`, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedHotel(null);
            }
        });
    };

    // Toggle activo/inactivo
    const handleToggleActive = (hotel: HotelItem) => {
        if (isPlanner) return;
        router.put(`/admin/hotels/${hotel.id}/toggle`, {}, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    // Reordenar hoteles (Move Up / Move Down)
    const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
        if (isPlanner) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= hotels.length) return;

        const newHotels = [...hotels];
        const temp = newHotels[index];
        newHotels[index] = newHotels[targetIndex];
        newHotels[targetIndex] = temp;

        setHotels(newHotels);

        const orders = newHotels.map((h, idx) => ({ id: h.id, order: idx }));
        router.put('/admin/hotels/reorder', { orders }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const activeHotelsCount = hotels.filter(h => h.is_active).length;

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 py-6 w-full">
            <Head title={`Hoteles Recomendados - ${wedding?.bride_name || 'Boda'} & ${wedding?.groom_name || ''}`} />

            {/* Banner de Wedding Planner (si aplica) */}
            {isPlanner && (
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-center gap-3">
                    <AlertTriangle className="size-5 shrink-0 text-amber-600" />
                    <p className="text-xs md:text-sm font-sans">
                        Modo lectura activo. Como Wedding Planner tienes acceso a supervisar los hoteles recomendados, pero no puedes modificarlos ni eliminarlos.
                    </p>
                </div>
            )}

            {/* Cabecera Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#ded8cd]">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 rounded-lg bg-[#698175]/10 text-[#698175]">
                            <Building2 className="size-5" />
                        </span>
                        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#28362e] dark:text-[#f3f6f4]">
                            Hoteles Recomendados
                        </h1>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-sans">
                        Administra las opciones de hospedaje que se mostrarán en el carrusel de la invitación para tus invitados.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href="/#hospedaje"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#ded8cd] hover:border-[#698175] text-[#28362e] dark:text-[#f3f6f4] transition-colors bg-card shadow-xs"
                    >
                        <ExternalLink className="size-3.5 text-[#698175]" />
                        <span>Ver en Invitación</span>
                    </a>

                    {!isPlanner && (
                        <Button
                            type="button"
                            onClick={openCreateModal}
                            className="bg-[#698175] hover:bg-[#52665c] text-white font-medium text-xs md:text-sm gap-1.5 shadow-sm"
                        >
                            <Plus className="size-4" />
                            <span>Agregar Hotel</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Métricas / Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-[#ded8cd] bg-card flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Registrados</p>
                        <h3 className="text-2xl font-bold font-serif text-[#28362e] dark:text-[#f3f6f4] mt-0.5">
                            {hotels.length}
                        </h3>
                    </div>
                    <div className="size-10 rounded-lg bg-[#698175]/10 text-[#698175] flex items-center justify-center">
                        <Hotel className="size-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-[#ded8cd] bg-card flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Activos en Invitación</p>
                        <h3 className="text-2xl font-bold font-serif text-[#698175] mt-0.5">
                            {activeHotelsCount}
                        </h3>
                    </div>
                    <div className="size-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 flex items-center justify-center">
                        <CheckCircle2 className="size-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-[#ded8cd] bg-card flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ocultos / Pausados</p>
                        <h3 className="text-2xl font-bold font-serif text-stone-500 mt-0.5">
                            {hotels.length - activeHotelsCount}
                        </h3>
                    </div>
                    <div className="size-10 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center">
                        <EyeOff className="size-5" />
                    </div>
                </div>
            </div>

            {/* Lista de Hoteles */}
            {hotels.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border-2 border-dashed border-[#ded8cd] bg-card flex flex-col items-center justify-center">
                    <div className="size-14 rounded-2xl bg-[#698175]/10 text-[#698175] flex items-center justify-center mb-4">
                        <Building2 className="size-7" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#28362e] dark:text-[#f3f6f4]">
                        Aún no tienes hoteles registrados
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
                        Agrega hoteles y recomendaciones de hospedaje con fotografía, nombre y ubicación para facilitar la estancia de tus invitados.
                    </p>
                    {!isPlanner && (
                        <Button
                            type="button"
                            onClick={openCreateModal}
                            className="bg-[#698175] hover:bg-[#52665c] text-white text-xs gap-1.5"
                        >
                            <Plus className="size-4" />
                            <span>Registrar Primer Hotel</span>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {hotels.map((hotel, index) => (
                        <div
                            key={hotel.id}
                            className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-card flex flex-col justify-between group ${
                                hotel.is_active 
                                    ? 'border-[#ded8cd] hover:border-[#698175] hover:shadow-md' 
                                    : 'border-dashed border-stone-300 opacity-70 bg-stone-50/50 dark:bg-stone-900/30'
                            }`}
                        >
                            {/* Imagen y badges */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                                <img
                                    src={hotel.image_path}
                                    alt={hotel.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        // Imagen fallback si no carga
                                        (e.target as HTMLImageElement).src = '/images/hotels/hotel_1.jpg';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                                {/* Badge de estado y orden */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                    <Badge 
                                        variant={hotel.is_active ? "default" : "secondary"}
                                        className={`text-[10px] uppercase font-semibold tracking-wider ${
                                            hotel.is_active 
                                                ? 'bg-[#698175] text-white hover:bg-[#698175]' 
                                                : 'bg-stone-700/80 text-white'
                                        }`}
                                    >
                                        {hotel.is_active ? 'Activo' : 'Oculto'}
                                    </Badge>
                                </div>

                                <div className="absolute top-2.5 right-2.5 bg-black/50 text-white text-[11px] font-mono px-2 py-0.5 rounded-full backdrop-blur-xs">
                                    #{index + 1}
                                </div>

                                {/* Nombre encima del degradado */}
                                <div className="absolute bottom-2.5 inset-x-3 text-white">
                                    <h4 className="font-serif font-bold text-base leading-snug drop-shadow-sm line-clamp-1">
                                        {hotel.name}
                                    </h4>
                                </div>
                            </div>

                            {/* Contenido / Datos del Hotel */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <MapPin className="size-3.5 text-[#698175] shrink-0 mt-0.5" />
                                        <span className="line-clamp-2 leading-relaxed text-[#28362e] dark:text-[#d1dbd5]">
                                            {hotel.location}
                                        </span>
                                    </div>

                                    {hotel.url && (
                                        <div className="flex items-center gap-1.5 text-xs text-[#698175] truncate">
                                            <Globe className="size-3.5 shrink-0" />
                                            <a
                                                href={hotel.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate hover:underline"
                                            >
                                                {hotel.url.replace(/^https?:\/\/(www\.)?/, '')}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Barra de Acciones */}
                                <div className="pt-3 border-t border-[#f0ede6] flex items-center justify-between">
                                    {/* Reordenar */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={isPlanner || index === 0}
                                            onClick={() => handleMoveOrder(index, 'up')}
                                            title="Mover hacia arriba"
                                            className="size-7 rounded-md hover:bg-[#698175]/10 text-stone-600 disabled:opacity-30"
                                        >
                                            <ArrowUp className="size-3.5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={isPlanner || index === hotels.length - 1}
                                            onClick={() => handleMoveOrder(index, 'down')}
                                            title="Mover hacia abajo"
                                            className="size-7 rounded-md hover:bg-[#698175]/10 text-stone-600 disabled:opacity-30"
                                        >
                                            <ArrowDown className="size-3.5" />
                                        </Button>
                                    </div>

                                    {/* Controles de Visibilidad, Editar, Eliminar */}
                                    <div className="flex items-center gap-1">
                                        {!isPlanner && (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleActive(hotel)}
                                                    title={hotel.is_active ? 'Ocultar en invitación' : 'Mostrar en invitación'}
                                                    className={`size-7 rounded-md ${hotel.is_active ? 'text-[#698175] hover:bg-[#698175]/10' : 'text-stone-400 hover:bg-stone-100'}`}
                                                >
                                                    {hotel.is_active ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(hotel)}
                                                    title="Editar datos del hotel"
                                                    className="size-7 rounded-md text-amber-700 hover:bg-amber-50"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openDeleteModal(hotel)}
                                                    title="Eliminar hotel"
                                                    className="size-7 rounded-md text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 1: AGREGAR HOTEL                                    */}
            {/* ========================================================= */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#28362e] dark:text-[#f3f6f4] flex items-center gap-2">
                            <Building2 className="size-5 text-[#698175]" />
                            <span>Agregar Hotel Recomendado</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Completa los datos del hotel para que los invitados puedan consultarlo en su invitación.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                        {/* Nombre del Hotel */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create-name" className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Nombre del Hotel *
                            </Label>
                            <Input
                                id="create-name"
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Ej. Hotel Hacienda Misné"
                                className="text-sm"
                                required
                            />
                            {createErrors.name && (
                                <p className="text-[11px] text-rose-600">{createErrors.name}</p>
                            )}
                        </div>

                        {/* Ubicación / Dirección */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create-location" className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Ubicación / Dirección *
                            </Label>
                            <Input
                                id="create-location"
                                value={createLocation}
                                onChange={(e) => setCreateLocation(e.target.value)}
                                placeholder="Ej. Calle 19 #172, Centro Histórico / A 5 min de la recepción"
                                className="text-sm"
                                required
                            />
                            {createErrors.location && (
                                <p className="text-[11px] text-rose-600">{createErrors.location}</p>
                            )}
                        </div>

                        {/* URL de Reserva o Mapa (Opcional) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create-url" className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Enlace de Reserva o Sitio Web (Opcional)
                            </Label>
                            <Input
                                id="create-url"
                                type="url"
                                value={createUrl}
                                onChange={(e) => setCreateUrl(e.target.value)}
                                placeholder="https://hotel.com/reservaciones o link de Google Maps"
                                className="text-sm"
                            />
                            <p className="text-[10.5px] text-muted-foreground">
                                Si lo dejas vacío, el botón "Reserva aquí" buscará la ubicación en Google Maps.
                            </p>
                            {createErrors.url && (
                                <p className="text-[11px] text-rose-600">{createErrors.url}</p>
                            )}
                        </div>

                        {/* Imagen del Hotel */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Fotografía del Hotel *
                            </Label>
                            
                            <input
                                ref={createFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCreateImageChange}
                                className="hidden"
                            />

                            {createImagePreview ? (
                                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#ded8cd] group">
                                    <img
                                        src={createImagePreview}
                                        alt="Previsualización"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => createFileInputRef.current?.click()}
                                            className="text-xs"
                                        >
                                            Cambiar Foto
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => createFileInputRef.current?.click()}
                                    className="border-2 border-dashed border-[#ded8cd] hover:border-[#698175] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#fbf9f4]/50 hover:bg-[#fbf9f4]"
                                >
                                    <UploadCloud className="size-8 text-[#698175] mx-auto mb-2" />
                                    <p className="text-xs font-medium text-[#28362e] dark:text-[#f3f6f4]">
                                        Haz clic para seleccionar la fotografía
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Formatos JPG, PNG, WEBP (Máx. 5MB)
                                    </p>
                                </div>
                            )}

                            {createErrors.image && (
                                <p className="text-[11px] text-rose-600">{createErrors.image}</p>
                            )}
                        </div>

                        {/* Visibilidad Inicial */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="create-active"
                                type="checkbox"
                                checked={createIsActive}
                                onChange={(e) => setCreateIsActive(e.target.checked)}
                                className="size-4 rounded border-[#ded8cd] text-[#698175] focus:ring-[#698175]"
                            />
                            <Label htmlFor="create-active" className="text-xs cursor-pointer text-[#28362e] dark:text-[#e2e8e4]">
                                Mostrar inmediatamente en la invitación pública
                            </Label>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={isSubmittingCreate}
                                className="text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmittingCreate}
                                className="bg-[#698175] hover:bg-[#52665c] text-white text-xs font-medium"
                            >
                                {isSubmittingCreate ? 'Guardando...' : 'Guardar Hotel'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* MODAL 2: EDITAR HOTEL                                     */}
            {/* ========================================================= */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#28362e] dark:text-[#f3f6f4] flex items-center gap-2">
                            <Pencil className="size-5 text-amber-600" />
                            <span>Editar Hotel Recomendado</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Modifica los datos del hotel o sube una nueva imagen si lo deseas.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                        {/* Nombre del Hotel */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name" className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Nombre del Hotel *
                            </Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-sm"
                                required
                            />
                            {editErrors.name && (
                                <p className="text-[11px] text-rose-600">{editErrors.name}</p>
                            )}
                        </div>

                        {/* Ubicación / Dirección */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-location" className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Ubicación / Dirección *
                            </Label>
                            <Input
                                id="edit-location"
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                className="text-sm"
                                required
                            />
                            {editErrors.location && (
                                <p className="text-[11px] text-rose-600">{editErrors.location}</p>
                            )}
                        </div>

                        {/* URL de Reserva o Mapa (Opcional) */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-url" className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Enlace de Reserva o Sitio Web
                            </Label>
                            <Input
                                id="edit-url"
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder="https://hotel.com/reservaciones"
                                className="text-sm"
                            />
                            {editErrors.url && (
                                <p className="text-[11px] text-rose-600">{editErrors.url}</p>
                            )}
                        </div>

                        {/* Imagen del Hotel */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-[#28362e] dark:text-[#e2e8e4]">
                                Fotografía del Hotel
                            </Label>
                            
                            <input
                                ref={editFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleEditImageChange}
                                className="hidden"
                            />

                            {editImagePreview && (
                                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#ded8cd] group">
                                    <img
                                        src={editImagePreview}
                                        alt="Previsualización"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => editFileInputRef.current?.click()}
                                            className="text-xs"
                                        >
                                            Cambiar Fotografía
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => editFileInputRef.current?.click()}
                                className="w-full text-xs gap-1.5 mt-1"
                            >
                                <UploadCloud className="size-3.5" />
                                <span>Seleccionar Nueva Foto de Reemplazo</span>
                            </Button>

                            {editErrors.image && (
                                <p className="text-[11px] text-rose-600">{editErrors.image}</p>
                            )}
                        </div>

                        {/* Visibilidad */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="edit-active"
                                type="checkbox"
                                checked={editIsActive}
                                onChange={(e) => setEditIsActive(e.target.checked)}
                                className="size-4 rounded border-[#ded8cd] text-[#698175] focus:ring-[#698175]"
                            />
                            <Label htmlFor="edit-active" className="text-xs cursor-pointer text-[#28362e] dark:text-[#e2e8e4]">
                                Hotel visible para los invitados
                            </Label>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSubmittingEdit}
                                className="text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmittingEdit}
                                className="bg-[#698175] hover:bg-[#52665c] text-white text-xs font-medium"
                            >
                                {isSubmittingEdit ? 'Actualizando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* MODAL 3: CONFIRMAR ELIMINACIÓN                            */}
            {/* ========================================================= */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-lg font-bold text-rose-700 flex items-center gap-2">
                            <AlertTriangle className="size-5 text-rose-600" />
                            <span>¿Eliminar este hotel?</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Esta acción eliminará <strong>{selectedHotel?.name}</strong> y su imagen asociada. Ya no se mostrará en el carrusel de la invitación.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedHotel && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-rose-100 bg-rose-50/50 dark:bg-rose-950/20 my-2">
                            <img
                                src={selectedHotel.image_path}
                                alt={selectedHotel.name}
                                className="size-12 rounded-lg object-cover"
                            />
                            <div className="overflow-hidden">
                                <p className="font-serif font-bold text-xs truncate text-[#28362e] dark:text-[#f3f6f4]">
                                    {selectedHotel.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {selectedHotel.location}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            className="text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleDeleteConfirm}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                        >
                            <Trash2 className="size-3.5 mr-1" />
                            Sí, Eliminar Hotel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

HotelManager.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Hoteles Recomendados', href: '/admin/hotels' },
    ],
};
