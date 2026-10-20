import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Check, 
    Search, 
    X, 
    Sparkles, 
    UtensilsCrossed, 
    AlertTriangle, 
    Users, 
    Clock, 
    ShieldCheck, 
    RotateCcw, 
    LayoutList, 
    Ticket, 
    ChevronRight,
    UserCheck,
    CheckCircle2,
    Lock,
    AlertCircle,
    UserX,
    Camera,
    QrCode,
    Zap
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface GuestItem {
    id: number;
    invitation_id: number;
    full_name: string;
    checkin_code?: string;
    type?: 'adult' | 'child';
    is_attending?: boolean | null;
    has_entered?: boolean;
    checked_in_at?: string | null;
    table_name?: string | null;
    allergies?: string | null;
    special_notes?: string | null;
}

interface InvitationItem {
    id: number;
    name: string;
    phone?: string | null;
    category?: string | null;
    side?: 'bride' | 'groom' | string | null;
    token: string;
    status: string;
    message_to_couple?: string | null;
    guests: GuestItem[];
}

interface CheckInProps {
    wedding: {
        bride_name?: string;
        groom_name?: string;
    };
    guests: GuestItem[];
    invitations: InvitationItem[];
}

export default function CheckInManager({ wedding, guests = [], invitations = [] }: CheckInProps) {
    const { auth } = usePage().props as any;

    // Estado del buscador y vista
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'concierge' | 'list'>('concierge');
    const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'entered'>('all');
    
    // Familia o Invitación seleccionada en el "Pase de Gala"
    const [selectedInvitationId, setSelectedInvitationId] = useState<number | null>(() => {
        return invitations.length > 0 ? invitations[0].id : null;
    });

    // Estado para modal de ingreso excepcional (invitados que no confirmaron)
    const [exceptionalGuest, setExceptionalGuest] = useState<GuestItem | null>(null);

    // Estado para lector de cámara QR y escaneo
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isProcessingCode, setIsProcessingCode] = useState(false);

    // Modal de resultado de escaneo en tiempo real (Pase de Bienvenida / Alertas)
    const [scanResult, setScanResult] = useState<{
        status: 'success' | 'already_entered' | 'not_confirmed' | 'not_found';
        guest?: GuestItem;
        invitation?: InvitationItem;
        message: string;
    } | null>(null);

    // Síntesis de audio para confirmación y alertas (Web Audio API)
    const playSuccessSound = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(659.25, now);
            osc.frequency.setValueAtTime(830.61, now + 0.1);
            osc.frequency.setValueAtTime(987.77, now + 0.2);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {}
    };

    const playAlertSound = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'triangle';
            const now = audioCtx.currentTime;
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.setValueAtTime(220, now + 0.15);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {}
    };

    // Procesar validación de código de acceso
    const handleProcessCode = async (rawCode: string) => {
        const code = rawCode.trim();
        if (!code || isProcessingCode) return;

        setIsProcessingCode(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/admin/checkin/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ code })
            });

            const data = await res.json();

            if (data.status === 'success') {
                playSuccessSound();
                setScanResult(data);
                if (data.guest?.invitation_id) {
                    setSelectedInvitationId(data.guest.invitation_id);
                }
                router.reload({ only: ['guests', 'invitations'] });
            } else if (data.status === 'already_entered' || data.status === 'not_confirmed') {
                playAlertSound();
                setScanResult(data);
                if (data.guest?.invitation_id) {
                    setSelectedInvitationId(data.guest.invitation_id);
                }
            } else {
                playAlertSound();
                toast.error(data.message || 'Código de pase no encontrado.');
            }
        } catch (err) {
            playAlertSound();
            toast.error('Ocurrió un error al validar el código.');
        } finally {
            setIsProcessingCode(false);
        }
    };

    // Lector global de teclado para pistolas / lectores físicos de código de barras (USB/Bluetooth)
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === 'textarea') return;

            const currentTime = Date.now();
            if (currentTime - lastKeyTime > 150) {
                buffer = '';
            }
            lastKeyTime = currentTime;

            if (e.key === 'Enter') {
                if (buffer.length >= 4) {
                    e.preventDefault();
                    handleProcessCode(buffer.trim());
                    buffer = '';
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Ciclo de vida para el lector de cámara QR
    useEffect(() => {
        if (!isScannerOpen) return;

        let html5QrCode: Html5Qrcode | null = null;
        const containerId = 'qr-camera-viewport';

        const timer = setTimeout(async () => {
            try {
                html5QrCode = new Html5Qrcode(containerId);
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 15,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        handleProcessCode(decodedText);
                        setIsScannerOpen(false);
                    },
                    () => {}
                );
            } catch (err) {
                console.warn('Lector de cámara:', err);
                toast.error('No se pudo abrir la cámara. Verifica los permisos del navegador.');
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            if (html5QrCode) {
                try {
                    if (html5QrCode.isScanning) {
                        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(() => {});
                    } else {
                        html5QrCode.clear();
                    }
                } catch (e) {}
            }
        };
    }, [isScannerOpen]);

    // Reloj del evento en tiempo real
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

    // Efecto de sello / animación al dar acceso
    const [isSealing, setIsSealing] = useState(false);

    // Métrica de invitados en el lugar (solo confirmados)
    const totalExpected = guests.length;
    const totalEntered = useMemo(() => guests.filter(g => g.has_entered).length, [guests]);
    const percentageEntered = totalExpected > 0 ? Math.round((totalEntered / totalExpected) * 100) : 0;

    // Filtrar invitaciones según búsqueda y pestaña (incluyendo código único de pase)
    const filteredInvitations = useMemo(() => {
        return invitations.filter(inv => {
            const matchesSearch = 
                inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (inv.category && inv.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                inv.guests.some(g => 
                    g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (g.table_name && g.table_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (g.checkin_code && g.checkin_code.toLowerCase().includes(searchTerm.toLowerCase()))
                );

            if (!matchesSearch) return false;

            const confirmedGuests = inv.guests.filter(g => g.is_attending === true);
            const allConfirmedEntered = confirmedGuests.length > 0 && confirmedGuests.every(g => g.has_entered);
            const hasAnyEntered = inv.guests.some(g => g.has_entered);

            if (filterTab === 'pending') return !allConfirmedEntered;
            if (filterTab === 'entered') return hasAnyEntered;
            return true;
        });
    }, [invitations, searchTerm, filterTab]);

    // Determinar la invitación activa para la Tarjeta de Gala
    const activeInvitation = useMemo(() => {
        if (!selectedInvitationId && filteredInvitations.length > 0) {
            return filteredInvitations[0];
        }
        return invitations.find(inv => inv.id === selectedInvitationId) || filteredInvitations[0] || null;
    }, [invitations, selectedInvitationId, filteredInvitations]);

    // Calcular estatus de la invitación activa (diferenciando confirmados de no confirmados)
    const activeStats = useMemo(() => {
        if (!activeInvitation) return { 
            totalPasses: 0, 
            confirmedTotal: 0, 
            confirmedEntered: 0, 
            declinedTotal: 0,
            allConfirmedEntered: false, 
            tableName: null 
        };

        const totalPasses = activeInvitation.guests.length;
        const confirmedGuests = activeInvitation.guests.filter(g => g.is_attending === true);
        const declinedGuests = activeInvitation.guests.filter(g => g.is_attending !== true);
        
        const confirmedEntered = confirmedGuests.filter(g => g.has_entered).length;
        const allConfirmedEntered = confirmedGuests.length > 0 && confirmedEntered === confirmedGuests.length;

        // Mesa asignada
        const table = activeInvitation.guests.find(g => g.table_name)?.table_name || null;

        return {
            totalPasses,
            confirmedTotal: confirmedGuests.length,
            confirmedEntered,
            declinedTotal: declinedGuests.length,
            allConfirmedEntered,
            tableName: table
        };
    }, [activeInvitation]);

    // Manejar Check-in individual de un invitado
    const handleToggleGuest = (guestId: number, guestName: string) => {
        router.put(`/admin/guests/${guestId}/checkin`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Acceso actualizado para ${guestName}`);
            }
        });
    };

    // Manejar Check-in grupal de la invitación completa (SOLO CONFIRMADOS)
    const handleToggleFullInvitation = (invitationId: number, hasEnteredTarget: boolean) => {
        setIsSealing(true);
        router.put(`/admin/invitations/${invitationId}/checkin`, {
            has_entered: hasEnteredTarget
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setTimeout(() => setIsSealing(false), 700);
                if (hasEnteredTarget) {
                    toast.success('¡Acceso de Gala concedido a los confirmados!', {
                        description: 'Los integrantes con asistencia confirmada han sido registrados.'
                    });
                } else {
                    toast.info('Ingreso revertido para la invitación');
                }
            },
            onError: () => {
                setIsSealing(false);
            }
        });
    };

    // Lista de últimas llegadas recientes (invitados que tienen has_entered)
    const recentArrivals = useMemo(() => {
        return invitations
            .filter(inv => inv.guests.some(g => g.has_entered))
            .slice(0, 10);
    }, [invitations]);

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 py-6 w-full">
            <Head title={`Control de Acceso (Concierge) - ${wedding?.bride_name} & ${wedding?.groom_name}`} />

            {/* ========================================================= */}
            {/* 1. HEADER: AMBIENTE DE RECEPCIÓN & INDICADORES EN VIVO    */}
            {/* ========================================================= */}
            <header className="bg-gradient-to-r from-[#2c4537] via-[#385645] to-[#2c4537] dark:from-[#1b2b22] dark:via-[#24392d] dark:to-[#1b2b22] text-[#fcf8ed] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#486b55] dark:border-[#2d4234] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
                {/* Monograma decorativo de fondo */}
                <div className="absolute -right-8 -bottom-10 opacity-[0.14] pointer-events-none w-48 h-48 select-none brightness-150">
                    <img src="/resources_canvas/images/15.svg" alt="Monograma" className="w-full h-full object-contain" />
                </div>

                <div className="space-y-1.5 z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans uppercase tracking-wider font-semibold bg-[#16271e]/75 backdrop-blur-sm text-[#f4ecd8] border border-[#cfbe95]/40 shadow-xs">
                            <Sparkles className="w-3 h-3 text-[#cfbe95]" />
                            Modo Concierge de Recepción
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#f4ecd8] bg-[#16271e]/75 backdrop-blur-sm px-3 py-1 rounded-full border border-[#cfbe95]/40 shadow-xs font-semibold">
                            <Clock className="w-3 h-3 text-[#cfbe95]" />
                            <span>{currentTime || 'En recepción'}</span>
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#fcf8ed]">
                        Recepción de Boda • Control de Acceso
                    </h1>
                    <p className="text-xs sm:text-sm text-[#dfd4c0] font-sans font-medium">
                        {wedding?.bride_name} &amp; {wedding?.groom_name} — Da la bienvenida y ubica a cada invitado confirmado.
                    </p>
                </div>

                {/* Métricas visuales de afluencia */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end z-10 flex-wrap sm:flex-nowrap">
                    <div className="bg-[#16271e]/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#cfbe95]/30 shadow-md flex flex-col items-end min-w-[160px]">
                        <span className="text-[10.5px] uppercase font-sans font-semibold tracking-wider text-[#cfbe95]">
                            Afluencia Confirmada
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-2xl font-bold font-sans text-[#fcf8ed]">
                                {totalEntered}
                            </span>
                            <span className="text-xs text-[#cfbe95]/85 font-sans font-medium">
                                / {totalExpected} confirmados
                            </span>
                        </div>
                        {/* Barra de progreso */}
                        <div className="w-full bg-[#0f1c15] h-1.5 rounded-full mt-2 overflow-hidden border border-[#cfbe95]/20">
                            <div 
                                className="bg-gradient-to-r from-[#d4af37] via-[#e5cf97] to-[#d4af37] h-full transition-all duration-500 rounded-full"
                                style={{ width: `${percentageEntered}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-[#e8d5aa] font-bold mt-1">
                            {percentageEntered}% del salón ocupado
                        </span>
                    </div>

                    {/* Botón Lector QR y Selector de Modo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fcf8ee] hover:bg-[#f3ebd9] text-[#24352a] font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer border border-[#e6dbc5] h-11"
                        >
                            <Camera className="w-3.5 h-3.5 text-[#24352a]" />
                            <span>Escanear QR</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode(viewMode === 'concierge' ? 'list' : 'concierge')}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#fcf8ee] border border-white/25 font-sans font-semibold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer h-11"
                        >
                            {viewMode === 'concierge' ? (
                                <>
                                    <LayoutList className="w-3.5 h-3.5 text-[#cfbe95]" />
                                    <span>Vista Lista</span>
                                </>
                            ) : (
                                <>
                                    <Ticket className="w-3.5 h-3.5 text-[#cfbe95]" />
                                    <span>Pase de Gala</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ========================================================= */}
            {/* 2. SPOTLIGHT SEARCH (Buscador central con autoenfoque)    */}
            {/* ========================================================= */}
            <div className="relative">
                <div className="relative flex items-center shadow-md rounded-2xl bg-white border-2 border-[#b8c9d9] focus-within:border-[#698175] focus-within:ring-2 focus-within:ring-[#698175]/20 transition-all">
                    <Search className="absolute left-4 text-[#556c7d] w-5 h-5 pointer-events-none" />
                    <Input
                        type="text"
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchTerm.trim()) {
                                const term = searchTerm.trim();
                                if (term.toUpperCase().startsWith('AJ-') || term.length >= 4) {
                                    handleProcessCode(term);
                                }
                            }
                        }}
                        placeholder="Busca por apellido, nombre, mesa o código de pase (ej. AJ-82K4)..."
                        className="pl-12 pr-32 sm:pr-40 h-14 text-base sm:text-lg border-0 focus-visible:ring-0 placeholder:text-stone-400 font-sans"
                    />
                    <div className="absolute right-3 flex items-center gap-2">
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#698175] hover:bg-[#52665c] text-white text-xs font-sans font-semibold shadow-xs transition-all cursor-pointer"
                            title="Abrir lector de cámara QR"
                        >
                            <Camera className="w-4 h-4" />
                            <span className="hidden sm:inline">Escanear</span>
                        </button>
                    </div>
                </div>

                {/* Filtros rápidos: Todos | Pendientes | Ya ingresaron */}
                <div className="flex items-center justify-between mt-3 px-1 text-xs text-stone-500 font-sans">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => setFilterTab('all')}
                            className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
                                filterTab === 'all'
                                    ? 'bg-[#698175] text-white font-semibold shadow-xs'
                                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                            }`}
                        >
                            Todos ({invitations.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('pending')}
                            className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
                                filterTab === 'pending'
                                    ? 'bg-[#698175] text-white font-semibold shadow-xs'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60'
                            }`}
                        >
                            ⏳ Faltan por llegar
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('entered')}
                            className={`px-3 py-1 rounded-full text-xs font-sans font-medium transition-all cursor-pointer ${
                                filterTab === 'entered'
                                    ? 'bg-[#698175] text-white font-semibold shadow-xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                            }`}
                        >
                            ✓ En el Salón
                        </button>
                    </div>

                    <span className="font-sans text-[11px] text-stone-400 hidden sm:inline-block">
                        Mostrando {filteredInvitations.length} {filteredInvitations.length === 1 ? 'invitación' : 'invitaciones'}
                    </span>
                </div>
            </div>

            {/* ========================================================= */}
            {/* 3. VISTA PRINCIPAL: MODO CONCIERGE / PASE DE GALA         */}
            {/* ========================================================= */}
            {viewMode === 'concierge' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* COLUMNA IZQUIERDA: Selector rápido de Familias / Resultados */}
                    <div className="lg:col-span-5 flex flex-col">
                        <span className="font-sans text-[11px] uppercase tracking-wider text-stone-400 block px-1 mb-2 font-medium">
                            {searchTerm ? 'Coincidencias encontradas' : 'Familias e Invitaciones'}
                        </span>

                        <div className="space-y-2.5 max-h-[720px] overflow-y-auto p-2">
                            {filteredInvitations.length === 0 ? (
                                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                                    <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                                    <p className="font-sans text-sm text-stone-600">
                                        No se encontraron invitados con esa búsqueda.
                                    </p>
                                </div>
                            ) : (
                                filteredInvitations.map((inv) => {
                                    const isSelected = activeInvitation?.id === inv.id;
                                    const totalPases = inv.guests.length;
                                    const confirmedGuests = inv.guests.filter(g => g.is_attending === true);
                                    const confirmedCount = confirmedGuests.length;
                                    const enteredCount = confirmedGuests.filter(g => g.has_entered).length;
                                    const isAllConfirmedIn = confirmedCount > 0 && enteredCount === confirmedCount;
                                    const tableName = inv.guests.find(g => g.table_name)?.table_name;
                                    const declinedCount = inv.guests.filter(g => g.is_attending !== true).length;

                                    return (
                                        <div
                                            key={inv.id}
                                            onClick={() => setSelectedInvitationId(inv.id)}
                                            className={`p-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isSelected
                                                    ? 'bg-[#f4f7f5] border-2 border-[#698175] shadow-sm'
                                                    : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50 shadow-xs'
                                            }`}
                                        >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-sans font-bold text-[#70531c] text-sm truncate">
                                                    {inv.name}
                                                </h4>
                                                {inv.category && (
                                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-sans bg-stone-100 text-stone-600 border border-stone-200 shrink-0">
                                                        {inv.category}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2.5 mt-1 text-[11.5px] text-stone-500 font-sans flex-wrap">
                                                <span className="font-medium text-stone-700">
                                                    {confirmedCount} de {totalPases} confirmados
                                                </span>
                                                {declinedCount > 0 && (
                                                    <span className="text-[10px] text-rose-600 font-sans">
                                                        ({declinedCount} no asiste)
                                                    </span>
                                                )}
                                                {tableName && (
                                                    <span className="font-semibold text-[#556c7d] flex items-center gap-1">
                                                        <UtensilsCrossed className="w-3 h-3" />
                                                        {tableName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Insignia de estado */}
                                        <div className="shrink-0 flex items-center gap-2">
                                            {confirmedCount === 0 ? (
                                                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-[10px]">
                                                    Sin confirmar
                                                </Badge>
                                            ) : isAllConfirmedIn ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 text-[10.5px]">
                                                    ✓ En el lugar ({enteredCount}/{confirmedCount})
                                                </Badge>
                                            ) : enteredCount > 0 ? (
                                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-[10.5px]">
                                                    {enteredCount}/{confirmedCount}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-stone-500 border-stone-300 text-[10.5px]">
                                                    Pendiente
                                                </Badge>
                                            )}
                                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#698175] translate-x-0.5' : 'text-stone-300'}`} />
                                        </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: EL PASE DE GALA DE RECEPCIÓN (EL NÚCLEO UX) */}
                    <div className="lg:col-span-7">
                        {activeInvitation ? (
                            <div className="relative bg-gradient-to-b from-[#fbf9f4] to-[#f5f2ea] rounded-3xl border-2 border-[#d9cfbe] shadow-2xl overflow-hidden p-6 sm:p-8 animate-fadeIn">
                                
                                {/* Decoración de bordes dorados de boleto de gala */}
                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#698175] via-[#d4af37] to-[#698175]" />
                                
                                {/* Cinta / Encabezado del pase */}
                                <div className="flex items-center justify-between pb-5 border-b border-[#ded8cd]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#698175] text-white flex items-center justify-center font-sans font-bold text-xs shadow-xs">
                                            A&amp;J
                                        </div>
                                        <div>
                                            <span className="font-sans text-[10.5px] uppercase tracking-wider text-[#698175] font-semibold block">
                                                Pase de Acceso Oficial
                                            </span>
                                            <span className="text-[11.5px] text-stone-500 font-sans">
                                                Boda de {wedding?.bride_name} &amp; {wedding?.groom_name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Categoría */}
                                    {activeInvitation.category && (
                                        <Badge variant="outline" className="font-sans tracking-wide text-[10.5px] bg-white border-[#ded8cd] text-stone-700 py-1 px-3 shadow-xs font-medium">
                                            {activeInvitation.category}
                                        </Badge>
                                    )}
                                </div>

                                {/* Titular de la invitación */}
                                <div className="py-5 text-center sm:text-left">
                                    <span className="text-xs uppercase font-sans tracking-wider text-[#84662d] font-semibold">
                                        Familia / Titular Registrado
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-sans font-bold text-[#70531c] mt-1 tracking-tight">
                                        {activeInvitation.name}
                                    </h2>
                                    {activeInvitation.phone && (
                                        <p className="text-xs text-stone-500 mt-0.5 font-sans">
                                            Tel: {activeInvitation.phone}
                                        </p>
                                    )}
                                </div>

                                {/* TARJETA DE MESA ASIGNADA */}
                                <div className="bg-white rounded-2xl border-2 border-[#cfbe95] p-4 sm:p-5 shadow-sm flex items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 rounded-xl bg-[#c5a356]/15 text-[#947029] flex items-center justify-center text-xl shrink-0 shadow-xs border border-[#cfbe95]/50">
                                            <UtensilsCrossed className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="text-[10.5px] uppercase font-sans tracking-wider text-[#947029] font-semibold block">
                                                Mesa Asignada
                                            </span>
                                            <h3 className="text-xl sm:text-2xl font-sans font-bold text-[#70531c]">
                                                {activeStats.tableName || 'Sin mesa asignada'}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[10px] uppercase font-sans tracking-wider text-stone-400 block font-medium">
                                            Asistencia en la recepción
                                        </span>
                                        <span className="text-base sm:text-lg font-bold font-sans text-[#70531c]">
                                            {activeStats.confirmedEntered} de {activeStats.confirmedTotal} confirmados
                                        </span>
                                        {activeStats.declinedTotal > 0 && (
                                            <span className="text-[10.5px] text-rose-600 block mt-0.5 font-sans">
                                                {activeStats.declinedTotal} {activeStats.declinedTotal === 1 ? 'persona no confirmó' : 'personas no confirmaron'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* LISTA DE INTEGRANTES / DETALLES DE CADA PERSONA */}
                                <div className="space-y-3 mb-6">
                                    <span className="text-xs uppercase font-sans font-semibold tracking-wider text-stone-500 block">
                                        Integrantes del pase ({activeInvitation.guests.length} pases):
                                    </span>

                                    <div className="space-y-2.5">
                                        {activeInvitation.guests.map((guest) => {
                                            const isConfirmed = guest.is_attending === true;
                                            const hasEntered = !!guest.has_entered;

                                            return (
                                                <div
                                                    key={guest.id}
                                                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                        !isConfirmed
                                                            ? 'bg-stone-50/80 border-dashed border-stone-300 opacity-75'
                                                            : hasEntered
                                                                ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs'
                                                                : 'bg-white border-stone-200 shadow-xs'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`font-sans font-bold text-sm ${!isConfirmed ? 'text-stone-500 line-through decoration-stone-400' : 'text-[#70531c]'}`}>
                                                                {guest.full_name}
                                                            </span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-sans">
                                                                {guest.type === 'child' ? 'Niño/a' : 'Adulto'}
                                                            </span>

                                                            {/* Insignia de Confirmación RSVP */}
                                                            {isConfirmed ? (
                                                                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-sans">
                                                                    ✓ Confirmó
                                                                </span>
                                                            ) : guest.is_attending === false ? (
                                                                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium font-sans flex items-center gap-1">
                                                                    <UserX className="w-3 h-3" /> Declinó (No asistirá)
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium font-sans flex items-center gap-1">
                                                                    ⏳ Sin confirmar
                                                                </span>
                                                            )}

                                                            {/* Código único de pase */}
                                                            {guest.checkin_code && (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-stone-100 text-[#28362e] border border-stone-200 font-bold tracking-wider">
                                                                    🎫 {guest.checkin_code}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Alergias o notas especiales */}
                                                        {(guest.allergies || guest.special_notes) && (
                                                            <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium mt-1">
                                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                                <span>
                                                                    {guest.allergies && `Alergia: ${guest.allergies}`}
                                                                    {guest.allergies && guest.special_notes && ' • '}
                                                                    {guest.special_notes && `Nota: ${guest.special_notes}`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Botón táctil por invitado */}
                                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                        {isConfirmed ? (
                                                            /* Invitado confirmado: Check-in directo */
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => handleToggleGuest(guest.id, guest.full_name)}
                                                                className={`cursor-pointer font-sans text-xs px-3.5 py-1.5 h-8 rounded-full transition-all ${
                                                                    hasEntered
                                                                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                                                                        : 'bg-[#698175] hover:bg-[#52665c] text-white shadow-xs'
                                                                }`}
                                                            >
                                                                {hasEntered ? (
                                                                    <>
                                                                        <Check className="w-3.5 h-3.5 mr-1" />
                                                                        Ingresó
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        + Marcar
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            /* Invitado NO confirmado: Bloqueado, requiere confirmación modal */
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setExceptionalGuest(guest)}
                                                                className={`cursor-pointer font-sans text-xs px-3 py-1.5 h-8 rounded-full transition-all ${
                                                                    hasEntered
                                                                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                                                        : 'bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-700 border-stone-200 hover:border-rose-300'
                                                                }`}
                                                            >
                                                                {hasEntered ? (
                                                                    <>
                                                                        <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700" />
                                                                        Excepción
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Lock className="w-3 h-3 mr-1" />
                                                                        Bloqueado
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ========================================================= */}
                                {/* GRAN BOTÓN DE SELLO DE BIENVENIDA (SOLO CONFIRMADOS)      */}
                                {/* ========================================================= */}
                                <div className="pt-2 border-t border-[#ded8cd] flex flex-col items-center">
                                    {activeStats.confirmedTotal === 0 ? (
                                        /* Ningún invitado de la familia confirmó */
                                        <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
                                            <div className="flex items-center justify-center gap-2 text-rose-800 font-sans font-bold text-sm">
                                                <UserX className="w-4 h-4" />
                                                NINGÚN INTEGRANTE DE ESTA FAMILIA CONFIRMÓ ASISTENCIA
                                            </div>
                                            <p className="text-xs text-rose-600 mt-1 font-sans">
                                                Todos los pases fueron declinados o quedaron sin respuesta. Si llegaron a la puerta, puedes autorizar excepciones de forma individual en cada nombre arriba.
                                            </p>
                                        </div>
                                    ) : !activeStats.allConfirmedEntered ? (
                                        /* Hay confirmados pendientes de ingresar */
                                        <div className="w-full space-y-2">
                                            <button
                                                type="button"
                                                disabled={isSealing}
                                                onClick={() => handleToggleFullInvitation(activeInvitation.id, true)}
                                                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#698175] via-[#597366] to-[#698175] hover:from-[#52665c] hover:to-[#52665c] active:scale-[0.99] text-white font-sans text-sm sm:text-base font-semibold tracking-wide shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer group"
                                            >
                                                <Sparkles className="w-5 h-5 text-amber-200 group-hover:rotate-12 transition-transform" />
                                                <span>
                                                    {isSealing ? 'Sellando pase...' : `¡Bienvenidos! Marcar Entrada (${activeStats.confirmedTotal} confirmados)`}
                                                </span>
                                                <ShieldCheck className="w-5 h-5 text-amber-200" />
                                            </button>

                                            {activeStats.declinedTotal > 0 && (
                                                <p className="text-center text-[11px] text-stone-500 font-sans">
                                                    * Solo se marcará acceso a los <strong>{activeStats.confirmedTotal} confirmados</strong>. Las {activeStats.declinedTotal} personas que no confirmaron permanecerán bloqueadas.
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        /* Todos los confirmados ya ingresaron */
                                        <div className="w-full bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-sans font-bold text-emerald-900 text-base">
                                                        Acceso Concedido • {activeStats.confirmedTotal} confirmados en el salón
                                                    </h4>
                                                    <p className="text-xs text-emerald-700 font-sans">
                                                        Los integrantes con asistencia confirmada han sido recibidos en el evento.
                                                        {activeStats.declinedTotal > 0 && ` (${activeStats.declinedTotal} no confirmaron y no tienen acceso automático).`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Opción de revertir */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggleFullInvitation(activeInvitation.id, false)}
                                                className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-sans text-xs rounded-xl cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                                Revertir entrada
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
                                <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                <h3 className="font-sans text-lg font-bold text-stone-700">
                                    Selecciona una invitación
                                </h3>
                                <p className="text-xs text-stone-500 font-sans mt-1">
                                    Utiliza el buscador superior para encontrar al invitado por nombre o apellido.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredInvitations.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
                            <p className="text-stone-500 text-sm font-sans">
                                No se encontraron invitados con esa búsqueda.
                            </p>
                        </div>
                    ) : (
                        filteredInvitations.map((inv) => {
                            const confirmedGuests = inv.guests.filter(g => g.is_attending === true);
                            const isAllConfirmedIn = confirmedGuests.length > 0 && confirmedGuests.every(g => g.has_entered);
                            const tableName = inv.guests.find(g => g.table_name)?.table_name;

                            return (
                                <div 
                                    key={inv.id} 
                                    className={`p-4 rounded-xl border shadow-sm transition-colors ${
                                        isAllConfirmedIn 
                                            ? 'bg-emerald-50/60 border-emerald-200' 
                                            : 'bg-white border-stone-200'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-sans font-bold text-[#70531c] text-base">
                                                    {inv.name}
                                                </h4>
                                                {inv.category && (
                                                    <Badge variant="outline" className="text-[10px] border-stone-200">
                                                        {inv.category}
                                                    </Badge>
                                                )}
                                                {tableName && (
                                                    <span className="font-sans font-semibold text-xs text-[#84662d] bg-[#fbf8f0] px-2.5 py-0.5 rounded-full border border-[#cfbe95]">
                                                        🍽️ {tableName}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-stone-500">
                                                {confirmedGuests.length} de {inv.guests.length} confirmados
                                            </span>
                                        </div>

                                        {/* Botón de acción masiva en la fila (solo confirmados) */}
                                        <div className="flex items-center gap-2">
                                            {confirmedGuests.length > 0 ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => handleToggleFullInvitation(inv.id, !isAllConfirmedIn)}
                                                    className={`cursor-pointer font-sans text-xs rounded-full ${
                                                        isAllConfirmedIn
                                                            ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                                                            : 'bg-[#698175] hover:bg-[#52665c] text-white'
                                                    }`}
                                                >
                                                    {isAllConfirmedIn ? 'Revertir acceso' : `Dar acceso a confirmados (${confirmedGuests.length})`}
                                                </Button>
                                            ) : (
                                                <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-[10px]">
                                                    Sin confirmaciones
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lista de integrantes dentro de la tarjeta */}
                                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {inv.guests.map((guest) => {
                                            const isConfirmed = guest.is_attending === true;
                                            const hasEntered = !!guest.has_entered;

                                            return (
                                                <div 
                                                    key={guest.id}
                                                    onClick={() => {
                                                        if (isConfirmed) {
                                                            handleToggleGuest(guest.id, guest.full_name);
                                                        } else {
                                                            setExceptionalGuest(guest);
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                                        !isConfirmed
                                                            ? 'bg-stone-50 border-dashed border-stone-300 text-stone-400'
                                                            : hasEntered
                                                                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-medium'
                                                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                                    }`}
                                                >
                                                    <span className={`truncate font-medium ${!isConfirmed ? 'line-through text-stone-400' : hasEntered ? 'text-emerald-900 font-semibold' : 'text-[#70531c]'}`}>
                                                        {guest.full_name}
                                                    </span>
                                                    <span className="text-[10px] shrink-0 font-sans">
                                                        {!isConfirmed ? (
                                                            hasEntered ? '⚠️ Excepción' : '🔒 Bloqueado'
                                                        ) : (
                                                            hasEntered ? '✓ Entró' : '+ Marcar'
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* 5. FEED INFERIOR: ÚLTIMAS LLEGADAS EN VIVO                */}
            {/* ========================================================= */}
            {recentArrivals.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm mt-8">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-[#947029]" />
                            <h4 className="font-sans font-bold text-[#70531c] text-sm">
                                Recién llegados al evento ({recentArrivals.length})
                            </h4>
                        </div>
                        <span className="text-[11px] text-stone-400 font-sans">
                            Actualizado en tiempo real
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                        {recentArrivals.map((inv) => {
                            const tableName = inv.guests.find(g => g.table_name)?.table_name;
                            return (
                                <button
                                    key={inv.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedInvitationId(inv.id);
                                        setViewMode('concierge');
                                    }}
                                    className="px-3 py-2 rounded-xl border border-[#cfbe95] bg-[#faf8f4] hover:bg-[#f3ede0] shrink-0 text-left transition-all cursor-pointer flex items-center gap-2.5 shadow-xs"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#d4af37] to-[#8a6721] text-white flex items-center justify-center font-sans text-xs font-bold shrink-0">
                                        ✓
                                    </div>
                                    <div>
                                        <span className="text-xs font-sans font-bold text-[#70531c] block truncate max-w-[130px]">
                                            {inv.name}
                                        </span>
                                        <span className="text-[10px] text-stone-500 font-sans block">
                                            {tableName ? `Mesa: ${tableName}` : `${inv.guests.length} pases`}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 6. MODAL DE CONFIRMACIÓN: INGRESO EXCEPCIONAL             */}
            {/* ========================================================= */}
            <Dialog open={!!exceptionalGuest} onOpenChange={(open) => !open && setExceptionalGuest(null)}>
                <DialogContent className="max-w-md bg-white rounded-2xl p-6">
                    <DialogHeader className="text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <DialogTitle className="font-sans text-xl font-bold text-stone-900">
                            Ingreso Excepcional Requerido
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
                            El invitado <strong className="text-stone-900">{exceptionalGuest?.full_name}</strong>{' '}
                            {exceptionalGuest?.is_attending === false ? (
                                <span className="text-rose-600 font-medium">declinó su asistencia (indicó que no asistiría)</span>
                            ) : (
                                <span className="text-amber-700 font-medium">no confirmó asistencia en la invitación digital</span>
                            )}.
                            <br /><br />
                            Por seguridad del evento, este invitado <strong>no tiene lugar asignado en el banquete</strong>.
                            ¿Deseas autorizar su ingreso a la recepción como una excepción?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setExceptionalGuest(null)}
                            className="font-sans text-stone-600 cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            onClick={() => {
                                if (exceptionalGuest) {
                                    handleToggleGuest(exceptionalGuest.id, exceptionalGuest.full_name);
                                    setExceptionalGuest(null);
                                    toast.warning(`Ingreso excepcional concedido a ${exceptionalGuest.full_name}`, {
                                        description: 'Recuerda avisar al capitán de meseros para agregar su servicio a la mesa.'
                                    });
                                }
                            }}
                            className="bg-amber-700 hover:bg-amber-800 text-white font-sans text-xs uppercase tracking-wider font-semibold cursor-pointer shadow"
                        >
                            <ShieldCheck className="w-4 h-4 mr-1.5" />
                            Autorizar Ingreso Excepcional
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* 7. MODAL: ESCÁNER DE CÁMARA QR EN VIVO                    */}
            {/* ========================================================= */}
            <Dialog open={isScannerOpen} onOpenChange={(open) => !open && setIsScannerOpen(false)}>
                <DialogContent className="max-w-md bg-stone-900 border-stone-800 text-white rounded-3xl p-6">
                    <DialogHeader className="text-center">
                        <div className="w-12 h-12 rounded-full bg-[#698175] text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                            <Camera className="w-6 h-6" />
                        </div>
                        <DialogTitle className="font-sans text-xl font-bold text-white">
                            Escáner de Pases de Gala
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-300 mt-1">
                            Apunta la cámara del smartphone o tablet hacia el código QR del boleto del invitado.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Viewport de la cámara */}
                    <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-[#698175]/50 my-2 flex items-center justify-center shadow-inner">
                        <div id="qr-camera-viewport" className="w-full h-full object-cover" />
                        {/* Animación del visor */}
                        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#698175] to-transparent animate-pulse pointer-events-none" />
                    </div>

                    <DialogFooter className="flex justify-center mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsScannerOpen(false)}
                            className="bg-white/10 hover:bg-white/20 text-stone-200 border-white/20 font-sans text-xs px-6 py-2 rounded-xl cursor-pointer"
                        >
                            Cerrar Escáner
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* 8. MODAL: RESULTADO DE VALIDACIÓN DEL PASE                */}
            {/* ========================================================= */}
            <Dialog open={!!scanResult} onOpenChange={(open) => !open && setScanResult(null)}>
                <DialogContent className="max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-[#ded8cd]">
                    {scanResult?.status === 'success' && (
                        <div className="text-center space-y-4 py-2 animate-fadeIn">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                                <span className="font-sans text-[11px] tracking-[0.25em] text-[#698175] uppercase font-bold block mb-1">
                                    PASE VÁLIDO • ACCESO AUTORIZADO
                                </span>
                                <h2 className="font-sans font-extrabold text-stone-900 text-2xl leading-tight">
                                    {scanResult.guest?.full_name}
                                </h2>
                                {scanResult.invitation?.name && (
                                    <p className="text-xs text-stone-500 font-sans mt-1">
                                        Familia: {scanResult.invitation.name}
                                    </p>
                                )}
                            </div>

                            {/* Mesa Asignada destacada */}
                            <div className="bg-[#f7faf8] rounded-2xl border-2 border-emerald-300 p-4 flex items-center justify-center gap-3">
                                <UtensilsCrossed className="w-6 h-6 text-[#698175]" />
                                <div className="text-left">
                                    <span className="text-[10px] uppercase font-sans tracking-widest text-stone-400 block font-semibold">
                                        MESA ASIGNADA
                                    </span>
                                    <span className="font-sans text-2xl font-black text-[#28362e]">
                                        {scanResult.guest?.table_name || 'Sin mesa asignada'}
                                    </span>
                                </div>
                            </div>

                            {scanResult.guest?.allergies && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-800 text-left flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                                    <span>Alergia registrada: <strong>{scanResult.guest.allergies}</strong></span>
                                </div>
                            )}

                            <Button
                                type="button"
                                autoFocus
                                onClick={() => setScanResult(null)}
                                className="w-full py-3 bg-[#698175] hover:bg-[#52665c] text-white font-sans text-sm font-bold uppercase tracking-widest rounded-xl shadow-md cursor-pointer mt-2"
                            >
                                Continuar (Enter)
                            </Button>
                        </div>
                    )}

                    {scanResult?.status === 'already_entered' && (
                        <div className="text-center space-y-4 py-2 animate-fadeIn">
                            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-md">
                                <AlertTriangle className="w-9 h-9" />
                            </div>
                            <div>
                                <span className="font-sans text-[11px] tracking-[0.25em] text-amber-800 uppercase font-bold block mb-1">
                                    PASE YA REGISTRADO PREVIAMENTE
                                </span>
                                <h2 className="font-sans font-bold text-stone-900 text-xl leading-tight">
                                    {scanResult.guest?.full_name}
                                </h2>
                                <p className="text-xs text-stone-600 font-sans mt-2">
                                    {scanResult.message}
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 text-center">
                                Mesa asignada: <strong>{scanResult.guest?.table_name || 'Por asignar'}</strong>
                            </div>

                            <Button
                                type="button"
                                autoFocus
                                onClick={() => setScanResult(null)}
                                className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl shadow cursor-pointer"
                            >
                                Entendido
                            </Button>
                        </div>
                    )}

                    {scanResult?.status === 'not_confirmed' && (
                        <div className="text-center space-y-4 py-2 animate-fadeIn">
                            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center mx-auto shadow-md">
                                <UserX className="w-9 h-9" />
                            </div>
                            <div>
                                <span className="font-sans text-[11px] tracking-[0.25em] text-rose-800 uppercase font-bold block mb-1">
                                    SIN ASISTENCIA CONFIRMADA
                                </span>
                                <h2 className="font-sans font-bold text-stone-900 text-xl leading-tight">
                                    {scanResult.guest?.full_name}
                                </h2>
                                <p className="text-xs text-stone-600 font-sans mt-2">
                                    {scanResult.message}
                                </p>
                            </div>

                            <div className="flex gap-2 justify-end mt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setScanResult(null)}
                                    className="font-sans text-xs text-stone-600 cursor-pointer"
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (scanResult.guest) {
                                            handleToggleGuest(scanResult.guest.id, scanResult.guest.full_name);
                                            setScanResult(null);
                                            toast.warning(`Ingreso excepcional concedido a ${scanResult.guest.full_name}`);
                                        }
                                    }}
                                    className="bg-amber-700 hover:bg-amber-800 text-white font-sans text-xs uppercase tracking-wider font-semibold cursor-pointer shadow"
                                >
                                    Autorizar Ingreso
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

CheckInManager.layout = {
    breadcrumbs: [
        { title: 'Control de Acceso', href: '/admin/checkin' }
    ],
};
