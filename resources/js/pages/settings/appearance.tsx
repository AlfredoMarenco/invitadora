import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Mi Cuenta • Apariencia" />

            <h1 className="sr-only">Configuración de apariencia</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Apariencia del panel"
                    description="Elige entre modo claro, oscuro o automático según tu dispositivo"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Apariencia',
            href: editAppearance(),
        },
    ],
};
