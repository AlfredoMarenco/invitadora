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
    const [isDesktop, setIsDesktop] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const viewParam = params.get('view');
            if (viewParam === 'desktop') return true;
            if (viewParam === 'mobile') return false;
            return window.innerWidth >= 768;
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

            setIsDesktop(window.innerWidth >= 768);
        };

        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handleChange = (e: MediaQueryListEvent) => {
            const params = new URLSearchParams(window.location.search);
            if (!params.get('view')) {
                setIsDesktop(e.matches);
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
