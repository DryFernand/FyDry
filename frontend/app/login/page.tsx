import AuthCard from "@/components/auth/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión — FyDry",
  description: "Accede a tu cuenta de FyDry para gestionar tus gastos con tranquilidad.",
};

export default function LoginPage() {
  return <AuthCard initialView="login" />;
}
