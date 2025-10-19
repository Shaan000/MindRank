'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TopNav() {
  return (
    <nav className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white">
              🧠 Neuron Sim
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
