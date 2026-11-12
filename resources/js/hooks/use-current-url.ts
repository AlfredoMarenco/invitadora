import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
    startsWith?: boolean,
) => boolean;

export type IsCurrentOrParentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
) => boolean;

export type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: TIfTrue,
    ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

export type UseCurrentUrlReturn = {
    currentUrl: string;
    isCurrentUrl: IsCurrentUrlFn;
    isCurrentOrParentUrl: IsCurrentOrParentUrlFn;
    whenCurrentUrl: WhenCurrentUrlFn;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const page = usePage();
    const parsedPageUrl = new URL(
        page.url,
        typeof window !== 'undefined'
            ? window.location.origin
            : 'http://localhost',
    );
    const currentUrlPath = parsedPageUrl.pathname;

    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
        startsWith: boolean = false,
    ) => {
        const urlToCompare = currentUrl ?? currentUrlPath;
        const urlString = toUrl(urlToCheck);

        try {
            const targetUrl = new URL(
                urlString,
                typeof window !== 'undefined'
                    ? window.location.origin
                    : 'http://localhost',
            );
            const pathMatches = startsWith
                ? urlToCompare.startsWith(targetUrl.pathname)
                : targetUrl.pathname === urlToCompare;

            if (!pathMatches) {
                return false;
            }

            if (currentUrl === undefined && targetUrl.search) {
                for (const [key, val] of targetUrl.searchParams.entries()) {
                    if (parsedPageUrl.searchParams.get(key) !== val) {
                        return false;
                    }
                }
                return true;
            }

            if (
                currentUrl === undefined &&
                targetUrl.pathname === '/admin/invitations' &&
                !targetUrl.searchParams.has('tab') &&
                parsedPageUrl.searchParams.get('tab') === 'tables'
            ) {
                return false;
            }

            return true;
        } catch {
            return startsWith
                ? urlToCompare.startsWith(urlString)
                : urlString === urlToCompare;
        }
    };

    const isCurrentOrParentUrl: IsCurrentOrParentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) => {
        return isCurrentUrl(urlToCheck, currentUrl, true);
    };

    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };

    return {
        currentUrl: currentUrlPath,
        isCurrentUrl,
        isCurrentOrParentUrl,
        whenCurrentUrl,
    };
}
