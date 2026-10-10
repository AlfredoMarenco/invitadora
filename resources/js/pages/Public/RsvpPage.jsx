import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export default function RsvpPage({ invitation }) {
    const [responses, setResponses] = useState(() => {
        const initial = {};
        invitation.guests.forEach(g => {
            initial[g.id] = g.is_attending;
        });
        return initial;
    });
    
    const [allergies, setAllergies] = useState(() => {
        const initial = {};
        invitation.guests.forEach(g => {
            initial[g.id] = g.allergies || '';
        });
        return initial;
    });

    const [messageToCouple, setMessageToCouple] = useState(invitation.message_to_couple || '');

    const handleToggle = (id, value) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    const handleAllergy = (id, value) => {
        setAllergies(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            message_to_couple: messageToCouple,
            guests: Object.entries(responses).map(([id, is_attending]) => ({
                id,
                is_attending: is_attending === true,
                allergies: allergies[id] || null
            }))
        };

        router.put(`/rsvp/${invitation.token}`, payload);
    };

    if (invitation.status === 'responded') {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-serif text-stone-800">
                <div className="bg-white p-10 max-w-md w-full text-center shadow-sm">
                    <h2 className="text-2xl mb-4">¡Gracias por responder!</h2>
                    <p className="text-stone-600">Hemos guardado tu confirmación para la boda de {invitation.wedding.bride_name} y {invitation.wedding.groom_name}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex py-10 px-4 justify-center font-serif text-stone-800">
            <div className="bg-white p-8 md:p-12 max-w-xl w-full shadow-lg h-fit">
                <div className="text-center mb-10">
                    <p className="text-sm uppercase tracking-widest text-stone-500 mb-2">Confirmación de Asistencia</p>
                    <h1 className="text-3xl mb-4">Hola, {invitation.name}</h1>
                    <p className="text-stone-600 text-sm">Por favor confirma la asistencia de cada integrante antes del evento.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {invitation.guests.map(guest => (
                        <div key={guest.id} className="flex flex-col p-4 bg-stone-50 rounded border border-stone-100">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                                <div className="mb-3 sm:mb-0">
                                    <p className="font-bold text-lg">{guest.full_name}</p>
                                    <p className="text-xs uppercase tracking-widest text-stone-500">{guest.type === 'child' ? 'Niño/a' : 'Adulto'}</p>
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border rounded shadow-sm hover:bg-stone-100 transition">
                                        <input 
                                            type="radio" name={`guest_${guest.id}`} 
                                            className="accent-stone-800"
                                            checked={responses[guest.id] === true}
                                            onChange={() => handleToggle(guest.id, true)}
                                        />
                                        Sí voy
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border rounded shadow-sm hover:bg-stone-100 transition">
                                        <input 
                                            type="radio" name={`guest_${guest.id}`}
                                            className="accent-stone-800"
                                            checked={responses[guest.id] === false}
                                            onChange={() => handleToggle(guest.id, false)}
                                        />
                                        No voy
                                    </label>
                                </div>
                            </div>
                            
                            {responses[guest.id] === true && (
                                <div className="mt-2 pt-4 border-t border-stone-200">
                                    <label className="block text-sm text-stone-600 mb-1">Alergias o restricciones alimentarias (Opcional)</label>
                                    <input 
                                        type="text" 
                                        className="w-full border-stone-300 rounded focus:border-stone-800 focus:ring-0 p-2 text-sm"
                                        placeholder="Ej. Vegano, Alergia a nueces..."
                                        value={allergies[guest.id]}
                                        onChange={(e) => handleAllergy(guest.id, e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="pt-6 border-t border-stone-200">
                        <label className="block font-bold text-lg mb-2">Mensaje para los novios (Opcional)</label>
                        <p className="text-sm text-stone-600 mb-3">Déjales unas palabras, deseos o dedicatoria a la pareja.</p>
                        <textarea 
                            className="w-full border-stone-300 rounded focus:border-stone-800 focus:ring-0 p-3 text-sm min-h-[100px] resize-y"
                            placeholder="¡Felicidades! Que sean muy felices..."
                            value={messageToCouple}
                            onChange={(e) => setMessageToCouple(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="w-full bg-stone-800 text-white uppercase tracking-widest py-4 mt-8 hover:bg-stone-900 transition rounded shadow-md">
                        Enviar Confirmación
                    </button>
                </form>
            </div>
        </div>
    );
}
