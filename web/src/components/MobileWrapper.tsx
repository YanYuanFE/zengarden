import React, { useEffect, useState } from 'react';
import { DeviceFrameset } from 'react-device-frameset';
import 'react-device-frameset/styles/marvel-devices.min.css'


export const MobileWrapper = ({ children }: { children: React.ReactNode }) => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkScreen = () => {
            // Check if window width is greater than typical mobile width (e.g. 768px for iPad/Tablets)
            setIsDesktop(window.innerWidth > 900);
        };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    console.log(isDesktop);
    if (!isDesktop) {
        return <>{children}</>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 py-10">
            <DeviceFrameset device="iPhone X" color="black">
                <div className="w-full h-full bg-cream overflow-y-auto scrollbar-hide pt-12">
                    {children}
                </div>
            </DeviceFrameset>
        </div>
    );
};
