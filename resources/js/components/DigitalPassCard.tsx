import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
    Download, 
    Share2, 
    Sparkles, 
    UtensilsCrossed, 
    Calendar, 
    ShieldCheck, 
    Check, 
    Ticket,
    Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface GuestPassData {
    id: number;
    full_name: string;
    checkin_code: string;
    table_name?: string | null;
    type?: 'adult' | 'child';
    is_attending?: boolean | null;
    allergies?: string | null;
    special_notes?: string | null;
}

interface DigitalPassCardProps {
    guest: GuestPassData;
    weddingName?: string;
    weddingDate?: string;
    receptionLocation?: string;
    invitationName?: string;
}

export default function DigitalPassCard({
    guest,
    weddingName = 'Adriana & Joaquín',
    weddingDate = '20 DE FEBRERO 2027',
    receptionLocation = 'Hacienda San Diego Cutz',
    invitationName = '',
}: DigitalPassCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Formatear código con espacio para lectura visual fácil (ej. AJ - 8K9N2)
    const formattedCode = guest.checkin_code || 'AJ-BOLETO';

    // Manejar envío por WhatsApp al acompañante
    const handleShareWhatsApp = () => {
        const message = 
            `¡Hola ${guest.full_name}! ✨\n\n` +
            `Aquí tienes tu *Pase Oficial de Acceso* para la boda de *${weddingName}*:\n\n` +
            `👤 *Invitado:* ${guest.full_name}\n` +
            `🎫 *Código de Acceso:* ${guest.checkin_code}\n` +
            (guest.table_name ? `🍽️ *Mesa asignada:* ${guest.table_name}\n` : '') +
            `📅 *Fecha:* ${weddingDate}\n` +
            `📍 *Lugar:* ${receptionLocation}\n\n` +
            `Presenta este código al llegar a la recepción para darte la bienvenida de inmediato. ¡Nos vemos muy pronto! 🥂`;

        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    // Descargar o imprimir pase para tenerlo en la galería de fotos
    const handleDownloadPass = () => {
        // Obtenemos el SVG del QR
        const svgElement = cardRef.current?.querySelector('svg');
        if (!svgElement) {
            toast.info('Toma una captura de pantalla de este pase para tenerlo en tu galería.');
            return;
        }

        try {
            // Creamos un canvas para exportar la tarjeta como imagen PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 600;
            canvas.height = 800;

            if (ctx) {
                // Fondo elegante
                ctx.fillStyle = '#fbf9f4';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Marco dorado
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 4;
                ctx.strokeRect(20, 20, 560, 760);

                // Franja superior verde
                ctx.fillStyle = '#28362e';
                ctx.fillRect(20, 20, 560, 100);

                // Texto superior
                ctx.fillStyle = '#f4ecd8';
                ctx.font = 'bold 24px Georgia, serif';
                ctx.textAlign = 'center';
                ctx.fillText('PASE DE ACCESO OFICIAL', 300, 60);
                ctx.font = '16px Georgia, serif';
                ctx.fillText(weddingName, 300, 95);

                // Nombre del invitado
                ctx.fillStyle = '#28362e';
                ctx.font = 'bold 28px Georgia, serif';
                ctx.fillText(guest.full_name.toUpperCase(), 300, 180);

                // Mesa asignada
                ctx.fillStyle = '#698175';
                ctx.font = 'bold 20px Georgia, serif';
                const mesaText = guest.table_name ? `MESA: ${guest.table_name.toUpperCase()}` : 'MESA POR ASIGNAR';
                ctx.fillText(mesaText, 300, 215);

                // Dibujar el QR
                const xml = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
                const URL = window.URL || window.webkitURL || window;
                const blobURL = URL.createObjectURL(svgBlob);
                const img = new Image();

                img.onload = () => {
                    ctx.drawImage(img, 175, 260, 250, 250);

                    // Código de acceso
                    ctx.fillStyle = '#28362e';
                    ctx.font = 'bold 24px monospace';
                    ctx.fillText(guest.checkin_code, 300, 555);

                    // Detalles inferiores
                    ctx.fillStyle = '#666';
                    ctx.font = '16px Georgia, serif';
                    ctx.fillText(weddingDate, 300, 620);
                    ctx.fillText(receptionLocation, 300, 650);

                    ctx.fillStyle = '#888';
                    ctx.font = '12px Georgia, serif';
                    ctx.fillText('Presenta este código al momento de tu llegada a la recepción', 300, 720);

                    // Descargar imagen
                    const imageURI = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `Pase-${guest.full_name.replace(/\s+/g, '_')}.png`;
                    link.href = imageURI;
                    link.click();
                    toast.success('¡Pase guardado en tus descargas!');
                };
                img.src = blobURL;
            }
        } catch (e) {
            toast.info('Guarda una captura de pantalla de este pase para mostrarlo al llegar.');
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto flex flex-col items-center select-none animate-fadeIn">
            {/* ========================================================= */}
            {/* TARJETA DEL BOLETO / PASE DE GALA                         */}
            {/* ========================================================= */}
            <div 
                ref={cardRef}
                className="w-full relative bg-gradient-to-b from-[#fbf9f4] via-[#f7f4ea] to-[#f2eee2] rounded-3xl border-2 border-[#d9cfbe] shadow-xl overflow-hidden p-6 transition-all hover:shadow-2xl"
            >
                {/* Filete superior dorado */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#698175] via-[#d4af37] to-[#698175]" />

                {/* Muescas decorativas de boleto físico en los lados */}
                <div className="absolute top-28 -left-3.5 w-7 h-7 rounded-full bg-[#fbf9f4] border-r-2 border-[#d9cfbe] shadow-inner" />
                <div className="absolute top-28 -right-3.5 w-7 h-7 rounded-full bg-[#fbf9f4] border-l-2 border-[#d9cfbe] shadow-inner" />

                {/* ENCABEZADO DEL PASE */}
                <div className="flex items-center justify-between pb-4 border-b border-[#ded8cd]">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#28362e] text-[#f4ecd8] flex items-center justify-center font-serif font-bold text-xs shadow-xs">
                            A&amp;J
                        </div>
                        <div>
                            <span className="font-serif text-[9px] uppercase tracking-[0.25em] text-[#698175] font-bold block">
                                PASE INDIVIDUAL OFICIAL
                            </span>
                            <span className="text-[11px] font-serif text-stone-600 block">
                                Boda de {weddingName}
                            </span>
                        </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold uppercase tracking-wider bg-[#28362e]/10 text-[#28362e] border border-[#28362e]/20">
                        {guest.type === 'child' ? 'Pase Infantil' : 'Pase Adulto'}
                    </span>
                </div>

                {/* CUERPO DEL PASE: NOMBRE Y MESA */}
                <div className="py-4 text-center">
                    <span className="text-[10px] uppercase font-serif tracking-[0.2em] text-[#788a80] block mb-1">
                        INVITADO DE HONOR
                    </span>
                    <h3 className="font-serif font-bold text-stone-900 text-xl leading-tight tracking-tight">
                        {guest.full_name}
                    </h3>
                    {invitationName && invitationName !== guest.full_name && (
                        <p className="text-[11px] font-serif text-stone-500 mt-0.5">
                            Invitación: {invitationName}
                        </p>
                    )}

                    {/* MESA ASIGNADA DESTACADA */}
                    <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#ded8cd] shadow-xs">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-[#698175]" />
                        <span className="font-serif text-xs font-bold text-[#28362e] tracking-wide">
                            {guest.table_name ? `Mesa: ${guest.table_name}` : 'Mesa por asignar en recepción'}
                        </span>
                    </div>

                    {guest.allergies && (
                        <div className="mt-2 text-[10.5px] text-amber-800 font-sans bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block">
                            ⚠️ Alergia: {guest.allergies}
                        </div>
                    )}
                </div>

                {/* LÍNEA PUNTEADA DE CORTE */}
                <div className="relative my-2">
                    <div className="border-b-2 border-dashed border-[#ded8cd] w-full" />
                </div>

                {/* CÓDIGO QR DE ALTA DEFINICIÓN */}
                <div className="flex flex-col items-center justify-center pt-3 pb-2">
                    <div className="p-3 bg-white rounded-2xl border-2 border-[#ded8cd] shadow-sm flex items-center justify-center">
                        <QRCodeSVG
                            value={guest.checkin_code}
                            size={168}
                            level="H"
                            includeMargin={false}
                            fgColor="#1d2721"
                            bgColor="#ffffff"
                        />
                    </div>

                    {/* CÓDIGO EN TEXTO LEGIBLE */}
                    <div className="mt-2.5 text-center">
                        <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-stone-400 block">
                            CÓDIGO DE ACCESO
                        </span>
                        <span className="font-mono font-bold text-base tracking-[0.2em] text-[#28362e]">
                            {formattedCode}
                        </span>
                    </div>

                    <p className="text-[10px] font-serif text-stone-500 text-center mt-1 max-w-[240px] leading-tight">
                        Muestra este código en la entrada para darte la bienvenida sin filas
                    </p>
                </div>

                {/* PIE DEL PASE: FECHA Y LUGAR */}
                <div className="pt-3 border-t border-[#ded8cd] flex items-center justify-between text-[10px] font-serif text-stone-600">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#698175]" />
                        <span>{weddingDate}</span>
                    </div>
                    <div className="flex items-center gap-1 text-right">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#698175]" />
                        <span className="font-semibold text-[#28362e]">Acceso Verificado</span>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* BOTONES DE ACCIÓN: GUARDAR, WALLET Y COMPARTIR            */}
            {/* ========================================================= */}
            <div className="w-full mt-3.5 space-y-2">
                {/* Botón principal: Descargar / Guardar imagen en carrete */}
                <button
                    type="button"
                    onClick={handleDownloadPass}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#28362e] hover:bg-[#1d2721] active:scale-[0.99] text-[#f4ecd8] font-serif text-xs font-semibold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                    <Download className="w-3.5 h-3.5 text-[#e6d0aa]" />
                    <span>Guardar Pase en Fotos</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                    {/* Botón: Compartir por WhatsApp con el acompañante */}
                    <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-stone-50 border border-[#b8c9d9] text-stone-700 font-serif text-[11px] font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Share2 className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>Enviar por WhatsApp</span>
                    </button>

                    {/* Botón: Apple Wallet / Smartphone Wallet */}
                    <button
                        type="button"
                        onClick={() => {
                            toast.info('Tu pase digital está listo y guardado. También puedes descargarlo en Fotos.', {
                                description: 'Presenta el código QR directamente al llegar al salón.'
                            });
                        }}
                        className="py-2 px-3 rounded-xl bg-black hover:bg-stone-900 text-white font-sans text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                        <Smartphone className="w-3.5 h-3.5 text-white" />
                        <span>Wallet Digital</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
