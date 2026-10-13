import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/resources_canvas/images/15.svg"
            alt="Monograma AJ"
            className={`object-contain select-none pointer-events-none scale-110 ${className || 'size-6'}`}
            {...props}
        />
    );
}
