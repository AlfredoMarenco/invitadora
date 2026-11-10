import React, { useState, useEffect } from 'react';
import InvitationMobile, { WeddingProps } from './InvitationMobile';
import InvitationDesktop from './InvitationDesktop';

export type { WeddingProps };

/**
 * Componente principal de Invitación (Punto de entrada de la ruta '/')
 * 
 * Separa automáticamente el código en dos archivos completamente independientes:
 * 1. InvitationMobile.tsx -> Versión móvil (intacta, terminada).
 * 2. InvitationDesktop.tsx -> Versión de escritorio (para trabajarla y personalizarla libremente).
 * 
 * Ambos responden al mismo enlace/URL sin cambiar la ruta:
 * - Detecta automáticamente si la pantalla es móvil (< 768px) o escritorio (>= 768px).
 * - Soporta forzar la vista en URL para desarrollo:
 *     http://localhost:8000/?view=mobile
 *     http://localhost:8000/?view=desktop
 */
export default function Invitation(props: WeddingProps) {
    const isMobileOrTabletDevice = () => {
        if (typeof window === 'undefined') return true;
        const ua = navigator.userAgent || '';
        const isPhoneOrTabletUA = /iPhone|iPod|iPad|Android|Mobile|Tablet|PlayBook|Silk|BlackBerry|IEMobile/i.test(ua);
        const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        if (isPhoneOrTabletUA || isIPadOS) return true;
        return window.innerWidth < 1024;
    };

    const [isDesktop, setIsDesktop] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const viewParam = params.get('view');
            if (viewParam === 'desktop') return true;
            if (viewParam === 'mobile') return false;

            if (isMobileOrTabletDevice()) return false;

            return window.innerWidth >= 1024;
        }
        return false;
    });

    useEffect(() => {
        const checkView = () => {
            const params = new URLSearchParams(window.location.search);
            const viewParam = params.get('view');
            if (viewParam === 'desktop') {
                setIsDesktop(true);
                return;
            }
            if (viewParam === 'mobile') {
                setIsDesktop(false);
                return;
            }

            if (isMobileOrTabletDevice()) {
                setIsDesktop(false);
                return;
            }

            setIsDesktop(window.innerWidth >= 1024);
        };

        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const handleChange = (e: MediaQueryListEvent) => {
            const params = new URLSearchParams(window.location.search);
            if (!params.get('view')) {
                if (isMobileOrTabletDevice()) {
                    setIsDesktop(false);
                } else {
                    setIsDesktop(e.matches);
                }
            }
        };

        checkView();
        mediaQuery.addEventListener('change', handleChange);
        window.addEventListener('resize', checkView);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
            window.removeEventListener('resize', checkView);
        };
    }, []);

    if (isDesktop) {
        return <InvitationDesktop {...props} />;
    }

    return <InvitationMobile {...props} />;
}
