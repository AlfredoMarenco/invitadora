import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Search, X } from 'lucide-react';

interface CheckInProps {
    wedding: any;
    guests: any[];
}

export default function CheckInManager({ wedding, guests }: CheckInProps) {
    const { auth } = usePage().props as any;
    const isPlanner = auth.user.role === 'wedding_planner';

    const [searchTerm, setSearchTerm] = useState('');

    const handleToggle = (guest) => {
        router.put(`/admin/guests/${guest.id}/checkin`, {}, { preserveScroll: true });
    };

    const filteredGuests = guests.filter(g => 
        g.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.invitation.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalEntered = guests.filter(g => g.has_entered).length;

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 py-8 w-full max-w-5xl mx-auto">
            <Head title={`Control de Acceso - ${wedding.bride_name} & ${wedding.groom_name}`} />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Control de Acceso (Check-in)
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Busca y marca a los invitados que van llegando al evento.
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm flex flex-col items-end">
                    <span className="text-sm text-zinc-500 font-medium">Asistentes en el lugar</span>
                    <span className="text-3xl font-bold text-black dark:text-white">{totalEntered} <span className="text-lg text-zinc-400 font-normal">/ {guests.length}</span></span>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                    type="text" 
                    placeholder="Buscar por nombre de persona o familia..." 
                    className="pl-10 h-12 text-lg shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                {filteredGuests.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-xl border">
                        <p className="text-zinc-500">No se encontraron invitados con esa búsqueda.</p>
                    </div>
                ) : (
                    filteredGuests.map(guest => (
                        <div key={guest.id} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm transition-colors ${guest.has_entered ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50' : 'bg-white dark:bg-zinc-900'}`}>
                            <div className="flex flex-col">
                                <span className={`text-lg font-bold ${guest.has_entered ? 'text-emerald-900 dark:text-emerald-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {guest.full_name} <span className="text-sm font-normal text-zinc-500">({guest.type === 'child' ? 'Niño' : 'Adulto'})</span>
                                </span>
                                <span className="text-sm text-zinc-500 flex items-center gap-2 mt-1">
                                    Fam. {guest.invitation.name}
                                    {guest.invitation.category && (
                                        <Badge variant="outline" className="text-[10px] h-4 py-0">{guest.invitation.category}</Badge>
                                    )}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {guest.has_entered ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Ingresó
                                    </span>
                                ) : (
                                    <span className="text-zinc-400 text-sm font-medium">
                                        No ha llegado
                                    </span>
                                )}
                                <button 
                                    onClick={() => handleToggle(guest)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${guest.has_entered ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                >
                                    <span className="sr-only">Toggle</span>
                                    <span 
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${guest.has_entered ? 'translate-x-6' : 'translate-x-1'}`} 
                                    />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

CheckInManager.layout = {
    breadcrumbs: [
        { title: 'Control de Acceso', href: '/admin/checkin' }
    ],
};
