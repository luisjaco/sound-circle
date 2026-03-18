type Props = {
    children: React.ReactNode;
}

import Logo from "@/components/Logo";
import Header from './components/Header';

export default function MainLayout({ children }: Props) {
    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Header */}
            <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10 flex justify-between">
                <div className="max-w-2xl  px-4 py-4 inline-flex items-center">
                    <h1 className="text-3xl font-bold text-white mr-1">
                        Sound<span className="text-[#1DB954]">Circle</span>
                    </h1>
                    <Logo 
                        size={40}
                    />
                </div>

                <Header />               
            </header>

            {children}
        </div>
    );
}