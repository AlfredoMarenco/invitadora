import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { PlusCircle, Users, Edit, Trash2 } from 'lucide-react';

export default function WeddingList({ weddings }) {
    return (
        <>
            <Head title="Mis Bodas" />
            
            <div className="flex flex-col gap-8 p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bodas</h1>
                        <p className="text-muted-foreground mt-2">Gestiona los eventos y sus invitaciones.</p>
                    </div>
                    <Link 
                        href="/admin/weddings/create" 
                        className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-zinc-800 transition"
                    >
                        <PlusCircle size={18} />
                        Nueva Boda
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {weddings.length === 0 ? (
                        <p className="text-muted-foreground col-span-3 py-8 border-dashed border-2 rounded-lg text-center">
                            No hay bodas registradas. ¡Crea la primera!
                        </p>
                    ) : (
                        weddings.map(wedding => (
                            <div key={wedding.id} className="border rounded-lg p-6 bg-white shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{wedding.bride_name} & {wedding.groom_name}</h3>
                                    <p className="text-sm text-zinc-500 mb-4">
                                        📅 {new Date(wedding.wedding_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <Link href={`/${wedding.slug}`} className="text-sm text-blue-600 hover:underline" target="_blank">
                                            Ver Landing Page
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Link 
                                            href={`/admin/weddings/${wedding.id}/invitations`}
                                            className="flex-1 bg-zinc-100 text-zinc-800 py-2 rounded text-center text-sm font-medium hover:bg-zinc-200 flex items-center justify-center gap-2"
                                        >
                                            <Users size={16} />
                                            Invitados
                                        </Link>
                                        <Link 
                                            href={`/admin/weddings/${wedding.id}/edit`}
                                            className="p-2 border rounded text-zinc-600 hover:bg-zinc-50"
                                        >
                                            <Edit size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

WeddingList.layout = {
    breadcrumbs: [
        { title: 'Bodas', href: '/admin/weddings' },
    ],
};
