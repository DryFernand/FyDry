import AuthCard from "@/components/auth/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Cuenta — FyDry",
  description: "Regístrate en FyDry y ordena tus finanzas personales sin estrés.",
};

export default function RegisterPage() {
  return <AuthCard initialView="register" />;
}
