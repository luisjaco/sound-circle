type Props = {
    children: React.ReactNode;
}

import NavigationFooter from "./components/NavigationFooter";

export default function MainLayout({ children }: Props) {
    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Header */}
            <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold text-white">
                        Sound<span className="text-[#1DB954]">Circle</span>
                    </h1>
                </div>
            </header>

            {children}

            <NavigationFooter />
        </div>
    );
}