import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import LuxuryModal from '@/components/LuxuryModal';

interface WeddingFormProps {
    wedding: any;
}

export default function WeddingForm({ wedding }: WeddingFormProps) {
    const { auth } = usePage().props;
    const isPlanner = auth.user.role === 'wedding_planner';
    const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });

    const { data, setData, post, put, processing, errors } = useForm({
        bride_name: wedding?.bride_name || '',
        groom_name: wedding?.groom_name || '',
        wedding_date: wedding ? wedding.wedding_date.split('T')[0] : '',
        locations: wedding?.locations || { ceremony: '', ceremony_maps: '', ceremony_waze: '', reception: '', reception_maps: '', reception_waze: '' },
        bride_parents: wedding?.bride_parents?.join(', ') || '',
        groom_parents: wedding?.groom_parents?.join(', ') || '',
        bride_godparents: wedding?.bride_godparents?.join(', ') || '',
        groom_godparents: wedding?.groom_godparents?.join(', ') || '',
        gift_registry_url: wedding?.gift_registry_url || '',
        gift_registry_button_text: wedding?.gift_registry_button_text || 'LIVERPOOL',
        gift_registry_url_2: wedding?.gift_registry_url_2 || '',
        gift_registry_button_text_2: wedding?.gift_registry_button_text_2 || '',
        bank_transfer_info: wedding?.bank_transfer_info || '',
        dress_code: wedding?.dress_code || '',
        timeline: (wedding?.timeline && wedding.timeline.length > 0) ? wedding.timeline : (wedding?.timeline_list || [
            { time: '15:00', title: 'MISA', description: 'Ceremonia religiosa', icon_url: '/resources_canvas/images/5.svg' },
            { time: '16:30', title: 'ROMPEHIELOS', description: 'Cóctel de bienvenida', icon_url: '/resources_canvas/images/6.svg' },
            { time: '17:30', title: 'BRINDIS', description: 'Brindis con los novios', icon_url: '/resources_canvas/images/7.svg' },
            { time: '18:30', title: 'CENA', description: 'Banquete de gala', icon_url: '/resources_canvas/images/8.svg' },
            { time: '20:00', title: 'FIESTA', description: 'Música y baile', icon_url: '/resources_canvas/images/9.svg' },
            { time: '02:00', title: 'CLAUSURA', description: 'Fin de la celebración', icon_url: '/resources_canvas/images/10.svg' },
        ]),
        rsvp_deadline: wedding?.rsvp_deadline ? wedding.rsvp_deadline.split('T')[0] : '',
        rsvp_notification_email: wedding?.rsvp_notification_email || '',
        notify_on_rsvp: wedding?.notify_on_rsvp ?? true,
        song_title: wedding?.song_title || '',
        song_artist: wedding?.song_artist || '',
        background_audio: null,
        delete_audio: false,
    });

    const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null);

    const defaultIconPresets = [
        { name: 'Misa', icon: '/resources_canvas/images/5.svg' },
        { name: 'Rompehielos', icon: '/resources_canvas/images/6.svg' },
        { name: 'Brindis', icon: '/resources_canvas/images/7.svg' },
        { name: 'Cena', icon: '/resources_canvas/images/8.svg' },
        { name: 'Fiesta', icon: '/resources_canvas/images/9.svg' },
        { name: 'Clausura', icon: '/resources_canvas/images/10.svg' },
    ];

    const handleIconUpload = async (index: number, file: File) => {
        if (!file) return;
        setUploadingIndex(index);
        try {
            const formData = new FormData();
            formData.append('icon', file);

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch('/admin/timeline/upload-icon', {
                method: 'POST',
                headers: {
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const result = await response.json();
            if (result.success && result.url) {
                const newTimeline = [...data.timeline];
                newTimeline[index].icon_url = result.url;
                setData('timeline', newTimeline);
            } else {
                setAlertModal({ open: true, title: 'Error al subir icono', message: result.message || 'No se pudo subir la imagen del icono.' });
            }
        } catch (err) {
            console.error('Error uploading icon:', err);
            setAlertModal({ open: true, title: 'Error de conexión', message: 'Hubo un error al subir el icono.' });
        } finally {
            setUploadingIndex(null);
        }
    };

    const moveTimelineItem = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= data.timeline.length) return;
        const newTimeline = [...data.timeline];
        const temp = newTimeline[index];
        newTimeline[index] = newTimeline[targetIndex];
        newTimeline[targetIndex] = temp;
        setData('timeline', newTimeline);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert comma separated strings to arrays for JSON storage
        const payload = {
            ...data,
            bride_parents: data.bride_parents ? data.bride_parents.split(',').map((n: string) => n.trim()) : [],
            groom_parents: data.groom_parents ? data.groom_parents.split(',').map((n: string) => n.trim()) : [],
            bride_godparents: data.bride_godparents ? data.bride_godparents.split(',').map((n: string) => n.trim()) : [],
            groom_godparents: data.groom_godparents ? data.groom_godparents.split(',').map((n: string) => n.trim()) : [],
            _method: 'put',
        };

        router.post('/admin/settings', payload, {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Configuración de la Boda" />
            
            <div className="w-full px-4 md:px-8 py-8">
                <h1 className="text-3xl font-bold tracking-tight mb-8">
                    Configuración Principal de la Boda
                    {isPlanner && " (Modo Lectura)"}
                </h1>

                <form onSubmit={submit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border">
                    
                    {/* SECCIÓN: NOVIOS */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Los Novios</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre de la Novia</label>
                                <input type="text" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.bride_name} onChange={e => setData('bride_name', e.target.value)} required />
                                {errors.bride_name && <p className="text-red-500 text-sm mt-1">{errors.bride_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Novio</label>
                                <input type="text" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.groom_name} onChange={e => setData('groom_name', e.target.value)} required />
                                {errors.groom_name && <p className="text-red-500 text-sm mt-1">{errors.groom_name}</p>}
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: FECHA Y LUGARES */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Fecha y Lugares</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha del Evento</label>
                                <input type="date" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.wedding_date} onChange={e => setData('wedding_date', e.target.value)} required />
                                {errors.wedding_date && <p className="text-red-500 text-sm mt-1">{errors.wedding_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha Límite Confirmación (Opcional)</label>
                                <input type="date" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.rsvp_deadline} onChange={e => setData('rsvp_deadline', e.target.value)} />
                                {errors.rsvp_deadline && <p className="text-red-500 text-sm mt-1">{errors.rsvp_deadline}</p>}
                                <p className="text-xs text-zinc-500 mt-1">Si se llena, el formulario se cerrará esta fecha.</p>
                            </div>
                            <div className="col-span-1 md:col-span-3 h-px bg-zinc-200 my-2"></div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Lugar de Ceremonia</label>
                                    <input type="text" placeholder="Ej: Parroquia San José" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.locations.ceremony || ''} onChange={e => setData('locations', { ...data.locations, ceremony: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Google Maps</label>
                                        <input type="url" placeholder="https://maps.app.goo.gl/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm" value={data.locations.ceremony_maps || ''} onChange={e => setData('locations', { ...data.locations, ceremony_maps: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Waze</label>
                                        <input type="url" placeholder="https://waze.com/ul/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm" value={data.locations.ceremony_waze || ''} onChange={e => setData('locations', { ...data.locations, ceremony_waze: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Lugar de Recepción</label>
                                    <input type="text" placeholder="Ej: Jardín Los Pinos" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.locations.reception || ''} onChange={e => setData('locations', { ...data.locations, reception: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Google Maps</label>
                                        <input type="url" placeholder="https://maps.app.goo.gl/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm" value={data.locations.reception_maps || ''} onChange={e => setData('locations', { ...data.locations, reception_maps: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Waze</label>
                                        <input type="url" placeholder="https://waze.com/ul/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm" value={data.locations.reception_waze || ''} onChange={e => setData('locations', { ...data.locations, reception_waze: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: NOTIFICACIONES DE CONFIRMACIÓN */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Avisos y Notificaciones de Confirmación</h3>
                        <div className="bg-[#fcfaf7] border border-[#e7dfd1] rounded-xl p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="notify_on_rsvp"
                                    checked={data.notify_on_rsvp}
                                    onChange={e => setData('notify_on_rsvp', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-[#28362e] focus:ring-[#698175] cursor-pointer"
                                />
                                <label htmlFor="notify_on_rsvp" className="text-sm font-medium text-zinc-800 cursor-pointer">
                                    Enviar notificación inmediata por correo cuando alguien confirme o responda su asistencia
                                    <span className="block text-xs text-zinc-500 font-normal mt-0.5">
                                        Las confirmaciones también se guardan en la campana de notificaciones de la barra superior del panel.
                                    </span>
                                </label>
                            </div>

                            {data.notify_on_rsvp && (
                                <div className="pt-2 pl-7">
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Correos de los Novios para recibir los avisos (Separados por coma)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ejemplo: novia@gmail.com, novio@gmail.com"
                                        className="w-full max-w-xl rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm"
                                        value={data.rsvp_notification_email}
                                        onChange={e => setData('rsvp_notification_email', e.target.value)}
                                    />
                                    {errors.rsvp_notification_email && (
                                        <p className="text-red-500 text-sm mt-1">{errors.rsvp_notification_email}</p>
                                    )}
                                    <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                                        ✨ Se enviará un correo elegante y brandeado con el nombre de los invitados, cuántos pases confirmaron, alergias alimentarias y el mensaje dedicatorio. Si se deja vacío, se enviará al correo de la cuenta administradora actual.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN: PADRES Y PADRINOS */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Padres y Padrinos <span className="text-sm font-normal text-zinc-500">(Separados por coma)</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padres de la Novia</label>
                                <input type="text" placeholder="Ej: Juan Pérez, María López" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.bride_parents} onChange={e => setData('bride_parents', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padres del Novio</label>
                                <input type="text" placeholder="Ej: Roberto Gómez, Laura Torres" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.groom_parents} onChange={e => setData('groom_parents', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padrinos de la Novia</label>
                                <input type="text" placeholder="Ej: Carlos Silva, Ana Martínez" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.bride_godparents} onChange={e => setData('bride_godparents', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padrinos del Novio</label>
                                <input type="text" placeholder="Ej: Luis Fernando, Carmen Vega" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.groom_godparents} onChange={e => setData('groom_godparents', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: INFORMACIÓN ADICIONAL */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Información Adicional</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Código de Vestimenta (Dress Code)</label>
                                <input type="text" placeholder="Ej: Formal, Etiqueta Rigurosa, Cóctel..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.dress_code || ''} onChange={e => setData('dress_code', e.target.value)} />
                            </div>
                            {/* SECCIÓN MESA DE REGALOS CONFIGURABLE */}
                            <div className="md:col-span-2 bg-[#fbf9f4] border border-[#ded8cd] rounded-xl p-4 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                    <span className="text-base font-bold text-[#2c4537]">🎁 Mesa de Regalos (Botón y Enlace Personalizables)</span>
                                    <span className="text-xs text-zinc-500 font-medium">Configura el texto del botón y su link directo</span>
                                </div>

                                {/* Mesa 1 */}
                                <div className="bg-white p-3.5 rounded-lg border border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 mb-1">Texto del Botón 1</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: LIVERPOOL, MESA DE REGALOS, NUESTRA MESA..."
                                            className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm uppercase"
                                            value={data.gift_registry_button_text || ''}
                                            onChange={e => setData('gift_registry_button_text', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 mb-1">Enlace / URL 1</label>
                                        <input
                                            type="text"
                                            placeholder="https://mesaderegalos.liverpool.com.mx/..."
                                            className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm"
                                            value={data.gift_registry_url || ''}
                                            onChange={e => setData('gift_registry_url', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Mesa 2 (Opcional) */}
                                <div className="bg-white p-3.5 rounded-lg border border-zinc-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 mb-1">Texto del Botón 2 (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: AMAZON, SEARS, PALACIO..."
                                            className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm uppercase"
                                            value={data.gift_registry_button_text_2 || ''}
                                            onChange={e => setData('gift_registry_button_text_2', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 mb-1">Enlace / URL 2 (Opcional)</label>
                                        <input
                                            type="text"
                                            placeholder="https://www.amazon.com.mx/..."
                                            className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm"
                                            value={data.gift_registry_url_2 || ''}
                                            onChange={e => setData('gift_registry_url_2', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* SECCIÓN MÚSICA DE FONDO */}
                            <div className="md:col-span-2 bg-[#fbf9f4] border border-[#ded8cd] rounded-xl p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-[#2c4537]">🎵 Música de Fondo de la Invitación</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 mb-1">Título de la Canción</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Resto de mi vida, A Thousand Years..." 
                                            className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#2c4537] focus:border-[#2c4537] text-sm" 
                                            value={data.song_title || ''} 
                                            onChange={e => setData('song_title', e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-700 mb-1">Artista / Intérprete</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Camila, Il Divo, Christina Perri..." 
                                            className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#2c4537] focus:border-[#2c4537] text-sm" 
                                            value={data.song_artist || ''} 
                                            onChange={e => setData('song_artist', e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-700">Subir Archivo de Audio (MP3, WAV, M4A, OGG)</label>
                                    <input 
                                        type="file" 
                                        accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/*" 
                                        className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#2c4537] focus:border-[#2c4537] text-sm bg-white" 
                                        onChange={e => {
                                            setData(prev => ({
                                                ...prev,
                                                background_audio: e.target.files ? e.target.files[0] : null,
                                                delete_audio: false
                                            }));
                                        }} 
                                    />
                                    {errors.background_audio && <p className="text-red-500 text-xs mt-1">{errors.background_audio}</p>}
                                </div>

                                {wedding?.music_url && !data.delete_audio && (
                                    <div className="bg-white border border-[#e8dfcf] rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                                                ✓ Canción actual activa: <strong>{wedding.song_title || 'Audio cargado'}</strong>
                                                {wedding.song_artist && <span className="text-stone-500">({wedding.song_artist})</span>}
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={() => setData('delete_audio', true)}
                                                className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline cursor-pointer"
                                            >
                                                Quitar canción
                                            </button>
                                        </div>
                                        <audio controls src={wedding.music_url} className="w-full h-8" />
                                    </div>
                                )}

                                {data.delete_audio && (
                                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5 rounded-lg flex items-center justify-between">
                                        <span>Se eliminará la canción actual al guardar los cambios.</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setData('delete_audio', false)}
                                            className="text-xs text-stone-600 underline font-medium"
                                        >
                                            Deshacer
                                        </button>
                                    </div>
                                )}

                                <p className="text-[11px] text-stone-500">
                                    💡 <strong>Reproducción:</strong> Al ingresar al sitio o tocar la pantalla, la canción comenzará a sonar con volumen equilibrado. Los invitados podrán pausarla o reactivarla en el reproductor de la invitación.
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Información de Transferencia Bancaria (Mesa de regalos en efectivo)</label>
                                <textarea rows="3" placeholder="Banco: BBVA&#10;Cuenta: 1234567890&#10;CLABE: 012345678901234567" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-[#698175] focus:border-[#698175]" value={data.bank_transfer_info} onChange={e => setData('bank_transfer_info', e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: ITINERARIO / TIMELINE */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-3 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-800">Itinerario del Evento (Timeline)</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Configura los hitos del día. Los círculos estarán conectados por una elegante línea en la invitación interactiva.
                                </p>
                            </div>
                            {!isPlanner && (
                                <button
                                    type="button"
                                    onClick={() => setData('timeline', [
                                        ...data.timeline,
                                        { time: '', title: '', description: '', icon_url: '/resources_canvas/images/5.svg' }
                                    ])}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#698175] text-white px-3.5 py-2 rounded-lg hover:bg-[#586e63] shadow-xs transition shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    Agregar Evento
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {data.timeline.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-xl bg-zinc-50 text-zinc-400 text-sm">
                                    No hay eventos en el itinerario aún. Haz clic en <strong>"+ Agregar Evento"</strong> para comenzar.
                                </div>
                            ) : (
                                data.timeline.map((event: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex flex-col lg:flex-row gap-5 items-start p-4 sm:p-5 bg-white border border-zinc-200 rounded-xl shadow-xs relative group hover:border-[#698175]/50 transition"
                                    >
                                        {/* Bloque Icono: Preview, Carga y Presets */}
                                        <div className="flex flex-row lg:flex-col items-center gap-3 shrink-0 w-full lg:w-36 pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-zinc-100 pr-0 lg:pr-3">
                                            <div className="w-16 h-16 rounded-full bg-[#748270] border-2 border-white/90 shadow-md flex items-center justify-center p-2.5 relative group/icon shrink-0">
                                                {event.icon_url ? (
                                                    <img
                                                        src={event.icon_url}
                                                        alt={event.title || 'Icono'}
                                                        className="w-full h-full object-contain filter drop-shadow-xs"
                                                    />
                                                ) : (
                                                    <span className="text-white/60 text-[10px] font-medium text-center">Sin icono</span>
                                                )}
                                                {uploadingIndex === index && (
                                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                                                        Subiendo...
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-start lg:items-center gap-1.5 w-full">
                                                {!isPlanner && (
                                                    <label className="cursor-pointer text-[11px] font-semibold text-[#526a5e] bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-md transition flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                        <span>Cargar Icono</span>
                                                        <input
                                                            type="file"
                                                            accept=".svg,.png,.jpg,.jpeg,.webp"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    handleIconUpload(index, e.target.files[0]);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}

                                                {/* Mini presets de iconos habituales */}
                                                <div className="w-full mt-1">
                                                    <span className="text-[10px] text-zinc-400 block mb-1 text-left lg:text-center font-medium">Predeterminados:</span>
                                                    <div className="flex flex-wrap lg:justify-center gap-1">
                                                        {defaultIconPresets.map((preset, pIdx) => (
                                                            <button
                                                                key={pIdx}
                                                                type="button"
                                                                title={`Usar icono: ${preset.name}`}
                                                                onClick={() => {
                                                                    const newTimeline = [...data.timeline];
                                                                    newTimeline[index].icon_url = preset.icon;
                                                                    setData('timeline', newTimeline);
                                                                }}
                                                                className={`w-6 h-6 rounded-full p-0.5 flex items-center justify-center transition border ${
                                                                    event.icon_url === preset.icon
                                                                        ? 'bg-[#55695f] border-zinc-900 ring-1 ring-zinc-700 shadow-xs'
                                                                        : 'bg-[#748270] border-transparent opacity-65 hover:opacity-100 hover:scale-105'
                                                                }`}
                                                            >
                                                                <img src={preset.icon} alt={preset.name} className="w-full h-full object-contain filter drop-shadow-xs" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bloque Campos: Hora, Título, Descripción */}
                                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-semibold text-zinc-600 mb-1">Hora del Evento</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 15:00 o 3:00 PM"
                                                    className="w-full rounded-lg border-zinc-300 shadow-xs px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm"
                                                    value={event.time}
                                                    onChange={e => {
                                                        const newTimeline = [...data.timeline];
                                                        newTimeline[index].time = e.target.value;
                                                        setData('timeline', newTimeline);
                                                    }}
                                                    required
                                                />
                                                <p className="text-[10px] text-zinc-400 mt-1">Formato 24h (15:00) o 12h (3:00 PM).</p>
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-zinc-600 mb-1">Título / Nombre</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: MISA, BRINDIS, CENA"
                                                    className="w-full rounded-lg border-zinc-300 shadow-xs px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm uppercase tracking-wide font-medium"
                                                    value={event.title}
                                                    onChange={e => {
                                                        const newTimeline = [...data.timeline];
                                                        newTimeline[index].title = e.target.value;
                                                        setData('timeline', newTimeline);
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-semibold text-zinc-600 mb-1">Descripción / Detalle (Opcional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Parroquia San Juan Bautista, Cóctel en el jardín..."
                                                    className="w-full rounded-lg border-zinc-300 shadow-xs px-3 py-2 border focus:ring-[#698175] focus:border-[#698175] text-sm"
                                                    value={event.description || ''}
                                                    onChange={e => {
                                                        const newTimeline = [...data.timeline];
                                                        newTimeline[index].description = e.target.value;
                                                        setData('timeline', newTimeline);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Botones de acción: Subir, Bajar, Eliminar */}
                                        {!isPlanner && (
                                            <div className="flex lg:flex-col items-center gap-1 self-end lg:self-start shrink-0 pt-1">
                                                <button
                                                    type="button"
                                                    disabled={index === 0}
                                                    onClick={() => moveTimelineItem(index, 'up')}
                                                    title="Mover hacia arriba"
                                                    className="p-1.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-25 rounded-md hover:bg-zinc-100 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={index === data.timeline.length - 1}
                                                    onClick={() => moveTimelineItem(index, 'down')}
                                                    title="Mover hacia abajo"
                                                    className="p-1.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-25 rounded-md hover:bg-zinc-100 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newTimeline = data.timeline.filter((_: any, i: number) => i !== index);
                                                        setData('timeline', newTimeline);
                                                    }}
                                                    title="Eliminar evento"
                                                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {!isPlanner && (
                        <div className="pt-6 flex justify-end gap-3">
                            <button 
                                type="submit" 
                                disabled={processing} 
                                className="bg-[#698175] text-white px-8 py-3 rounded-lg hover:bg-[#586e63] disabled:opacity-50 transition font-medium shadow-sm ring-1 ring-[#5a7064]/20"
                            >
                                {processing ? 'Guardando...' : 'Guardar Configuración'}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            <LuxuryModal
                open={alertModal.open}
                onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
                title={alertModal.title}
                description={alertModal.message}
                type="error"
            />
        </>
    );
}

WeddingForm.layout = () => ({
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Configuración de la Boda', href: '/admin/settings' }
    ],
});
