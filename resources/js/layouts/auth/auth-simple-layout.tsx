import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#788e80] shadow-md ring-1 ring-[#698175]/30">
                                <AppLogoIcon className="size-9 object-contain" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="text-2xl font-serif font-bold text-[#28362e] dark:text-[#f4f6f4] tracking-wide">{title}</h1>
                            <p className="text-center font-serif text-sm text-muted-foreground tracking-wide">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
