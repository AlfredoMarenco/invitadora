import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, UserCheck, UserX, AlertCircle, MessageSquareQuote, ExternalLink } from 'lucide-react';
import { usePage, Link } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NotificationItem {
    id: string;
    read: boolean;
    created_at: string;
    data: {
        invitation_id: number;
        invitation_name: string;
        attending_count: number;
        declined_count: number;
        total_guests: number;
        has_attending: boolean;
        message?: string | null;
        guests?: Array<{
            name: string;
            is_attending: boolean | null;
            allergies?: string | null;
        }>;
    };
}

export function NotificationBell() {
    const { auth } = usePage().props as any;
    const initialUnread = auth?.unread_notifications_count || 0;

    const [unreadCount, setUnreadCount] = useState<number>(initialUnread);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/admin/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (e) {
            console.error('Error fetching notifications:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Opcional: refrescar conteo cada 45 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/admin/notifications')
                .then(res => res.json())
                .then(data => {
                    setUnreadCount(data.unread_count || 0);
                })
                .catch(() => {});
        }, 45000);

        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch(`/admin/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    'Accept': 'application/json',
                },
            });

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error('Error marking as read:', e);
        }
    };

    const handleMarkAllAsRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            await fetch('/admin/notifications/mark-all-read', {
                method: 'PUT',
                headers: {
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    'Accept': 'application/json',
                },
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Error marking all as read:', e);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    aria-label="Notificaciones"
                    className="relative p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-300 focus:outline-none"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden"
            >
                {/* Header del panel de notificaciones */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#fbf9f4] dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[#28362e] dark:text-stone-200">
                            Confirmaciones
                        </span>
                        {unreadCount > 0 && (
                            <span className="bg-[#698175] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-[11px] text-[#698175] hover:text-[#28362e] dark:text-[#a5b8ad] flex items-center gap-1 font-medium transition-colors"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Marcar leídas</span>
                        </button>
                    )}
                </div>

                {/* Lista de notificaciones */}
                <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
                    {loading && notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-stone-400">
                            Cargando notificaciones...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-10 px-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto mb-2">
                                <Bell className="w-5 h-5 opacity-40" />
                            </div>
                            <p className="font-serif text-sm font-semibold text-stone-700 dark:text-stone-300">
                                Sin notificaciones aún
                            </p>
                            <p className="text-xs text-stone-400 mt-1 max-w-[240px] mx-auto">
                                Aquí aparecerán al instante los invitados que confirmen o actualicen su asistencia.
                            </p>
                        </div>
                    ) : (
                        notifications.map(item => {
                            const isAttending = item.data.has_attending;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => !item.read && handleMarkAsRead(item.id)}
                                    className={`p-3.5 transition-colors cursor-pointer text-left ${
                                        !item.read
                                            ? 'bg-[#f4f7f5]/80 dark:bg-[#28362e]/20'
                                            : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {isAttending ? (
                                                <span className="p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                </span>
                                            ) : (
                                                <span className="p-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 shrink-0">
                                                    <UserX className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                            <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 leading-tight">
                                                {item.data.invitation_name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-stone-400 shrink-0">
                                            {item.created_at}
                                        </span>
                                    </div>

                                    {/* Detalle de asistencia */}
                                    <div className="mt-1.5 ml-6 text-[11.5px] text-stone-600 dark:text-stone-300">
                                        {isAttending ? (
                                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                                ✓ Confirmó {item.data.attending_count} de {item.data.total_guests} {item.data.total_guests === 1 ? 'pase' : 'pases'}
                                            </span>
                                        ) : (
                                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                                                ✕ No podrá asistir
                                            </span>
                                        )}
                                    </div>

                                    {/* Alergias si existen */}
                                    {item.data.guests?.some(g => !!g.allergies) && (
                                        <div className="mt-1 ml-6 flex items-center gap-1 text-[10.5px] text-amber-700 dark:text-amber-400">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            <span className="truncate">
                                                Alergias: {item.data.guests.filter(g => !!g.allergies).map(g => g.allergies).join(', ')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Mensaje si dejaron uno */}
                                    {item.data.message && (
                                        <div className="mt-1.5 ml-6 p-2 rounded-lg bg-stone-100/70 dark:bg-stone-800/80 text-[11px] text-stone-600 dark:text-stone-300 italic border-l-2 border-[#698175]">
                                            "{item.data.message}"
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer del dropdown */}
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2 bg-stone-50 dark:bg-stone-900 text-center">
                    <Link
                        href="/admin/invitations"
                        className="text-xs font-semibold text-[#28362e] dark:text-[#a5b8ad] hover:underline inline-flex items-center gap-1.5 py-1"
                    >
                        <span>Ver lista completa en Invitados</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
export default NotificationBell;
