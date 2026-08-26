import { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export const metadata: Metadata = {
  title: "Panel de Control | FyDry",
  description: "Administra tus finanzas, cuentas, gastos, ingresos, presupuestos y deudas en FyDry.",
};

export default function DashboardPage() {
  return <DashboardLayout />;
}
