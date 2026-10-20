import React, { useState } from 'react';
import { 
    UtensilsCrossed, 
    Users, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    X, 
    Check,
    AlertCircle,
    LayoutGrid,
    Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InteractiveSeatingCanvas from './InteractiveSeatingCanvas';

interface TableGuest {
    id: number;
    table_id: number;
    full_name: string;
    type: string;
    checkin_code?: string;
    allergies?: string | null;
}

interface TableItem {
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

interface UnassignedGuest {
    id: number;
    full_name: string;
    type: string;
    invitation_name: string;
}

interface BanquetSeatingViewProps {
    tables: TableItem[];
    unassignedGuests: UnassignedGuest[];
    tableSearch: string;
    setTableSearch: (val: string) => void;
    totalTableCapacity: number;
    totalAssignedGuests: number;
    percentTablesFilled: number;
    assignGuestTable: (guestId: number, tableId: string | null) => void;
    startEditTable: (table: TableItem) => void;
    handleDeleteTable: (tableId: number) => void;
    openCreateTable: () => void;
    venueElements?: any[];
}

export default function BanquetSeatingView({
    tables,
    unassignedGuests,
    tableSearch,
    setTableSearch,
    totalTableCapacity,
    totalAssignedGuests,
    percentTablesFilled,
    assignGuestTable,
    startEditTable,
    handleDeleteTable,
    openCreateTable,
    venueElements = []
}: BanquetSeatingViewProps) {
    const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

    const filteredTables = tables.filter(t => {
        if (!tableSearch.trim()) return true;
        const q = tableSearch.toLowerCase();
        const inName = t.name.toLowerCase().includes(q);
        const inNotes = t.notes?.toLowerCase().includes(q) || false;
        const inGuests = t.guests?.some(g => g.full_name.toLowerCase().includes(q)) || false;
        return inName || inNotes || inGuests;
    });

    return (
        <div className="space-y-6">
            {/* 1. BARRA DE ESTADÍSTICAS EJECUTIVAS DEL BANQUETE */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="p-3.5 border-[#ded8cd] shadow-xs bg-[#faf8f3] dark:bg-stone-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Mesas Creadas
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-bold font-sans text-[#2c4537] dark:text-[#f4ecd8]">
                            {tables.length}
                        </span>
                        <span className="text-xs text-stone-400">mesas</span>
                    </div>
                </Card>

                <Card className="p-3.5 border-[#ded8cd] shadow-xs bg-[#faf8f3] dark:bg-stone-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Capacidad Total
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-bold font-sans text-stone-800 dark:text-stone-200">
                            {totalTableCapacity}
                        </span>
                        <span className="text-xs text-stone-400">lugares</span>
                    </div>
                </Card>

                <Card className="p-3.5 border-[#ded8cd] shadow-xs bg-[#faf8f3] dark:bg-stone-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#385645] dark:text-[#a8c5b2]">
                        Lugares Asignados
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-bold font-sans text-[#2c4537] dark:text-[#a8c5b2]">
                            {totalAssignedGuests}
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold font-mono">
                            ({percentTablesFilled}%)
                        </span>
                    </div>
                </Card>

                <Card className="p-3.5 border-[#ded8cd] shadow-xs bg-[#faf8f3] dark:bg-stone-900">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Lugares Libres
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-bold font-sans text-[#8f6d28] dark:text-[#e5cf97]">
                            {Math.max(0, totalTableCapacity - totalAssignedGuests)}
                        </span>
                        <span className="text-xs text-stone-400">disponibles</span>
                    </div>
                </Card>

                <Card className="p-3.5 border-[#ded8cd] shadow-xs bg-[#faf8f3] dark:bg-stone-900 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Sin Asignar
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-bold font-sans text-amber-700 dark:text-amber-400">
                            {unassignedGuests.length}
                        </span>
                        <span className="text-xs text-amber-600/80">invitados</span>
                    </div>
                </Card>
            </div>

            {/* 2. FILTRO DE BÚSQUEDA Y ACCIÓN RÁPIDA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-[#ded8cd]">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input 
                        placeholder="Buscar mesa o nombre de invitado..." 
                        value={tableSearch}
                        onChange={e => setTableSearch(e.target.value)}
                        className="pl-9 h-9 text-xs bg-[#faf8f3] dark:bg-stone-900 border-[#ded8cd]"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Selector de Vista: Plano 2D vs Cuadrícula */}
                    <div className="flex items-center bg-[#faf8f3] dark:bg-stone-900 p-0.5 rounded-lg border border-[#ded8cd]">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('canvas')}
                            className={`h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                                viewMode === 'canvas'
                                    ? 'bg-[#2c4537] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
                            }`}
                        >
                            <Map className="w-3.5 h-3.5 text-[#cfbe95]" />
                            Plano Interactivo 2D
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={`h-8 px-3 text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                                viewMode === 'grid'
                                    ? 'bg-[#2c4537] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
                            }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5 text-[#cfbe95]" />
                            Cuadrícula
                        </Button>
                    </div>

                    <Button
                        onClick={openCreateTable}
                        className="bg-[#2c4537] hover:bg-[#385645] text-white text-xs font-bold uppercase tracking-wider h-9 px-3 rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5 text-[#cfbe95]" />
                        Crear Mesa
                    </Button>
                </div>
            </div>

            {/* 3. CONTENIDO SEGÚN MODO DE VISTA: PLANO 2D vs CUADRÍCULA */}
            {viewMode === 'canvas' ? (
                <InteractiveSeatingCanvas
                    tables={tables}
                    unassignedGuests={unassignedGuests}
                    tableSearch={tableSearch}
                    setTableSearch={setTableSearch}
                    assignGuestTable={assignGuestTable}
                    startEditTable={startEditTable}
                    handleDeleteTable={handleDeleteTable}
                    openCreateTable={openCreateTable}
                    venueElements={venueElements}
                />
            ) : (
                <>
                    {/* CUADRÍCULA DE MESAS */}
                    {filteredTables.length === 0 ? (
                        <div className="p-12 text-center bg-card rounded-2xl border border-dashed border-[#ded8cd]">
                            <UtensilsCrossed className="w-12 h-12 mx-auto text-[#cfbe95] opacity-50 mb-3" />
                            <h3 className="font-sans font-bold text-base text-stone-800 dark:text-stone-200">
                                {tableSearch ? 'No se encontraron mesas con esa búsqueda' : 'No hay mesas registradas todavía'}
                            </h3>
                            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 mb-4">
                                {tableSearch ? 'Intenta con otro término o limpia el buscador.' : 'Crea las mesas de tu banquete (ej. "Mesa de Honor", "Mesa 1 - Familia Novia") y define cuántas personas caben en cada una.'}
                            </p>
                            {!tableSearch && (
                                <Button
                                    onClick={openCreateTable}
                                    className="bg-[#2c4537] hover:bg-[#385645] text-white text-xs font-bold uppercase tracking-wider h-10 px-4 rounded-xl cursor-pointer"
                                >
                                    <Plus className="w-4 h-4 mr-1 text-[#cfbe95]" />
                                    Crear Mi Primera Mesa
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredTables.map(table => {
                                const occupied = table.guests_count || 0;
                                const isFull = occupied >= table.capacity;
                                const pct = Math.min(100, Math.round((occupied / table.capacity) * 100));
                                const freeSpots = Math.max(0, table.capacity - occupied);
                                const seatedGuests = table.guests || [];

                                return (
                                    <Card key={table.id} className="border-[#ded8cd] shadow-sm bg-card hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
                                        <div>
                                            {/* Header de la mesa */}
                                            <div className="p-4 bg-[#faf8f3] dark:bg-stone-900 border-b border-[#ded8cd] dark:border-stone-800">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-sans font-bold text-base text-[#2c4537] dark:text-[#f4ecd8] flex items-center gap-1.5">
                                                            <UtensilsCrossed className="w-4 h-4 text-[#cfbe95]" />
                                                            {table.name}
                                                        </h3>
                                                        {table.notes && (
                                                            <p className="text-xs text-stone-500 italic mt-0.5">
                                                                📍 {table.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-stone-400 hover:text-[#2c4537] cursor-pointer"
                                                            onClick={() => startEditTable(table)}
                                                            title="Editar mesa"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-stone-400 hover:text-rose-600 cursor-pointer"
                                                            onClick={() => handleDeleteTable(table.id)}
                                                            title="Eliminar mesa"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Barra de capacidad */}
                                                <div className="mt-3 space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium text-stone-600 dark:text-stone-300">
                                                            {occupied} / {table.capacity} lugares ocupados
                                                        </span>
                                                        <Badge className={`text-[10px] font-semibold ${
                                                            isFull 
                                                                ? 'bg-rose-100 text-rose-800 border-rose-200' 
                                                                : freeSpots <= 2 
                                                                ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                        }`}>
                                                            {isFull ? 'Mesa Llena' : `${freeSpots} ${freeSpots === 1 ? 'lugar libre' : 'lugares libres'}`}
                                                        </Badge>
                                                    </div>
                                                    <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-300 ${
                                                                isFull ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-[#2c4537]'
                                                            }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lista de comensales sentados */}
                                            <div className="p-3.5 space-y-2">
                                                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                                                    <span>Invitados Sentados ({occupied})</span>
                                                </div>

                                                {seatedGuests.length === 0 ? (
                                                    <div className="py-6 text-center text-xs text-stone-400 italic bg-[#fcfaf7] dark:bg-stone-900/40 rounded-xl border border-dashed border-[#ded8cd] dark:border-stone-800">
                                                        Sin invitados sentados todavía.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                                        {seatedGuests.map((sg: any) => (
                                                            <div 
                                                                key={sg.id}
                                                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#faf8f3] dark:bg-stone-900 border border-[#e8dfcf] dark:border-stone-800 text-xs"
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                                                                            {sg.full_name}
                                                                        </span>
                                                                        <span className="text-[10px] text-stone-500">
                                                                            ({sg.type === 'child' ? 'Niño' : 'Adulto'})
                                                                        </span>
                                                                        {sg.checkin_code && (
                                                                            <span className="text-[9px] font-mono text-[#8f6d28] bg-[#fbf8f0] px-1 rounded border border-[#cfbe95]">
                                                                                🎫 {sg.checkin_code}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer shrink-0"
                                                                    onClick={() => assignGuestTable(sg.id, null)}
                                                                    title="Retirar de esta mesa"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Footer: Selector rápido para sentar comensal */}
                                        <div className="p-3 bg-[#faf8f3]/80 dark:bg-stone-900/60 border-t border-[#ded8cd] dark:border-stone-800">
                                            {!isFull && unassignedGuests.length > 0 ? (
                                                <Select 
                                                    value="placeholder" 
                                                    onValueChange={(guestId) => {
                                                        if (guestId && guestId !== 'placeholder') {
                                                            assignGuestTable(parseInt(guestId), String(table.id));
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 text-xs bg-white dark:bg-stone-950 border-[#cfbe95] text-[#2c4537] dark:text-[#f4ecd8] font-medium cursor-pointer">
                                                        <SelectValue placeholder={`+ Sentar a un invitado (${freeSpots} disp.)`} />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[250px]">
                                                        <SelectItem value="placeholder" disabled>
                                                            Seleccionar invitado sin mesa...
                                                        </SelectItem>
                                                        {unassignedGuests.map(ug => (
                                                            <SelectItem key={ug.id} value={String(ug.id)} className="cursor-pointer text-xs">
                                                                👤 {ug.full_name} <span className="text-stone-400">({ug.invitation_name})</span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : isFull ? (
                                                <div className="text-center text-[11px] text-stone-400 py-1 font-medium">
                                                    ✓ Mesa al 100% de capacidad
                                                </div>
                                            ) : (
                                                <div className="text-center text-[11px] text-emerald-700 dark:text-emerald-400 py-1 font-medium">
                                                    ✓ Todos los invitados ya tienen mesa
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* PANEL DE INVITADOS SIN ASIGNAR */}
                    <Card className="border-[#ded8cd] shadow-sm bg-card p-5 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ded8cd] pb-3 mb-4">
                            <div>
                                <h3 className="font-sans font-bold text-base text-[#2c4537] dark:text-[#f4ecd8] flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#cfbe95]" />
                                    Invitados Pendientes de Asignar Mesa ({unassignedGuests.length})
                                </h3>
                                <p className="text-xs text-stone-500">
                                    Asigna rápidamente una mesa para cada persona o hazlo por familia completa en la pestaña de Invitados.
                                </p>
                            </div>
                            {unassignedGuests.length === 0 && (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 py-1 px-3 text-xs font-semibold">
                                    🎉 ¡Todos los invitados tienen mesa asignada!
                                </Badge>
                            )}
                        </div>

                        {unassignedGuests.length === 0 ? (
                            <div className="text-center py-8 text-stone-400">
                                <Check className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                                    ¡El banquete está completamente organizado!
                                </p>
                                <p className="text-xs text-stone-400 mt-1">
                                    No hay invitados pendientes por ubicar en las mesas.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {unassignedGuests.map(ug => (
                                    <div 
                                        key={ug.id}
                                        className="flex items-center justify-between gap-2 p-3 bg-[#faf8f3] dark:bg-stone-900 border border-[#e8dfcf] dark:border-stone-800 rounded-xl"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs text-stone-800 dark:text-stone-100 truncate">
                                                {ug.full_name}
                                            </p>
                                            <p className="text-[11px] text-stone-500 truncate">
                                                Familia: {ug.invitation_name}
                                            </p>
                                        </div>

                                        <div className="w-36 shrink-0">
                                            <Select 
                                                value="none" 
                                                onValueChange={(tblId) => {
                                                    if (tblId && tblId !== 'none') {
                                                        assignGuestTable(ug.id, tblId);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-[11px] bg-white dark:bg-stone-950 border-[#cfbe95] cursor-pointer">
                                                    <SelectValue placeholder="Asignar mesa..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    <SelectItem value="none" disabled>
                                                        Elegir mesa...
                                                    </SelectItem>
                                                    {tables.map(t => {
                                                        const free = t.capacity - (t.guests_count || 0);
                                                        const full = free <= 0;
                                                        return (
                                                            <SelectItem key={t.id} value={String(t.id)} disabled={full} className="text-xs cursor-pointer">
                                                                {t.name} ({free} disp.) {full ? '• LLENA' : ''}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}
