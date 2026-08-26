import AuthCard from "@/components/auth/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autenticación — FyDry",
  description: "Accede o regístrate en FyDry.",
};

export default function AuthPage() {
  return <AuthCard initialView="login" />;
}
