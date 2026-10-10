import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Users, User, Phone, CheckCircle2, MessageCircle, Send, X, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InvitationManagerProps {
    wedding: any;
    invitations: any[];
}

export default function InvitationManager({ wedding, invitations }: InvitationManagerProps) {
    const { auth } = usePage().props;
    const isPlanner = auth.user.role === 'wedding_planner';

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', category: '', rsvp_deadline: '', guests: [{ full_name: '', type: 'adult' }] });
    
    const [editGuest, setEditGuest] = useState<any>(null);
    const [guestFormData, setGuestFormData] = useState({ table_name: '', special_notes: '' });

    const openEditGuest = (guest: any) => {
        setEditGuest(guest);
        setGuestFormData({ table_name: guest.table_name || '', special_notes: guest.special_notes || '' });
    };

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editGuest) return;
        router.put(`/admin/guests/${editGuest?.id}`, guestFormData, {
            onSuccess: () => {
                setEditGuest(null);
            }
        });
    };

    const addGuestField = () => {
        setFormData({ ...formData, guests: [...formData.guests, { full_name: '', type: 'adult' }] });
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/admin/invitations`, formData, {
            onSuccess: () => {
                setShowModal(false);
                setFormData({ name: '', phone: '', category: '', rsvp_deadline: '', guests: [{ full_name: '', type: 'adult' }] });
            }
        });
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const handleDelete = () => {
        if (!deleteConfirmId) return;
        router.delete(`/admin/invitations/${deleteConfirmId}`, {
            onFinish: () => setDeleteConfirmId(null)
        });
    };

    const generateWaLink = (invitation: any) => {
        const url = `${window.location.origin}/public/rsvp/${invitation.token}`;
        const guestCount = invitation.guests.length;
        const passText = guestCount === 1 ? '1 pase' : `${guestCount} pases`;

        // Usamos escapes Unicode para evitar problemas de codificación de archivos en Windows
        const text = `¡Hola *${invitation.name}*! \u{1F44B}\n\nNos casamos y nos haría muy felices contar con su presencia en este día tan especial para nosotros.\n\nHemos reservado *${passText}* en su honor \u{1F3AB}.\n\nPor favor, hagan clic en el siguiente enlace para ver nuestra invitación digital, conocer todos los detalles del evento y confirmar su asistencia:\n\u{1F449} ${url}\n\n¡Los esperamos! \u{1F942}`;
        
        // Usamos la API oficial directa que es más estable con WhatsApp Desktop
        return `https://api.whatsapp.com/send?phone=${invitation.phone}&text=${encodeURIComponent(text)}`;
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
        <div className="flex-1 space-y-6 px-4 md:px-8 py-8 w-full">
            <Head title={`Invitaciones - ${wedding.bride_name} & ${wedding.groom_name}`} />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Lista de Invitados
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Administra quiénes asisten a la boda de {wedding.bride_name} y {wedding.groom_name}.
                        {isPlanner && " (Modo Lectura)"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild className="flex items-center gap-2 bg-white">
                        <a href="/admin/invitations/export">
                            <Send className="w-4 h-4" /> Exportar CSV
                        </a>
                    </Button>
                    {!isPlanner && (
                        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Nueva Invitación
                        </Button>
                    )}
                </div>
            </div>

            <Card className="shadow-sm border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 font-medium border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 font-medium">Familia / Nombre</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium text-center">Pases</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {invitations.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                {inv.name}
                                                {inv.category && <Badge variant="outline" className="text-[10px] h-5">{inv.category}</Badge>}
                                            </span>
                                            {inv.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3"/> {inv.phone}</span>}
                                            
                                            {inv.guests && inv.guests.length > 0 && (
                                                <div className="mt-3 space-y-2 border-t pt-2 w-full">
                                                    {inv.guests.map((g: any) => (
                                                        <div key={g.id} className="text-xs flex items-start justify-between group/guest">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-medium flex items-center gap-1">
                                                                    {g.full_name} 
                                                                    <span className="text-[10px] text-gray-400 font-normal">({g.type === 'child' ? 'Niño' : 'Adulto'})</span>
                                                                    {g.table_name && <Badge variant="secondary" className="h-4 text-[9px] px-1 ml-1">{g.table_name}</Badge>}
                                                                </span>
                                                                {g.allergies && <span className="text-[10px] text-amber-600">Alergia: {g.allergies}</span>}
                                                                {g.special_notes && <span className="text-[10px] text-blue-600">Nota: {g.special_notes}</span>}
                                                            </div>
                                                            {!isPlanner && (
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="ghost" 
                                                                    className="h-6 w-6 opacity-0 group-hover/guest:opacity-100 h-[24px]"
                                                                    onClick={() => openEditGuest(g)}
                                                                >
                                                                    <Edit className="w-3 h-3 text-gray-400 hover:text-gray-900" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {inv.message_to_couple && (
                                                <div className="mt-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-2 rounded-md w-full">
                                                    <p className="text-[10px] uppercase tracking-wider text-rose-500 font-semibold mb-0.5">Mensaje para los novios:</p>
                                                    <p className="text-xs text-rose-700 dark:text-rose-300 italic">"{inv.message_to_couple}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {statusBadge(inv.status)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                                            <Users className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                            {inv.guests.length}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 transition-opacity">
                                            {inv.phone && (
                                                <Button size="sm" variant="outline" className="h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20" asChild>
                                                    <a href={generateWaLink(inv)} target="_blank" rel="noreferrer">
                                                        <MessageCircle className="w-4 h-4 mr-1.5" />
                                                        WhatsApp
                                                    </a>
                                                </Button>
                                            )}
                                            {!isPlanner && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setDeleteConfirmId(inv.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {invitations.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                                                <Users className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">Sin invitados todavía</p>
                                            <p className="text-sm mb-4">Agrega tu primera invitación para empezar.</p>
                                            {!isPlanner && (
                                                <Button onClick={() => setShowModal(true)} variant="outline">
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

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Nueva Invitación</DialogTitle>
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
                                <Label htmlFor="phone">Teléfono de WhatsApp.</Label>
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
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={() => removeGuestField(index)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <Button type="button" variant="outline" onClick={addGuestField} className="w-full border-dashed border-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Añadir otro integrante
                            </Button>
                        </div>
                        
                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Guardar Invitación
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Invitación</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar esta invitación? Al hacerlo, sus invitados ya no podrán ingresar al enlace público ni confirmar su asistencia.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
                            Cancelar
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>
                            Sí, Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editGuest} onOpenChange={(open) => !open && setEditGuest(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Detalles de {editGuest?.full_name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGuestSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="table_name">Mesa Asignada</Label>
                            <Input 
                                id="table_name"
                                placeholder="Ej. Mesa 12 o Mesa Principal"
                                value={guestFormData.table_name} 
                                onChange={e => setGuestFormData({...guestFormData, table_name: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="special_notes">Notas Especiales</Label>
                            <Input 
                                id="special_notes"
                                placeholder="Silla de ruedas, periquera, etc."
                                value={guestFormData.special_notes} 
                                onChange={e => setGuestFormData({...guestFormData, special_notes: e.target.value})} 
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setEditGuest(null)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

InvitationManager.layout = {
    breadcrumbs: [
        { title: 'Invitados', href: '/admin/invitations' }
    ],
};
