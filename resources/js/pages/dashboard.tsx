import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    Mail, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    ExternalLink, 
    Image as ImageIcon, 
    Settings, 
    UserCheck, 
    Calendar, 
    ArrowRight,
    MessageCircle,
    Heart,
    Sparkles,
    Hotel,
    UtensilsCrossed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

interface DashboardProps {
    wedding?: any;
    stats?: {
        total_invitations: number;
        total_guests: number;
        confirmed_guests: number;
        rejected_guests: number;
        pending_guests: number;
        checked_in_guests: number;
        gallery_count: number;
        hotels_count?: number;
        total_tables?: number;
        tables_capacity?: number;
        assigned_guests?: number;
    };
    recentInvitations?: any[];
}

export default function Dashboard({ 
    wedding, 
    stats = {
        total_invitations: 0,
        total_guests: 0,
        confirmed_guests: 0,
        rejected_guests: 0,
        pending_guests: 0,
        checked_in_guests: 0,
        gallery_count: 0,
        hotels_count: 0,
    },
    recentInvitations = []
}: DashboardProps) {
    const bride = wedding?.bride_name || 'Adriana';
    const groom = wedding?.groom_name || 'Joaquín';

    // Reloj en tiempo real
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

    // Countdown calculation
    const calculateDaysLeft = () => {
        if (!wedding?.wedding_date) return null;
        const targetDate = new Date(wedding.wedding_date);
        const today = new Date();
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysLeft = calculateDaysLeft();

    // Formatted wedding date in Spanish
    const formattedDate = wedding?.wedding_date 
        ? new Date(wedding.wedding_date).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        : 'Fecha por definir';

    // Percentage of confirmed
    const confirmedPercent = stats.total_guests > 0 
        ? Math.round((stats.confirmed_guests / stats.total_guests) * 100) 
        : 0;

    return (
        <div className="flex-1 space-y-8 px-4 md:px-8 py-6 w-full">
            <Head title={`Panel de Boda - ${bride} & ${groom}`} />

            {/* TOP HEADER / HERO BANNER EN TONO VERDE BOSQUE ELEGANTE */}
            <header className="bg-gradient-to-r from-[#2c4537] via-[#385645] to-[#2c4537] dark:from-[#1b2b22] dark:via-[#24392d] dark:to-[#1b2b22] text-[#fcf8ed] rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm border border-[#486b55] dark:border-[#2d4234] relative overflow-hidden">
                {/* Monograma decorativo de fondo */}
                <div className="absolute right-0 top-0 -mt-6 -mr-6 w-64 h-64 opacity-[0.14] pointer-events-none select-none brightness-150">
                    <img 
                        src="/resources_canvas/images/15.svg" 
                        alt="Monograma" 
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans uppercase tracking-wider font-semibold bg-[#16271e]/75 backdrop-blur-sm text-[#f4ecd8] border border-[#cfbe95]/40 shadow-xs">
                                <Sparkles className="w-3 h-3 text-[#cfbe95]" />
                                Panel Central de Boda
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#f4ecd8] bg-[#16271e]/75 backdrop-blur-sm px-3 py-1 rounded-full border border-[#cfbe95]/40 shadow-xs font-semibold">
                                <Clock className="w-3 h-3 text-[#cfbe95]" />
                                <span>{currentTime || 'En vivo'}</span>
                            </div>
                            {daysLeft !== null && (
                                <Badge className="bg-[#16271e]/75 backdrop-blur-sm text-[#f4ecd8] border border-[#cfbe95]/40 hover:bg-[#16271e] font-sans uppercase tracking-wider text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs">
                                    {daysLeft > 0 ? `⏳ Faltan ${daysLeft} días` : daysLeft === 0 ? '¡El gran día es hoy! 🎉' : 'Celebrado'}
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-[#fcf8ed]">
                            {bride} &amp; {groom}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 text-[#dfd4c0] text-xs sm:text-sm font-sans">
                            <span className="flex items-center gap-1.5 capitalize text-[#e8dfcf] font-medium">
                                <Calendar className="w-4 h-4 text-[#cfbe95]" />
                                {formattedDate}
                            </span>
                            <span className="text-[#a89b80]">•</span>
                            <span className="text-[#dfd4c0] font-medium">
                                Coordinación en tiempo real de recepción, pases y confirmaciones.
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4">
                        {/* Tarjeta de Métricas de la Boda */}
                        <div className="bg-[#16271e]/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#cfbe95]/30 shadow-md flex flex-col items-end min-w-[170px] w-full sm:w-auto">
                            <span className="text-[10.5px] uppercase font-sans font-semibold tracking-wider text-[#cfbe95]">
                                Confirmaciones Totales
                            </span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-2xl font-bold font-sans text-[#fcf8ed]">
                                    {stats.confirmed_guests}
                                </span>
                                <span className="text-xs text-[#cfbe95]/85 font-sans font-medium">
                                    / {stats.total_guests} invitados
                                </span>
                            </div>
                            <div className="w-full bg-[#0f1c15] h-1.5 rounded-full mt-2 overflow-hidden border border-[#cfbe95]/20">
                                <div 
                                    className="bg-gradient-to-r from-[#d4af37] via-[#e5cf97] to-[#d4af37] h-full transition-all duration-500 rounded-full"
                                    style={{ width: `${confirmedPercent}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-[#e8d5aa] font-bold mt-1">
                                {confirmedPercent}% de afluencia confirmada
                            </span>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                            <Button 
                                asChild 
                                variant="secondary" 
                                className="bg-[#fcf8ee] hover:bg-[#f3ebd9] text-[#24352a] font-sans font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer h-11 px-4 rounded-xl border border-[#e6dbc5]"
                            >
                                <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                                    <ExternalLink className="w-3.5 h-3.5 text-[#24352a]" />
                                    <span>Ver Invitación</span>
                                </a>
                            </Button>
                            <Button 
                                asChild 
                                variant="outline" 
                                className="bg-white/5 hover:bg-white/10 text-[#fcf8ee] border border-white/25 font-sans font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer h-11 px-4 rounded-xl shadow-xs"
                            >
                                <Link href="/admin/settings" className="flex items-center gap-1.5">
                                    <Settings className="w-3.5 h-3.5 text-[#cfbe95]" />
                                    <span>Configurar</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* KEY METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* Total Invitaciones */}
                <Card className="border-[#ded8cd] shadow-sm hover:shadow transition-shadow bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                            Invitaciones (Familias)
                        </CardTitle>
                        <div className="size-9 rounded-lg bg-[#698175]/10 flex items-center justify-center text-[#698175]">
                            <Mail className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-sans text-[#70531c] dark:text-[#f4ecd8]">
                            {stats.total_invitations}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Grupos y pases generados
                        </p>
                    </CardContent>
                </Card>

                {/* Total Invitados */}
                <Card className="border-[#ded8cd] shadow-sm hover:shadow transition-shadow bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                            Total de Pases
                        </CardTitle>
                        <div className="size-9 rounded-lg bg-[#698175]/10 flex items-center justify-center text-[#698175]">
                            <Users className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-sans text-[#70531c] dark:text-[#f4ecd8]">
                            {stats.total_guests}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Personas invitadas en lista
                        </p>
                    </CardContent>
                </Card>

                {/* Confirmados */}
                <Card className="border-[#ded8cd] shadow-sm hover:shadow transition-shadow bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                            Confirmados (RSVP)
                        </CardTitle>
                        <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold font-sans text-[#70531c] dark:text-[#f4ecd8]">
                                {stats.confirmed_guests}
                            </span>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {confirmedPercent}% confirmado
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-[#f0ede6] rounded-full h-1.5 mt-3 overflow-hidden">
                            <div 
                                className="bg-[#698175] h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(confirmedPercent, 100)}%` }} 
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pendientes y Declinados */}
                <Card className="border-[#ded8cd] shadow-sm hover:shadow transition-shadow bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                            Pendientes / Declinados
                        </CardTitle>
                        <div className="size-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Clock className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div>
                                <span className="text-2xl font-bold font-sans text-amber-700 dark:text-amber-400">
                                    {stats.pending_guests}
                                </span>
                                <span className="text-xs text-muted-foreground block">Pendientes</span>
                            </div>
                            <div className="h-8 w-px bg-[#ded8cd]" />
                            <div>
                                <span className="text-2xl font-bold font-sans text-rose-600 dark:text-rose-400">
                                    {stats.rejected_guests}
                                </span>
                                <span className="text-xs text-muted-foreground block">Declinados</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* QUICK ACTIONS / ADMIN MODULES */}
            <div>
                <div className="mb-4">
                    <h2 className="text-xl font-bold font-sans text-[#70531c] dark:text-[#f3f6f4] tracking-tight">
                        Módulos de Gestión
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Accede a las herramientas principales para organizar tu evento
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Modulo 1: Invitaciones */}
                    <Link 
                        href="/admin/invitations"
                        className="group p-5 rounded-xl border border-[#ded8cd] bg-card hover:border-[#698175] hover:shadow-md transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="size-10 rounded-lg bg-[#698175]/10 text-[#698175] flex items-center justify-center mb-3 group-hover:bg-[#698175] group-hover:text-white transition-colors">
                                <Users className="size-5" />
                            </div>
                            <h3 className="font-sans font-bold text-base text-[#70531c] dark:text-[#f3f6f4] group-hover:text-[#8a6721] transition-colors">
                                Lista de Invitados
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                Crea pases familiares, envía mensajes automáticos por WhatsApp y monitorea respuestas.
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#698175] mt-4 pt-3 border-t border-[#f0ede6]">
                            <span>Gestionar lista</span>
                            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    {/* Modulo 2: Mesas del Banquete */}
                    <Link 
                        href="/admin/invitations?tab=tables"
                        className="group p-5 rounded-xl border border-[#ded8cd] bg-card hover:border-[#698175] hover:shadow-md transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="size-10 rounded-lg bg-[#698175]/10 text-[#698175] flex items-center justify-center mb-3 group-hover:bg-[#698175] group-hover:text-white transition-colors">
                                <UtensilsCrossed className="size-5" />
                            </div>
                            <h3 className="font-sans font-bold text-base text-[#70531c] dark:text-[#f3f6f4] group-hover:text-[#8a6721] transition-colors">
                                Mesas del Banquete
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                Crea mesas con cupos, asigna familias completas y visualiza la ocupación del salón ({stats.total_tables || 0} mesas • {stats.assigned_guests || 0} asignados).
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#698175] mt-4 pt-3 border-t border-[#f0ede6]">
                            <span>Organizar mesas</span>
                            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    {/* Modulo 2: Galería */}
                    <Link 
                        href="/admin/gallery"
                        className="group p-5 rounded-xl border border-[#ded8cd] bg-card hover:border-[#698175] hover:shadow-md transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="size-10 rounded-lg bg-[#698175]/10 text-[#698175] flex items-center justify-center mb-3 group-hover:bg-[#698175] group-hover:text-white transition-colors">
                                <ImageIcon className="size-5" />
                            </div>
                            <h3 className="font-sans font-bold text-base text-[#70531c] dark:text-[#f3f6f4] group-hover:text-[#8a6721] transition-colors">
                                Galería de Fotos
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                Sube y ordena las imágenes de la sesión preboda ({stats.gallery_count} fotos subidas).
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#698175] mt-4 pt-3 border-t border-[#f0ede6]">
                            <span>Organizar fotos</span>
                            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    {/* Modulo 3: Check-in */}
                    <Link 
                        href="/admin/checkin"
                        className="group p-5 rounded-xl border border-[#ded8cd] bg-card hover:border-[#698175] hover:shadow-md transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="size-10 rounded-lg bg-[#698175]/10 text-[#698175] flex items-center justify-center mb-3 group-hover:bg-[#698175] group-hover:text-white transition-colors">
                                <UserCheck className="size-5" />
                            </div>
                            <h3 className="font-sans font-bold text-base text-[#70531c] dark:text-[#f3f6f4] group-hover:text-[#8a6721] transition-colors">
                                Control de Acceso
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                Registro en recepción el día del evento ({stats.checked_in_guests} ya ingresados).
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#698175] mt-4 pt-3 border-t border-[#f0ede6]">
                            <span>Abrir puerta</span>
                            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    {/* Modulo 4: Configuración */}
                    <Link 
                        href="/admin/settings"
                        className="group p-5 rounded-xl border border-[#ded8cd] bg-card hover:border-[#698175] hover:shadow-md transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="size-10 rounded-lg bg-[#698175]/10 text-[#698175] flex items-center justify-center mb-3 group-hover:bg-[#698175] group-hover:text-white transition-colors">
                                <Settings className="size-5" />
                            </div>
                            <h3 className="font-sans font-bold text-base text-[#70531c] dark:text-[#f3f6f4] group-hover:text-[#8a6721] transition-colors">
                                Configuración de Boda
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                Lugares, mapas Google/Waze, itinerario, padrinos, vestimenta y datos de regalos.
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#698175] mt-4 pt-3 border-t border-[#f0ede6]">
                            <span>Editar detalles</span>
                            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>

                    {/* Modulo 5: Hoteles Recomendados */}
                    <Link 
                        href="/admin/hotels"
                        className="group p-5 rounded-xl border border-[#ded8cd] bg-card hover:border-[#698175] hover:shadow-md transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="size-10 rounded-lg bg-[#698175]/10 text-[#698175] flex items-center justify-center mb-3 group-hover:bg-[#698175] group-hover:text-white transition-colors">
                                <Hotel className="size-5" />
                            </div>
                            <h3 className="font-sans font-bold text-base text-[#70531c] dark:text-[#f3f6f4] group-hover:text-[#8a6721] transition-colors">
                                Hoteles Recomendados
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                Sugiere opciones de hospedaje para tus invitados con foto y ubicación ({stats.hotels_count || 0} hoteles).
                            </p>
                        </div>
                        <div className="flex items-center text-xs font-medium text-[#698175] mt-4 pt-3 border-t border-[#f0ede6]">
                            <span>Gestionar hoteles</span>
                            <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* RECENT INVITATIONS PREVIEW */}
            <Card className="border-[#ded8cd] shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-sans font-bold text-[#28362e] dark:text-[#f3f6f4]">
                            Actividad Reciente de Invitados
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Últimas invitaciones añadidas al sistema
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild className="border-[#ded8cd] hover:border-[#698175] text-[#28362e]">
                        <Link href="/admin/invitations">
                            Ver todos ({stats.total_invitations})
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentInvitations.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Mail className="size-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No hay invitaciones registradas aún.</p>
                            <Button asChild size="sm" className="mt-4 bg-[#698175] hover:bg-[#586e63]">
                                <Link href="/admin/invitations">Crear Primera Invitación</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#f5f2eb]/60 dark:bg-muted/40 text-muted-foreground text-xs uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Familia / Nombre</th>
                                        <th className="px-4 py-3">Pases</th>
                                        <th className="px-4 py-3">Estado</th>
                                        <th className="px-4 py-3 text-right rounded-r-lg">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0ede6] dark:divide-border/50">
                                    {recentInvitations.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-[#fbf9f4]/80 dark:hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-medium text-[#28362e] dark:text-[#f3f6f4]">
                                                {inv.name}
                                                {inv.category && (
                                                    <Badge variant="outline" className="ml-2 text-[10px] border-[#ded8cd]">
                                                        {inv.category}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {inv.guests?.length || 0} pases
                                            </td>
                                            <td className="px-4 py-3">
                                                {inv.status === 'responded' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 text-xs">
                                                        Respondido
                                                    </Badge>
                                                ) : inv.status === 'viewed' ? (
                                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0 text-xs">
                                                        Visto
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 text-xs">
                                                        Pendiente
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" asChild className="text-[#698175] hover:text-[#586e63] hover:bg-[#698175]/10">
                                                    <Link href="/admin/invitations">
                                                        Ver Familia
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
