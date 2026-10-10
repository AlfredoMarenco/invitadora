import React, { useState } from 'react';
import { router, Head } from '@inertiajs/react';
import Countdown from './Countdown';

export default function WeddingPage({ wedding, invitation }) {
    const [responses, setResponses] = useState(() => {
        const initial = {};
        if (invitation && invitation.guests) {
            invitation.guests.forEach(g => {
                initial[g.id] = g.is_attending;
            });
        }
        return initial;
    });

    const handleToggle = (id, value) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            guests: Object.entries(responses).map(([id, is_attending]) => ({
                id,
                is_attending: is_attending === true
            }))
        };

        router.put(`/rsvp/${invitation?.token}`, payload, { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-stone-50 font-serif text-stone-800">
            <Head title={`Boda de ${wedding.bride_name} y ${wedding.groom_name}`} />

            {/* Hero Section */}
            <div className="h-screen flex flex-col items-center justify-center bg-stone-100 text-center px-4">
                <h3 className="text-xl uppercase tracking-[0.2em] mb-4 text-stone-500">Nos casamos</h3>
                <h1 className="text-6xl md:text-8xl font-bold mb-8">
                    {wedding.bride_name} <br/> <span className="text-4xl">&amp;</span> <br/> {wedding.groom_name}
                </h1>
                <p className="text-xl tracking-widest">{new Date(wedding.wedding_date).toLocaleDateString()}</p>
            </div>

            {/* Countdown */}
            <Countdown targetDate={wedding.wedding_date} />

            {/* Event Details */}
            <div className="max-w-4xl mx-auto py-20 px-6 text-center">
                <h2 className="text-3xl font-bold mb-10">Detalles del Evento</h2>
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="bg-white p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-4">Ceremonia</h3>
                        <p className="mb-4">{wedding.locations?.ceremony || 'Iglesia principal'}</p>
                        <p className="text-stone-500 text-sm">4:00 PM</p>
                    </div>
                    <div className="bg-white p-8 shadow-sm">
                        <h3 className="text-xl font-bold mb-4">Recepción</h3>
                        <p className="mb-4">{wedding.locations?.reception || 'Salón de eventos'}</p>
                        <p className="text-stone-500 text-sm">6:00 PM</p>
                    </div>
                </div>
            </div>

            {/* Sección RSVP Condicional */}
            <div id="rsvp" className="bg-stone-200 py-20 px-4">
                <div className="max-w-xl mx-auto bg-white p-8 md:p-12 shadow-sm text-center">
                    {!invitation ? (
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Asistencia</h2>
                            <p className="text-stone-600">Por favor, revisa el enlace personalizado que te enviamos por WhatsApp para confirmar tu asistencia.</p>
                        </div>
                    ) : invitation.status === 'responded' ? (
                        <div>
                            <h2 className="text-3xl font-bold mb-4">¡Gracias por responder!</h2>
                            <p className="text-stone-600">Hemos guardado la confirmación de la familia <b>{invitation.name}</b>.</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm uppercase tracking-widest text-stone-500 mb-2">Confirmación de Asistencia</p>
                            <h2 className="text-3xl mb-6">Hola, {invitation.name}</h2>
                            <p className="text-stone-600 mb-8">Confirma la asistencia de cada integrante antes de la boda.</p>

                            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                                {invitation.guests.map(guest => (
                                    <div key={guest.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-stone-50 border border-stone-100 rounded">
                                        <div className="mb-3 sm:mb-0">
                                            <p className="font-bold text-lg">{guest.full_name}</p>
                                            <p className="text-xs uppercase tracking-widest text-stone-500">{guest.type === 'child' ? 'Niño/a' : 'Adulto'}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <label className={`flex flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer px-4 py-2 border rounded shadow-sm transition ${responses[guest.id] === true ? 'bg-stone-800 text-white' : 'bg-white text-stone-800 hover:bg-stone-100'}`}>
                                                <input 
                                                    type="radio" name={`guest_${guest.id}`} 
                                                    className="sr-only"
                                                    checked={responses[guest.id] === true}
                                                    onChange={() => handleToggle(guest.id, true)}
                                                />
                                                Sí voy
                                            </label>
                                            <label className={`flex flex-1 sm:flex-none items-center justify-center gap-2 cursor-pointer px-4 py-2 border rounded shadow-sm transition ${responses[guest.id] === false ? 'bg-stone-800 text-white' : 'bg-white text-stone-800 hover:bg-stone-100'}`}>
                                                <input 
                                                    type="radio" name={`guest_${guest.id}`}
                                                    className="sr-only"
                                                    checked={responses[guest.id] === false}
                                                    onChange={() => handleToggle(guest.id, false)}
                                                />
                                                No voy
                                            </label>
                                        </div>
                                    </div>
                                ))}

                                <button type="submit" className="w-full bg-stone-800 text-white uppercase tracking-widest py-4 mt-8 hover:bg-stone-900 transition">
                                    Enviar Confirmación
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-stone-800 text-stone-400 text-center py-8 text-sm">
                <p>&copy; {new Date().getFullYear()} Invitadora. Todos los derechos reservados.</p>
            </div>
        </div>
    );
}

// Remover cualquier layout persistente del starter kit
WeddingPage.layout = page => <>{page}</>;
