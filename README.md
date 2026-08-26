# 🌿 FyDry — Ordena tus gastos, tranquiliza tu mente

> Plataforma financiera personal y empresarial minimalista diseñada con estética Geist, seguridad bancaria, protección contra fuerza bruta escalonada, autenticación Google/GitHub OAuth, sistema de Onboarding, auditoría patrimonial y exportación ejecutiva a PDF.

---

## 🚀 Tecnologías

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion (`motion/react`), Lucide React.
- **Backend**: FastAPI (Python 3.12+), SQLAlchemy 2.0, PostgreSQL (Supabase Pooler), Bcrypt, PyJWT, Google SMTP (`smtp.gmail.com`).
- **Despliegue**: Vercel (Frontend) & Supabase Cloud (Database).

---

## 🧭 Módulos del Sistema

1. **Autenticación & Seguridad**:
   - Registro con verificación de correo OTP de 6 dígitos vía Google SMTP.
   - Login con protección contra ataques de fuerza bruta escalonada (1m, 1h, 24h).
   - OAuth 2.0 oficial con **Google** y **GitHub**.
   - Recuperación de contraseña en 3 fases secuenciales con validación de código de seguridad.
2. **Onboarding & Recopilación de Datos**:
   - Flujo interactivo en 5 pasos (Datos personales, laborales, financieros, diagnóstico y canal de adquisición).
3. **Dashboard Principal**:
   - **Inicio**: Balance neto, flujo mensual, Paz Mental (98%) y movimientos recientes.
   - **Cuentas**: Liquidez en bancos, tarjetas, billeteras y efectivo.
   - **Gastos**: Desglose de gastos fijos necesarios vs variables y filtros por categoría.
   - **Ingresos**: Nóminas, clientes freelance y recurrencias.
   - **Presupuesto**: Límites mensuales con alertas preventivas al 85%+.
   - **Deudas**: Monitoreo de pasivos, amortización y cuotas mensuales.
   - **Reporte**: Informe financiero estructurado para exportación limpia a PDF.
4. **Configuración & i18n**:
   - Soporte multilingüe completo en **Español (ES)** e **Inglés (EN)** con `LanguageContext` reactivo y persistencia local.
   - Gestión de datos personales, permisos de notificaciones push, soporte directo por correo/WhatsApp y restablecimiento de fábrica de datos.

---

## 🛠️ Instalación y Desarrollo Local

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```
Accede a `http://localhost:3000`.

### 2. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation en `http://localhost:8000/docs`.
