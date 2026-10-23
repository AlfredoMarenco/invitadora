import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
    Download, 
    Share2, 
    Sparkles, 
    UtensilsCrossed, 
    Calendar, 
    ShieldCheck, 
    Check, 
    Ticket,
    Smartphone,
    Eye,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from '@/components/ui/dialog';
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
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    // Modal de vista previa e instrucciones de guardado en iPhone / galería
    const [previewModal, setPreviewModal] = useState<{
        open: boolean;
        imageSrc: string;
    }>({
        open: false,
        imageSrc: '',
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    // Formatear código con espacio para lectura visual fácil (ej. AJ - 8K9N2)
    const formattedCode = guest.checkin_code || 'AJ-BOLETO';

    // Manejar enlace a Google Wallet
    const handleGoogleWallet = async () => {
        setIsSavingWallet(true);
        try {
            const res = await fetch(`/public/pass/${encodeURIComponent(guest.checkin_code || guest.id)}/google-wallet`, {
                headers: { 'Accept': 'application/json' },
            });
            const data = await res.json();

            if (data.success && data.url) {
                window.open(data.url, '_blank');
                toast.success('Abriendo pase en Google Wallet...');
            } else if (data.configured === false) {
                toast.info('Pase digital listo', {
                    description: 'Puedes guardarlo directamente en tu galería de Fotos con el botón superior.',
                });
            } else {
                toast.error(data.message || 'No se pudo conectar con Google Wallet');
            }
        } catch (e) {
            console.error('Error connecting to Google Wallet:', e);
            toast.info('Pase digital listo', {
                description: 'Puedes guardarlo en tu carrete de Fotos para tenerlo disponible sin conexión.',
            });
        } finally {
            setIsSavingWallet(false);
        }
    };

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

    // Descargar pase con alta fidelidad y compatibilidad total con iPhone (iOS) y Android/PC
    const handleDownloadPass = async () => {
        // Encontrar el canvas del QR exacto
        const qrCanvas = qrCanvasRef.current || cardRef.current?.querySelector('canvas');
        if (!qrCanvas) {
            toast.info('Preparando tu pase digital, intenta de nuevo en un segundo.');
            return;
        }

        setIsGenerating(true);

        try {
            // Creamos un canvas de alta definición para exportar la tarjeta como imagen PNG
            const canvas = document.createElement('canvas');
            const width = 700;
            const height = 980;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                setIsGenerating(false);
                return;
            }

            // 1. Fondo elegante crema de gala
            ctx.fillStyle = '#fbf9f4';
            ctx.fillRect(0, 0, width, height);

            // 2. Marco exterior dorado
            ctx.strokeStyle = '#cbb57b';
            ctx.lineWidth = 4;
            ctx.strokeRect(24, 24, width - 48, height - 48);

            // 3. Filete fino interior
            ctx.strokeStyle = '#e6dbc5';
            ctx.lineWidth = 1;
            ctx.strokeRect(32, 32, width - 64, height - 64);

            // 4. Franja superior verde bosque esmeralda
            ctx.fillStyle = '#28362e';
            ctx.fillRect(32, 32, width - 64, 120);

            // Acento dorado debajo de la franja
            ctx.fillStyle = '#cbb57b';
            ctx.fillRect(32, 150, width - 64, 3);

            // Texto cabecera
            ctx.fillStyle = '#f4ecd8';
            ctx.font = 'bold 22px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('PASE OFICIAL DE ACCESO', width / 2, 80);

            ctx.fillStyle = '#dcd2bd';
            ctx.font = 'italic 16px Georgia, serif';
            ctx.fillText(`Boda de ${weddingName}`, width / 2, 115);

            // 5. Invitado de Honor
            ctx.fillStyle = '#788a80';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('INVITADO DE HONOR', width / 2, 205);

            ctx.fillStyle = '#1d2721';
            ctx.font = 'bold 28px Georgia, serif';
            ctx.fillText(guest.full_name.toUpperCase(), width / 2, 245);

            // 6. Mesa Asignada
            const mesaText = guest.table_name ? `MESA: ${guest.table_name.toUpperCase()}` : 'MESA POR ASIGNAR EN RECEPCIÓN';
            ctx.fillStyle = '#eef4f0';
            const mesaBadgeW = Math.min(width - 100, ctx.measureText(mesaText).width + 50);
            ctx.fillRect((width - mesaBadgeW) / 2, 268, mesaBadgeW, 36);
            ctx.strokeStyle = '#b8d1c0';
            ctx.lineWidth = 1.5;
            ctx.strokeRect((width - mesaBadgeW) / 2, 268, mesaBadgeW, 36);

            ctx.fillStyle = '#28362e';
            ctx.font = 'bold 14px Georgia, serif';
            ctx.fillText(mesaText, width / 2, 292);

            // 7. Línea punteada de corte
            ctx.strokeStyle = '#cbb57b';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.moveTo(40, 335);
            ctx.lineTo(width - 40, 335);
            ctx.stroke();
            ctx.setLineDash([]); // reestablecer

            // 8. Contenedor blanco del Código QR
            const qrBoxSize = 300;
            const qrBoxX = (width - qrBoxSize) / 2;
            const qrBoxY = 360;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
            ctx.strokeStyle = '#ded8cd';
            ctx.lineWidth = 2;
            ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

            // 9. DIBUJAR EL QR EXACTO (Sincrónicamente desde el canvas de QR)
            // Esto garantiza que JAMÁS se confunda con el icono de cubiertos ni falle en iOS
            const qrPadding = 20;
            ctx.drawImage(
                qrCanvas, 
                qrBoxX + qrPadding, 
                qrBoxY + qrPadding, 
                qrBoxSize - (qrPadding * 2), 
                qrBoxSize - (qrPadding * 2)
            );

            // 10. Código de Acceso alfanumérico
            ctx.fillStyle = '#788a80';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('CÓDIGO DE ACCESO', width / 2, 695);

            ctx.fillStyle = '#1d2721';
            ctx.font = 'bold 24px monospace';
            ctx.fillText(guest.checkin_code || 'AJ-ACCESO', width / 2, 730);

            // 11. Instrucción
            ctx.fillStyle = '#666666';
            ctx.font = '13px Georgia, serif';
            ctx.fillText('Presenta este código al llegar a la recepción para ingresar sin filas', width / 2, 770);

            // Separador fino
            ctx.strokeStyle = '#ded8cd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, 805);
            ctx.lineTo(width - 60, 805);
            ctx.stroke();

            // 12. Pie de página: Fecha y Lugar
            ctx.fillStyle = '#28362e';
            ctx.font = 'bold 14px Georgia, serif';
            ctx.fillText(weddingDate, width / 2, 840);

            ctx.fillStyle = '#555555';
            ctx.font = '13px Georgia, serif';
            ctx.fillText(receptionLocation, width / 2, 870);

            ctx.fillStyle = '#8f6d28';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('✦ PASE INDIVIDUAL OFICIAL • ACCESO VERIFICADO ✦', width / 2, 925);

            // Generar imagen final
            const dataUrl = canvas.toDataURL('image/png');
            const sanitizedName = guest.full_name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
            const fileName = `Pase_${sanitizedName}.png`;

            // Detectar iOS (iPhone / iPad / iPod)
            const isIOS = typeof navigator !== 'undefined' && (
                /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
            );

            canvas.toBlob(async (blob) => {
                setIsGenerating(false);

                if (!blob) {
                    setPreviewModal({ open: true, imageSrc: dataUrl });
                    return;
                }

                const file = new File([blob], fileName, { type: 'image/png' });

                // EN IPHONE: Intentar primero Web Share API nativo de iOS
                // Abre el menú nativo de iOS donde la primera opción es "Guardar imagen" (directo al Carrete de Fotos)
                if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Pase de Acceso - ${guest.full_name}`,
                            text: `Pase oficial de acceso para la boda de ${weddingName}`,
                        });
                        toast.success('¡Pase listo y compartido!');
                        return;
                    } catch (shareErr: any) {
                        if (shareErr.name === 'AbortError') {
                            // Si el usuario canceló la hoja de compartir de iOS, le abrimos el modal de vista previa
                            setPreviewModal({ open: true, imageSrc: dataUrl });
                            return;
                        }
                    }
                }

                // Si NO es iPhone, o si Web Share no está disponible, descargar normalmente
                if (!isIOS) {
                    try {
                        const blobUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = fileName;
                        link.href = blobUrl;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                        toast.success('¡Pase guardado en tus descargas!');
                        return;
                    } catch (err) {
                        console.error('Error en descarga:', err);
                    }
                }

                // En iOS o en caso de bloqueo de descargas automáticas:
                // Desplegamos el modal visual con la instrucción clara de mantener presionado para Guardar en Fotos
                setPreviewModal({ open: true, imageSrc: dataUrl });

            }, 'image/png');

        } catch (e) {
            console.error('Error al generar pase:', e);
            setIsGenerating(false);
            toast.info('Toma una captura de pantalla a este pase para tenerlo en tu galería.');
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

                {/* CÓDIGO QR DE ALTA DEFINICIÓN (CANVAS SINCRÓNICO) */}
                <div className="flex flex-col items-center justify-center pt-3 pb-2">
                    <div className="p-3 bg-white rounded-2xl border-2 border-[#ded8cd] shadow-sm flex items-center justify-center">
                        <QRCodeCanvas
                            ref={qrCanvasRef}
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
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#28362e] hover:bg-[#1d2721] active:scale-[0.99] text-[#f4ecd8] font-serif text-xs font-semibold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
                >
                    <Download className="w-3.5 h-3.5 text-[#e6d0aa]" />
                    <span>{isGenerating ? 'Generando Pase...' : 'Guardar Pase en Fotos'}</span>
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

                    {/* Botón: Google Wallet */}
                    <button
                        type="button"
                        onClick={handleGoogleWallet}
                        disabled={isSavingWallet}
                        className="py-2 px-3 rounded-xl bg-black hover:bg-stone-900 text-white font-sans text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-70"
                    >
                        <Smartphone className="w-3.5 h-3.5 text-white" />
                        <span>{isSavingWallet ? 'Conectando...' : 'Google Wallet'}</span>
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MODAL DE VISTA PREVIA Y GUARDADO EN FOTOS (ESPECIAL IPHONE)*/}
            {/* ========================================================= */}
            <Dialog 
                open={previewModal.open} 
                onOpenChange={(open) => setPreviewModal(prev => ({ ...prev, open }))}
            >
                <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto p-5 text-center">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#28362e]">
                            Pase de Acceso Listo
                        </DialogTitle>
                        <DialogDescription className="font-serif text-xs text-stone-500">
                            Guarda tu pase oficial para tenerlo a mano en la recepción.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Instrucción visual para iPhone / Safari */}
                    <div className="bg-[#f7f5ed] border border-[#d9cfbe] rounded-xl p-3 text-stone-700 text-xs font-serif text-left flex items-start gap-2.5 my-2 shadow-2xs">
                        <span className="text-xl leading-none shrink-0">📱</span>
                        <div>
                            <strong className="block text-[#28362e] font-sans font-semibold text-[11.5px]">
                                ¿Cómo guardarlo en tu iPhone?
                            </strong>
                            <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                                <strong>Mantén presionada la imagen</strong> de abajo durante un segundo y selecciona <strong>«Guardar en Fotos»</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Vista previa de la imagen generada con el QR exacto */}
                    <div className="my-2 p-1.5 bg-white rounded-2xl border-2 border-[#ded8cd] shadow-md flex justify-center overflow-hidden">
                        <img 
                            src={previewModal.imageSrc} 
                            alt={`Pase de Acceso - ${guest.full_name}`}
                            className="w-full max-h-[50vh] object-contain rounded-xl select-all"
                        />
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                            <Button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const res = await fetch(previewModal.imageSrc);
                                        const blob = await res.blob();
                                        const file = new File([blob], `Pase_${guest.full_name}.png`, { type: 'image/png' });
                                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                                            await navigator.share({
                                                files: [file],
                                                title: `Pase de Acceso - ${guest.full_name}`,
                                                text: `Pase oficial para la boda de ${weddingName}`,
                                            });
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }}
                                className="bg-[#28362e] hover:bg-[#1d2721] text-[#f4ecd8] font-serif text-xs w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Share2 className="w-3.5 h-3.5 text-[#e6d0aa]" />
                                <span>Compartir / Guardar</span>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const link = document.createElement('a');
                                link.download = `Pase_${guest.full_name}.png`;
                                link.href = previewModal.imageSrc;
                                link.click();
                            }}
                            className="font-serif text-xs border-[#ded8cd] w-full sm:w-auto flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5 text-[#698175]" />
                            <span>Descargar Archivo</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setPreviewModal(prev => ({ ...prev, open: false }))}
                            className="text-stone-500 text-xs w-full sm:w-auto cursor-pointer"
                        >
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
