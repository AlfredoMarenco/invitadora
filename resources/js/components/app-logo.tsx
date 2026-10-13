import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[#698175] text-white shadow-sm ring-1 ring-[#5a7064]/20 transition-transform group-hover:scale-105 overflow-hidden">
                <AppLogoIcon className="size-7 object-contain" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-serif font-bold text-[#28362e] dark:text-[#f3f6f4] tracking-wide text-sm">
                    {name || 'Invitadora'}
                </span>
                <span className="truncate font-serif text-[10px] text-[#698175] dark:text-[#8ba495] tracking-[0.2em] uppercase font-semibold">
                    Panel de Boda
                </span>
            </div>
        </>
    );
}
