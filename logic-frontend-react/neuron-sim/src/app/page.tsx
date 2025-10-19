'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-bold tracking-tight"
        >
          Interactive Spiking Neuron Simulation
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 text-lg text-slate-300 max-w-2xl"
        >
          Watch causal structure & learning emerge from noise using STDP and intrinsic plasticity.
          Runs entirely in your browser. No account required.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <Link href="/neuron-sim">
            <Button className="text-lg px-6 py-6 rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Click to see neuron simulation
            </Button>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Simulation</h3>
            <p className="text-slate-400">
              Watch neurons fire, synapses strengthen, and networks learn in real-time with interactive controls.
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-2">STDP Learning</h3>
            <p className="text-slate-400">
              Spike-timing dependent plasticity allows networks to learn temporal patterns and logical operations.
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="text-3xl mb-4">🔬</div>
            <h3 className="text-xl font-semibold mb-2">No Setup Required</h3>
            <p className="text-slate-400">
              Everything runs in your browser. No downloads, no accounts, no server dependencies.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}