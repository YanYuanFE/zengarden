import React, { useEffect, useState } from 'react';

export const MobileWrapper = ({ children }: { children: React.ReactNode }) => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkScreen = () => {
            setIsDesktop(window.innerWidth > 900);
        };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    if (!isDesktop) {
        return <>{children}</>;
    }

    return (
        <div className="flex justify-center h-screen bg-gray-100">
            <div className="w-full max-w-[430px] h-screen bg-cream overflow-y-auto">
                {children}
            </div>
        </div>
    );
};
