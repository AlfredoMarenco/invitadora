import React from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';

interface WeddingFormProps {
    wedding: any;
}

export default function WeddingForm({ wedding }: WeddingFormProps) {
    const { auth } = usePage().props;
    const isPlanner = auth.user.role === 'wedding_planner';

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
        bank_transfer_info: wedding?.bank_transfer_info || '',
        dress_code: wedding?.dress_code || '',
        timeline: wedding?.timeline || [],
        rsvp_deadline: wedding?.rsvp_deadline ? wedding.rsvp_deadline.split('T')[0] : '',
        background_audio: null,
    });

    const submit = (e) => {
        e.preventDefault();
        
        // Convert comma separated strings to arrays for JSON storage
        const payload = {
            ...data,
            bride_parents: data.bride_parents ? data.bride_parents.split(',').map(n => n.trim()) : [],
            groom_parents: data.groom_parents ? data.groom_parents.split(',').map(n => n.trim()) : [],
            bride_godparents: data.bride_godparents ? data.bride_godparents.split(',').map(n => n.trim()) : [],
            groom_godparents: data.groom_godparents ? data.groom_godparents.split(',').map(n => n.trim()) : [],
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
                                <input type="text" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.bride_name} onChange={e => setData('bride_name', e.target.value)} required />
                                {errors.bride_name && <p className="text-red-500 text-sm mt-1">{errors.bride_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Novio</label>
                                <input type="text" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.groom_name} onChange={e => setData('groom_name', e.target.value)} required />
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
                                <input type="date" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.wedding_date} onChange={e => setData('wedding_date', e.target.value)} required />
                                {errors.wedding_date && <p className="text-red-500 text-sm mt-1">{errors.wedding_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha Límite Confirmación (Opcional)</label>
                                <input type="date" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.rsvp_deadline} onChange={e => setData('rsvp_deadline', e.target.value)} />
                                {errors.rsvp_deadline && <p className="text-red-500 text-sm mt-1">{errors.rsvp_deadline}</p>}
                                <p className="text-xs text-zinc-500 mt-1">Si se llena, el formulario se cerrará esta fecha.</p>
                            </div>
                            <div className="col-span-1 md:col-span-3 h-px bg-zinc-200 my-2"></div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Lugar de Ceremonia</label>
                                    <input type="text" placeholder="Ej: Parroquia San José" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.locations.ceremony} onChange={e => setData('locations', { ...data.locations, ceremony: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Google Maps</label>
                                        <input type="url" placeholder="https://maps.app.goo.gl/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black text-sm" value={data.locations.ceremony_maps || ''} onChange={e => setData('locations', { ...data.locations, ceremony_maps: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Waze</label>
                                        <input type="url" placeholder="https://waze.com/ul/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black text-sm" value={data.locations.ceremony_waze || ''} onChange={e => setData('locations', { ...data.locations, ceremony_waze: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Lugar de Recepción</label>
                                    <input type="text" placeholder="Ej: Jardín Los Pinos" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.locations.reception} onChange={e => setData('locations', { ...data.locations, reception: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Google Maps</label>
                                        <input type="url" placeholder="https://maps.app.goo.gl/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black text-sm" value={data.locations.reception_maps || ''} onChange={e => setData('locations', { ...data.locations, reception_maps: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Link Waze</label>
                                        <input type="url" placeholder="https://waze.com/ul/..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black text-sm" value={data.locations.reception_waze || ''} onChange={e => setData('locations', { ...data.locations, reception_waze: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: PADRES Y PADRINOS */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Padres y Padrinos <span className="text-sm font-normal text-zinc-500">(Separados por coma)</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padres de la Novia</label>
                                <input type="text" placeholder="Ej: Juan Pérez, María López" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.bride_parents} onChange={e => setData('bride_parents', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padres del Novio</label>
                                <input type="text" placeholder="Ej: Roberto Gómez, Laura Torres" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.groom_parents} onChange={e => setData('groom_parents', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padrinos de la Novia</label>
                                <input type="text" placeholder="Ej: Carlos Silva, Ana Martínez" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.bride_godparents} onChange={e => setData('bride_godparents', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Padrinos del Novio</label>
                                <input type="text" placeholder="Ej: Luis Fernando, Carmen Vega" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.groom_godparents} onChange={e => setData('groom_godparents', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: INFORMACIÓN ADICIONAL */}
                    <div>
                        <h3 className="text-lg font-bold border-b pb-2 mb-4">Información Adicional</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Código de Vestimenta (Dress Code)</label>
                                <input type="text" placeholder="Ej: Formal, Etiqueta Rigurosa, Cóctel..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.dress_code} onChange={e => setData('dress_code', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Enlace a Mesa de Regalos</label>
                                <input type="url" placeholder="https://..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.gift_registry_url} onChange={e => setData('gift_registry_url', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Música de Fondo (MP3, WAV)</label>
                                <input type="file" accept="audio/*" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" onChange={e => setData('background_audio', e.target.files[0])} />
                                {wedding?.background_audio_path && <p className="text-sm text-green-600 mt-1">✓ Audio actual cargado</p>}
                                {errors.background_audio && <p className="text-red-500 text-sm mt-1">{errors.background_audio}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Información de Transferencia Bancaria (Mesa de regalos en efectivo)</label>
                                <textarea rows="3" placeholder="Banco: BBVA&#10;Cuenta: 1234567890&#10;CLABE: 012345678901234567" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black" value={data.bank_transfer_info} onChange={e => setData('bank_transfer_info', e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: ITINERARIO / TIMELINE */}
                    <div>
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h3 className="text-lg font-bold text-zinc-800">Itinerario del Evento</h3>
                            {!isPlanner && (
                                <button type="button" onClick={() => setData('timeline', [...data.timeline, { time: '', title: '', description: '' }])} className="text-sm bg-black text-white px-3 py-1.5 rounded-md hover:bg-zinc-800 transition">
                                    + Agregar Evento
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {data.timeline.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic">No hay eventos en el itinerario aún.</p>
                            ) : (
                                data.timeline.map((event, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-4 items-start p-4 bg-zinc-50 border rounded-md relative group">
                                        <div className="w-full md:w-32 flex-shrink-0">
                                            <label className="block text-xs font-medium text-zinc-500 mb-1">Hora</label>
                                            <input type="time" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black text-sm" value={event.time} onChange={e => {
                                                const newTimeline = [...data.timeline];
                                                newTimeline[index].time = e.target.value;
                                                setData('timeline', newTimeline);
                                            }} required />
                                        </div>
                                        <div className="flex-1 space-y-3 w-full">
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Título</label>
                                                <input type="text" placeholder="Ej: Cóctel de Bienvenida" className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black text-sm" value={event.title} onChange={e => {
                                                    const newTimeline = [...data.timeline];
                                                    newTimeline[index].title = e.target.value;
                                                    setData('timeline', newTimeline);
                                                }} required />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-zinc-500 mb-1">Descripción (Opcional)</label>
                                                <input type="text" placeholder="Disfruta de unos canapés y bebidas..." className="w-full rounded-md border-zinc-300 shadow-sm px-3 py-2 border focus:ring-black focus:border-black text-sm" value={event.description} onChange={e => {
                                                    const newTimeline = [...data.timeline];
                                                    newTimeline[index].description = e.target.value;
                                                    setData('timeline', newTimeline);
                                                }} />
                                            </div>
                                        </div>
                                        {!isPlanner && (
                                            <button type="button" onClick={() => {
                                                const newTimeline = data.timeline.filter((_, i) => i !== index);
                                                setData('timeline', newTimeline);
                                            }} className="absolute top-2 right-2 text-zinc-400 hover:text-red-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {!isPlanner && (
                        <div className="pt-6 flex justify-end gap-3">
                            <button type="submit" disabled={processing} className="bg-black text-white px-8 py-3 rounded-md hover:bg-zinc-800 disabled:opacity-50 transition font-medium">
                                {processing ? 'Guardando...' : 'Guardar Configuración'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

WeddingForm.layout = ({ wedding }) => ({
    breadcrumbs: [
        { title: 'Bodas', href: '/admin/weddings' },
        { title: wedding ? 'Editar Boda' : 'Nueva Boda', href: '#' }
    ],
});
