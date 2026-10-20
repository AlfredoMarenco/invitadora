import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    UtensilsCrossed, 
    Users, 
    Search, 
    X, 
    Check, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw, 
    Lock, 
    Unlock, 
    Plus, 
    Crown, 
    Music, 
    Wine, 
    DoorOpen, 
    Sparkles,
    Trash2,
    Edit,
    Gift,
    Cake,
    Camera,
    Armchair,
    Layers,
    Sliders,
    Maximize2,
    Maximize,
    Minimize,
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import LuxuryModal from '@/components/LuxuryModal';
import { router } from '@inertiajs/react';

export interface TableGuest {
    id: number;
    table_id: number;
    full_name: string;
    type: string;
    checkin_code?: string;
    allergies?: string | null;
}

export interface TableItem {
    id: number;
    wedding_id: number;
    name: string;
    capacity: number;
    notes?: string;
    guests_count: number;
    guests?: TableGuest[];
    pos_x?: number;
    pos_y?: number;
    shape?: 'round' | 'rectangular' | 'head';
    rotation?: number;
    width?: number;
    height?: number;
}

export interface UnassignedGuest {
    id: number;
    full_name: string;
    type: string;
    invitation_name: string;
}

export interface VenueElement {
    id: string;
    type: 'stage' | 'dancefloor' | 'bar' | 'entrance' | 'gifts' | 'cake' | 'photocall' | 'lounge' | 'restrooms' | 'custom';
    title: string;
    subtitle?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    shape?: 'rectangle' | 'circle' | 'pill';
    color?: string;
}

interface InteractiveSeatingCanvasProps {
    tables: TableItem[];
    unassignedGuests: UnassignedGuest[];
    tableSearch: string;
    setTableSearch: (val: string) => void;
    assignGuestTable: (guestId: number, tableId: string | null) => void;
    startEditTable: (table: TableItem) => void;
    handleDeleteTable: (tableId: number) => void;
    openCreateTable: () => void;
    venueElements?: VenueElement[];
}

const DEFAULT_VENUE_ELEMENTS: VenueElement[] = [
    {
        id: 'stage-1',
        type: 'stage',
        title: 'ESCENARIO & GRUPO MUSICAL',
        subtitle: 'Zona de Sonido e Iluminación',
        x: 450,
        y: 30,
        width: 380,
        height: 75,
        shape: 'rectangle',
    },
    {
        id: 'dancefloor-1',
        type: 'dancefloor',
        title: 'PISTA DE BAILE',
        subtitle: 'A & J',
        x: 470,
        y: 160,
        width: 340,
        height: 220,
        shape: 'rectangle',
    },
    {
        id: 'bar-1',
        type: 'bar',
        title: 'BARRA LIBRE',
        subtitle: 'Mixología & Cócteles',
        x: 960,
        y: 160,
        width: 170,
        height: 180,
        shape: 'rectangle',
    },
    {
        id: 'entrance-1',
        type: 'entrance',
        title: 'ACCESO PRINCIPAL',
        subtitle: 'Entrada de Invitados',
        x: 490,
        y: 880,
        width: 300,
        height: 50,
        shape: 'pill',
    },
];

export const CANVAS_WIDTH = 2000;
export const CANVAS_HEIGHT = 1400;

export default function InteractiveSeatingCanvas({
    tables,
    unassignedGuests,
    tableSearch,
    setTableSearch,
    assignGuestTable,
    startEditTable,
    handleDeleteTable,
    openCreateTable,
    venueElements = []
}: InteractiveSeatingCanvasProps) {
    // Zoom del plano
    const [zoom, setZoom] = useState(1);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Modo Pantalla Completa / Ampliado
    const [isExpandedMode, setIsExpandedMode] = useState(false);

    // Visibilidad del panel de invitados sin asignar
    const [showUnassignedSidebar, setShowUnassignedSidebar] = useState(true);

    // Tab activo en el panel lateral ('unassigned' = sin asignar, 'table' = detalle/inspector de mesa, 'venue' = inspector de zona)
    const [sidebarTab, setSidebarTab] = useState<'unassigned' | 'table' | 'venue'>('unassigned');

    // Modo de bloqueo de distribución (para alternar entre arrastrar invitados y mover elementos)
    const [isMoveTablesMode, setIsMoveTablesMode] = useState(false);

    // Estado para mesa seleccionada e inspección de comensales
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

    // Estado para zona del salón seleccionada (escenario, pista, barra, etc.)
    const [selectedVenueElemId, setSelectedVenueElemId] = useState<string | null>(null);

    // Dimensiones locales inmediatas para evitar recargas al cambiar tamaño de mesas
    const [localDimensions, setLocalDimensions] = useState<Record<number, { width: number; height: number }>>({});
    const dimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const venueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Limpieza de debounces al desmontar
    useEffect(() => {
        return () => {
            if (dimTimeoutRef.current) {
                clearTimeout(dimTimeoutRef.current);
            }
            if (venueTimeoutRef.current) {
                clearTimeout(venueTimeoutRef.current);
            }
        };
    }, []);

    // Getters de dimensiones con fallback fluido
    const getTableWidth = (t: TableItem): number => {
        if (localDimensions[t.id]?.width !== undefined) return localDimensions[t.id].width;
        if (t.width) return t.width;
        return t.shape === 'round' ? 150 : t.shape === 'head' ? 240 : 210;
    };

    const getTableHeight = (t: TableItem): number => {
        if (localDimensions[t.id]?.height !== undefined) return localDimensions[t.id].height;
        if (t.height) return t.height;
        return t.shape === 'round' ? 150 : t.shape === 'head' ? 110 : 100;
    };

    // Modal de lujo para alertas y confirmaciones
    const [luxuryModalState, setLuxuryModalState] = useState<{
        open: boolean;
        title: string;
        description: string;
        type?: 'warning' | 'info' | 'success' | 'danger' | 'error';
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
    }>({
        open: false,
        title: '',
        description: '',
    });

    const showAlertModal = (title: string, description: string, type: 'warning' | 'info' | 'success' | 'error' = 'warning') => {
        setLuxuryModalState({
            open: true,
            title,
            description,
            type,
            confirmText: 'Entendido',
        });
    };

    const showConfirmModal = (title: string, description: string, onConfirm: () => void, confirmText = 'Sí, Eliminar') => {
        setLuxuryModalState({
            open: true,
            title,
            description,
            type: 'danger',
            confirmText,
            cancelText: 'Cancelar',
            onConfirm,
        });
    };

    // Salir de pantalla completa con tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isExpandedMode) {
                setIsExpandedMode(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpandedMode]);

    // Estado local optimista de posiciones de mesas
    const [localPositions, setLocalPositions] = useState<Record<number, { x: number; y: number }>>(() => {
        const map: Record<number, { x: number; y: number }> = {};
        tables.forEach((t, i) => {
            const defaultCol = i % 4;
            const defaultRow = Math.floor(i / 4);
            const defX = 140 + defaultCol * 240;
            const defY = 280 + defaultRow * 230;

            map[t.id] = {
                x: typeof t.pos_x === 'number' && t.pos_x > 0 ? t.pos_x : defX,
                y: typeof t.pos_y === 'number' && t.pos_y > 0 ? t.pos_y : defY,
            };
        });
        return map;
    });

    useEffect(() => {
        setLocalPositions(prev => {
            const next = { ...prev };
            tables.forEach((t, i) => {
                if (!next[t.id]) {
                    const defaultCol = i % 4;
                    const defaultRow = Math.floor(i / 4);
                    next[t.id] = {
                        x: typeof t.pos_x === 'number' && t.pos_x > 0 ? t.pos_x : 140 + defaultCol * 240,
                        y: typeof t.pos_y === 'number' && t.pos_y > 0 ? t.pos_y : 280 + defaultRow * 230,
                    };
                }
            });
            return next;
        });
    }, [tables]);

    // Estado de ZONAS DEL SALÓN (Escenario, Pista, Barra, etc.)
    const [venueList, setVenueList] = useState<VenueElement[]>(() => {
        if (venueElements && venueElements.length > 0) return venueElements;
        return DEFAULT_VENUE_ELEMENTS;
    });

    useEffect(() => {
        if (venueElements && venueElements.length > 0) {
            setVenueList(venueElements);
        }
    }, [venueElements]);

    // Modal para Crear / Editar Zona del Salón
    const [showVenueModal, setShowVenueModal] = useState(false);
    const [editingVenueElem, setEditingVenueElem] = useState<VenueElement | null>(null);
    const [venueFormData, setVenueFormData] = useState<{
        type: VenueElement['type'];
        title: string;
        subtitle: string;
        width: number;
        height: number;
        shape: 'rectangle' | 'circle' | 'pill';
    }>({
        type: 'stage',
        title: 'ESCENARIO & GRUPO MUSICAL',
        subtitle: 'Zona de Sonido',
        width: 380,
        height: 80,
        shape: 'rectangle'
    });

    const openAddVenueModal = () => {
        setEditingVenueElem(null);
        setVenueFormData({
            type: 'stage',
            title: 'ESCENARIO & GRUPO MUSICAL',
            subtitle: 'Sonido e Iluminación',
            width: 380,
            height: 80,
            shape: 'rectangle'
        });
        setShowVenueModal(true);
    };

    const openEditVenueModal = (elem: VenueElement) => {
        setEditingVenueElem(elem);
        setVenueFormData({
            type: elem.type,
            title: elem.title,
            subtitle: elem.subtitle || '',
            width: elem.width,
            height: elem.height,
            shape: elem.shape || 'rectangle'
        });
        setShowVenueModal(true);
    };

    const handlePresetChange = (type: VenueElement['type']) => {
        switch (type) {
            case 'stage':
                setVenueFormData({
                    type,
                    title: 'ESCENARIO & GRUPO MUSICAL',
                    subtitle: 'Sonido e Iluminación',
                    width: 380,
                    height: 80,
                    shape: 'rectangle'
                });
                break;
            case 'dancefloor':
                setVenueFormData({
                    type,
                    title: 'PISTA DE BAILE',
                    subtitle: 'A & J',
                    width: 340,
                    height: 220,
                    shape: 'rectangle'
                });
                break;
            case 'bar':
                setVenueFormData({
                    type,
                    title: 'BARRA LIBRE',
                    subtitle: 'Mixología & Cócteles',
                    width: 170,
                    height: 180,
                    shape: 'rectangle'
                });
                break;
            case 'entrance':
                setVenueFormData({
                    type,
                    title: 'ACCESO PRINCIPAL',
                    subtitle: 'Entrada de Invitados',
                    width: 300,
                    height: 50,
                    shape: 'pill'
                });
                break;
            case 'gifts':
                setVenueFormData({
                    type,
                    title: 'MESA DE REGALOS & SOBRES',
                    subtitle: 'Mesa de firmas y bienvenida',
                    width: 180,
                    height: 80,
                    shape: 'rectangle'
                });
                break;
            case 'cake':
                setVenueFormData({
                    type,
                    title: 'MESA DE PASTEL & DULCES',
                    subtitle: 'Candy Bar & Postres',
                    width: 160,
                    height: 80,
                    shape: 'rectangle'
                });
                break;
            case 'photocall':
                setVenueFormData({
                    type,
                    title: 'CABINA DE FOTOS / PHOTOCALL',
                    subtitle: 'Recuerdos y Fotografías',
                    width: 180,
                    height: 100,
                    shape: 'rectangle'
                });
                break;
            case 'lounge':
                setVenueFormData({
                    type,
                    title: 'SALA LOUNGE / CHILL OUT',
                    subtitle: 'Zona de descanso',
                    width: 220,
                    height: 120,
                    shape: 'rectangle'
                });
                break;
            case 'restrooms':
                setVenueFormData({
                    type,
                    title: 'SANITARIOS',
                    subtitle: 'Baños de invitados',
                    width: 130,
                    height: 60,
                    shape: 'pill'
                });
                break;
            default:
                setVenueFormData(prev => ({
                    ...prev,
                    type: 'custom',
                    title: 'ZONA PERSONALIZADA'
                }));
                break;
        }
    };

    const handleSaveVenueElement = (e: React.FormEvent) => {
        e.preventDefault();
        let nextList: VenueElement[];

        if (editingVenueElem) {
            nextList = venueList.map(elem => {
                if (elem.id === editingVenueElem.id) {
                    return {
                        ...elem,
                        type: venueFormData.type,
                        title: venueFormData.title,
                        subtitle: venueFormData.subtitle,
                        width: venueFormData.width,
                        height: venueFormData.height,
                        shape: venueFormData.shape,
                    };
                }
                return elem;
            });
        } else {
            const newElem: VenueElement = {
                id: `venue-${Date.now()}`,
                type: venueFormData.type,
                title: venueFormData.title,
                subtitle: venueFormData.subtitle,
                x: 480,
                y: 350,
                width: venueFormData.width,
                height: venueFormData.height,
                shape: venueFormData.shape,
            };
            nextList = [...venueList, newElem];
        }

        setVenueList(nextList);
        setShowVenueModal(false);

        // Guardar en servidor
        router.put('/admin/venue-elements', { elements: nextList as any }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleDeleteVenueElement = (elemId: string) => {
        const target = venueList.find(e => e.id === elemId);
        showConfirmModal(
            '¿Eliminar Zona del Salón?',
            `¿Deseas retirar "${target?.title || 'esta zona'}" del plano? Podrás volver a añadirla en cualquier momento si lo necesitas.`,
            () => {
                const nextList = venueList.filter(e => e.id !== elemId);
                setVenueList(nextList);

                if (selectedVenueElemId === elemId) {
                    setSelectedVenueElemId(null);
                    setSidebarTab('unassigned');
                }

                router.put('/admin/venue-elements', { elements: nextList as any }, {
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        );
    };

    // Actualización de zona del salón con sincronización local en vivo y debounce de guardado
    const updateVenueElement = (elemId: string, updates: Partial<VenueElement>, immediate = false) => {
        let updatedList: VenueElement[] = [];
        setVenueList(prev => {
            updatedList = prev.map(item => {
                if (item.id === elemId) {
                    return { ...item, ...updates };
                }
                return item;
            });
            return updatedList;
        });

        if (venueTimeoutRef.current) {
            clearTimeout(venueTimeoutRef.current);
        }

        const persistToServer = () => {
            const listToSave = updatedList.length > 0 ? updatedList : venueList.map(item => item.id === elemId ? { ...item, ...updates } : item);
            router.put('/admin/venue-elements', { elements: listToSave as any }, {
                preserveScroll: true,
                preserveState: true,
            });
        };

        if (immediate) {
            persistToServer();
        } else {
            venueTimeoutRef.current = setTimeout(persistToServer, 600);
        }
    };

    const getVenuePresets = (type: VenueElement['type']) => {
        switch (type) {
            case 'stage':
                return [
                    { label: 'Chica', w: 300, h: 70 },
                    { label: 'Media', w: 380, h: 80 },
                    { label: 'Grande', w: 460, h: 90 },
                    { label: 'XL', w: 540, h: 100 },
                ];
            case 'dancefloor':
                return [
                    { label: 'Chica', w: 260, h: 180 },
                    { label: 'Media', w: 340, h: 220 },
                    { label: 'Grande', w: 420, h: 270 },
                    { label: 'XL', w: 500, h: 320 },
                ];
            case 'bar':
                return [
                    { label: 'Chica', w: 130, h: 130 },
                    { label: 'Media', w: 170, h: 180 },
                    { label: 'Grande', w: 220, h: 200 },
                    { label: 'XL', w: 280, h: 220 },
                ];
            case 'entrance':
                return [
                    { label: 'Chica', w: 220, h: 45 },
                    { label: 'Media', w: 300, h: 50 },
                    { label: 'Grande', w: 380, h: 55 },
                    { label: 'XL', w: 460, h: 60 },
                ];
            case 'photocall':
            case 'lounge':
                return [
                    { label: 'Chica', w: 160, h: 90 },
                    { label: 'Media', w: 220, h: 120 },
                    { label: 'Grande', w: 280, h: 150 },
                    { label: 'XL', w: 350, h: 180 },
                ];
            default:
                return [
                    { label: 'Chica', w: 140, h: 70 },
                    { label: 'Media', w: 180, h: 80 },
                    { label: 'Grande', w: 240, h: 100 },
                    { label: 'XL', w: 300, h: 120 },
                ];
        }
    };

    // Arrastre de mesas en el canvas (Pointer Events)
    const [draggingTableId, setDraggingTableId] = useState<number | null>(null);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const handleTablePointerDown = (e: React.PointerEvent, tableId: number) => {
        if (!isMoveTablesMode) return;
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

        const currentPos = localPositions[tableId] || { x: 150, y: 150 };
        dragOffsetRef.current = {
            x: e.clientX / zoom - currentPos.x,
            y: e.clientY / zoom - currentPos.y,
        };
        setDraggingTableId(tableId);
    };

    // Arrastre de Zonas del Salón (Escenario, Pista, Barra, etc.)
    const [draggingVenueId, setDraggingVenueId] = useState<string | null>(null);
    const venueDragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const handleVenuePointerDown = (e: React.PointerEvent, elemId: string) => {
        if (!isMoveTablesMode) return;
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

        const elem = venueList.find(item => item.id === elemId);
        if (!elem) return;

        venueDragOffsetRef.current = {
            x: e.clientX / zoom - elem.x,
            y: e.clientY / zoom - elem.y,
        };
        setDraggingVenueId(elemId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (draggingTableId !== null) {
            const table = tables.find(t => t.id === draggingTableId);
            const w = table ? getTableWidth(table) : 150;
            const h = table ? getTableHeight(table) : 150;
            const halfW = Math.round(w / 2);
            const halfH = Math.round(h / 2);

            // Permitir mover la mesa por absolutamente TODO el interior de la línea punteada (16px margen del marco)
            const minX = 18 + halfW;
            const maxX = CANVAS_WIDTH - 18 - halfW;
            const minY = 18 + halfH;
            const maxY = CANVAS_HEIGHT - 18 - halfH;

            const newX = Math.max(minX, Math.min(maxX, Math.round(e.clientX / zoom - dragOffsetRef.current.x)));
            const newY = Math.max(minY, Math.min(maxY, Math.round(e.clientY / zoom - dragOffsetRef.current.y)));

            setLocalPositions(prev => ({
                ...prev,
                [draggingTableId]: { x: newX, y: newY }
            }));
        } else if (draggingVenueId !== null) {
            const elem = venueList.find(item => item.id === draggingVenueId);
            const w = elem ? elem.width : 200;
            const h = elem ? elem.height : 100;

            // Permitir mover las zonas por todo el interior de la línea punteada
            const minX = 20;
            const maxX = CANVAS_WIDTH - 20 - w;
            const minY = 20;
            const maxY = CANVAS_HEIGHT - 20 - h;

            const newX = Math.max(minX, Math.min(maxX, Math.round(e.clientX / zoom - venueDragOffsetRef.current.x)));
            const newY = Math.max(minY, Math.min(maxY, Math.round(e.clientY / zoom - venueDragOffsetRef.current.y)));

            setVenueList(prev => prev.map(item => {
                if (item.id === draggingVenueId) {
                    return { ...item, x: newX, y: newY };
                }
                return item;
            }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (draggingTableId !== null) {
            const finalPos = localPositions[draggingTableId];
            if (finalPos) {
                router.put(`/admin/tables/${draggingTableId}/position`, {
                    pos_x: finalPos.x,
                    pos_y: finalPos.y
                }, {
                    preserveScroll: true,
                    preserveState: true,
                    only: ['tables'],
                });
            }
            setDraggingTableId(null);
        } else if (draggingVenueId !== null) {
            router.put('/admin/venue-elements', { elements: venueList as any }, {
                preserveScroll: true,
                preserveState: true,
            });
            setDraggingVenueId(null);
        }
    };

    // Cambiar forma de mesa (redonda / rectangular / honor)
    const toggleTableShape = (table: TableItem) => {
        const currentShape = table.shape || 'round';
        const nextShape: 'round' | 'rectangular' | 'head' = 
            currentShape === 'round' ? 'rectangular' : currentShape === 'rectangular' ? 'head' : 'round';

        const curW = getTableWidth(table);
        const curH = getTableHeight(table);

        router.put(`/admin/tables/${table.id}`, {
            name: table.name,
            capacity: table.capacity,
            notes: table.notes || '',
            shape: nextShape,
            pos_x: localPositions[table.id]?.x || table.pos_x,
            pos_y: localPositions[table.id]?.y || table.pos_y,
            width: curW,
            height: curH,
        }, {
            preserveScroll: true,
            preserveState: true,
            only: ['tables'],
        });
    };

    // Actualizar dimensiones de mesa con sincronización inmediata local y guardado debounced (cero recargas molestas)
    const updateTableDimensions = (table: TableItem, newWidth: number, newHeight: number, immediate = false) => {
        // 1. Actualización inmediata local en React (cero latencia, cambio en vivo en pantalla)
        setLocalDimensions(prev => ({
            ...prev,
            [table.id]: { width: newWidth, height: newHeight }
        }));

        if (dimTimeoutRef.current) {
            clearTimeout(dimTimeoutRef.current);
        }

        const persistToServer = () => {
            router.put(`/admin/tables/${table.id}`, {
                name: table.name,
                capacity: table.capacity,
                notes: table.notes || '',
                shape: table.shape || 'round',
                pos_x: localPositions[table.id]?.x || table.pos_x,
                pos_y: localPositions[table.id]?.y || table.pos_y,
                width: newWidth,
                height: newHeight,
            }, {
                preserveScroll: true,
                preserveState: true,
                only: ['tables'],
            });
        };

        if (immediate) {
            persistToServer();
        } else {
            // Debounce de 600ms para evitar recargas constantes al teclear números
            dimTimeoutRef.current = setTimeout(persistToServer, 600);
        }
    };

    // DRAG AND DROP DE INVITADOS (HTML5 Drag & Drop)
    const [draggedGuest, setDraggedGuest] = useState<{ id: number; fromTableId?: number | null; name: string } | null>(null);
    const [dragOverTableId, setDragOverTableId] = useState<number | null>(null);

    const handleGuestDragStart = (e: React.DragEvent, guestId: number, guestName: string, fromTableId?: number | null) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ guestId, fromTableId }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedGuest({ id: guestId, fromTableId, name: guestName });
    };

    const handleGuestDragEnd = () => {
        setDraggedGuest(null);
        setDragOverTableId(null);
    };

    const handleTableDragOver = (e: React.DragEvent, table: TableItem) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverTableId !== table.id) {
            setDragOverTableId(table.id);
        }
    };

    const handleTableDragLeave = (e: React.DragEvent, table: TableItem) => {
        if (dragOverTableId === table.id) {
            setDragOverTableId(null);
        }
    };

    const handleTableDrop = (e: React.DragEvent, table: TableItem) => {
        e.preventDefault();
        setDragOverTableId(null);

        const rawData = e.dataTransfer.getData('text/plain');
        if (!rawData) return;

        try {
            const { guestId, fromTableId } = JSON.parse(rawData);
            if (!guestId) return;

            if (fromTableId === table.id) return;

            const currentOccupied = table.guests_count || 0;
            if (currentOccupied >= table.capacity) {
                showAlertModal(
                    'Mesa Completa',
                    `La mesa "${table.name}" ya alcanzó su límite máximo de capacidad (${table.capacity} lugares). Por favor elige otra mesa disponible o aumenta la capacidad de esta mesa para acomodar a más personas.`,
                    'warning'
                );
                return;
            }

            assignGuestTable(guestId, String(table.id));
        } catch (err) {
            console.error('Error al soltar comensal:', err);
        }
    };

    // Zona de desasignación
    const [dragOverUnassignArea, setDragOverUnassignArea] = useState(false);

    const handleUnassignDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverUnassignArea(false);

        const rawData = e.dataTransfer.getData('text/plain');
        if (!rawData) return;

        try {
            const { guestId, fromTableId } = JSON.parse(rawData);
            if (guestId && fromTableId) {
                assignGuestTable(guestId, null);
            }
        } catch (err) {
            console.error('Error al desasignar:', err);
        }
    };

    const filteredUnassigned = useMemo(() => {
        if (!tableSearch.trim()) return unassignedGuests;
        const q = tableSearch.toLowerCase();
        return unassignedGuests.filter(g => 
            g.full_name.toLowerCase().includes(q) || 
            g.invitation_name.toLowerCase().includes(q)
        );
    }, [unassignedGuests, tableSearch]);

    const selectedTable = useMemo(() => {
        return tables.find(t => t.id === selectedTableId) || null;
    }, [tables, selectedTableId]);

    const selectedVenueElem = useMemo(() => {
        return venueList.find(elem => elem.id === selectedVenueElemId) || null;
    }, [venueList, selectedVenueElemId]);

    // Renderizar icono según tipo de zona
    const renderVenueIcon = (type: VenueElement['type']) => {
        switch (type) {
            case 'stage': return <Music className="w-4 h-4 text-[#cfbe95]" />;
            case 'dancefloor': return <Sparkles className="w-5 h-5 text-[#cfbe95]" />;
            case 'bar': return <Wine className="w-5 h-5 text-[#8f6d28]" />;
            case 'entrance': return <DoorOpen className="w-4 h-4 text-stone-500" />;
            case 'gifts': return <Gift className="w-4 h-4 text-amber-600" />;
            case 'cake': return <Cake className="w-4 h-4 text-rose-500" />;
            case 'photocall': return <Camera className="w-4 h-4 text-purple-600" />;
            case 'lounge': return <Armchair className="w-4 h-4 text-[#385645]" />;
            case 'restrooms': return <Users className="w-4 h-4 text-stone-500" />;
            default: return <Sparkles className="w-4 h-4 text-[#cfbe95]" />;
        }
    };

    return (
        <div className={`${isExpandedMode ? 'fixed inset-0 z-50 bg-[#f7f4ec] dark:bg-stone-950 p-4 sm:p-6 flex flex-col w-screen h-screen overflow-hidden' : 'space-y-4 select-none relative'}`}>
            {/* 1. BARRA SUPERIOR DE HERRAMIENTAS Y CONTROLES DEL PLANO */}
            <div className="bg-card p-3 rounded-2xl border border-[#ded8cd] shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Botón modo Mover Mesas y Zonas */}
                    <Button
                        type="button"
                        onClick={() => setIsMoveTablesMode(!isMoveTablesMode)}
                        variant={isMoveTablesMode ? 'default' : 'outline'}
                        className={`text-xs font-bold uppercase tracking-wider h-9 px-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 ${
                            isMoveTablesMode
                                ? 'bg-[#cfbe95] hover:bg-[#bfae85] text-[#2c4537] shadow-sm ring-2 ring-[#cfbe95]/50'
                                : 'bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd] text-stone-700 dark:text-stone-300'
                        }`}
                        title={isMoveTablesMode ? "Bloquear posiciones de elementos" : "Activar para mover mesas y zonas libremente"}
                    >
                        {isMoveTablesMode ? (
                            <>
                                <Unlock className="w-4 h-4 text-[#2c4537] animate-pulse" />
                                <span>Modo Edición: Mover Elementos (Activo)</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 text-stone-500" />
                                <span>Posiciones Bloqueadas</span>
                            </>
                        )}
                    </Button>

                    {/* Botón para Crear / Añadir Zona al Plano */}
                    <Button
                        type="button"
                        onClick={openAddVenueModal}
                        variant="outline"
                        className="h-9 px-3 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd] text-[#2c4537] dark:text-[#f4ecd8] hover:border-[#cfbe95] flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5 text-[#cfbe95]" />
                        <span>+ Zona (Pista, Grupo...)</span>
                    </Button>

                    <span className="h-5 w-px bg-stone-300 dark:bg-stone-700 hidden sm:block" />

                    {/* Controles de Zoom */}
                    <div className="flex items-center bg-[#faf8f3] dark:bg-stone-900 border border-[#ded8cd] rounded-xl p-0.5">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-stone-600 hover:text-[#2c4537] cursor-pointer"
                            onClick={() => setZoom(prev => Math.max(0.45, prev - 0.1))}
                            title="Reducir zoom"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-[11px] font-mono font-bold px-2 text-stone-600 dark:text-stone-300">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-stone-600 hover:text-[#2c4537] cursor-pointer"
                            onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                            title="Aumentar zoom"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-stone-400 hover:text-[#2c4537] cursor-pointer border-l border-stone-200 dark:border-stone-800"
                            onClick={() => setZoom(1)}
                            title="Restablecer zoom a 100%"
                        >
                            <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 text-[10.5px] font-bold text-stone-600 hover:text-[#2c4537] cursor-pointer border-l border-stone-200 dark:border-stone-800"
                            onClick={() => setZoom(0.72)}
                            title="Ajustar escala para ver todo el salón sin desplazarte"
                        >
                            🔍 Ver Salón
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón para alternar visibilidad del Panel Lateral (Invitados & Mesas) */}
                    <Button
                        type="button"
                        onClick={() => setShowUnassignedSidebar(!showUnassignedSidebar)}
                        variant={showUnassignedSidebar ? 'outline' : 'default'}
                        className={`h-9 px-3 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-all ${
                            showUnassignedSidebar 
                                ? 'bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd] text-stone-700 hover:text-[#2c4537]' 
                                : 'bg-[#2c4537] text-white hover:bg-[#385645] shadow-xs'
                        }`}
                        title={showUnassignedSidebar ? "Plegar panel lateral para ampliar el plano" : "Desplegar panel lateral de invitados y mesas"}
                    >
                        <Users className="w-3.5 h-3.5 text-[#cfbe95]" />
                        <span>{showUnassignedSidebar ? 'Plegar Panel' : `Panel Lateral (${unassignedGuests.length})`}</span>
                    </Button>

                    {/* Botón Pantalla Completa / Ampliar Lienzo */}
                    <Button
                        type="button"
                        onClick={() => setIsExpandedMode(!isExpandedMode)}
                        variant={isExpandedMode ? 'default' : 'outline'}
                        className={`h-9 px-3.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-all ${
                            isExpandedMode
                                ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-md ring-2 ring-rose-400/40'
                                : 'bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd] text-[#2c4537] dark:text-[#f4ecd8] hover:border-[#cfbe95]'
                        }`}
                        title={isExpandedMode ? "Salir de pantalla completa (Esc)" : "Ampliar el croquis a pantalla completa"}
                    >
                        {isExpandedMode ? (
                            <>
                                <Minimize className="w-3.5 h-3.5" />
                                <span>Salir (Esc)</span>
                            </>
                        ) : (
                            <>
                                <Maximize className="w-3.5 h-3.5 text-[#cfbe95]" />
                                <span>Pantalla Completa</span>
                            </>
                        )}
                    </Button>

                    <Button
                        type="button"
                        onClick={openCreateTable}
                        className="bg-[#2c4537] hover:bg-[#385645] text-white text-xs font-bold uppercase tracking-wider h-9 px-3.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5 text-[#cfbe95]" />
                        Crear Mesa
                    </Button>
                </div>
            </div>

            {/* AVISO DEL MODO DE EDICIÓN */}
            {isMoveTablesMode && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                            <strong>Modo Edición Activado:</strong> Haz clic y arrastra cualquier <strong>mesa</strong> o <strong>zona</strong> (escenario, pista, barra, etc.) para acomodarla libremente en el salón.
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsMoveTablesMode(false)}
                        className="text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold h-7 cursor-pointer"
                    >
                        Listo / Bloquear
                    </Button>
                </div>
            )}

            {/* 2. ÁREA PRINCIPAL: SIDEBAR DE INVITADOS + LIENZO 2D DEL SALÓN */}
            <div className={`flex flex-col lg:flex-row gap-3 items-start ${isExpandedMode ? 'flex-1 min-h-0 w-full overflow-hidden' : ''}`}>
                
                {/* SIDEBAR: PANEL LATERAL UNIFICADO (INVITADOS SIN ASIGNAR & INSPECTOR DE MESA) */}
                {showUnassignedSidebar ? (
                    <div className={`w-full lg:w-84 shrink-0 bg-card rounded-2xl border border-[#ded8cd] p-4 flex flex-col shadow-xs transition-all ${isExpandedMode ? 'h-full' : 'h-[780px]'}`}>
                        {/* Selector de Pestañas / Tabs */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#ded8cd] mb-3 shrink-0">
                            <div className="flex items-center bg-[#faf8f3] dark:bg-stone-900 border border-[#ded8cd] p-1 rounded-xl gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => setSidebarTab('unassigned')}
                                    className={`text-xs font-bold px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                        sidebarTab === 'unassigned'
                                            ? 'bg-white dark:bg-stone-800 text-[#2c4537] dark:text-[#f4ecd8] shadow-xs'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                    title="Ver comensales pendientes de ubicar"
                                >
                                    <Users className="w-3.5 h-3.5 text-[#cfbe95]" />
                                    <span>Invitados ({filteredUnassigned.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSidebarTab('table');
                                        if (!selectedTableId && tables.length > 0) setSelectedTableId(tables[0].id);
                                        setSelectedVenueElemId(null);
                                    }}
                                    className={`text-xs font-bold px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                        sidebarTab === 'table'
                                            ? 'bg-white dark:bg-stone-800 text-[#2c4537] dark:text-[#f4ecd8] shadow-xs'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                    title="Ver y editar mesa"
                                >
                                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#cfbe95]" />
                                    <span className="truncate max-w-[70px]">
                                        {selectedTable ? selectedTable.name : 'Mesa'}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSidebarTab('venue');
                                        if (!selectedVenueElemId && venueList.length > 0) setSelectedVenueElemId(venueList[0].id);
                                        setSelectedTableId(null);
                                    }}
                                    className={`text-xs font-bold px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                        sidebarTab === 'venue'
                                            ? 'bg-white dark:bg-stone-800 text-[#2c4537] dark:text-[#f4ecd8] shadow-xs'
                                            : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                    title="Ver y editar zona del salón (escenario, pista, barra, etc.)"
                                >
                                    <Sliders className="w-3.5 h-3.5 text-[#cfbe95]" />
                                    <span className="truncate max-w-[70px]">
                                        {selectedVenueElem ? selectedVenueElem.title : 'Zona'}
                                    </span>
                                </button>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-stone-400 hover:text-stone-700 cursor-pointer"
                                onClick={() => setShowUnassignedSidebar(false)}
                                title="Plegar panel lateral para ampliar el plano"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* PESTAÑA 1: INVITADOS SIN ASIGNAR */}
                        {sidebarTab === 'unassigned' && (
                            <>
                                <div className="border-b border-[#ded8cd] pb-3 mb-3 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                                            Invitados por Asignar
                                        </span>
                                        {unassignedGuests.length > 0 && (
                                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                                                Arrastra a la mesa
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                                        Arrastra a cualquier comensal y suéltalo sobre una mesa en el plano para sentarlo.
                                    </p>

                                    <div className="relative mt-2.5">
                                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                        <Input
                                            placeholder="Filtrar por nombre..."
                                            value={tableSearch}
                                            onChange={e => setTableSearch(e.target.value)}
                                            className="pl-8 h-8 text-xs bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd]"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                                    {filteredUnassigned.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400">
                                            <Check className="w-10 h-10 text-emerald-600 mb-2" />
                                            <span className="font-bold text-xs text-stone-700 dark:text-stone-300">
                                                {tableSearch ? 'Sin resultados' : '¡Todos tienen mesa!'}
                                            </span>
                                            <span className="text-[11px] text-stone-400 mt-0.5">
                                                {tableSearch ? 'Prueba con otro término.' : 'No hay invitados pendientes por ubicar.'}
                                            </span>
                                        </div>
                                    ) : (
                                        filteredUnassigned.map(ug => (
                                            <div
                                                key={ug.id}
                                                draggable
                                                onDragStart={(e) => handleGuestDragStart(e, ug.id, ug.full_name, null)}
                                                onDragEnd={handleGuestDragEnd}
                                                className="p-2.5 rounded-xl border border-[#ded8cd] bg-[#faf8f3] dark:bg-stone-900 hover:border-[#cfbe95] hover:shadow-sm cursor-grab active:cursor-grabbing transition-all flex items-center justify-between gap-2 group"
                                                title="Arrastra esta tarjeta hacia una mesa en el plano"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate group-hover:text-[#2c4537] transition-colors">
                                                        {ug.full_name}
                                                    </p>
                                                    <p className="text-[10px] text-stone-500 truncate">
                                                        {ug.invitation_name} • {ug.type === 'child' ? 'Niño' : 'Adulto'}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-stone-400 group-hover:text-[#2c4537] group-hover:translate-x-0.5 transition-all">
                                                    ⋮⋮
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Zona para desasignar comensales arrastrándolos aquí */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOverUnassignArea(true); }}
                                    onDragLeave={() => setDragOverUnassignArea(false)}
                                    onDrop={handleUnassignDrop}
                                    className={`mt-3 p-3 rounded-xl border-2 border-dashed text-center transition-all shrink-0 ${
                                        dragOverUnassignArea 
                                        ? 'bg-rose-50 border-rose-400 text-rose-700 scale-102' 
                                        : 'border-[#ded8cd] text-stone-400 bg-stone-50/50 dark:bg-stone-900/50'
                                    }`}
                                >
                                    <p className="text-[11px] font-semibold">
                                        {dragOverUnassignArea ? 'Suelta aquí para retirar de la mesa' : 'Zona de Desasignación'}
                                    </p>
                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                        Arrastra a un comensal desde el inspector o mesa para dejarlo sin mesa.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* PESTAÑA 2: INSPECTOR DE MESA */}
                        {sidebarTab === 'table' && !selectedTable && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
                                <div className="w-14 h-14 rounded-full bg-[#faf8f3] dark:bg-stone-900 border border-[#ded8cd] flex items-center justify-center mb-3 text-[#cfbe95]">
                                    <UtensilsCrossed className="w-6 h-6" />
                                </div>
                                <span className="font-serif font-bold text-sm text-[#2c4537] dark:text-[#f4ecd8]">
                                    Ninguna Mesa Seleccionada
                                </span>
                                <p className="text-xs text-stone-400 mt-1 max-w-[220px]">
                                    Haz clic en cualquier mesa del plano para ver sus detalles, comensales sentados y cambiar su forma o tamaño.
                                </p>
                            </div>
                        )}

                        {sidebarTab === 'table' && selectedTable && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {/* Encabezado de la mesa seleccionada */}
                                <div className="flex items-start justify-between border-b border-[#ded8cd] pb-2.5 shrink-0">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                            Mesa Seleccionada
                                        </span>
                                        <h3 className="font-serif font-bold text-base text-[#2c4537] dark:text-[#f4ecd8] flex items-center gap-1.5 mt-0.5">
                                            <UtensilsCrossed className="w-4 h-4 text-[#cfbe95]" />
                                            {selectedTable.name}
                                        </h3>
                                        {selectedTable.notes && (
                                            <p className="text-xs text-stone-500 italic mt-0.5">
                                                📍 {selectedTable.notes}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-stone-400 hover:text-stone-800 cursor-pointer"
                                        onClick={() => setSelectedTableId(null)}
                                        title="Deseleccionar mesa"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {/* Capacidad y acciones de forma */}
                                <div className="py-2.5 border-b border-[#ded8cd] space-y-2 shrink-0">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-stone-600 font-medium">Ocupación:</span>
                                        <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                                            {selectedTable.guests_count || 0} de {selectedTable.capacity} lugares
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-0.5">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleTableShape(selectedTable)}
                                            className="text-xs h-7.5 px-2.5 flex-1 font-semibold border-[#ded8cd] text-stone-700 hover:text-[#2c4537] hover:border-[#cfbe95] cursor-pointer"
                                            title="Alternar entre Redonda, Rectangular y Honor"
                                        >
                                            <Layers className="w-3.5 h-3.5 mr-1 text-[#cfbe95]" />
                                            Forma: {selectedTable.shape === 'rectangular' ? 'Rectangular' : selectedTable.shape === 'head' ? 'Honor' : 'Redonda'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => startEditTable(selectedTable)}
                                            className="text-xs h-7.5 px-2 border-[#ded8cd] text-stone-600 hover:text-[#2c4537] cursor-pointer"
                                            title="Editar datos de mesa"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                showConfirmModal(
                                                    `¿Eliminar Mesa "${selectedTable.name}"?`,
                                                    `Se eliminará la mesa y sus ${selectedTable.guests_count || 0} comensales quedarán sin asignar.`,
                                                    () => {
                                                        handleDeleteTable(selectedTable.id);
                                                        setSelectedTableId(null);
                                                        setSidebarTab('unassigned');
                                                    }
                                                );
                                            }}
                                            className="text-xs h-7.5 px-2 border-[#ded8cd] text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                            title="Eliminar mesa"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* AJUSTE DE TAMAÑO DE LA MESA */}
                                <div className="py-2.5 border-b border-[#ded8cd] space-y-2 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                                            <Maximize2 className="w-3.5 h-3.5 text-[#cfbe95]" />
                                            Tamaño de Mesa
                                        </span>
                                        <span className="text-[10.5px] font-mono text-stone-500 font-semibold">
                                            {selectedTable.shape === 'round' 
                                                ? `Ø ${getTableWidth(selectedTable)}px` 
                                                : `${getTableWidth(selectedTable)} × ${getTableHeight(selectedTable)}px`}
                                        </span>
                                    </div>

                                    {/* Botones de tamaño rápido (Presets) */}
                                    {selectedTable.shape === 'round' ? (
                                        <div className="grid grid-cols-4 gap-1">
                                            {[
                                                { label: 'Chica', size: 120 },
                                                { label: 'Media', size: 150 },
                                                { label: 'Grande', size: 185 },
                                                { label: 'XL', size: 220 },
                                            ].map(preset => {
                                                const currentSize = getTableWidth(selectedTable);
                                                const isActive = Math.abs(currentSize - preset.size) < 10;
                                                return (
                                                    <button
                                                        key={preset.label}
                                                        type="button"
                                                        onClick={() => updateTableDimensions(selectedTable, preset.size, preset.size, true)}
                                                        className={`text-[10px] font-semibold py-1 px-1 rounded-lg border transition-all cursor-pointer ${
                                                            isActive
                                                                ? 'bg-[#2c4537] text-[#cfbe95] border-[#2c4537] shadow-xs'
                                                                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                                                        }`}
                                                    >
                                                        {preset.label} ({preset.size})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-1">
                                            {[
                                                { label: 'Chica', w: 170, h: 85 },
                                                { label: 'Media', w: 210, h: 100 },
                                                { label: 'Grande', w: 260, h: 110 },
                                                { label: 'XL', w: 320, h: 120 },
                                            ].map(preset => {
                                                const currentW = getTableWidth(selectedTable);
                                                const currentH = getTableHeight(selectedTable);
                                                const isActive = Math.abs(currentW - preset.w) < 15 && Math.abs(currentH - preset.h) < 15;
                                                return (
                                                    <button
                                                        key={preset.label}
                                                        type="button"
                                                        onClick={() => updateTableDimensions(selectedTable, preset.w, preset.h, true)}
                                                        className={`text-[10px] font-semibold py-1 px-1 rounded-lg border transition-all cursor-pointer ${
                                                            isActive
                                                                ? 'bg-[#2c4537] text-[#cfbe95] border-[#2c4537] shadow-xs'
                                                                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                                                        }`}
                                                    >
                                                        {preset.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Incremento fino (+ / -) y entradas numéricas manuales */}
                                    <div className="flex items-center gap-2 pt-0.5">
                                        <div className="flex-1">
                                            <label className="text-[9.5px] uppercase font-bold text-stone-400 block mb-0.5">
                                                {selectedTable.shape === 'round' ? 'Diámetro' : 'Ancho'} (px)
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                    onClick={() => {
                                                        const curW = getTableWidth(selectedTable);
                                                        const curH = getTableHeight(selectedTable);
                                                        const newW = Math.max(60, curW - 15);
                                                        const newH = selectedTable.shape === 'round' ? newW : curH;
                                                        updateTableDimensions(selectedTable, newW, newH);
                                                    }}
                                                    title="Reducir"
                                                >
                                                    -
                                                </Button>
                                                <input
                                                    type="number"
                                                    min={60}
                                                    max={800}
                                                    step={10}
                                                    value={getTableWidth(selectedTable)}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 60;
                                                        const curH = getTableHeight(selectedTable);
                                                        const newH = selectedTable.shape === 'round' ? val : curH;
                                                        updateTableDimensions(selectedTable, val, newH);
                                                    }}
                                                    onBlur={() => {
                                                        const curW = getTableWidth(selectedTable);
                                                        const curH = getTableHeight(selectedTable);
                                                        updateTableDimensions(selectedTable, curW, curH, true);
                                                    }}
                                                    className="w-full text-center text-xs font-mono font-bold py-0.5 px-1 border border-[#ded8cd] rounded-md bg-white dark:bg-stone-900"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                    onClick={() => {
                                                        const curW = getTableWidth(selectedTable);
                                                        const curH = getTableHeight(selectedTable);
                                                        const newW = Math.min(600, curW + 15);
                                                        const newH = selectedTable.shape === 'round' ? newW : curH;
                                                        updateTableDimensions(selectedTable, newW, newH);
                                                    }}
                                                    title="Aumentar"
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>

                                        {selectedTable.shape !== 'round' && (
                                            <div className="flex-1">
                                                <label className="text-[9.5px] uppercase font-bold text-stone-400 block mb-0.5">
                                                    Alto (px)
                                                </label>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                        onClick={() => {
                                                            const curW = getTableWidth(selectedTable);
                                                            const curH = getTableHeight(selectedTable);
                                                            const newH = Math.max(50, curH - 10);
                                                            updateTableDimensions(selectedTable, curW, newH);
                                                        }}
                                                        title="Reducir alto"
                                                    >
                                                        -
                                                    </Button>
                                                    <input
                                                        type="number"
                                                        min={50}
                                                        max={600}
                                                        step={10}
                                                        value={getTableHeight(selectedTable)}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 50;
                                                            const curW = getTableWidth(selectedTable);
                                                            updateTableDimensions(selectedTable, curW, val);
                                                        }}
                                                        onBlur={() => {
                                                            const curW = getTableWidth(selectedTable);
                                                            const curH = getTableHeight(selectedTable);
                                                            updateTableDimensions(selectedTable, curW, curH, true);
                                                        }}
                                                        className="w-full text-center text-xs font-mono font-bold py-0.5 px-1 border border-[#ded8cd] rounded-md bg-white dark:bg-stone-900"
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                        onClick={() => {
                                                            const curW = getTableWidth(selectedTable);
                                                            const curH = getTableHeight(selectedTable);
                                                            const newH = Math.min(500, curH + 10);
                                                            updateTableDimensions(selectedTable, curW, newH);
                                                        }}
                                                        title="Aumentar alto"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Lista de comensales sentados */}
                                <div className="flex-1 overflow-y-auto py-2.5 space-y-2 pr-1 min-h-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                                            Comensales Sentados ({selectedTable.guests?.length || 0})
                                        </span>
                                    </div>

                                    {(!selectedTable.guests || selectedTable.guests.length === 0) ? (
                                        <div className="py-8 text-center text-xs text-stone-400 italic">
                                            No hay comensales en esta mesa.<br />
                                            <span className="text-[11px] text-[#2c4537] font-semibold mt-1 inline-block">
                                                Ve a la pestaña "Sin Asignar" o arrastra comensales en el plano para sentarlos aquí.
                                            </span>
                                        </div>
                                    ) : (
                                        selectedTable.guests.map(guest => (
                                            <div 
                                                key={guest.id}
                                                draggable
                                                onDragStart={(e) => handleGuestDragStart(e, guest.id, guest.full_name, selectedTable.id)}
                                                onDragEnd={handleGuestDragEnd}
                                                className="p-2 rounded-xl bg-[#faf8f3] dark:bg-stone-900 border border-[#ded8cd] flex items-center justify-between gap-2 group cursor-grab active:cursor-grabbing hover:border-[#cfbe95]"
                                                title="Arrastra para mover a otra mesa o suelta en desasignar"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate">
                                                        {guest.full_name}
                                                    </p>
                                                    <p className="text-[10px] text-stone-500">
                                                        {guest.type === 'child' ? 'Niño' : 'Adulto'} 
                                                        {guest.checkin_code && ` • 🎫 ${guest.checkin_code}`}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => assignGuestTable(guest.id, null)}
                                                    className="h-6 w-6 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer shrink-0"
                                                    title="Retirar de esta mesa"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Zona para desasignar también disponible en la pestaña de mesa */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOverUnassignArea(true); }}
                                    onDragLeave={() => setDragOverUnassignArea(false)}
                                    onDrop={handleUnassignDrop}
                                    className={`mt-2 p-2.5 rounded-xl border-2 border-dashed text-center transition-all shrink-0 ${
                                        dragOverUnassignArea 
                                        ? 'bg-rose-50 border-rose-400 text-rose-700 scale-102' 
                                        : 'border-[#ded8cd] text-stone-400 bg-stone-50/50 dark:bg-stone-900/50'
                                    }`}
                                >
                                    <p className="text-[10.5px] font-semibold">
                                        {dragOverUnassignArea ? 'Suelta aquí para retirar de la mesa' : 'Zona de Desasignación'}
                                    </p>
                                    <p className="text-[9.5px] text-stone-400 mt-0.5">
                                        Arrastra a un comensal aquí para retirarlo de la mesa.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* PESTAÑA 3: INSPECTOR DE ZONA DEL SALÓN (ESCENARIO, PISTA, BARRA, ETC.) */}
                        {sidebarTab === 'venue' && !selectedVenueElem && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-400">
                                <div className="w-14 h-14 rounded-full bg-[#faf8f3] dark:bg-stone-900 border border-[#ded8cd] flex items-center justify-center mb-3 text-[#cfbe95]">
                                    <Sliders className="w-6 h-6" />
                                </div>
                                <span className="font-serif font-bold text-sm text-[#2c4537] dark:text-[#f4ecd8]">
                                    Ninguna Zona Seleccionada
                                </span>
                                <p className="text-xs text-stone-400 mt-1 max-w-[220px]">
                                    Haz clic en cualquier zona del croquis (pista, escenario, barra, mesa de pastel...) para ajustar su tamaño, silueta o nombre.
                                </p>
                                <Button
                                    type="button"
                                    onClick={openAddVenueModal}
                                    className="mt-4 bg-[#2c4537] hover:bg-[#385645] text-white text-xs font-bold uppercase tracking-wider h-8 px-3 rounded-lg cursor-pointer flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5 text-[#cfbe95]" />
                                    Añadir Nueva Zona
                                </Button>
                            </div>
                        )}

                        {sidebarTab === 'venue' && selectedVenueElem && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 space-y-3">
                                {/* Encabezado de la zona seleccionada */}
                                <div className="flex items-start justify-between border-b border-[#ded8cd] pb-2.5 shrink-0">
                                    <div className="min-w-0 flex-1 pr-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                            Zona del Salón
                                        </span>
                                        <h3 className="font-serif font-bold text-base text-[#2c4537] dark:text-[#f4ecd8] flex items-center gap-1.5 mt-0.5 truncate">
                                            {renderVenueIcon(selectedVenueElem.type)}
                                            <span className="truncate">{selectedVenueElem.title}</span>
                                        </h3>
                                        {selectedVenueElem.subtitle && (
                                            <p className="text-xs text-stone-500 italic mt-0.5 truncate">
                                                {selectedVenueElem.subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                            onClick={() => {
                                                showConfirmModal(
                                                    `¿Eliminar Zona "${selectedVenueElem.title}"?`,
                                                    `¿Deseas retirar esta zona del plano? Podrás volver a añadirla en cualquier momento si lo necesitas.`,
                                                    () => {
                                                        handleDeleteVenueElement(selectedVenueElem.id);
                                                        setSelectedVenueElemId(null);
                                                        setSidebarTab('unassigned');
                                                    }
                                                );
                                            }}
                                            title="Eliminar esta zona"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-stone-400 hover:text-stone-800 cursor-pointer"
                                            onClick={() => {
                                                setSelectedVenueElemId(null);
                                                setSidebarTab('unassigned');
                                            }}
                                            title="Deseleccionar zona"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Tipo de Zona */}
                                <div className="space-y-1 shrink-0">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Tipo de Estructura
                                    </label>
                                    <Select
                                        value={selectedVenueElem.type}
                                        onValueChange={(val: VenueElement['type']) => {
                                            updateVenueElement(selectedVenueElem.id, { type: val }, true);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-stone-900 border-[#ded8cd]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="stage">🎵 Escenario &amp; Grupo / DJ</SelectItem>
                                            <SelectItem value="dancefloor">💃 Pista de Baile</SelectItem>
                                            <SelectItem value="bar">🍸 Barra Libre / Mixología</SelectItem>
                                            <SelectItem value="entrance">🚪 Acceso Principal</SelectItem>
                                            <SelectItem value="gifts">🎁 Mesa de Regalos / Sobres</SelectItem>
                                            <SelectItem value="cake">🎂 Mesa de Pastel / Candy Bar</SelectItem>
                                            <SelectItem value="photocall">📸 Cabina de Fotos</SelectItem>
                                            <SelectItem value="lounge">🛋️ Sala Lounge / Chill Out</SelectItem>
                                            <SelectItem value="restrooms">🚻 Sanitarios / Baños</SelectItem>
                                            <SelectItem value="custom">✨ Personalizada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Título en el Plano */}
                                <div className="space-y-1 shrink-0">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Título en el Plano
                                    </label>
                                    <Input
                                        value={selectedVenueElem.title}
                                        onChange={e => updateVenueElement(selectedVenueElem.id, { title: e.target.value })}
                                        onBlur={e => updateVenueElement(selectedVenueElem.id, { title: e.target.value }, true)}
                                        className="h-8 text-xs bg-white dark:bg-stone-900 border-[#ded8cd] font-semibold"
                                        placeholder="Ej. Pista de Baile, Sonido..."
                                    />
                                </div>

                                {/* Subtítulo / Monograma */}
                                <div className="space-y-1 shrink-0">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Subtítulo o Monograma (Opcional)
                                    </label>
                                    <Input
                                        value={selectedVenueElem.subtitle || ''}
                                        onChange={e => updateVenueElement(selectedVenueElem.id, { subtitle: e.target.value })}
                                        onBlur={e => updateVenueElement(selectedVenueElem.id, { subtitle: e.target.value }, true)}
                                        className="h-8 text-xs bg-white dark:bg-stone-900 border-[#ded8cd]"
                                        placeholder="Ej. A &amp; J, Mixología..."
                                    />
                                </div>

                                {/* AJUSTE DE TAMAÑO / DIMENSIONES DE LA ZONA */}
                                <div className="py-2 border-y border-[#ded8cd] space-y-2 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                                            <Maximize2 className="w-3.5 h-3.5 text-[#cfbe95]" />
                                            Dimensiones
                                        </span>
                                        <span className="text-[10.5px] font-mono text-stone-500 font-semibold">
                                            {selectedVenueElem.width} × {selectedVenueElem.height}px
                                        </span>
                                    </div>

                                    {/* Presets Rápidos según el tipo */}
                                    <div className="grid grid-cols-4 gap-1">
                                        {getVenuePresets(selectedVenueElem.type).map(preset => {
                                            const isActive = Math.abs(selectedVenueElem.width - preset.w) < 15 && Math.abs(selectedVenueElem.height - preset.h) < 15;
                                            return (
                                                <button
                                                    key={preset.label}
                                                    type="button"
                                                    onClick={() => updateVenueElement(selectedVenueElem.id, { width: preset.w, height: preset.h }, true)}
                                                    className={`text-[10px] font-semibold py-1 px-1 rounded-lg border transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-[#2c4537] text-[#cfbe95] border-[#2c4537] shadow-xs'
                                                            : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                                                    }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Inputs Numéricos Ancho y Alto con botones +/- */}
                                    <div className="flex items-center gap-2 pt-0.5">
                                        <div className="flex-1">
                                            <label className="text-[9.5px] uppercase font-bold text-stone-400 block mb-0.5">
                                                Ancho (px)
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                    onClick={() => {
                                                        const newW = Math.max(60, selectedVenueElem.width - 20);
                                                        updateVenueElement(selectedVenueElem.id, { width: newW });
                                                    }}
                                                    title="Reducir ancho"
                                                >
                                                    -
                                                </Button>
                                                <input
                                                    type="number"
                                                    min={60}
                                                    max={1200}
                                                    step={10}
                                                    value={selectedVenueElem.width}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 60;
                                                        updateVenueElement(selectedVenueElem.id, { width: val });
                                                    }}
                                                    onBlur={() => {
                                                        updateVenueElement(selectedVenueElem.id, { width: selectedVenueElem.width }, true);
                                                    }}
                                                    className="w-full text-center text-xs font-mono font-bold py-0.5 px-1 border border-[#ded8cd] rounded-md bg-white dark:bg-stone-900"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                    onClick={() => {
                                                        const newW = Math.min(1200, selectedVenueElem.width + 20);
                                                        updateVenueElement(selectedVenueElem.id, { width: newW });
                                                    }}
                                                    title="Aumentar ancho"
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <label className="text-[9.5px] uppercase font-bold text-stone-400 block mb-0.5">
                                                Alto (px)
                                            </label>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                    onClick={() => {
                                                        const newH = Math.max(40, selectedVenueElem.height - 15);
                                                        updateVenueElement(selectedVenueElem.id, { height: newH });
                                                    }}
                                                    title="Reducir alto"
                                                >
                                                    -
                                                </Button>
                                                <input
                                                    type="number"
                                                    min={40}
                                                    max={1000}
                                                    step={10}
                                                    value={selectedVenueElem.height}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 40;
                                                        updateVenueElement(selectedVenueElem.id, { height: val });
                                                    }}
                                                    onBlur={() => {
                                                        updateVenueElement(selectedVenueElem.id, { height: selectedVenueElem.height }, true);
                                                    }}
                                                    className="w-full text-center text-xs font-mono font-bold py-0.5 px-1 border border-[#ded8cd] rounded-md bg-white dark:bg-stone-900"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 text-xs text-stone-600 border-[#ded8cd] hover:border-[#cfbe95] cursor-pointer"
                                                    onClick={() => {
                                                        const newH = Math.min(1000, selectedVenueElem.height + 15);
                                                        updateVenueElement(selectedVenueElem.id, { height: newH });
                                                    }}
                                                    title="Aumentar alto"
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Silueta / Forma */}
                                <div className="space-y-1.5 shrink-0">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Silueta Visual
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[
                                            { id: 'rectangle', label: 'Rectangular' },
                                            { id: 'circle', label: 'Circular' },
                                            { id: 'pill', label: 'Cápsula' },
                                        ].map(s => {
                                            const isActive = (selectedVenueElem.shape || 'rectangle') === s.id;
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => updateVenueElement(selectedVenueElem.id, { shape: s.id as any }, true)}
                                                    className={`text-xs font-semibold py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-[#2c4537] text-[#cfbe95] border-[#2c4537] shadow-xs'
                                                            : 'bg-white dark:bg-stone-900 border-[#ded8cd] text-stone-600 hover:border-[#cfbe95]'
                                                    }`}
                                                >
                                                    {s.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Ubicación y Ayuda de Arrastre */}
                                <div className="p-2.5 rounded-xl bg-[#faf8f3] dark:bg-stone-900 border border-[#ded8cd] text-[10.5px] text-stone-500 space-y-1 shrink-0">
                                    <div className="flex items-center justify-between font-mono font-bold text-stone-600 dark:text-stone-300">
                                        <span>Posición actual:</span>
                                        <span>X: {selectedVenueElem.x}px • Y: {selectedVenueElem.y}px</span>
                                    </div>
                                    <p className="text-[10px] text-stone-400">
                                        💡 Arrastra la zona directamente en el croquis para ubicarla en cualquier punto del salón.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="shrink-0 hidden lg:flex flex-col items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowUnassignedSidebar(true)}
                            className={`w-10 border-[#ded8cd] bg-card hover:bg-[#faf8f3] dark:bg-stone-900 rounded-2xl shadow-sm text-stone-600 hover:text-[#2c4537] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-[#cfbe95] ${
                                isExpandedMode ? 'h-full py-6' : 'h-[780px] py-6'
                            }`}
                            title="Desplegar panel de invitados y mesas"
                        >
                            {selectedTable ? (
                                <>
                                    <UtensilsCrossed className="w-4 h-4 text-[#cfbe95]" />
                                    <span className="text-[10px] font-bold [writing-mode:vertical-lr] tracking-wider uppercase rotate-180">
                                        {selectedTable.name} ({selectedTable.guests_count || 0}/{selectedTable.capacity})
                                    </span>
                                </>
                            ) : selectedVenueElem ? (
                                <>
                                    <Sliders className="w-4 h-4 text-[#cfbe95]" />
                                    <span className="text-[10px] font-bold [writing-mode:vertical-lr] tracking-wider uppercase rotate-180">
                                        {selectedVenueElem.title}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4 text-[#cfbe95]" />
                                    <span className="text-[10px] font-bold [writing-mode:vertical-lr] tracking-wider uppercase rotate-180">
                                        Invitados ({unassignedGuests.length})
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* LIENZO 2D DEL SALÓN DE EVENTOS */}
                <div 
                    ref={canvasRef}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className={`flex-1 w-full bg-[#fcfaf7] dark:bg-stone-950 rounded-2xl border border-[#ded8cd] shadow-sm relative overflow-auto ${
                        isExpandedMode ? 'h-full' : 'h-[780px]'
                    }`}
                >
                    <div 
                        style={{
                            width: `${CANVAS_WIDTH}px`,
                            height: `${CANVAS_HEIGHT}px`,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                        }}
                        className="relative bg-[#fcfaf7] dark:bg-stone-950 transition-transform duration-75"
                    >
                        {/* Marco perimetral del salón */}
                        <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-[#ded8cd] dark:border-stone-800 pointer-events-none">
                            {/* Medidas y rótulo de salón */}
                            <div className="absolute top-2 left-4 text-[10px] font-mono uppercase tracking-widest text-stone-400">
                                Salón Principal de Banquete &amp; Recepción
                            </div>
                        </div>

                        {/* ========================================================= */}
                        {/* 1. ZONAS DEL SALÓN (Escenario, Pista, Barra, etc.)         */}
                        {/* ========================================================= */}
                        {venueList.map(elem => {
                            const isDraggingVenue = draggingVenueId === elem.id;
                            const isSelectedVenue = selectedVenueElemId === elem.id;

                            return (
                                <div
                                    key={elem.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${elem.x}px`,
                                        top: `${elem.y}px`,
                                        width: `${elem.width}px`,
                                        height: `${elem.height}px`,
                                        cursor: isMoveTablesMode ? 'move' : 'pointer',
                                        zIndex: isDraggingVenue ? 40 : isSelectedVenue ? 35 : 10,
                                    }}
                                    onPointerDown={(e) => handleVenuePointerDown(e, elem.id)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedVenueElemId(elem.id);
                                        setSelectedTableId(null);
                                        setSidebarTab('venue');
                                        setShowUnassignedSidebar(true);
                                    }}
                                    className={`group border transition-all select-none flex flex-col items-center justify-center text-center p-2 relative ${
                                        elem.shape === 'circle' || elem.shape === 'pill' || elem.type === 'entrance'
                                            ? 'rounded-full'
                                            : 'rounded-2xl'
                                    } ${
                                        isSelectedVenue
                                            ? 'ring-4 ring-[#cfbe95] shadow-2xl scale-102 border-[#2c4537]'
                                            : isDraggingVenue 
                                            ? 'ring-4 ring-[#cfbe95] shadow-2xl scale-102' 
                                            : isMoveTablesMode
                                            ? 'hover:ring-2 hover:ring-[#cfbe95] shadow-md'
                                            : 'hover:border-[#cfbe95] shadow-sm'
                                    } ${
                                        elem.type === 'stage'
                                            ? 'bg-gradient-to-b from-[#2c4537] to-[#1f3127] text-[#f4ecd8] border-[#cfbe95]'
                                            : elem.type === 'dancefloor'
                                            ? 'bg-[#f5efe2]/90 dark:bg-stone-900/90 border-2 border-dashed border-[#cfbe95]'
                                            : elem.type === 'bar'
                                            ? 'bg-[#f0ede4] dark:bg-stone-900 border-[#cfbe95]'
                                            : elem.type === 'entrance'
                                            ? 'bg-white/95 dark:bg-stone-900 border-[#ded8cd]'
                                            : elem.type === 'gifts'
                                            ? 'bg-amber-50/90 dark:bg-stone-900 border-amber-300'
                                            : elem.type === 'cake'
                                            ? 'bg-rose-50/90 dark:bg-stone-900 border-rose-300'
                                            : 'bg-white dark:bg-stone-900 border-[#ded8cd]'
                                    }`}
                                >
                                    {/* Botones de acción al pasar el ratón en Modo Edición */}
                                    {isMoveTablesMode && (
                                        <div className="absolute -top-3.5 right-2 flex items-center gap-1 bg-[#2c4537] text-white p-0.5 rounded-full shadow-md z-50">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedVenueElemId(elem.id);
                                                    setSelectedTableId(null);
                                                    setSidebarTab('venue');
                                                    setShowUnassignedSidebar(true);
                                                }}
                                                className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center cursor-pointer text-[#cfbe95]"
                                                title="Editar propiedades en el panel lateral"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteVenueElement(elem.id); }}
                                                className="w-5 h-5 rounded-full hover:bg-rose-600 flex items-center justify-center cursor-pointer text-white"
                                                title="Eliminar esta zona"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Contenido de la zona */}
                                    <div className="flex items-center gap-1.5">
                                        {renderVenueIcon(elem.type)}
                                        <span className={`font-serif tracking-[0.2em] font-bold text-xs uppercase truncate max-w-[90%] ${
                                            elem.type === 'stage' ? 'text-[#cfbe95]' : 'text-stone-800 dark:text-stone-200'
                                        }`}>
                                            {elem.title}
                                        </span>
                                    </div>
                                    {elem.subtitle && (
                                        <span className={`text-[9.5px] font-sans mt-0.5 truncate max-w-[90%] ${
                                            elem.type === 'stage' ? 'text-white/70' : 'text-stone-500'
                                        }`}>
                                            {elem.subtitle}
                                        </span>
                                    )}
                                </div>
                            );
                        })}

                        {/* ========================================================= */}
                        {/* 2. RENDERIZADO ESPACIAL DE MESAS (SIN ASIENTOS)           */}
                        {/* ========================================================= */}
                        {tables.map(table => {
                            const pos = localPositions[table.id] || { x: 150, y: 150 };
                            const occupied = table.guests_count || 0;
                            const isFull = occupied >= table.capacity;
                            const isDragging = draggingTableId === table.id;
                            const isDragOver = dragOverTableId === table.id;
                            const isSelected = selectedTableId === table.id;
                            const shape = table.shape || 'round';
                            const freeSpots = Math.max(0, table.capacity - occupied);

                            const isSearchMatch = Boolean(
                                tableSearch.trim() && (
                                    table.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
                                    table.guests?.some(g => g.full_name.toLowerCase().includes(tableSearch.toLowerCase()))
                                )
                            );

                            return (
                                <div
                                    key={table.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${pos.x}px`,
                                        top: `${pos.y}px`,
                                        cursor: isMoveTablesMode ? 'move' : 'pointer',
                                        transform: `translate(-50%, -50%) ${isDragging ? 'scale(1.06)' : isDragOver ? 'scale(1.08)' : 'scale(1)'}`,
                                        zIndex: isDragging ? 50 : isDragOver ? 45 : isSelected ? 40 : 30,
                                    }}
                                    className={`group transition-transform select-none ${
                                        isSearchMatch ? 'ring-4 ring-amber-400 rounded-full animate-bounce' : ''
                                    }`}
                                    onPointerDown={(e) => handleTablePointerDown(e, table.id)}
                                    onClick={() => {
                                        setSelectedTableId(table.id);
                                        setSelectedVenueElemId(null);
                                        setSidebarTab('table');
                                        setShowUnassignedSidebar(true);
                                    }}
                                    onDragOver={(e) => handleTableDragOver(e, table)}
                                    onDragLeave={(e) => handleTableDragLeave(e, table)}
                                    onDrop={(e) => handleTableDrop(e, table)}
                                >
                                    {/* =================================================== */}
                                    {/* A) MESA REDONDA (`shape === 'round'`)               */}
                                    {/* =================================================== */}
                                    {shape === 'round' && (() => {
                                        const diameter = getTableWidth(table);
                                        return (
                                            <div 
                                                style={{ width: `${diameter}px`, height: `${diameter}px` }}
                                                className={`rounded-full border-2 shadow-md flex flex-col items-center justify-center text-center p-2.5 transition-all relative ${
                                                    isDragOver 
                                                        ? 'bg-emerald-100 border-[#2c4537] ring-4 ring-[#2c4537]/30 scale-105'
                                                        : isSelected
                                                        ? 'bg-white dark:bg-stone-900 border-[#cfbe95] ring-3 ring-[#cfbe95]'
                                                        : isFull
                                                        ? 'bg-[#fcfaf7] dark:bg-stone-900 border-stone-300 dark:border-stone-700'
                                                        : 'bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd] hover:border-[#cfbe95]'
                                                }`}
                                            >
                                                {/* Botón flotante para editar tamaño o datos en Modo Edición */}
                                                {isMoveTablesMode && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditTable(table);
                                                        }}
                                                        className="absolute -top-2.5 -right-2.5 bg-[#2c4537] hover:bg-[#3d5e4b] text-white p-1 rounded-full shadow-md z-50 cursor-pointer transition-transform hover:scale-110 border border-[#cfbe95]"
                                                        title={`Cambiar tamaño o editar mesa "${table.name}"`}
                                                    >
                                                        <Edit className="w-3 h-3 text-[#cfbe95]" />
                                                    </button>
                                                )}

                                                <UtensilsCrossed className="w-3.5 h-3.5 text-[#cfbe95] mb-0.5" />
                                                <span className="font-serif font-bold text-xs text-[#2c4537] dark:text-[#f4ecd8] leading-tight truncate max-w-[85%]">
                                                    {table.name}
                                                </span>
                                                
                                                {/* Contador de comensales */}
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="font-mono text-[10.5px] font-bold text-stone-700 dark:text-stone-300">
                                                        {occupied}/{table.capacity}
                                                    </span>
                                                    <Badge className={`text-[8.5px] py-0 px-1 font-semibold ${
                                                        isFull
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {isFull ? 'Llena' : `${freeSpots} lib.`}
                                                    </Badge>
                                                </div>

                                                {table.notes && (
                                                    <span className="text-[8.5px] text-stone-400 italic truncate max-w-[80%] mt-0.5">
                                                        {table.notes}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* =================================================== */}
                                    {/* B) MESA RECTANGULAR O IMPERIAL                      */}
                                    {/* =================================================== */}
                                    {shape === 'rectangular' && (() => {
                                        const width = getTableWidth(table);
                                        const height = getTableHeight(table);
                                        return (
                                            <div 
                                                style={{ width: `${width}px`, height: `${height}px` }}
                                                className={`rounded-2xl border-2 shadow-md flex flex-col items-center justify-center text-center p-2.5 transition-all relative ${
                                                    isDragOver 
                                                        ? 'bg-emerald-100 border-[#2c4537] ring-4 ring-[#2c4537]/30 scale-105'
                                                        : isSelected
                                                        ? 'bg-white dark:bg-stone-900 border-[#cfbe95] ring-3 ring-[#cfbe95]'
                                                        : isFull
                                                        ? 'bg-[#fcfaf7] dark:bg-stone-900 border-stone-300 dark:border-stone-700'
                                                        : 'bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd] hover:border-[#cfbe95]'
                                                }`}
                                            >
                                                {/* Botón flotante para editar tamaño o datos en Modo Edición */}
                                                {isMoveTablesMode && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditTable(table);
                                                        }}
                                                        className="absolute -top-2.5 -right-2.5 bg-[#2c4537] hover:bg-[#3d5e4b] text-white p-1 rounded-full shadow-md z-50 cursor-pointer transition-transform hover:scale-110 border border-[#cfbe95]"
                                                        title={`Cambiar tamaño o editar mesa "${table.name}"`}
                                                    >
                                                        <Edit className="w-3 h-3 text-[#cfbe95]" />
                                                    </button>
                                                )}

                                                <span className="font-serif font-bold text-xs text-[#2c4537] dark:text-[#f4ecd8] leading-tight truncate max-w-[90%]">
                                                    {table.name}
                                                </span>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="font-mono text-[10.5px] font-bold text-stone-700 dark:text-stone-300">
                                                        {occupied}/{table.capacity}
                                                    </span>
                                                    <Badge className={`text-[8.5px] py-0 px-1 font-semibold ${
                                                        isFull
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {isFull ? 'Llena' : `${freeSpots} lib.`}
                                                    </Badge>
                                                </div>
                                                {table.notes && (
                                                    <span className="text-[8.5px] text-stone-400 italic truncate max-w-[85%] mt-0.5">
                                                        {table.notes}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* =================================================== */}
                                    {/* C) MESA DE HONOR / NOVIOS (`shape === 'head'`)      */}
                                    {/* =================================================== */}
                                    {shape === 'head' && (() => {
                                        const width = getTableWidth(table);
                                        const height = getTableHeight(table);
                                        return (
                                            <div 
                                                style={{ width: `${width}px`, height: `${height}px` }}
                                                className={`rounded-3xl border-2 shadow-lg flex flex-col items-center justify-center text-center p-2.5 transition-all relative ${
                                                    isDragOver 
                                                        ? 'bg-amber-100 border-[#8f6d28] ring-4 ring-[#cfbe95] scale-105'
                                                        : isSelected
                                                        ? 'bg-[#2c4537] ring-4 ring-[#cfbe95]'
                                                        : 'bg-gradient-to-br from-[#2c4537] via-[#355242] to-[#2c4537] text-[#f4ecd8] border-[#cfbe95]'
                                                }`}
                                            >
                                                {/* Botón flotante para editar tamaño o datos en Modo Edición */}
                                                {isMoveTablesMode && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEditTable(table);
                                                        }}
                                                        className="absolute -top-2.5 -right-2.5 bg-[#2c4537] hover:bg-[#3d5e4b] text-white p-1 rounded-full shadow-md z-50 cursor-pointer transition-transform hover:scale-110 border border-[#cfbe95]"
                                                        title={`Cambiar tamaño o editar mesa "${table.name}"`}
                                                    >
                                                        <Edit className="w-3 h-3 text-[#cfbe95]" />
                                                    </button>
                                                )}

                                                <Crown className="w-4 h-4 text-[#cfbe95] mb-0.5" />
                                                <span className="font-serif font-bold text-xs tracking-wider uppercase text-[#f4ecd8] leading-tight truncate max-w-[90%]">
                                                    {table.name}
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="font-mono text-xs font-bold text-[#cfbe95]">
                                                        {occupied}/{table.capacity}
                                                    </span>
                                                    <span className="text-[9px] uppercase font-bold text-white/80">
                                                        Mesa de Novios
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL: CREAR / EDITAR ZONA DEL SALÓN                      */}
            {/* ========================================================= */}
            <Dialog open={showVenueModal} onOpenChange={setShowVenueModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold font-sans text-[#2c4537] dark:text-[#f4ecd8]">
                            <Sliders className="w-5 h-5 text-[#cfbe95]" />
                            {editingVenueElem ? 'Editar Zona del Salón' : 'Añadir Zona al Salón'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-500">
                            Configura dónde irá el escenario del grupo, la pista de baile, la barra u otra zona personalizada.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveVenueElement} className="space-y-4 pt-2">
                        {/* Selector de Presets */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Tipo de Zona / Estructura</Label>
                            <Select 
                                value={venueFormData.type} 
                                onValueChange={(val: any) => handlePresetChange(val)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stage">🎵 Escenario &amp; Grupo Musical / DJ</SelectItem>
                                    <SelectItem value="dancefloor">💃 Pista de Baile</SelectItem>
                                    <SelectItem value="bar">🍸 Barra Libre / Mixología</SelectItem>
                                    <SelectItem value="entrance">🚪 Acceso Principal de Invitados</SelectItem>
                                    <SelectItem value="gifts">🎁 Mesa de Regalos / Sobres</SelectItem>
                                    <SelectItem value="cake">🎂 Mesa de Pastel / Candy Bar</SelectItem>
                                    <SelectItem value="photocall">📸 Cabina de Fotos / Photocall</SelectItem>
                                    <SelectItem value="lounge">🛋️ Sala Lounge / Zona Chill Out</SelectItem>
                                    <SelectItem value="restrooms">🚻 Sanitarios / Baños</SelectItem>
                                    <SelectItem value="custom">✨ Zona Personalizada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Título de la zona */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Título en el Plano *</Label>
                            <Input 
                                value={venueFormData.title}
                                onChange={e => setVenueFormData({ ...venueFormData, title: e.target.value })}
                                required
                                placeholder="Ej. Pista de Baile, Grupo Sonora Dinamita..."
                                className="h-9 text-xs"
                            />
                        </div>

                        {/* Subtítulo / Descripción */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold">Subtítulo o Monograma (Opcional)</Label>
                            <Input 
                                value={venueFormData.subtitle}
                                onChange={e => setVenueFormData({ ...venueFormData, subtitle: e.target.value })}
                                placeholder="Ej. A &amp; J, Sonido en vivo, Terraza..."
                                className="h-9 text-xs"
                            />
                        </div>

                        {/* Dimensiones (Ancho x Alto) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Ancho (px)</Label>
                                <Input 
                                    type="number"
                                    min={60}
                                    max={600}
                                    value={venueFormData.width}
                                    onChange={e => setVenueFormData({ ...venueFormData, width: parseInt(e.target.value) || 100 })}
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Alto (px)</Label>
                                <Input 
                                    type="number"
                                    min={40}
                                    max={500}
                                    value={venueFormData.height}
                                    onChange={e => setVenueFormData({ ...venueFormData, height: parseInt(e.target.value) || 60 })}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-[#ded8cd]">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowVenueModal(false)}
                                className="cursor-pointer text-xs"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                size="sm" 
                                className="bg-[#2c4537] hover:bg-[#385645] text-white cursor-pointer text-xs font-semibold"
                            >
                                {editingVenueElem ? 'Guardar Cambios' : 'Añadir al Plano'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL DE LUJO PARA ALERTAS Y CONFIRMACIONES */}
            <LuxuryModal
                open={luxuryModalState.open}
                onClose={() => setLuxuryModalState(prev => ({ ...prev, open: false }))}
                title={luxuryModalState.title}
                description={luxuryModalState.description}
                type={luxuryModalState.type}
                confirmText={luxuryModalState.confirmText}
                cancelText={luxuryModalState.cancelText}
                onConfirm={luxuryModalState.onConfirm}
            />
        </div>
    );
}
