import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Plus, 
    Users, 
    Phone, 
    MessageCircle, 
    Send, 
    X, 
    Trash2, 
    Edit, 
    Sparkles, 
    Clock, 
    Utensils, 
    AlertCircle,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    UtensilsCrossed,
    Search,
    LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BanquetSeatingView from './Partials/BanquetSeatingView';

interface TableGuest {
    id: number;
    table_id: number;
    full_name: string;
    type: string;
    checkin_code?: string;
}

interface TableItem {
    id: number;
    wedding_id: number;
    name: string;
    capacity: number;
    notes?: string;
    guests_count: number;
    guests?: TableGuest[];
}

interface InvitationManagerProps {
    wedding: any;
    invitations: any[];
    tables?: TableItem[];
    initialTab?: string;
}

export default function InvitationManager({ wedding, invitations, tables = [], initialTab = 'invitations' }: InvitationManagerProps) {
    const { auth } = usePage().props as any;
    const isPlanner = auth?.user?.role === 'wedding_planner';

    // Pestaña activa (invitaciones o mesas)
    const [activeTab, setActiveTab] = useState<'invitations' | 'tables'>(
        initialTab === 'tables' ? 'tables' : 'invitations'
    );
    const [tableSearch, setTableSearch] = useState('');

    // Estado para nueva invitación
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        phone: string;
        category: string;
        rsvp_deadline: string;
        table_id: string;
        guests: Array<{ full_name: string; type: string; table_id?: string }>;
    }>({ 
        name: '', 
        phone: '', 
        category: '', 
        rsvp_deadline: '', 
        table_id: '',
        guests: [{ full_name: '', type: 'adult', table_id: '' }] 
    });

    // Estado para editar invitación completa (rol novios y admin)
    const [editingInvitation, setEditingInvitation] = useState<any>(null);
    const [editFormData, setEditFormData] = useState<{
        name: string;
        phone: string;
        category: string;
        rsvp_deadline: string;
        table_id?: string;
        guests: Array<{
            id?: number;
            full_name: string;
            type: string;
            table_id?: string;
            checkin_code?: string;
            has_entered?: boolean;
            is_attending?: boolean | null;
        }>;
    }>({
        name: '',
        phone: '',
        category: '',
        rsvp_deadline: '',
        table_id: '',
        guests: []
    });
    const [editError, setEditError] = useState<string | null>(null);
    
    // Estado para asignación de mesa en integrante individual
    const [editGuest, setEditGuest] = useState<any>(null);
    const [guestFormData, setGuestFormData] = useState({ table_id: '', special_notes: '' });
    const [guestError, setGuestError] = useState<string | null>(null);

    // Estado para el modal de gestión de mesas
    const [showTableModal, setShowTableModal] = useState(false);
    const [newTableData, setNewTableData] = useState({ name: '', capacity: 10, notes: '' });
    const [tableSubmitting, setTableSubmitting] = useState(false);
    const [tableError, setTableError] = useState<string | null>(null);
    const [editingTableId, setEditingTableId] = useState<number | null>(null);
    const [editTableData, setEditTableData] = useState({ name: '', capacity: 10, notes: '' });

    // Estado para desplegar / contraer lista de integrantes
    const [expandedInvIds, setExpandedInvIds] = useState<number[]>([]);

    // Estado para botón de copiar texto
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Estado para eliminar invitación
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Reloj en vivo para ambiente de gala
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

    // Estadísticas rápidas de invitados
    const totalInvitations = invitations.length;
    const totalGuests = invitations.reduce((acc, inv) => acc + (inv.guests?.length || 0), 0);
    const confirmedGuests = invitations.reduce((acc, inv) => {
        return acc + (inv.guests?.filter((g: any) => g.is_attending === true).length || 0);
    }, 0);
    const percentConfirmed = totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0;

    // Estadísticas de mesas
    const totalTableCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);
    const totalAssignedGuests = tables.reduce((acc, t) => acc + (t.guests_count || 0), 0);
    const percentTablesFilled = totalTableCapacity > 0 ? Math.round((totalAssignedGuests / totalTableCapacity) * 100) : 0;

    // Invitados sin mesa asignada
    const unassignedGuests: Array<{ id: number; full_name: string; type: string; invitation_name: string }> = [];
    invitations.forEach(inv => {
        inv.guests?.forEach((g: any) => {
            if (!g.table_id && !g.table) {
                unassignedGuests.push({
                    id: g.id,
                    full_name: g.full_name,
                    type: g.type,
                    invitation_name: inv.name,
                });
            }
        });
    });

    // Filtro de mesas
    const filteredTables = tables.filter(t => {
        if (!tableSearch.trim()) return true;
        const q = tableSearch.toLowerCase();
        const inName = t.name.toLowerCase().includes(q);
        const inNotes = t.notes?.toLowerCase().includes(q) || false;
        const inGuests = t.guests?.some((g: any) => g.full_name.toLowerCase().includes(q)) || false;
        return inName || inNotes || inGuests;
    });

    // Asignación rápida de mesa a toda la familia
    const assignFamilyTable = (invitationId: number, tableId: string) => {
        router.put(`/admin/invitations/${invitationId}/assign-table`, {
            table_id: tableId === 'none' ? null : parseInt(tableId)
        }, {
            preserveScroll: true,
        });
    };

    // Asignación rápida de integrante individual a mesa
    const assignGuestTable = (guestId: number, tableId: string | null) => {
        router.put(`/admin/guests/${guestId}`, {
            table_id: tableId && tableId !== 'none' ? parseInt(tableId) : null
        }, {
            preserveScroll: true,
        });
    };

    // Toggle expandir / contraer integrantes
    const toggleExpand = (invId: number) => {
        setExpandedInvIds(prev => 
            prev.includes(invId) ? prev.filter(id => id !== invId) : [...prev, invId]
        );
    };

    const toggleExpandAll = () => {
        if (expandedInvIds.length === invitations.length) {
            setExpandedInvIds([]);
        } else {
            setExpandedInvIds(invitations.map(i => i.id));
        }
    };

    // Métodos para nueva invitación
    const addGuestField = () => {
        setFormData({ 
            ...formData, 
            guests: [...formData.guests, { full_name: '', type: 'adult', table_id: formData.table_id || '' }] 
        });
    };

    const removeGuestField = (index: number) => {
        const newGuests = formData.guests.filter((_, i) => i !== index);
        setFormData({ ...formData, guests: newGuests });
    };

    const handleGuestChange = (index: number, field: string, value: string) => {
        const newGuests: any[] = [...formData.guests];
        newGuests[index][field] = value;
        setFormData({ ...formData, guests: newGuests });
    };

    const handleFormTableChange = (tableId: string) => {
        const val = tableId === 'none' ? '' : tableId;
        setFormData({
            ...formData,
            table_id: val,
            guests: formData.guests.map(g => ({ ...g, table_id: val }))
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const defaultTableId = formData.table_id ? parseInt(formData.table_id) : null;
        const payload = {
            ...formData,
            guests: formData.guests.map(g => ({
                ...g,
                table_id: g.table_id ? parseInt(String(g.table_id)) : defaultTableId
            }))
        };

        router.post(`/admin/invitations`, payload, {
            onSuccess: () => {
                setShowModal(false);
                setFormData({ 
                    name: '', 
                    phone: '', 
                    category: '', 
                    rsvp_deadline: '', 
                    table_id: '',
                    guests: [{ full_name: '', type: 'adult', table_id: '' }] 
                });
            }
        });
    };

    // Métodos para editar invitación completa
    const openEditInvitation = (inv: any) => {
        setEditingInvitation(inv);
        const tableIds = inv.guests?.map((g: any) => g.table_id).filter(Boolean);
        const firstId = tableIds && tableIds.length > 0 ? tableIds[0] : null;
        const allSame = firstId && tableIds.length === inv.guests?.length && tableIds.every((id: any) => id === firstId);

        setEditFormData({
            name: inv.name || '',
            phone: inv.phone || '',
            category: inv.category || '',
            rsvp_deadline: inv.rsvp_deadline || '',
            table_id: allSame ? String(firstId) : '',
            guests: inv.guests ? inv.guests.map((g: any) => ({
                id: g.id,
                full_name: g.full_name,
                type: g.type || 'adult',
                table_id: g.table_id ? String(g.table_id) : '',
                checkin_code: g.checkin_code,
                has_entered: g.has_entered,
                is_attending: g.is_attending,
            })) : [{ full_name: '', type: 'adult', table_id: '' }]
        });
        setEditError(null);
    };

    const handleEditFormTableChange = (tableId: string) => {
        const val = tableId === 'none' ? '' : tableId;
        setEditFormData({
            ...editFormData,
            table_id: val,
            guests: editFormData.guests.map(g => ({ ...g, table_id: val }))
        });
    };

    const addEditGuestField = () => {
        setEditFormData({
            ...editFormData,
            guests: [...editFormData.guests, { full_name: '', type: 'adult', table_id: editFormData.table_id || '' }]
        });
    };

    const removeEditGuestField = (index: number) => {
        const target = editFormData.guests[index];
        if (target?.has_entered) {
            alert('No se puede retirar a un integrante que ya ingresó al evento.');
            return;
        }
        setEditFormData({
            ...editFormData,
            guests: editFormData.guests.filter((_, i) => i !== index)
        });
    };

    const handleEditGuestChange = (index: number, field: string, value: string) => {
        const updated = [...editFormData.guests];
        (updated[index] as any)[field] = value;
        setEditFormData({ ...editFormData, guests: updated });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInvitation) return;
        setEditError(null);

        const payload = {
            ...editFormData,
            guests: editFormData.guests.map(g => ({
                ...g,
                table_id: g.table_id ? parseInt(String(g.table_id)) : null
            }))
        };

        router.put(`/admin/invitations/${editingInvitation.id}`, payload, {
            onSuccess: () => {
                setEditingInvitation(null);
            },
            onError: (err: any) => {
                if (err?.name) setEditError(err.name);
                else if (err?.guests) setEditError('Revisa los nombres de los integrantes.');
                else setEditError('Error al guardar los cambios de la invitación.');
            }
        });
    };

    // Manejo de eliminación protegida
    const invToDelete = invitations.find(i => i.id === deleteConfirmId);
    const isProtectedFromDelete = Boolean(
        invToDelete && (
            invToDelete.status === 'responded' || 
            invToDelete.guests?.some((g: any) => g.has_entered || g.is_attending !== null)
        )
    );

    const handleDelete = () => {
        if (!deleteConfirmId) return;
        router.delete(`/admin/invitations/${deleteConfirmId}`, {
            onFinish: () => setDeleteConfirmId(null),
            onError: (errors: any) => {
                if (errors?.invitation) {
                    alert(errors.invitation);
                }
            }
        });
    };

    // Métodos para asignación de mesa en integrante individual
    const openEditGuest = (guest: any) => {
        setEditGuest(guest);
        setGuestFormData({ 
            table_id: guest.table_id ? String(guest.table_id) : '', 
            special_notes: guest.special_notes || '' 
        });
        setGuestError(null);
    };

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editGuest) return;
        setGuestError(null);

        router.put(`/admin/guests/${editGuest.id}`, {
            table_id: guestFormData.table_id ? parseInt(guestFormData.table_id) : null,
            special_notes: guestFormData.special_notes || null,
        }, {
            onSuccess: () => {
                setEditGuest(null);
            },
            onError: (err: any) => {
                if (err?.table_id) {
                    setGuestError(err.table_id);
                } else {
                    setGuestError('No se pudo guardar la asignación. Revisa los datos.');
                }
            }
        });
    };

    // Métodos para gestión de mesas (CRUD)
    const handleCreateTable = (e: React.FormEvent) => {
        e.preventDefault();
        setTableSubmitting(true);
        setTableError(null);

        router.post('/admin/tables', newTableData, {
            onSuccess: () => {
                setNewTableData({ name: '', capacity: 10, notes: '' });
                setTableSubmitting(false);
            },
            onError: (err: any) => {
                setTableSubmitting(false);
                if (err?.name) setTableError(err.name);
                else if (err?.capacity) setTableError(err.capacity);
                else setTableError('Error al crear la mesa.');
            }
        });
    };

    const startEditTable = (table: TableItem) => {
        setEditingTableId(table.id);
        setEditTableData({
            name: table.name,
            capacity: table.capacity,
            notes: table.notes || '',
        });
        setTableError(null);
    };

    const handleUpdateTable = (tableId: number) => {
        setTableSubmitting(true);
        setTableError(null);

        router.put(`/admin/tables/${tableId}`, editTableData, {
            onSuccess: () => {
                setEditingTableId(null);
                setTableSubmitting(false);
            },
            onError: (err: any) => {
                setTableSubmitting(false);
                if (err?.capacity) setTableError(err.capacity);
                else if (err?.name) setTableError(err.name);
                else setTableError('Error al actualizar la mesa.');
            }
        });
    };

    const handleDeleteTable = (tableId: number) => {
        if (!confirm('¿Deseas eliminar esta mesa? Los invitados asignados a ella quedarán sin mesa asignada.')) return;
        router.delete(`/admin/tables/${tableId}`, {
            onError: () => setTableError('Error al eliminar la mesa.')
        });
    };

    // Generador de texto para WhatsApp
    const generateWaMessageText = (invitation: any) => {
        const url = `${window.location.origin}/public/rsvp/${invitation.token}`;
        const guestCount = invitation.guests?.length || 0;
        const passText = guestCount === 1 ? '1 pase' : `${guestCount} pases`;

        return `¡Hola *${invitation.name}*! \u{1F44B}\n\nNos casamos y nos haría muy felices contar con su presencia en este día tan especial para nosotros.\n\nHemos reservado *${passText}* en su honor \u{1F3AB}.\n\nPor favor, hagan clic en el siguiente enlace para ver nuestra invitación digital, conocer todos los detalles del evento y confirmar su asistencia:\n\u{1F449} ${url}\n\n¡Los esperamos! \u{1F942}`;
    };

    const generateWaLink = (invitation: any) => {
        const text = generateWaMessageText(invitation);
        return `https://api.whatsapp.com/send?phone=${invitation.phone}&text=${encodeURIComponent(text)}`;
    };

    const handleCopyWaMessage = (invitation: any) => {
        const text = generateWaMessageText(invitation);
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedId(invitation.id);
                setTimeout(() => setCopiedId(null), 2500);
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedId(invitation.id);
            setTimeout(() => setCopiedId(null), 2500);
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'responded':
                return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Respondido</Badge>;
            case 'viewed':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Visto</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Pendiente</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 py-6 w-full">
            <Head title={`Invitaciones - ${wedding.bride_name} & ${wedding.groom_name}`} />
            
            {/* ========================================================= */}
            {/* 1. HERO HEADER: AMBIENTE DE GESTIÓN Y MÉTRICAS EN VIVO    */}
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
                            {isPlanner ? 'Modo Wedding Planner (Lectura)' : 'Protocolo & Recepción'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#f4ecd8] bg-[#16271e]/75 backdrop-blur-sm px-3 py-1 rounded-full border border-[#cfbe95]/40 shadow-xs font-semibold">
                            <Clock className="w-3 h-3 text-[#cfbe95]" />
                            <span>{currentTime || 'Lista de Invitados'}</span>
                        </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#fcf8ed]">
                        Lista de Invitados • Control de Asistencia
                    </h1>
                    <p className="text-xs sm:text-sm text-[#dfd4c0] font-sans font-medium max-w-xl">
                        {wedding ? `${wedding.bride_name} & ${wedding.groom_name} — ` : ''}Administra las familias, asignación de mesas y confirmaciones RSVP de su evento.
                    </p>
                </div>

                {/* Métricas y Acciones Rápidas */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end z-10">
                    {/* Tarjeta de Métricas */}
                    <div className="bg-[#16271e]/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#cfbe95]/30 shadow-md flex flex-col items-end min-w-[150px]">
                        <span className="text-[10.5px] uppercase font-sans font-semibold tracking-wider text-[#cfbe95]">
                            Afluencia Confirmada
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-2xl font-bold font-sans text-[#fcf8ed]">
                                {confirmedGuests}
                            </span>
                            <span className="text-xs text-[#cfbe95]/85 font-sans font-medium">
                                / {totalGuests} pases
                            </span>
                        </div>
                        <div className="w-full bg-[#0f1c15] h-1.5 rounded-full mt-1.5 overflow-hidden border border-[#cfbe95]/20">
                            <div 
                                className="bg-gradient-to-r from-[#d4af37] via-[#e5cf97] to-[#d4af37] h-full transition-all duration-500 rounded-full"
                                style={{ width: `${percentConfirmed}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-[#e8d5aa] font-bold mt-1">
                            {totalInvitations} familias • {percentConfirmed}% confirmado
                        </span>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Botón Gestionar Mesas */}
                        <Button 
                            variant="outline"
                            onClick={() => setShowTableModal(true)} 
                            className="bg-white/10 hover:bg-white/15 text-[#fcf8ee] border border-[#cfbe95]/60 font-sans font-semibold text-xs uppercase tracking-wider px-3.5 py-2.5 h-11 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                        >
                            <Utensils className="w-4 h-4 text-[#cfbe95]" /> 
                            Gestionar Mesas
                            <span className="bg-[#cfbe95] text-[#1b2b22] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {tables.length}
                            </span>
                        </Button>

                        <Button 
                            variant="outline" 
                            asChild 
                            className="bg-white/5 hover:bg-white/10 text-[#fcf8ee] border border-white/25 font-sans font-semibold text-xs uppercase tracking-wider px-3.5 py-2.5 h-11 rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                            <a href="/admin/invitations/export">
                                <Send className="w-4 h-4 mr-1.5 text-[#cfbe95]" /> 
                                Exportar CSV
                            </a>
                        </Button>

                        {!isPlanner && (
                            <Button 
                                onClick={() => setShowModal(true)} 
                                className="bg-[#fcf8ee] hover:bg-[#f3ebd9] text-[#24352a] font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 h-11 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 border border-[#e6dbc5]"
                            >
                                <Plus className="w-4 h-4 text-[#24352a]" />
                                Nueva Invitación
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* ========================================================= */}
            {/* NAVEGACIÓN DE PESTAÑAS: [INVITADOS] | [MESAS DEL BANQUETE]*/}
            {/* ========================================================= */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ded8cd] dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('invitations');
                            window.history.replaceState(null, '', '/admin/invitations');
                        }}
                        className={`px-4 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                            activeTab === 'invitations'
                                ? 'bg-[#2c4537] text-[#fcf8ed] border border-[#2c4537]'
                                : 'bg-[#faf8f3] dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-[#ded8cd] hover:border-[#cfbe95]'
                        }`}
                    >
                        <Users className="w-4 h-4 text-[#cfbe95]" />
                        <span>Lista de Invitados</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === 'invitations' ? 'bg-[#cfbe95] text-[#2c4537]' : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}>
                            {totalInvitations} familias • {totalGuests} pases
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('tables');
                            window.history.replaceState(null, '', '/admin/invitations?tab=tables');
                        }}
                        className={`px-4 py-2.5 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                            activeTab === 'tables'
                                ? 'bg-[#2c4537] text-[#fcf8ed] border border-[#2c4537]'
                                : 'bg-[#faf8f3] dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-[#ded8cd] hover:border-[#cfbe95]'
                        }`}
                    >
                        <UtensilsCrossed className="w-4 h-4 text-[#cfbe95]" />
                        <span>Mesas del Banquete</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === 'tables' ? 'bg-[#cfbe95] text-[#2c4537]' : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}>
                            {tables.length} mesas ({totalAssignedGuests}/{totalTableCapacity} asignados)
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'tables' ? (
                        <Button
                            onClick={() => {
                                setEditingTableId(null);
                                setShowTableModal(true);
                            }}
                            className="bg-[#2c4537] hover:bg-[#385645] text-white text-xs font-bold uppercase tracking-wider h-10 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                            <Plus className="w-4 h-4 text-[#cfbe95]" />
                            Nueva Mesa
                        </Button>
                    ) : (
                        !isPlanner && (
                            <Button 
                                onClick={() => setShowModal(true)} 
                                className="bg-[#2c4537] hover:bg-[#385645] text-white text-xs font-bold uppercase tracking-wider h-10 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                                <Plus className="w-4 h-4 text-[#cfbe95]" />
                                Nueva Invitación
                            </Button>
                        )
                    )}
                </div>
            </div>

            {activeTab === 'invitations' ? (
                /* ========================================================= */
                /* 2. TABLA DE INVITADOS CON COLUMNAS UNIFICADAS Y DROPDOWN  */
                /* ========================================================= */
                <Card className="shadow-sm border-[#ded8cd] bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#f5f2eb]/75 dark:bg-muted/40 text-stone-600 dark:text-muted-foreground text-xs uppercase font-semibold border-b border-[#ded8cd]">
                            <tr>
                                <th className="px-5 py-4 font-semibold tracking-wider">Familia / Titular</th>
                                <th className="px-5 py-4 font-semibold tracking-wider">
                                    <div className="flex items-center justify-between gap-3">
                                        <span>Integrantes y Pases</span>
                                        {invitations.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={toggleExpandAll}
                                                className="text-[11px] font-normal normal-case text-stone-500 hover:text-[#2c4537] dark:hover:text-[#cfbe95] underline cursor-pointer"
                                            >
                                                {expandedInvIds.length === invitations.length ? 'Contraer todos' : 'Expandir todos'}
                                            </button>
                                        )}
                                    </div>
                                </th>
                                <th className="px-5 py-4 font-semibold tracking-wider">Mensaje a los Novios</th>
                                <th className="px-5 py-4 font-semibold tracking-wider">Estado RSVP</th>
                                <th className="px-5 py-4 font-semibold tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0ede6] dark:divide-border/40">
                            {invitations.map((inv: any) => {
                                const isExpanded = expandedInvIds.includes(inv.id);
                                const hasDependencies = Boolean(
                                    inv.status === 'responded' || 
                                    inv.guests?.some((g: any) => g.has_entered || g.is_attending !== null)
                                );

                                return (
                                    <tr key={inv.id} className="hover:bg-[#fbf9f4]/80 dark:hover:bg-muted/20 transition-colors group">
                                        {/* 1. FAMILIA / TITULAR */}
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex flex-col items-start gap-1 min-w-[170px] max-w-[220px]">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-sm text-[#70531c] dark:text-[#f4ecd8] leading-tight">
                                                        {inv.name}
                                                    </span>
                                                    {inv.category && (
                                                        <Badge variant="outline" className="text-[10px] h-5 border-[#cfbe95] text-[#84662d] bg-[#fbf8f0]">
                                                            {inv.category}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {inv.phone && (
                                                    <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 font-mono">
                                                        <Phone className="w-3 h-3 text-[#cfbe95]"/> {inv.phone}
                                                    </span>
                                                )}
                                                {inv.rsvp_deadline && (
                                                    <span className="text-[10.5px] text-stone-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-stone-400"/> Límite: {inv.rsvp_deadline}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* 2. INTEGRANTES Y PASES (UNIFICADO CON DESPLEGABLE) */}
                                        <td className="px-5 py-4 align-top">
                                            <div className="space-y-2 min-w-[260px] max-w-md">
                                                {/* Botón selector contraído / expandido */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(inv.id)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#faf8f3] dark:bg-stone-900 border border-[#dfd5c2] dark:border-stone-800 text-[#2c4537] dark:text-[#f4ecd8] hover:bg-[#f2eee3] hover:border-[#cfbe95] transition-all cursor-pointer shadow-xs group/btn"
                                                >
                                                    <Users className="w-3.5 h-3.5 text-[#cfbe95]" />
                                                    <span>
                                                        {inv.guests?.length || 0} {inv.guests?.length === 1 ? 'pase' : 'pases'}
                                                    </span>
                                                    <span className="text-[10px] text-stone-400 group-hover/btn:text-stone-600 font-normal">
                                                        {isExpanded ? '(Ocultar lista)' : '(Ver integrantes)'}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-3.5 h-3.5 text-stone-400 group-hover/btn:text-[#2c4537]" />
                                                    ) : (
                                                        <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover/btn:text-[#2c4537]" />
                                                    )}
                                                </button>

                                                {/* Selector rápido de mesa para la familia completa */}
                                                {!isPlanner && (
                                                    <div className="flex items-center gap-1.5 pt-0.5">
                                                        <UtensilsCrossed className="w-3 h-3 text-[#cfbe95] shrink-0" />
                                                        <Select
                                                            value={(() => {
                                                                const tableIds = inv.guests?.map((g: any) => g.table_id).filter(Boolean);
                                                                if (tableIds && tableIds.length > 0 && tableIds.length === inv.guests?.length) {
                                                                    const firstId = tableIds[0];
                                                                    if (tableIds.every((id: any) => id === firstId)) return String(firstId);
                                                                }
                                                                return 'none';
                                                            })()}
                                                            onValueChange={(val) => assignFamilyTable(inv.id, val)}
                                                        >
                                                            <SelectTrigger className="h-6 text-[10.5px] px-2 py-0 bg-[#faf8f3] dark:bg-stone-900 border-dashed border-[#cfbe95]/80 hover:border-[#cfbe95] text-[#2c4537] dark:text-[#f4ecd8] w-auto max-w-[210px] cursor-pointer">
                                                                <SelectValue placeholder="Asignar mesa a la familia..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none" className="text-xs">
                                                                    🚫 Sin mesa familiar fija
                                                                </SelectItem>
                                                                {tables.map(t => {
                                                                    const occupied = t.guests_count || 0;
                                                                    const free = t.capacity - occupied;
                                                                    return (
                                                                        <SelectItem key={t.id} value={String(t.id)} className="text-xs cursor-pointer">
                                                                            🍽️ {t.name} ({occupied}/{t.capacity}) {free <= 0 ? '• [LLENA]' : ''}
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {/* Lista desplegable de los integrantes */}
                                                {isExpanded && (
                                                    <div className="space-y-1.5 pt-1">
                                                        {inv.guests && inv.guests.length > 0 ? (
                                                            inv.guests.map((g: any) => (
                                                                <div 
                                                                    key={g.id} 
                                                                    className="flex items-center justify-between gap-2.5 bg-white/90 dark:bg-stone-900/80 border border-[#e8dfcf] dark:border-stone-800 rounded-lg px-2.5 py-1.5 shadow-xs hover:border-[#cfbe95] transition-all group/guest"
                                                                >
                                                                    <div className="flex flex-col min-w-0">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                                                                                {g.full_name}
                                                                            </span>
                                                                            <span className="text-[10px] text-stone-500 font-normal">
                                                                                ({g.type === 'child' ? 'Niño' : 'Adulto'})
                                                                            </span>
                                                                            {g.checkin_code && (
                                                                                <span className="font-mono text-[9px] bg-[#fbf8f0] text-[#70531c] px-1.5 py-0.5 rounded border border-[#cfbe95]/80 font-bold tracking-wider">
                                                                                    🎫 {g.checkin_code}
                                                                                </span>
                                                                            )}
                                                                            {g.table ? (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#eef4f0] text-[#2c4537] border border-[#a8c5b2] px-2 py-0.5 rounded-md">
                                                                                    🍽️ {g.table.name}
                                                                                </span>
                                                                            ) : g.table_name ? (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#eef4f0] text-[#2c4537] border border-[#a8c5b2] px-2 py-0.5 rounded-md">
                                                                                    🍽️ {g.table_name}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[10px] text-stone-400 italic">
                                                                                    (Sin mesa)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {(g.allergies || g.special_notes) && (
                                                                            <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                                                                                {g.allergies && (
                                                                                    <span className="text-amber-700 font-medium">⚠️ {g.allergies}</span>
                                                                                )}
                                                                                {g.special_notes && (
                                                                                    <span className="text-[#385645] italic font-medium">📝 {g.special_notes}</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {!isPlanner && (
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            className="h-6 w-6 text-stone-400 hover:text-[#2c4537] hover:bg-[#f0ebe0] rounded-md shrink-0 cursor-pointer"
                                                                            title="Asignar mesa o notas"
                                                                            onClick={() => openEditGuest(g)}
                                                                        >
                                                                            <Edit className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-stone-400 italic">Sin integrantes</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* 3. MENSAJE PARA LOS NOVIOS (CHAMPAGNE DEDICATORIA) */}
                                        <td className="px-5 py-4 align-top">
                                            {inv.message_to_couple ? (
                                                <div className="bg-[#faf8f2] dark:bg-stone-900/60 border border-[#cfbe95]/60 dark:border-[#cfbe95]/30 rounded-xl p-3 shadow-xs min-w-[200px] max-w-xs sm:max-w-sm">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-sans uppercase font-bold tracking-wider text-[#8f6d28] dark:text-[#dfc588] mb-1">
                                                        <Sparkles className="w-3 h-3 text-[#cfbe95]" />
                                                        Dedicatoria
                                                    </div>
                                                    <p className="text-xs text-stone-700 dark:text-stone-300 italic font-sans leading-relaxed">
                                                        “{inv.message_to_couple}”
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-stone-400 dark:text-stone-500 italic">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        {/* 4. ESTADO RSVP */}
                                        <td className="px-5 py-4 align-top whitespace-nowrap">
                                            {statusBadge(inv.status)}
                                        </td>

                                        {/* 5. ACCIONES */}
                                        <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                {/* Botón WhatsApp directo si tiene teléfono */}
                                                {inv.phone && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-8 border-emerald-300 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30 text-xs font-semibold cursor-pointer" 
                                                        asChild
                                                        title="Enviar directamente por WhatsApp"
                                                    >
                                                        <a href={generateWaLink(inv)} target="_blank" rel="noreferrer">
                                                            <MessageCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                            WhatsApp
                                                        </a>
                                                    </Button>
                                                )}

                                                {/* Botón Copiar Texto Formateado para WhatsApp */}
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleCopyWaMessage(inv)}
                                                    className={`h-8 text-xs font-semibold transition-all cursor-pointer ${
                                                        copiedId === inv.id 
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-300' 
                                                            : 'border-[#dfd5c2] text-stone-700 hover:bg-[#f5f2eb] hover:text-[#2c4537] dark:border-stone-700 dark:text-stone-300'
                                                    }`}
                                                    title="Copiar mensaje con enlace para pegar en WhatsApp u otra red social"
                                                >
                                                    {copiedId === inv.id ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                            ¡Copiado!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5 mr-1 text-[#8f6d28]" />
                                                            Copiar Texto
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Botón Editar Invitación (para novios y admin) */}
                                                {!isPlanner && (
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 text-stone-600 hover:text-[#2c4537] hover:bg-[#f0ebe0] dark:hover:bg-stone-800 cursor-pointer" 
                                                        onClick={() => openEditInvitation(inv)}
                                                        title="Editar datos e integrantes de la invitación"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}

                                                {/* Botón Eliminar Invitación (con aviso de protección si tiene dependencias) */}
                                                {!isPlanner && (
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className={`h-8 w-8 cursor-pointer ${
                                                            hasDependencies 
                                                                ? 'text-stone-300 hover:text-stone-500 hover:bg-stone-100 dark:text-stone-600' 
                                                                : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                                        }`} 
                                                        onClick={() => setDeleteConfirmId(inv.id)}
                                                        title={hasDependencies ? "Invitación protegida (con confirmación o check-in activo)" : "Eliminar invitación"}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {invitations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="bg-[#f5f2eb] dark:bg-stone-800 p-4 rounded-full mb-4">
                                                <Users className="w-8 h-8 opacity-50 text-[#cfbe95]" />
                                            </div>
                                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Sin invitados todavía</p>
                                            <p className="text-sm mb-4">Agrega tu primera invitación para empezar.</p>
                                            {!isPlanner && (
                                                <Button onClick={() => setShowModal(true)} variant="outline" className="cursor-pointer">
                                                    Crear primera invitación
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
            ) : (
                <BanquetSeatingView
                    tables={tables}
                    unassignedGuests={unassignedGuests}
                    tableSearch={tableSearch}
                    setTableSearch={setTableSearch}
                    totalTableCapacity={totalTableCapacity}
                    totalAssignedGuests={totalAssignedGuests}
                    percentTablesFilled={percentTablesFilled}
                    assignGuestTable={assignGuestTable}
                    startEditTable={startEditTable}
                    handleDeleteTable={handleDeleteTable}
                    openCreateTable={() => {
                        setEditingTableId(null);
                        setShowTableModal(true);
                    }}
                />
            )}

            {/* ========================================================= */}
            {/* 3. MODAL: GESTIÓN DE MESAS Y CAPACIDADES                  */}
            {/* ========================================================= */}
            <Dialog open={showTableModal} onOpenChange={setShowTableModal}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans text-[#2c4537] dark:text-[#f4ecd8]">
                            <Utensils className="w-5 h-5 text-[#cfbe95]" />
                            Distribución y Gestión de Mesas
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-500 font-sans">
                            Define las mesas disponibles para el evento y su capacidad máxima de comensales.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Barra de métricas de mesas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#fbf9f4] dark:bg-stone-900/80 p-3.5 rounded-xl border border-[#ded8cd]">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-sans uppercase font-bold text-stone-400">Mesas</span>
                            <span className="text-lg font-bold font-sans text-stone-800 dark:text-stone-200">{tables.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-sans uppercase font-bold text-stone-400">Capacidad Total</span>
                            <span className="text-lg font-bold font-sans text-stone-800 dark:text-stone-200">{totalTableCapacity} lugares</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-sans uppercase font-bold text-stone-400">Asignados</span>
                            <span className="text-lg font-bold font-sans text-[#2c4537] dark:text-[#a8c5b2]">{totalAssignedGuests} lugares</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-sans uppercase font-bold text-stone-400">Disponibles</span>
                            <span className="text-lg font-bold font-sans text-[#8f6d28]">{Math.max(0, totalTableCapacity - totalAssignedGuests)} lugares</span>
                        </div>
                    </div>

                    {/* Alerta de error si aplica */}
                    {tableError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{tableError}</span>
                        </div>
                    )}

                    {/* Formulario de Creación / Edición */}
                    <div className="bg-white dark:bg-stone-900 border border-[#ded8cd] rounded-xl p-4 shadow-xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2c4537] dark:text-[#dfc588] mb-3 flex items-center justify-between">
                            <span>{editingTableId ? '✏️ Editar Mesa' : '➕ Crear Nueva Mesa'}</span>
                            {editingTableId && (
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                                    onClick={() => {
                                        setEditingTableId(null);
                                        setTableError(null);
                                    }}
                                >
                                    Cancelar Edición
                                </Button>
                            )}
                        </h4>

                        {editingTableId ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleUpdateTable(editingTableId); }} className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2 space-y-1">
                                        <Label className="text-xs">Nombre de la Mesa *</Label>
                                        <Input 
                                            value={editTableData.name} 
                                            onChange={e => setEditTableData({ ...editTableData, name: e.target.value })} 
                                            required 
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Capacidad (Lugares) *</Label>
                                        <Input 
                                            type="number" 
                                            min={1} 
                                            max={100} 
                                            value={editTableData.capacity} 
                                            onChange={e => setEditTableData({ ...editTableData, capacity: parseInt(e.target.value) || 1 })} 
                                            required 
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Notas (Opcional)</Label>
                                    <Input 
                                        placeholder="Ej. Cerca de la pista, junto a los novios, terraza..."
                                        value={editTableData.notes} 
                                        onChange={e => setEditTableData({ ...editTableData, notes: e.target.value })} 
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            setEditingTableId(null);
                                            setTableError(null);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        size="sm" 
                                        disabled={tableSubmitting}
                                        className="bg-[#2c4537] hover:bg-[#385645] text-white cursor-pointer"
                                    >
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateTable} className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2 space-y-1">
                                        <Label className="text-xs">Nombre de la Mesa *</Label>
                                        <Input 
                                            placeholder="Ej. Mesa 1, Mesa de Honor, Mesa Familia Pérez..."
                                            value={newTableData.name} 
                                            onChange={e => setNewTableData({ ...newTableData, name: e.target.value })} 
                                            required 
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Capacidad Máx. *</Label>
                                        <Input 
                                            type="number" 
                                            min={1} 
                                            max={100} 
                                            value={newTableData.capacity} 
                                            onChange={e => setNewTableData({ ...newTableData, capacity: parseInt(e.target.value) || 1 })} 
                                            required 
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Notas (Opcional)</Label>
                                    <Input 
                                        placeholder="Ej. Pista principal, terraza, mesa redonda..."
                                        value={newTableData.notes} 
                                        onChange={e => setNewTableData({ ...newTableData, notes: e.target.value })} 
                                        className="h-9"
                                    />
                                </div>
                                <div className="flex justify-end pt-1">
                                    <Button 
                                        type="submit" 
                                        size="sm" 
                                        disabled={tableSubmitting || !newTableData.name.trim()}
                                        className="bg-[#2c4537] hover:bg-[#385645] text-white cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        Crear Mesa
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Lista de Mesas Existentes */}
                    <div className="space-y-2 mt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                            <span>Mesas Registradas ({tables.length})</span>
                            <span className="text-[11px] font-normal lowercase">{percentTablesFilled}% ocupación global</span>
                        </h4>

                        {tables.length === 0 ? (
                            <div className="p-8 text-center text-stone-400 bg-[#fbf9f4] rounded-xl border border-dashed border-[#ded8cd]">
                                <Utensils className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#cfbe95]" />
                                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No hay mesas creadas aún</p>
                                <p className="text-xs mt-1">Crea tu primera mesa con el formulario arriba para empezar a ubicar a tus invitados.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {tables.map(table => {
                                    const occupied = table.guests_count || 0;
                                    const isFull = occupied >= table.capacity;
                                    const pct = Math.min(100, Math.round((occupied / table.capacity) * 100));

                                    return (
                                        <div 
                                            key={table.id}
                                            className="bg-[#faf8f3] dark:bg-stone-900 border border-[#e8dfcf] dark:border-stone-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                                        >
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-[#2c4537] dark:text-[#f4ecd8]">
                                                        🍽️ {table.name}
                                                    </span>
                                                    {isFull ? (
                                                        <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-semibold">
                                                            Mesa Llena
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] border-[#a8c5b2] text-[#2c4537] bg-[#eef4f0]">
                                                            {table.capacity - occupied} disponibles
                                                        </Badge>
                                                    )}
                                                    {table.notes && (
                                                        <span className="text-[11px] text-stone-500 italic">
                                                            — {table.notes}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Barra de progreso de capacidad */}
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <div className="w-32 bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all ${
                                                                isFull 
                                                                    ? 'bg-rose-500' 
                                                                    : pct > 75 
                                                                    ? 'bg-amber-500' 
                                                                    : 'bg-[#2c4537]'
                                                            }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono font-medium text-stone-600 dark:text-stone-300">
                                                        {occupied} / {table.capacity} lugares ({pct}%)
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 justify-end">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-stone-500 hover:text-[#2c4537] hover:bg-white cursor-pointer"
                                                    onClick={() => startEditTable(table)}
                                                    title="Editar mesa"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                                    onClick={() => handleDeleteTable(table.id)}
                                                    title="Eliminar mesa"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-3 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowTableModal(false)}
                            className="cursor-pointer"
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* 4. MODAL: EDITAR INVITACIÓN (DATOS E INTEGRANTES)        */}
            {/* ========================================================= */}
            <Dialog open={!!editingInvitation} onOpenChange={(open) => !open && setEditingInvitation(null)}>
                <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold font-sans text-[#2c4537] dark:text-[#f4ecd8]">
                            <Edit className="w-5 h-5 text-[#cfbe95]" />
                            Editar Invitación
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-500">
                            Modifica los datos generales y la lista de integrantes reservados para esta invitación.
                        </DialogDescription>
                    </DialogHeader>

                    {editError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{editError}</span>
                        </div>
                    )}

                    <form onSubmit={handleEditSubmit} className="space-y-5 pt-2">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_name" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Familia / Titular *
                                </Label>
                                <Input 
                                    id="edit_name"
                                    value={editFormData.name} 
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
                                    required 
                                    className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_category" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Etiqueta / Categoría
                                </Label>
                                <Input 
                                    id="edit_category"
                                    placeholder="Ej. VIP, Familia Novia, Amigos..."
                                    value={editFormData.category} 
                                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })} 
                                    className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd]"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_phone" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Teléfono WhatsApp
                                </Label>
                                <Input 
                                    id="edit_phone"
                                    placeholder="+52 999 123 4567"
                                    value={editFormData.phone} 
                                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} 
                                    className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_deadline" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Límite RSVP Especial
                                </Label>
                                <Input 
                                    id="edit_deadline"
                                    type="date"
                                    value={editFormData.rsvp_deadline} 
                                    onChange={e => setEditFormData({ ...editFormData, rsvp_deadline: e.target.value })} 
                                    className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd]"
                                />
                            </div>
                        </div>

                        {/* Selector de mesa familiar */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_table" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                Asignar Mesa a Toda la Familia
                            </Label>
                            <Select 
                                value={editFormData.table_id || 'none'} 
                                onValueChange={handleEditFormTableChange}
                            >
                                <SelectTrigger id="edit_table" className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd] text-xs">
                                    <SelectValue placeholder="Seleccionar mesa para todos..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        🚫 Sin mesa fija / Personalizar individual
                                    </SelectItem>
                                    {tables.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)} className="cursor-pointer text-xs">
                                            🍽️ {t.name} ({t.guests_count}/{t.capacity} personas)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Integrantes en Edición */}
                        <div className="space-y-3 pt-2 border-t border-[#ded8cd]">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                                    Integrantes de la Invitación ({editFormData.guests.length})
                                </h4>
                            </div>

                            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                                {editFormData.guests.map((guest, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-[#faf8f3] dark:bg-stone-900 p-2.5 rounded-xl border border-[#ded8cd] dark:border-stone-800">
                                        <div className="flex-1 space-y-1">
                                            <Input 
                                                placeholder={`Nombre integrante ${idx + 1}`}
                                                value={guest.full_name} 
                                                onChange={e => handleEditGuestChange(idx, 'full_name', e.target.value)} 
                                                required 
                                                className="h-9 bg-white dark:bg-stone-950"
                                            />
                                            {guest.checkin_code && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-[#8f6d28]">
                                                        🎫 Boleto: {guest.checkin_code}
                                                    </span>
                                                    {guest.has_entered && (
                                                        <Badge className="bg-emerald-100 text-emerald-800 text-[9px] h-4">
                                                            ✓ Ingresó al evento
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-24 shrink-0">
                                            <Select 
                                                value={guest.type} 
                                                onValueChange={(val) => handleEditGuestChange(idx, 'type', val)}
                                            >
                                                <SelectTrigger className="h-9 bg-white dark:bg-stone-950 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="adult">Adulto</SelectItem>
                                                    <SelectItem value="child">Niño</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="w-28 shrink-0">
                                            <Select 
                                                value={guest.table_id ? String(guest.table_id) : 'none'} 
                                                onValueChange={(val) => handleEditGuestChange(idx, 'table_id', val === 'none' ? '' : val)}
                                            >
                                                <SelectTrigger className="h-9 text-[11px] bg-white dark:bg-stone-950 border-[#cfbe95]">
                                                    <SelectValue placeholder="Mesa..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" className="text-xs">
                                                        Sin mesa
                                                    </SelectItem>
                                                    {tables.map(t => (
                                                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                                            {t.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {editFormData.guests.length > 1 && (
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 text-stone-400 hover:text-rose-500 shrink-0 cursor-pointer" 
                                                onClick={() => removeEditGuestField(idx)}
                                                disabled={Boolean(guest.has_entered)}
                                                title={guest.has_entered ? "No se puede retirar a quien ya ingresó" : "Quitar integrante"}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={addEditGuestField} 
                                className="w-full border-dashed border-2 cursor-pointer h-10 text-xs font-semibold"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Añadir otro integrante
                            </Button>
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button type="button" variant="ghost" onClick={() => setEditingInvitation(null)} className="cursor-pointer">
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-[#2c4537] hover:bg-[#385645] text-white cursor-pointer">
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* 5. MODAL: ASIGNACIÓN DE MESA Y NOTAS DE UN INVITADO       */}
            {/* ========================================================= */}
            <Dialog open={!!editGuest} onOpenChange={(open) => !open && setEditGuest(null)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold font-sans text-[#2c4537] dark:text-[#f4ecd8]">
                            <Utensils className="w-5 h-5 text-[#cfbe95]" />
                            Asignación de Mesa y Notas
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-500">
                            Asigna la mesa y especificaciones para <strong className="text-stone-800 dark:text-stone-200">{editGuest?.full_name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {guestError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{guestError}</span>
                        </div>
                    )}

                    <form onSubmit={handleGuestSubmit} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="table_select" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Mesa Seleccionada
                                </Label>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setEditGuest(null);
                                        setShowTableModal(true);
                                    }}
                                    className="text-[11px] text-[#8f6d28] hover:underline font-medium cursor-pointer"
                                >
                                    + Crear o ver mesas
                                </button>
                            </div>

                            <Select 
                                value={guestFormData.table_id || 'none'} 
                                onValueChange={(val) => setGuestFormData({ ...guestFormData, table_id: val === 'none' ? '' : val })}
                            >
                                <SelectTrigger id="table_select" className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd]">
                                    <SelectValue placeholder="Seleccionar mesa..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        🚫 Sin mesa asignada
                                    </SelectItem>
                                    {tables.map(t => {
                                        const isCurrentGuestInThisTable = editGuest?.table_id && editGuest.table_id === t.id;
                                        const isFull = t.guests_count >= t.capacity && !isCurrentGuestInThisTable;
                                        return (
                                            <SelectItem 
                                                key={t.id} 
                                                value={String(t.id)} 
                                                disabled={isFull}
                                                className="cursor-pointer"
                                            >
                                                🍽️ {t.name} — ({t.guests_count}/{t.capacity} personas) {isFull ? '• [LLENA]' : ''}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            {/* Resumen de ocupación de la mesa seleccionada */}
                            {guestFormData.table_id && (() => {
                                const selTable = tables.find(t => String(t.id) === String(guestFormData.table_id));
                                if (!selTable) return null;
                                const isCurrent = editGuest?.table_id && editGuest.table_id === selTable.id;
                                const count = selTable.guests_count;
                                const remaining = selTable.capacity - count + (isCurrent ? 1 : 0);

                                return (
                                    <div className="p-3 bg-[#fbf9f4] dark:bg-stone-900/60 border border-[#cfbe95]/50 rounded-xl text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#2c4537] dark:text-[#f4ecd8]">
                                                {selTable.name}
                                            </span>
                                            <Badge className={`text-[10px] ${
                                                remaining <= 1 
                                                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                                    : 'bg-[#eef4f0] text-[#2c4537] border-[#a8c5b2]'
                                            }`}>
                                                {remaining} {remaining === 1 ? 'lugar disponible' : 'lugares disponibles'}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-stone-500">
                                            Capacidad máxima: {selTable.capacity} comensales.
                                            {selTable.notes ? ` (${selTable.notes})` : ''}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="special_notes" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                Notas Especiales (Opcional)
                            </Label>
                            <Input 
                                id="special_notes"
                                placeholder="Ej. Silla para bebé, menú vegetariano, cerca de salida..."
                                value={guestFormData.special_notes} 
                                onChange={e => setGuestFormData({...guestFormData, special_notes: e.target.value})} 
                                className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd]"
                            />
                        </div>

                        <DialogFooter className="pt-3 border-t">
                            <Button type="button" variant="ghost" onClick={() => setEditGuest(null)} className="cursor-pointer">
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-[#2c4537] hover:bg-[#385645] text-white cursor-pointer">
                                Guardar Asignación
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* 6. MODAL: NUEVA INVITACIÓN                                */}
            {/* ========================================================= */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Nueva Invitación</DialogTitle>
                        <DialogDescription>
                            Registra el nombre de la familia o titular y sus integrantes.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre (Ej. Familia Pérez)</Label>
                                <Input 
                                    id="name"
                                    placeholder="Nombre a mostrar"
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Etiqueta (VIP, Foráneos...)</Label>
                                <Input 
                                    id="category"
                                    placeholder="Clasificación opcional"
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono de WhatsApp</Label>
                                <Input 
                                    id="phone"
                                    placeholder="Solo números con código de país"
                                    value={formData.phone} 
                                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rsvp_deadline">Fecha Límite Especial (Opcional)</Label>
                                <Input 
                                    id="rsvp_deadline"
                                    type="date"
                                    value={formData.rsvp_deadline} 
                                    onChange={e => setFormData({...formData, rsvp_deadline: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="form_table" className="text-xs font-bold text-stone-700 dark:text-stone-300">
                                    Mesa para toda la familia (Opcional)
                                </Label>
                                <span className="text-[11px] text-stone-400">
                                    Se aplicará a todos los integrantes
                                </span>
                            </div>
                            <Select 
                                value={formData.table_id || 'none'} 
                                onValueChange={handleFormTableChange}
                            >
                                <SelectTrigger id="form_table" className="h-10 bg-white dark:bg-stone-900 border-[#ded8cd] text-xs">
                                    <SelectValue placeholder="Seleccionar mesa..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        🚫 Sin mesa fija por ahora
                                    </SelectItem>
                                    {tables.map(t => {
                                        const free = t.capacity - (t.guests_count || 0);
                                        return (
                                            <SelectItem key={t.id} value={String(t.id)} disabled={free <= 0} className="text-xs cursor-pointer">
                                                🍽️ {t.name} ({t.guests_count}/{t.capacity} lugares) {free <= 0 ? '• [LLENA]' : `• ${free} disp.`}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Integrantes ({formData.guests.length})</h4>
                            </div>
                            
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {formData.guests.map((guest: any, index: number) => (
                                    <div key={index} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-900 p-2 rounded-md border border-gray-100 dark:border-gray-800 relative">
                                        <div className="flex-1 space-y-2">
                                            <Input 
                                                placeholder={`Nombre del invitado ${index + 1}`}
                                                value={guest.full_name} 
                                                onChange={e => handleGuestChange(index, 'full_name', e.target.value)} 
                                                required 
                                                className="h-9 bg-white dark:bg-black"
                                            />
                                        </div>
                                        <div className="w-28">
                                            <Select value={guest.type} onValueChange={(val) => handleGuestChange(index, 'type', val)}>
                                                <SelectTrigger className="h-9 bg-white dark:bg-black">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="adult">Adulto</SelectItem>
                                                    <SelectItem value="child">Niño</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {formData.guests.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-500 flex-shrink-0 cursor-pointer" onClick={() => removeGuestField(index)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <Button type="button" variant="outline" onClick={addGuestField} className="w-full border-dashed border-2 cursor-pointer">
                                <Plus className="w-4 h-4 mr-2" />
                                Añadir otro integrante
                            </Button>
                        </div>
                        
                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="cursor-pointer">
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-[#2c4537] hover:bg-[#385645] text-white cursor-pointer">
                                Guardar Invitación
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ========================================================= */}
            {/* 7. MODAL: CONFIRMACIÓN PARA ELIMINAR INVITACIÓN           */}
            {/* ========================================================= */}
            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-stone-800 dark:text-stone-100">
                            {isProtectedFromDelete ? (
                                <>
                                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                                    Invitación Protegida
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5 text-rose-600" />
                                    Eliminar Invitación
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-stone-500">
                            {isProtectedFromDelete ? (
                                'Esta invitación contiene datos críticos de asistencia o ingreso al evento.'
                            ) : (
                                `¿Estás seguro de que deseas eliminar la invitación de "${invToDelete?.name}"?`
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {isProtectedFromDelete ? (
                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-2">
                            <p>
                                <strong>No se puede eliminar esta invitación</strong> porque sus integrantes ya cuentan con confirmación de asistencia RSVP o registro de ingreso (check-in) en recepción.
                            </p>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300">
                                Para salvaguardar la veracidad de la lista y estadísticas del banquete, puedes editar sus datos o integrantes con el botón <strong>"Editar Invitación"</strong>.
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-stone-600 dark:text-stone-300 py-1">
                            Al eliminarla, los integrantes perderán sus pases y el enlace público quedará inhabilitado.
                        </p>
                    )}

                    <DialogFooter className="mt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="cursor-pointer">
                            Cancelar
                        </Button>
                        {isProtectedFromDelete ? (
                            <Button 
                                type="button" 
                                className="bg-[#2c4537] hover:bg-[#385645] text-white cursor-pointer flex items-center gap-1.5"
                                onClick={() => {
                                    const target = invToDelete;
                                    setDeleteConfirmId(null);
                                    if (target) openEditInvitation(target);
                                }}
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Editar en su lugar
                            </Button>
                        ) : (
                            <Button type="button" variant="destructive" onClick={handleDelete} className="cursor-pointer">
                                Sí, Eliminar
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

InvitationManager.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Invitados', href: '/admin/invitations' }
    ],
};
