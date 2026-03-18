'use client'
import { ArrowLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();

    return (
      <header className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>
    )
}