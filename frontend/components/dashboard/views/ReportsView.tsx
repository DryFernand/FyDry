"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Printer,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function ReportsView() {
  const { t, language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 300);
  };

  const currentDate = new Date().toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Reglas de impresión para forzar que ninguna tabla ni sección se corte a la mitad */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .avoid-break,
          .report-section,
          table,
          tr,
          tbody,
          .recommendations-box {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Header bar en interfaz web (Oculto en PDF) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200/80 shadow-xs print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-semibold mb-2">
            <FileText className="w-3.5 h-3.5 text-zinc-700" />
            <span>{t.reports.audited}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            {t.reports.title}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {t.reports.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          <span>{t.reports.exportPdf}</span>
        </button>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-zinc-200/80 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0 print:space-y-6 print:w-full">
        {/* Document Formal Header */}
        <div className="report-section avoid-break flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-zinc-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                FD
              </div>
              <span className="font-extrabold text-xl tracking-tight text-zinc-950">
                FyDry Financial
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              Consolidated Audit & Intelligence Statement
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-zinc-600 space-y-0.5">
            <div>
              <span className="font-semibold text-zinc-900">{t.reports.periodLabel}</span>{" "}
              {t.reports.periodValue}
            </div>
            <div>
              <span className="font-semibold text-zinc-900">{t.reports.generatedOn}</span>{" "}
              {currentDate}
            </div>
            <div>
              <span className="font-semibold text-zinc-900">{t.reports.accountHolder}</span>{" "}
              Fernando Gómez
            </div>
          </div>
        </div>

        {/* SECTION 1: Resumen Ejecutivo de Flujo de Caja */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section1Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section1Desc}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">{t.reports.totalIncomes}</span>
              <div className="text-lg font-bold text-zinc-950">+$3,100.00</div>
              <div className="text-[10px] text-emerald-600 font-semibold">100% Recaudado</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">{t.reports.totalExpenses}</span>
              <div className="text-lg font-bold text-zinc-950">-$1,342.68</div>
              <div className="text-[10px] text-zinc-500">43.3% del total ingresado</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800">{t.reports.netOperatingFlow}</span>
              <div className="text-lg font-bold text-emerald-700">+$1,757.32</div>
              <div className="text-[10px] text-emerald-600 font-semibold">Superávit Mensual</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500">{t.reports.savingsRate}</span>
              <div className="text-lg font-bold text-zinc-950">56.68%</div>
              <div className="text-[10px] text-emerald-600 font-semibold">Grado Excelente</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Posición de Liquidez y Custodia Bancaria */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section2Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section2Desc}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
                  <th className="py-2.5 px-3 font-semibold">{t.reports.accountCol}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.reports.typeCol}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.reports.accountNumCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.balanceCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">BBVA Cuenta Principal</td>
                  <td className="py-2.5 px-3 text-zinc-600">Banco / Corriente</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">ES48 •••• 4821</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$3,420.50</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Santander Nómina & Ahorro</td>
                  <td className="py-2.5 px-3 text-zinc-600">Banco / Nómina</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">ES12 •••• 9920</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$1,450.00</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Revolut Tarjeta Débito</td>
                  <td className="py-2.5 px-3 text-zinc-600">Fintech / Tarjeta</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">•••• 9102</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$892.30</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Efectivo en Billetera</td>
                  <td className="py-2.5 px-3 text-zinc-600">Efectivo Físico</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">N/A</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$230.00</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-900 font-bold bg-zinc-50">
                  <td colSpan={3} className="py-2.5 px-3 text-zinc-950 uppercase">
                    {t.reports.totalCustody}
                  </td>
                  <td className="py-2.5 px-3 text-right text-sm text-zinc-950">
                    $5,992.80
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 3: Desglose Estructural de Gastos */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section3Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section3Desc}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
                  <th className="py-2.5 px-3 font-semibold">{t.reports.categoryCol}</th>
                  <th className="py-2.5 px-3 font-semibold">{t.reports.natureCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.spentCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.percentCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Vivienda & Servicios (Alquiler, Luz)</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-zinc-100 font-semibold">{t.reports.fixedNature}</span></td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$732.00</td>
                  <td className="py-2.5 px-3 text-zinc-600 text-right">54.5%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Alimentación & Supermercado</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-zinc-100 font-semibold">{t.reports.fixedNature}</span></td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$320.00</td>
                  <td className="py-2.5 px-3 text-zinc-600 text-right">23.8%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Transporte & Gasolina</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-zinc-100 font-semibold">{t.reports.fixedNature}</span></td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$145.00</td>
                  <td className="py-2.5 px-3 text-zinc-600 text-right">10.8%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Ocio & Restaurantes</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">{t.reports.variableNature}</span></td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$180.00</td>
                  <td className="py-2.5 px-3 text-zinc-600 text-right">13.4%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Suscripciones Digitales</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">{t.reports.variableNature}</span></td>
                  <td className="py-2.5 px-3 font-bold text-zinc-950 text-right">$48.00</td>
                  <td className="py-2.5 px-3 text-zinc-600 text-right">3.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Estructura de Pasivos y Deudas */}
        <div className="report-section avoid-break space-y-3">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section4Title}
            </h2>
            <p className="text-xs text-zinc-500">{t.reports.section4Desc}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
                  <th className="py-2.5 px-3 font-semibold">{t.reports.creditorCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.originalCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.remainingCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.quotaCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{t.reports.progressCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Préstamo Coche (Santander Consumer)</td>
                  <td className="py-2.5 px-3 text-zinc-600 text-right">$12,000.00</td>
                  <td className="py-2.5 px-3 font-bold text-rose-600 text-right">$4,800.00</td>
                  <td className="py-2.5 px-3 text-zinc-950 text-right">$260/mes</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold text-right">60.0%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-zinc-900">Tarjeta Crédito BBVA</td>
                  <td className="py-2.5 px-3 text-zinc-600 text-right">$1,500.00</td>
                  <td className="py-2.5 px-3 font-bold text-rose-600 text-right">$450.00</td>
                  <td className="py-2.5 px-3 text-zinc-950 text-right">$150/mes</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold text-right">70.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: Diagnóstico y Recomendaciones FyDry */}
        <div className="report-section avoid-break space-y-3 pt-2">
          <div className="border-b border-zinc-100 pb-2">
            <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wide">
              {t.reports.section5Title}
            </h2>
          </div>

          <div className="recommendations-box p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs text-zinc-700">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span>{t.reports.recommendation1}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span>{t.reports.recommendation2}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span>{t.reports.recommendation3}</span>
            </div>
          </div>
        </div>

        {/* Formal Footer Watermark */}
        <div className="report-section avoid-break pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-2">
          <span>{t.reports.footerWatermark}</span>
          <span>FyDry Financial Intelligence • Security Grade A+</span>
        </div>
      </div>
    </div>
  );
}
