import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import LuxuryModal from '@/components/LuxuryModal';

interface WeddingFormProps {
    wedding: any;
}

export default function WeddingForm({ wedding }: WeddingFormProps) {
    const { auth } = usePage().props;
    const isPlanner = auth.user.role === 'wedding_planner';
    const [alertModal, setAlertModal] = useState<{
        open: boolean;
        title: string;
        message: string;
    }>({ open: false, title: '', message: '' });

    const { data, setData, post, put, processing, errors } = useForm({
        bride_name: wedding?.bride_name || '',
        groom_name: wedding?.groom_name || '',
        wedding_date: wedding ? wedding.wedding_date.split('T')[0] : '',
        locations: wedding?.locations || {
            ceremony: '',
            ceremony_maps: '',
            ceremony_waze: '',
            reception: '',
            reception_maps: '',
            reception_waze: '',
        },
        bride_parents: wedding?.bride_parents?.join(', ') || '',
        groom_parents: wedding?.groom_parents?.join(', ') || '',
        bride_godparents: wedding?.bride_godparents?.join(', ') || '',
        groom_godparents: wedding?.groom_godparents?.join(', ') || '',
        gift_registry_url: wedding?.gift_registry_url || '',
        gift_registry_button_text:
            wedding?.gift_registry_button_text || 'LIVERPOOL',
        gift_registry_url_2: wedding?.gift_registry_url_2 || '',
        gift_registry_button_text_2: wedding?.gift_registry_button_text_2 || '',
        bank_transfer_info: wedding?.bank_transfer_info || '',
        dress_code: wedding?.dress_code || '',
        timeline:
            wedding?.timeline && wedding.timeline.length > 0
                ? wedding.timeline
                : wedding?.timeline_list || [
                      {
                          time: '15:00',
                          title: 'MISA',
                          description: 'Ceremonia religiosa',
                          icon_url: '/resources_canvas/images/5.svg',
                      },
                      {
                          time: '16:30',
                          title: 'ROMPEHIELOS',
                          description: 'Cóctel de bienvenida',
                          icon_url: '/resources_canvas/images/6.svg',
                      },
                      {
                          time: '17:30',
                          title: 'BRINDIS',
                          description: 'Brindis con los novios',
                          icon_url: '/resources_canvas/images/7.svg',
                      },
                      {
                          time: '18:30',
                          title: 'CENA',
                          description: 'Banquete de gala',
                          icon_url: '/resources_canvas/images/8.svg',
                      },
                      {
                          time: '20:00',
                          title: 'FIESTA',
                          description: 'Música y baile',
                          icon_url: '/resources_canvas/images/9.svg',
                      },
                      {
                          time: '02:00',
                          title: 'CLAUSURA',
                          description: 'Fin de la celebración',
                          icon_url: '/resources_canvas/images/10.svg',
                      },
                  ],
        timeline_mode: wedding?.timeline_mode === 'items' ? 'items' : 'image',
        timeline_image_path: wedding?.timeline_image_path || '',
        rsvp_deadline: wedding?.rsvp_deadline
            ? wedding.rsvp_deadline.split('T')[0]
            : '',
        rsvp_notification_email: wedding?.rsvp_notification_email || '',
        notify_on_rsvp: wedding?.notify_on_rsvp ?? true,
        song_title: wedding?.song_title || '',
        song_artist: wedding?.song_artist || '',
        background_audio: null as File | null,
        delete_audio: false,
        og_image: null as File | null,
        delete_og_image: false,
    });

    const [previewMode, setPreviewMode] = useState<'guest' | 'general'>(
        'guest',
    );
    const [localOgPreviewUrl, setLocalOgPreviewUrl] = useState<string | null>(
        null,
    );

    React.useEffect(() => {
        if (!data.og_image) {
            setLocalOgPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(data.og_image);
        setLocalOgPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [data.og_image]);

    const previewSpanishDate = React.useMemo(() => {
        if (!data.wedding_date) return '20 de febrero de 2027';
        const parts = String(data.wedding_date)
            .slice(0, 10)
            .split('-')
            .map(Number);
        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2])
            return '20 de febrero de 2027';
        const months = [
            'enero',
            'febrero',
            'marzo',
            'abril',
            'mayo',
            'junio',
            'julio',
            'agosto',
            'septiembre',
            'octubre',
            'noviembre',
            'diciembre',
        ];
        return `${parts[2]} de ${months[parts[1] - 1] || 'febrero'} de ${parts[0]}`;
    }, [data.wedding_date]);

    const activeOgImageSrc = React.useMemo(() => {
        if (localOgPreviewUrl) return localOgPreviewUrl;
        if (!data.delete_og_image && wedding?.og_image_path) {
            return wedding.og_image_url || wedding.og_image_path;
        }
        return '/images/og-share.jpg?v=1';
    }, [
        localOgPreviewUrl,
        data.delete_og_image,
        wedding?.og_image_path,
        wedding?.og_image_url,
    ]);

    const previewHost =
        typeof window !== 'undefined' ? window.location.host : 'invitadora.com';
    const previewBride = (data.bride_name || 'Adriana').trim();
    const previewGroom = (data.groom_name || 'Joaquín').trim();
    const previewTitle =
        previewMode === 'guest'
            ? `Invitación para Familia Pérez López • Boda de ${previewBride} & ${previewGroom}`
            : `Boda de ${previewBride} & ${previewGroom} • Nuestra Invitación`;
    const previewDescription =
        previewMode === 'guest'
            ? `¡Nos casamos! Hemos reservado 3 pases en su honor · ${previewSpanishDate}`
            : `¡Nos casamos! Acompáñanos a celebrar nuestra boda · ${previewSpanishDate}`;

    const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(
        null,
    );

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

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch('/admin/timeline/upload-icon', {
                method: 'POST',
                headers: {
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    Accept: 'application/json',
                },
                body: formData,
            });

            const result = await response.json();
            if (result.success && result.url) {
                const newTimeline = [...data.timeline];
                newTimeline[index].icon_url = result.url;
                setData('timeline', newTimeline);
            } else {
                setAlertModal({
                    open: true,
                    title: 'Error al subir icono',
                    message:
                        result.message ||
                        'No se pudo subir la imagen del icono.',
                });
            }
        } catch (err) {
            console.error('Error uploading icon:', err);
            setAlertModal({
                open: true,
                title: 'Error de conexión',
                message: 'Hubo un error al subir el icono.',
            });
        } finally {
            setUploadingIndex(null);
        }
    };

    const [uploadingTimelineImage, setUploadingTimelineImage] = useState(false);

    const handleTimelineImageUpload = async (file: File) => {
        setUploadingTimelineImage(true);
        try {
            const fd = new FormData();
            fd.append('icon', file);
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const response = await fetch('/admin/timeline/upload-icon', {
                method: 'POST',
                headers: {
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    Accept: 'application/json',
                },
                body: fd,
            });
            const result = await response.json();
            if (result.success && result.url) {
                setData('timeline_image_path', result.url);
            } else {
                setAlertModal({
                    open: true,
                    title: 'Error al subir imagen',
                    message:
                        result.message ||
                        'No se pudo subir la imagen del itinerario.',
                });
            }
        } catch (err) {
            setAlertModal({
                open: true,
                title: 'Error de conexión',
                message: 'Hubo un error al subir la imagen del itinerario.',
            });
        } finally {
            setUploadingTimelineImage(false);
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
            bride_parents: data.bride_parents
                ? data.bride_parents.split(',').map((n: string) => n.trim())
                : [],
            groom_parents: data.groom_parents
                ? data.groom_parents.split(',').map((n: string) => n.trim())
                : [],
            bride_godparents: data.bride_godparents
                ? data.bride_godparents.split(',').map((n: string) => n.trim())
                : [],
            groom_godparents: data.groom_godparents
                ? data.groom_godparents.split(',').map((n: string) => n.trim())
                : [],
            _method: 'put',
        };

        router.post('/admin/settings', payload, {
            forceFormData: true,
            onSuccess: () => {
                setData((prev) => ({
                    ...prev,
                    background_audio: null,
                    delete_audio: false,
                    og_image: null,
                    delete_og_image: false,
                }));
            },
        });
    };

    return (
        <>
            <Head title="Configuración de la Boda" />

            <div className="w-full px-4 py-8 md:px-8">
                <h1 className="mb-8 text-3xl font-bold tracking-tight">
                    Configuración Principal de la Boda
                    {isPlanner && ' (Modo Lectura)'}
                </h1>

                <form
                    onSubmit={submit}
                    className="space-y-8 rounded-xl border bg-white p-8 shadow-sm"
                >
                    {/* SECCIÓN: NOVIOS */}
                    <div>
                        <h3 className="mb-4 border-b pb-2 text-lg font-bold">
                            Los Novios
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Nombre de la Novia
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.bride_name}
                                    onChange={(e) =>
                                        setData('bride_name', e.target.value)
                                    }
                                    required
                                />
                                {errors.bride_name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.bride_name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Nombre del Novio
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.groom_name}
                                    onChange={(e) =>
                                        setData('groom_name', e.target.value)
                                    }
                                    required
                                />
                                {errors.groom_name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.groom_name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: FECHA Y LUGARES */}
                    <div>
                        <h3 className="mb-4 border-b pb-2 text-lg font-bold">
                            Fecha y Lugares
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Fecha del Evento
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.wedding_date}
                                    onChange={(e) =>
                                        setData('wedding_date', e.target.value)
                                    }
                                    required
                                />
                                {errors.wedding_date && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.wedding_date}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Fecha Límite Confirmación (Opcional)
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.rsvp_deadline}
                                    onChange={(e) =>
                                        setData('rsvp_deadline', e.target.value)
                                    }
                                />
                                {errors.rsvp_deadline && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.rsvp_deadline}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-zinc-500">
                                    Si se llena, el formulario se cerrará esta
                                    fecha.
                                </p>
                            </div>
                            <div className="col-span-1 my-2 h-px bg-zinc-200 md:col-span-3"></div>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                                        Lugar de Ceremonia
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Parroquia San José"
                                        className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                        value={data.locations.ceremony || ''}
                                        onChange={(e) =>
                                            setData('locations', {
                                                ...data.locations,
                                                ceremony: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-500">
                                            Link Google Maps
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://maps.app.goo.gl/..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={
                                                data.locations.ceremony_maps ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData('locations', {
                                                    ...data.locations,
                                                    ceremony_maps:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-500">
                                            Link Waze
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://waze.com/ul/..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={
                                                data.locations.ceremony_waze ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData('locations', {
                                                    ...data.locations,
                                                    ceremony_waze:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                                        Lugar de Recepción
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Jardín Los Pinos"
                                        className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                        value={data.locations.reception || ''}
                                        onChange={(e) =>
                                            setData('locations', {
                                                ...data.locations,
                                                reception: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-500">
                                            Link Google Maps
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://maps.app.goo.gl/..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={
                                                data.locations.reception_maps ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData('locations', {
                                                    ...data.locations,
                                                    reception_maps:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-zinc-500">
                                            Link Waze
                                        </label>
                                        <input
                                            type="url"
                                            placeholder="https://waze.com/ul/..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={
                                                data.locations.reception_waze ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData('locations', {
                                                    ...data.locations,
                                                    reception_waze:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: NOTIFICACIONES DE CONFIRMACIÓN */}
                    <div>
                        <h3 className="mb-4 border-b pb-2 text-lg font-bold">
                            Avisos y Notificaciones de Confirmación
                        </h3>
                        <div className="space-y-4 rounded-xl border border-[#e7dfd1] bg-[#fcfaf7] p-5">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="notify_on_rsvp"
                                    checked={data.notify_on_rsvp}
                                    onChange={(e) =>
                                        setData(
                                            'notify_on_rsvp',
                                            e.target.checked,
                                        )
                                    }
                                    className="mt-1 h-4 w-4 cursor-pointer rounded border-zinc-300 text-[#28362e] focus:ring-[#698175]"
                                />
                                <label
                                    htmlFor="notify_on_rsvp"
                                    className="cursor-pointer text-sm font-medium text-zinc-800"
                                >
                                    Enviar notificación inmediata por correo
                                    cuando alguien confirme o responda su
                                    asistencia
                                    <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                                        Las confirmaciones también se guardan en
                                        la campana de notificaciones de la barra
                                        superior del panel.
                                    </span>
                                </label>
                            </div>

                            {data.notify_on_rsvp && (
                                <div className="pt-2 pl-7">
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                                        Correos de los Novios para recibir los
                                        avisos (Separados por coma)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ejemplo: novia@gmail.com, novio@gmail.com"
                                        className="w-full max-w-xl rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                        value={data.rsvp_notification_email}
                                        onChange={(e) =>
                                            setData(
                                                'rsvp_notification_email',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.rsvp_notification_email && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.rsvp_notification_email}
                                        </p>
                                    )}
                                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                                        ✨ Se enviará un correo elegante y
                                        brandeado con el nombre de los
                                        invitados, cuántos pases confirmaron,
                                        alergias alimentarias y el mensaje
                                        dedicatorio. Si se deja vacío, se
                                        enviará al correo de la cuenta
                                        administradora actual.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN: PADRES Y PADRINOS */}
                    <div>
                        <h3 className="mb-4 border-b pb-2 text-lg font-bold">
                            Padres y Padrinos{' '}
                            <span className="text-sm font-normal text-zinc-500">
                                (Separados por coma)
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Padres de la Novia
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Juan Pérez, María López"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.bride_parents}
                                    onChange={(e) =>
                                        setData('bride_parents', e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Padres del Novio
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Roberto Gómez, Laura Torres"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.groom_parents}
                                    onChange={(e) =>
                                        setData('groom_parents', e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Padrinos de la Novia
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Carlos Silva, Ana Martínez"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.bride_godparents}
                                    onChange={(e) =>
                                        setData(
                                            'bride_godparents',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Padrinos del Novio
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Luis Fernando, Carmen Vega"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.groom_godparents}
                                    onChange={(e) =>
                                        setData(
                                            'groom_godparents',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: INFORMACIÓN ADICIONAL */}
                    <div>
                        <h3 className="mb-4 border-b pb-2 text-lg font-bold">
                            Información Adicional
                        </h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Código de Vestimenta (Dress Code)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Formal, Etiqueta Rigurosa, Cóctel..."
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.dress_code || ''}
                                    onChange={(e) =>
                                        setData('dress_code', e.target.value)
                                    }
                                />
                            </div>
                            {/* SECCIÓN MESA DE REGALOS CONFIGURABLE */}
                            <div className="space-y-4 rounded-xl border border-[#ded8cd] bg-[#fbf9f4] p-4 md:col-span-2">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-base font-bold text-[#2c4537]">
                                        🎁 Mesa de Regalos (Botón y Enlace
                                        Personalizables)
                                    </span>
                                    <span className="text-xs font-medium text-zinc-500">
                                        Configura el texto del botón y su link
                                        directo
                                    </span>
                                </div>

                                {/* Mesa 1 */}
                                <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-white p-3.5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                                            Texto del Botón 1
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: LIVERPOOL, MESA DE REGALOS, NUESTRA MESA..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={
                                                data.gift_registry_button_text ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'gift_registry_button_text',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                                            Enlace / URL 1
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="https://mesaderegalos.liverpool.com.mx/..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={data.gift_registry_url || ''}
                                            onChange={(e) =>
                                                setData(
                                                    'gift_registry_url',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Mesa 2 (Opcional) */}
                                <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-white p-3.5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                                            Texto del Botón 2 (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: AMAZON, SEARS, PALACIO..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={
                                                data.gift_registry_button_text_2 ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'gift_registry_button_text_2',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                                            Enlace / URL 2 (Opcional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="https://www.amazon.com.mx/..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                            value={
                                                data.gift_registry_url_2 || ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'gift_registry_url_2',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* SECCIÓN MÚSICA DE FONDO */}
                            <div className="space-y-4 rounded-xl border border-[#ded8cd] bg-[#fbf9f4] p-4 md:col-span-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-[#2c4537]">
                                        🎵 Música de Fondo de la Invitación
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                                            Título de la Canción
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Resto de mi vida, A Thousand Years..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#2c4537] focus:ring-[#2c4537]"
                                            value={data.song_title || ''}
                                            onChange={(e) =>
                                                setData(
                                                    'song_title',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-bold text-zinc-700">
                                            Artista / Intérprete
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Camila, Il Divo, Christina Perri..."
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#2c4537] focus:ring-[#2c4537]"
                                            value={data.song_artist || ''}
                                            onChange={(e) =>
                                                setData(
                                                    'song_artist',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-zinc-700">
                                        Subir Archivo de Audio (MP3, WAV, M4A,
                                        OGG)
                                    </label>
                                    <input
                                        type="file"
                                        accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/*"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2c4537] focus:ring-[#2c4537]"
                                        onChange={(e) => {
                                            setData((prev) => ({
                                                ...prev,
                                                background_audio: e.target.files
                                                    ? e.target.files[0]
                                                    : null,
                                                delete_audio: false,
                                            }));
                                        }}
                                    />
                                    {errors.background_audio && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.background_audio}
                                        </p>
                                    )}
                                </div>

                                {wedding?.music_url && !data.delete_audio && (
                                    <div className="space-y-2 rounded-lg border border-[#e8dfcf] bg-white p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                                ✓ Canción actual activa:{' '}
                                                <strong>
                                                    {wedding.song_title ||
                                                        'Audio cargado'}
                                                </strong>
                                                {wedding.song_artist && (
                                                    <span className="text-stone-500">
                                                        ({wedding.song_artist})
                                                    </span>
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'delete_audio',
                                                        true,
                                                    )
                                                }
                                                className="cursor-pointer text-xs font-medium text-rose-600 hover:text-rose-800 hover:underline"
                                            >
                                                Quitar canción
                                            </button>
                                        </div>
                                        <audio
                                            controls
                                            src={wedding.music_url}
                                            className="h-8 w-full"
                                        />
                                    </div>
                                )}

                                {data.delete_audio && (
                                    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                                        <span>
                                            Se eliminará la canción actual al
                                            guardar los cambios.
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData('delete_audio', false)
                                            }
                                            className="text-xs font-medium text-stone-600 underline"
                                        >
                                            Deshacer
                                        </button>
                                    </div>
                                )}

                                <p className="text-[11px] text-stone-500">
                                    💡 <strong>Reproducción:</strong> Al
                                    ingresar al sitio o tocar la pantalla, la
                                    canción comenzará a sonar con volumen
                                    equilibrado. Los invitados podrán pausarla o
                                    reactivarla en el reproductor de la
                                    invitación.
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Información de Transferencia Bancaria (Mesa
                                    de regalos en efectivo)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Banco: BBVA&#10;Cuenta: 1234567890&#10;CLABE: 012345678901234567"
                                    className="w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-[#698175] focus:ring-[#698175]"
                                    value={data.bank_transfer_info}
                                    onChange={(e) =>
                                        setData(
                                            'bank_transfer_info',
                                            e.target.value,
                                        )
                                    }
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: VISTA PREVIA AL COMPARTIR ENLACE (WHATSAPP / REDES) */}
                    <div>
                        <div className="mb-5 border-b pb-2">
                            <h3 className="text-lg font-bold text-zinc-800">
                                Vista Previa al Compartir Enlace (WhatsApp y
                                Redes)
                            </h3>
                            <p className="mt-0.5 text-xs text-zinc-500">
                                Así se verá la tarjeta personalizada cuando
                                envíes el enlace de cada familia por WhatsApp,
                                iMessage o redes sociales.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                            {/* Controles de Imagen (Izquierda) */}
                            <div className="space-y-4 rounded-xl border border-[#ded8cd] bg-[#fbf9f4] p-5 lg:col-span-6">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-bold text-[#2c4537]">
                                        📸 Fotografía de Portada del Enlace
                                        (1200 × 630 px)
                                    </span>
                                    {wedding?.og_image_path &&
                                    !data.delete_og_image &&
                                    !data.og_image ? (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                            Personalizada activa
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
                                            Foto Hero predeterminada
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs leading-relaxed text-stone-600">
                                    Por defecto usamos la foto principal de los
                                    novios encuadrada en sus rostros. Si deseas
                                    usar otra fotografía, súbela aquí y el
                                    sistema la adaptará automáticamente a
                                    formato horizontal ligero (JPG &lt; 300 KB)
                                    compatible con WhatsApp.
                                </p>

                                {!isPlanner && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-zinc-700">
                                            Cambiar imagen de vista previa (JPG,
                                            PNG o WEBP)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2c4537] focus:ring-[#2c4537]"
                                            onChange={(e) => {
                                                const file =
                                                    e.target.files?.[0] || null;
                                                setData((prev) => ({
                                                    ...prev,
                                                    og_image: file,
                                                    delete_og_image: false,
                                                }));
                                            }}
                                        />
                                        {errors.og_image && (
                                            <p className="mt-1 text-xs text-red-500">
                                                {errors.og_image}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {data.og_image && (
                                    <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                                        <span className="truncate">
                                            Nueva foto seleccionada:{' '}
                                            <strong>
                                                {data.og_image.name}
                                            </strong>{' '}
                                            (recuerda guardar cambios)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData('og_image', null)
                                            }
                                            className="shrink-0 cursor-pointer text-xs font-semibold text-rose-700 hover:underline"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}

                                {!isPlanner &&
                                    wedding?.og_image_path &&
                                    !data.delete_og_image &&
                                    !data.og_image && (
                                        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#e8dfcf] bg-white p-3">
                                            <span className="text-xs text-stone-700">
                                                Tienes una imagen personalizada
                                                configurada.
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'delete_og_image',
                                                        true,
                                                    )
                                                }
                                                className="shrink-0 cursor-pointer text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                                            >
                                                Restaurar foto predeterminada
                                            </button>
                                        </div>
                                    )}

                                {data.delete_og_image && (
                                    <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                        <span>
                                            Se restaurará la foto predeterminada
                                            de los novios al guardar la
                                            configuración.
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    'delete_og_image',
                                                    false,
                                                )
                                            }
                                            className="shrink-0 cursor-pointer text-xs font-semibold text-stone-700 underline"
                                        >
                                            Deshacer
                                        </button>
                                    </div>
                                )}

                                <p className="text-[11px] text-stone-500">
                                    💡 <strong>Textos automáticos:</strong> El
                                    título, el nombre de cada familia, sus pases
                                    reservados y la fecha de la boda se
                                    personalizan automáticamente en cada enlace
                                    individual.
                                </p>
                            </div>

                            {/* Simulador en vivo estilo Burbuja de WhatsApp (Derecha) */}
                            <div className="space-y-2.5 lg:col-span-6">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                                        Simulador en vivo de WhatsApp
                                    </span>
                                    <div className="inline-flex rounded-lg border border-stone-300 bg-stone-100 p-0.5 text-xs">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPreviewMode('guest')
                                            }
                                            className={`cursor-pointer rounded-md px-2.5 py-1 font-semibold transition ${
                                                previewMode === 'guest'
                                                    ? 'bg-[#28362E] text-white shadow-2xs'
                                                    : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                        >
                                            Link de Invitado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPreviewMode('general')
                                            }
                                            className={`cursor-pointer rounded-md px-2.5 py-1 font-semibold transition ${
                                                previewMode === 'general'
                                                    ? 'bg-[#28362E] text-white shadow-2xs'
                                                    : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                        >
                                            Link General
                                        </button>
                                    </div>
                                </div>

                                {/* Fondo tipo chat de WhatsApp */}
                                <div className="rounded-2xl border border-[#ded8cd] bg-[#efeae2] p-4 shadow-inner sm:p-5">
                                    <div className="ml-auto max-w-md rounded-xl rounded-tr-xs border border-[#c6ecc0] bg-[#d9fdd3] p-1.5 shadow-sm">
                                        {/* Tarjeta Open Graph dentro de la burbuja */}
                                        <div className="overflow-hidden rounded-lg border border-black/5 bg-[#cfe9ba]/55">
                                            <div className="aspect-[1200/630] w-full overflow-hidden bg-stone-200">
                                                <img
                                                    src={activeOgImageSrc}
                                                    alt={previewTitle}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="space-y-0.5 bg-[#f0f2f5]/90 px-3 py-2">
                                                <p className="line-clamp-2 text-[13px] leading-snug font-semibold text-zinc-900">
                                                    {previewTitle}
                                                </p>
                                                <p className="line-clamp-2 text-[11.5px] leading-snug text-zinc-600">
                                                    {previewDescription}
                                                </p>
                                                <p className="truncate pt-0.5 text-[10.5px] text-zinc-400 lowercase">
                                                    {previewHost}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Texto del mensaje de WhatsApp debajo de la tarjeta */}
                                        <div className="px-2 pt-2 pb-1 text-[12.5px] leading-relaxed text-zinc-800">
                                            {previewMode === 'guest' ? (
                                                <span>
                                                    ¡Hola{' '}
                                                    <strong>
                                                        Familia Pérez López
                                                    </strong>
                                                    ! 👋 Nos casamos y hemos
                                                    reservado{' '}
                                                    <strong>3 pases</strong> en
                                                    su honor 🎫.{' '}
                                                    <span className="break-all text-[#027eb5] underline">
                                                        {`https://${previewHost}/public/rsvp/aB3x9Z`}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="break-all text-[#027eb5] underline">
                                                    {`https://${previewHost}/`}
                                                </span>
                                            )}
                                            <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-zinc-500">
                                                <span>18:00</span>
                                                <span className="font-bold tracking-tighter text-[#53bdeb]">
                                                    ✓✓
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN: ITINERARIO / TIMELINE */}
                    <div>
                        <div className="mb-6 flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-800">
                                    Itinerario del Evento (Timeline)
                                </h3>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    Configura los hitos del día. Los círculos
                                    estarán conectados por una elegante línea en
                                    la invitación interactiva.
                                </p>
                            </div>
                            {!isPlanner && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setData('timeline', [
                                            ...data.timeline,
                                            {
                                                time: '',
                                                title: '',
                                                description: '',
                                                icon_url:
                                                    '/resources_canvas/images/5.svg',
                                            },
                                        ])
                                    }
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#698175] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#586e63]"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    Agregar Evento
                                </button>
                            )}
                        </div>

                        <div className="mb-5 flex gap-2">
                            {[
                                { v: 'items', t: 'Por items (timeline)' },
                                { v: 'image', t: 'Una imagen' },
                            ].map((o) => (
                                <button
                                    key={o.v}
                                    type="button"
                                    disabled={isPlanner}
                                    onClick={() =>
                                        setData('timeline_mode', o.v)
                                    }
                                    className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${data.timeline_mode === o.v ? 'border-[#698175] bg-[#698175] text-white' : 'border-zinc-300 bg-white text-zinc-600 hover:border-[#698175]'}`}
                                >
                                    {o.t}
                                </button>
                            ))}
                        </div>

                        {data.timeline_mode === 'image' ? (
                            <div className="space-y-3">
                                <p className="text-xs text-zinc-500">
                                    Esta imagen reemplaza al timeline en la
                                    invitación (los items se conservan
                                    guardados). Se comprime automáticamente.
                                </p>
                                <div className="inline-block rounded-xl border bg-[#748270] p-4 shadow-xs">
                                    <img
                                        src={
                                            data.timeline_image_path ||
                                            '/images/canva_assets/itinerario_final.svg'
                                        }
                                        alt="Itinerario"
                                        className="max-h-96 object-contain"
                                    />
                                </div>
                                {!isPlanner && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadingTimelineImage}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file)
                                                handleTimelineImageUpload(file);
                                        }}
                                        className="block text-xs"
                                    />
                                )}
                                {uploadingTimelineImage && (
                                    <p className="text-xs text-zinc-500">
                                        Subiendo y comprimiendo...
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.timeline.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed bg-zinc-50 py-8 text-center text-sm text-zinc-400">
                                        No hay eventos en el itinerario aún. Haz
                                        clic en{' '}
                                        <strong>"+ Agregar Evento"</strong> para
                                        comenzar.
                                    </div>
                                ) : (
                                    data.timeline.map(
                                        (event: any, index: number) => (
                                            <div
                                                key={index}
                                                className="group relative flex flex-col items-start gap-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-[#698175]/50 sm:p-5 lg:flex-row"
                                            >
                                                {/* Bloque Icono: Preview, Carga y Presets */}
                                                <div className="flex w-full shrink-0 flex-row items-center gap-3 border-b border-zinc-100 pr-0 pb-3 lg:w-36 lg:flex-col lg:border-r lg:border-b-0 lg:pr-3 lg:pb-0">
                                                    <div className="group/icon relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-[#748270] p-2.5 shadow-md">
                                                        {event.icon_url ? (
                                                            <img
                                                                src={
                                                                    event.icon_url
                                                                }
                                                                alt={
                                                                    event.title ||
                                                                    'Icono'
                                                                }
                                                                className="h-full w-full object-contain drop-shadow-xs filter"
                                                            />
                                                        ) : (
                                                            <span className="text-center text-[10px] font-medium text-white/60">
                                                                Sin icono
                                                            </span>
                                                        )}
                                                        {uploadingIndex ===
                                                            index && (
                                                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-[10px] font-medium text-white">
                                                                Subiendo...
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex w-full flex-col items-start gap-1.5 lg:items-center">
                                                        {!isPlanner && (
                                                            <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-[#526a5e] transition hover:bg-stone-200">
                                                                <svg
                                                                    className="h-3.5 w-3.5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    Cargar Icono
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    accept=".svg,.png,.jpg,.jpeg,.webp"
                                                                    className="hidden"
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            e
                                                                                .target
                                                                                .files &&
                                                                            e
                                                                                .target
                                                                                .files[0]
                                                                        ) {
                                                                            handleIconUpload(
                                                                                index,
                                                                                e
                                                                                    .target
                                                                                    .files[0],
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        )}

                                                        {/* Mini presets de iconos habituales */}
                                                        <div className="mt-1 w-full">
                                                            <span className="mb-1 block text-left text-[10px] font-medium text-zinc-400 lg:text-center">
                                                                Predeterminados:
                                                            </span>
                                                            <div className="flex flex-wrap gap-1 lg:justify-center">
                                                                {defaultIconPresets.map(
                                                                    (
                                                                        preset,
                                                                        pIdx,
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                pIdx
                                                                            }
                                                                            type="button"
                                                                            title={`Usar icono: ${preset.name}`}
                                                                            onClick={() => {
                                                                                const newTimeline =
                                                                                    [
                                                                                        ...data.timeline,
                                                                                    ];
                                                                                newTimeline[
                                                                                    index
                                                                                ].icon_url =
                                                                                    preset.icon;
                                                                                setData(
                                                                                    'timeline',
                                                                                    newTimeline,
                                                                                );
                                                                            }}
                                                                            className={`flex h-6 w-6 items-center justify-center rounded-full border p-0.5 transition ${
                                                                                event.icon_url ===
                                                                                preset.icon
                                                                                    ? 'border-zinc-900 bg-[#55695f] shadow-xs ring-1 ring-zinc-700'
                                                                                    : 'border-transparent bg-[#748270] opacity-65 hover:scale-105 hover:opacity-100'
                                                                            }`}
                                                                        >
                                                                            <img
                                                                                src={
                                                                                    preset.icon
                                                                                }
                                                                                alt={
                                                                                    preset.name
                                                                                }
                                                                                className="h-full w-full object-contain drop-shadow-xs filter"
                                                                            />
                                                                        </button>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bloque Campos: Hora, Título, Descripción */}
                                                <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                                                    <div className="md:col-span-1">
                                                        <label className="mb-1 block text-xs font-semibold text-zinc-600">
                                                            Hora del Evento
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ej: 15:00 o 3:00 PM"
                                                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-xs focus:border-[#698175] focus:ring-[#698175]"
                                                            value={event.time}
                                                            onChange={(e) => {
                                                                const newTimeline =
                                                                    [
                                                                        ...data.timeline,
                                                                    ];
                                                                newTimeline[
                                                                    index
                                                                ].time =
                                                                    e.target.value;
                                                                setData(
                                                                    'timeline',
                                                                    newTimeline,
                                                                );
                                                            }}
                                                            required
                                                        />
                                                        <p className="mt-1 text-[10px] text-zinc-400">
                                                            Formato 24h (15:00)
                                                            o 12h (3:00 PM).
                                                        </p>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="mb-1 block text-xs font-semibold text-zinc-600">
                                                            Título / Nombre
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ej: MISA, BRINDIS, CENA"
                                                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium tracking-wide uppercase shadow-xs focus:border-[#698175] focus:ring-[#698175]"
                                                            value={event.title}
                                                            onChange={(e) => {
                                                                const newTimeline =
                                                                    [
                                                                        ...data.timeline,
                                                                    ];
                                                                newTimeline[
                                                                    index
                                                                ].title =
                                                                    e.target.value;
                                                                setData(
                                                                    'timeline',
                                                                    newTimeline,
                                                                );
                                                            }}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="md:col-span-3">
                                                        <label className="mb-1 block text-xs font-semibold text-zinc-600">
                                                            Descripción /
                                                            Detalle (Opcional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ej: Parroquia San Juan Bautista, Cóctel en el jardín..."
                                                            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-xs focus:border-[#698175] focus:ring-[#698175]"
                                                            value={
                                                                event.description ||
                                                                ''
                                                            }
                                                            onChange={(e) => {
                                                                const newTimeline =
                                                                    [
                                                                        ...data.timeline,
                                                                    ];
                                                                newTimeline[
                                                                    index
                                                                ].description =
                                                                    e.target.value;
                                                                setData(
                                                                    'timeline',
                                                                    newTimeline,
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Botones de acción: Subir, Bajar, Eliminar */}
                                                {!isPlanner && (
                                                    <div className="flex shrink-0 items-center gap-1 self-end pt-1 lg:flex-col lg:self-start">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index === 0
                                                            }
                                                            onClick={() =>
                                                                moveTimelineItem(
                                                                    index,
                                                                    'up',
                                                                )
                                                            }
                                                            title="Mover hacia arriba"
                                                            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-25"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M5 15l7-7 7 7"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index ===
                                                                data.timeline
                                                                    .length -
                                                                    1
                                                            }
                                                            onClick={() =>
                                                                moveTimelineItem(
                                                                    index,
                                                                    'down',
                                                                )
                                                            }
                                                            title="Mover hacia abajo"
                                                            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-25"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M19 9l-7 7-7-7"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newTimeline =
                                                                    data.timeline.filter(
                                                                        (
                                                                            _: any,
                                                                            i: number,
                                                                        ) =>
                                                                            i !==
                                                                            index,
                                                                    );
                                                                setData(
                                                                    'timeline',
                                                                    newTimeline,
                                                                );
                                                            }}
                                                            title="Eliminar evento"
                                                            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {!isPlanner && (
                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-[#698175] px-8 py-3 font-medium text-white shadow-sm ring-1 ring-[#5a7064]/20 transition hover:bg-[#586e63] disabled:opacity-50"
                            >
                                {processing
                                    ? 'Guardando...'
                                    : 'Guardar Configuración'}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            <LuxuryModal
                open={alertModal.open}
                onClose={() =>
                    setAlertModal((prev) => ({ ...prev, open: false }))
                }
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
        { title: 'Configuración de la Boda', href: '/admin/settings' },
    ],
});
