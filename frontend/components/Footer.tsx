import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-12 text-zinc-500 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-3 group">
              <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-zinc-900/10 shrink-0">
                <Image
                  src="/FyDry.jpeg"
                  alt="FyDry Logo"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-base text-zinc-900 tracking-tight">
                FyDry
              </span>
            </Link>
            <p className="text-zinc-500 max-w-sm text-xs leading-relaxed">
              Ordena tus gastos, tranquiliza tu mente. La plataforma de gestión financiera minimalista diseñada para darte claridad sin estrés.
            </p>
            <div className="mt-4 text-[11px] text-zinc-400">
              © {new Date().getFullYear()} FyDry Inc. Todos los derechos reservados.
            </div>
          </div>

          {/* Column 1: Producto */}
          <div>
            <div className="font-semibold text-zinc-900 mb-3 uppercase tracking-wider text-[11px]">
              Producto
            </div>
            <ul className="space-y-2">
              <li><a href="#caracteristicas" className="hover:text-zinc-900 transition-colors">Características</a></li>
              <li><a href="#simulador" className="hover:text-zinc-900 transition-colors">Simulador de Ahorro</a></li>
              <li><a href="#precios" className="hover:text-zinc-900 transition-colors">Precios</a></li>
              <li><a href="#comparativa" className="hover:text-zinc-900 transition-colors">Comparativa</a></li>
            </ul>
          </div>

          {/* Column 2: Recursos */}
          <div>
            <div className="font-semibold text-zinc-900 mb-3 uppercase tracking-wider text-[11px]">
              Recursos
            </div>
            <ul className="space-y-2">
              <li><a href="#faq" className="hover:text-zinc-900 transition-colors">Preguntas Frecuentes</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Guía de Finanzas Zen</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">API Docs</a></li>
            </ul>
          </div>

          {/* Column 3: Legal & Seguridad */}
          <div>
            <div className="font-semibold text-zinc-900 mb-3 uppercase tracking-wider text-[11px]">
              Legal
            </div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Términos de Servicio</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Seguridad</a></li>
              <li><a href="#" className="hover:text-zinc-900 transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Todos los sistemas operando normalmente (100% Uptime)</span>
          </div>
          <div>Diseñado para la calma financiera.</div>
        </div>
      </div>
    </footer>
  );
}
