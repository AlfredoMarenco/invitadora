import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle2, Trash2, XCircle } from 'lucide-react';

export interface LuxuryModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    type?: 'warning' | 'info' | 'success' | 'danger' | 'error';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

export default function LuxuryModal({
    open,
    onClose,
    title,
    description,
    type = 'info',
    confirmText = 'Entendido',
    cancelText = 'Cancelar',
    onConfirm,
}: LuxuryModalProps) {
    const isConfirm = typeof onConfirm === 'function';

    const getIcon = () => {
        switch (type) {
            case 'danger':
            case 'error':
                return <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 text-[#8f6d28] dark:text-[#cfbe95]" />;
        }
    };

    const getIconContainerStyle = () => {
        switch (type) {
            case 'danger':
            case 'error':
                return 'bg-rose-100/80 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60';
            case 'warning':
                return 'bg-amber-100/80 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60';
            case 'success':
                return 'bg-emerald-100/80 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60';
            case 'info':
            default:
                return 'bg-[#f4ecd8] dark:bg-stone-800 border-[#ded8cd] dark:border-stone-700';
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
            <DialogContent className="sm:max-w-[440px] bg-[#faf8f3] dark:bg-stone-900 border border-[#ded8cd] dark:border-stone-800 rounded-3xl p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center border shadow-xs ${getIconContainerStyle()}`}>
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <DialogHeader className="text-left space-y-1">
                            <DialogTitle className="font-serif font-bold text-lg text-[#2c4537] dark:text-[#f4ecd8] leading-snug">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                                {description}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <DialogFooter className="mt-5 pt-3 border-t border-[#ded8cd]/70 dark:border-stone-800 flex flex-row items-center justify-end gap-2">
                    {isConfirm && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="text-xs font-semibold h-9 px-4 rounded-xl border-[#ded8cd] dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className={`text-xs font-bold uppercase tracking-wider h-9 px-4.5 rounded-xl cursor-pointer transition-all shadow-sm ${
                            type === 'danger' || type === 'error'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-[#2c4537] hover:bg-[#385645] text-white'
                        }`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
