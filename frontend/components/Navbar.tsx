"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <span className="font-bold text-sm tracking-tighter">FD</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-zinc-900">
            FyDry
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-600">
          <a
            href="#caracteristicas"
            className="hover:text-zinc-950 transition-colors duration-150"
          >
            Características
          </a>
          <a
            href="#simulador"
            className="hover:text-zinc-950 transition-colors duration-150"
          >
            Simulador
          </a>
          <a
            href="#comparativa"
            className="hover:text-zinc-950 transition-colors duration-150"
          >
            Beneficios
          </a>
          <a
            href="#precios"
            className="hover:text-zinc-950 transition-colors duration-150"
          >
            Precios
          </a>
          <a
            href="#faq"
            className="hover:text-zinc-950 transition-colors duration-150"
          >
            FAQ
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-zinc-700 hover:text-zinc-950 px-3 py-1.5 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="#empezar"
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
          >
            <span>Probar Gratis</span>
            <ArrowRight className="w-4 h-4" />
          </motion.a>
        </div>
      </div>
    </motion.header>
  );
}
