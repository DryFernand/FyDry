# Registro de Cambios y Documentación del Proyecto (Documentatio.md)

## [2026-08-26] - Inicialización de Frontend y Configuración del Backend con FastAPI & Supabase

### Frontend
- Proyecto Next.js inicializado en `frontend/` con App Router y TailwindCSS.

### Backend
- **Estructura Modular de FastAPI**: Creada estructura en `backend/app/` con separación clara de `core/`, `models/`, `schemas/`, `api/v1/` y `services/`.
- **Gestión de Configuración y Variables de Entorno**:
  - `backend/app/core/config.py`: Manejo tipado de variables con `pydantic-settings`.
  - `backend/.env` y `backend/.env.example`: Plantillas preparadas para Supabase (`DATABASE_URL`, `DATABASE_POOLER_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`).
- **Capa de Persistencia y ORM (SQLAlchemy 2.0)**:
  - `backend/app/core/database.py`: Creación del `engine` con `pool_pre_ping=True` y generador `get_db` para inyección de dependencias.
  - `backend/app/models/base.py` & `backend/app/models/__init__.py`: Modelo base y mixin de timestamps (`created_at`, `updated_at`).
- **Sistema de Migraciones (Alembic)**:
  - `backend/alembic.ini` y `backend/alembic/env.py`: Configuración dinámica enlazada con los modelos y `DATABASE_URL` para soporte de `--autogenerate`.
- **Rutas y Salud de Conexión**:
  - `backend/app/api/v1/endpoints/health.py`: Endpoints `/health` y `/health/db` para verificar la conectividad con Supabase PostgreSQL.
  - `backend/app/main.py`: Configuración de CORS y enrutamiento `/api/v1`.
- **Documentación**:
  - `backend/README.md`: Guía de instalación, ejecución y comandos de migración.

### MCP (Model Context Protocol)
- **Configuración de Servidores MCP**:
  - `.agent/mcp_config.json`: Añadidos los servidores MCP para **Supabase** (`@supabase/mcp-server`) con tokens de acceso/proyecto y **Vercel** (`@modelcontextprotocol/server-vercel`).
- **Verificación de Conexiones**:
  - **GitHub API**: Verificado exitosamente usuario `DryFernand`.
  - **Supabase Management API**: Verificado exitosamente proyecto `FyDry` (`ndatbgiedkbzejavvchu`) en estado `ACTIVE_HEALTHY` (región `us-east-1`).
  - **Vercel API**: Verificado exitosamente usuario `daryfernand7-5243` (`daryfernand7@gmail.com`).
  - `backend/.env`: Autocompletadas las claves `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` obtenidas de la API oficial de Supabase.

### Landing Page (Frontend - Tema Claro Estilo Vercel)
- **Identidad de Marca**:
  - Nombre: **FyDry**.
  - Eslogan: *"Ordena tus gastos, tranquiliza tu mente"*.
- **Diseño & Animaciones**:
  - Estética minimalista estilo Vercel en **Tema Claro puro** (fondos blancos `#ffffff`, bordes limpios `border-zinc-200`, micro-patrón de grilla y sombras etéreas).
  - Animaciones fluidas en **todas las secciones** utilizando `motion` (Framer Motion).
- **Componentes Creados**:
  - `frontend/components/Navbar.tsx`: Barra sticky con blur, isotipo y enlaces de navegación suave.
  - `frontend/components/Hero.tsx`: Headline de impacto, eslogan, badge con pulso y Mock interactivo del Dashboard (balance, categorías y transacciones).
  - `frontend/components/StatsBar.tsx`: Indicadores de impacto y tranquilidad financiera.
  - `frontend/components/BentoFeatures.tsx`: Bento Grid de características (IA, gastos hormiga, modo paz mental, metas).
  - `frontend/components/InteractiveCalculator.tsx`: Simulador interactivo en tiempo real de ahorro e índice de paz mental.
  - `frontend/components/ComparisonSection.tsx`: Tabla comparativa visual entre el método tradicional y FyDry.
  - `frontend/components/Pricing.tsx`: Planes Starter, Pro y Lifetime con toggle mensual/anual animado.
  - `frontend/components/FAQ.tsx`: Acordeón de preguntas frecuentes con `AnimatePresence`.
  - `frontend/components/CTASection.tsx`: Banner de llamada a la acción con captura de correo.
  - `frontend/components/Footer.tsx`: Pie de página minimalista estructurado.
- **Validación de Tipos**: Verificación completada con `npx tsc --noEmit` (0 errores).
- **Ajustes y Efectos Visuales en Hero**:
  - Eliminado el badge de texto superior para dar mayor protagonismo al headline principal.
  - Implementados componentes y tarjetas flotantes animadas con levitación continua (`motion`):
    - Tarjeta flotante de *Gasto Hormiga Detectado* (`-$24.50 Evitado`).
    - Tarjeta flotante de *Índice de Paz Mental* (`98.4% Zen`).
    - Badge flotante de *Categorización con IA en 0.2s*.
    - Badge flotante de *Ahorro Promedio Mensual* (`+$380`).
  - Optimización responsiva móvil del mockup del dashboard: reestructurada la barra de control con `flex-col sm:flex-row`, soporte de scroll horizontal suave en botones (`scrollbar-none` y `whitespace-nowrap`) y `overflow-hidden` contenedor para evitar desbordamientos en pantallas pequeñas.

### Directriz de Design System Oficial (FyDry Web & App)
- **Tema**: Claro puro (Light Mode exclusivo) estilo Vercel / Geist.
- **Paleta de Colores**:
  - Fondos: Blanco `#FFFFFF`, gris sutil `zinc-50` / `zinc-100/50`.
  - Tipografía & Contraste: `zinc-950` / `zinc-900` para títulos de alto impacto, `zinc-600` para textos secundarios.
  - Bordes & Delimitadores: `border-zinc-200` y `border-zinc-100`.
  - Acentos de Estado: `emerald-600` / `emerald-50` (Ahorro / Salud Financiera / Éxito), `amber-600` / `amber-50` (Gastos Hormiga / Alertas), `zinc-950` para elementos y botones principales.
- **Animaciones & Micro-interacciones**: Framer Motion (`motion`) mandatorio en todas las vistas y componentes.

### Sistema de Autenticación (Frontend - Login, Registro & Seguridad)
- **Componente Orquestador**:
  - `frontend/components/auth/AuthCard.tsx`: Manejo de vistas dinámicas con animación de traslado (`slideVariants` con `AnimatePresence` y efecto de desenfoque suave).
- **Componentes Creados**:
  - `frontend/components/auth/LoginForm.tsx`: Login con correo/contraseña, toggle de visibilidad, botones sociales (Google/GitHub), recordatorio de dispositivo y contador de intentos fallidos.
  - `frontend/components/auth/RegisterForm.tsx`: Registro con nombre completo, correo, confirmación, medidor interactivo de fuerza de contraseña y términos legales.
  - `frontend/components/auth/VerifyOtpView.tsx`: Validación de código de 6 dígitos con casillas auto-avanzables numéricas, soporte de pegado (`paste`), temporizador regresivo de reenvío y feedback de éxito.
  - `frontend/components/auth/ForgotPasswordForm.tsx`: Solicitud de restablecimiento de contraseña por correo electrónico y confirmación visual.
  - `frontend/components/auth/LockedAccountNotice.tsx`: Protección visual contra fuerza bruta con cuenta regresiva en tiempo real (60s) y barra de progreso animada antes del desbloqueo.
- **Rutas Implementadas**:
  - `frontend/app/login/page.tsx`: `/login` (Renderiza `AuthCard` en vista Login).
  - `frontend/app/register/page.tsx`: `/register` (Renderiza `AuthCard` en vista Registro).
  - `frontend/app/auth/page.tsx`: `/auth`.
- **Validación de Tipos**: Verificación completada con `npx tsc --noEmit` (0 errores).
### Sistema de Autenticación en Backend (FastAPI, Google SMTP & OAuth)
- **Modelos de Base de Datos (SQLAlchemy 2.0)**:
  - `backend/app/models/user.py`: Modelo `User` con campos de OAuth (`provider_id`, `auth_provider`), estado de verificación, intentos fallidos (`failed_login_attempts`) y timestamp de bloqueo temporal (`locked_until`).
  - `backend/app/models/otp.py`: Modelo `OtpCode` para tokens seguros de 6 dígitos con expiración y control de uso único.
- **Servicio de Correo con Google SMTP**:
  - `backend/app/services/email.py`: Envío asíncrono vía `smtp.gmail.com` (TLS puerto 587) con plantillas HTML minimalistas en tema claro para verificación de registro, login OTP, restablecimiento de contraseña y alertas de seguridad.
- **Servicio de OAuth (Google & GitHub)**:
  - `backend/app/services/oauth.py`: Validación de tokens de Google (`tokeninfo`) e intercambio/consulta de perfiles y correos primarios con GitHub API.
- **Endpoints de Autenticación (`/api/v1/auth`)**:
  - `POST /register`: Creación de usuario y despacho en background del OTP de 6 dígitos.
  - `POST /verify-email-otp`: Validación del OTP de 6 dígitos, activación de cuenta y retorno de JWT Bearer token.
  - `POST /resend-otp`: Reenvío de código OTP con regeneración segura.
  - `POST /login`: Validación con bloqueo automático tras 3 intentos fallidos (HTTP 423) y retorno de JWT.
  - `POST /forgot-password` & `POST /reset-password`: Flujo completo de recuperación de contraseña con código OTP.
  - `POST /google` & `POST /github`: Registro o inicio de sesión federado vía OAuth.
  - `GET /me`: Obtención de perfil del usuario autenticado.
- **Frontend Integration**:
  - `frontend/lib/api.ts` & `frontend/lib/auth.ts`: Cliente HTTP conectado a los endpoints de FastAPI con fallback inteligente en desarrollo.

### Resiliencia de Base de Datos y Supabase Pooler
- **Conexión IPv4 Compatible con Supabase**:
  - `backend/.env`: Actualizado `DATABASE_URL` para utilizar el **Supabase Connection Pooler** (`aws-0-us-east-1.pooler.supabase.com:6543`), evitando errores de resolución DNS IPv6 en redes residenciales Windows.
- **Auto-creación de Tablas & Fallback en Desarrollo**:
  - `backend/app/core/database.py` & `backend/app/main.py`: Integrado `init_db()` dentro del ciclo de vida `lifespan` de FastAPI para verificar y crear automáticamente las tablas `users` y `otp_codes`. Si la base de datos remota está pendiente de contraseña, conmuta automáticamente a SQLite local (`sqlite:///./fydry.db`) garantizando que el registro y login funcionen de inmediato sin arrojar errores 500.
- **Codificación Windows cp1252**: Limpiados caracteres unicode/emojis en los mensajes de consola de base de datos y envío de correos.
### Flujo de Autenticación OAuth (Google & GitHub)
- **Frontend Redirections & Callbacks**:
  - `frontend/lib/oauth.ts`: Generación de URLs de autorización con `client_id`, scopes y `redirect_uri` (`/auth/callback/google` y `/auth/callback/github`).
  - `frontend/app/auth/callback/[provider]/page.tsx`: Página de captura de código de autorización (`code`), llamada al backend para intercambio de credenciales, almacenamiento del JWT en `localStorage` y redirección automática.
  - Conexión interactiva en los botones sociales de `LoginForm.tsx` y `RegisterForm.tsx`.
### Verificación de Correo en Vivo (Google SMTP & OTP)
- **Flujo de Registro y Verificación**:
  - Al completar el formulario de registro (`RegisterForm.tsx`), el backend (`POST /api/v1/auth/register`) almacena el nuevo usuario en Supabase con `is_verified=False`, genera un código OTP numérico de 6 dígitos con tiempo de expiración y lo despacha de forma asíncrona mediante **Google SMTP**.
  - La interfaz traslada suavemente la vista a `VerifyOtpView.tsx` solicitando los 6 dígitos.
  - Al ingresar el código, el endpoint `POST /api/v1/auth/verify-email-otp` valida el OTP, marca la cuenta como verificada (`is_verified=True`), invalida el código y retorna el JWT Bearer token para el acceso inmediato.
- **Resolución de Compatibilidad de Hashing (Bcrypt Nativo)**:
### Política Escalonada de Bloqueo por Fuerza Bruta
- **Niveles de Seguridad Implementados**:
  - **Nivel 1 (5 intentos)**: Primeros 5 fallos -> Bloqueo temporal por **1 minuto** (60s).
  - **Nivel 2 (+2 intentos adicionales = 7 intentos)**: Tras el primer desbloqueo, si se vuelven a fallar 2 intentos más -> Bloqueo por **1 hora** (3600s).
  - **Nivel 3 (+1 intento adicional = 8 intentos)**: Tras el segundo desbloqueo, si se vuelve a fallar 1 intento más -> Bloqueo por **24 horas** (86400s).
### Rediseño del Flujo de Recuperación de Contraseña
- **Estructura Escalonada en 3 Fases**:
  - **Fase 1 (Solicitud)**: Ingreso de correo electrónico y despacho del código de seguridad de 6 dígitos vía Google SMTP.
  - **Fase 2 (Verificación de Código OTP)**: Integradas las 6 casillas numéricas individuales auto-avanzables con soporte de pegado (`paste`), temporizador de reenvío regresivo y validación contra `/api/v1/auth/verify-reset-otp` (idéntica apariencia y comportamiento a la pantalla de verificación de registro).
  - **Fase 3 (Nueva Contraseña)**: Tras validar exitosamente el código, la pantalla efectúa una transición animada para mostrar los inputs de *Nueva Contraseña* y *Confirmar Nueva Contraseña* con medidor dinámico de fortaleza, visibilidad interactiva y confirmación final de actualización.

### Sistema de Onboarding y Recopilación de Datos Iniciales
- **Modelos de Base de Datos y Esquemas**:
  - `backend/app/models/user_profile.py`: Modelo `UserProfile` vinculado 1:1 con `User` para almacenar datos personales (país, ciudad, teléfono, moneda), laborales (situación, industria), financieros (rango de ingresos, fuentes, frecuencia), diagnóstico económico y metas, y canal de adquisición.
  - `backend/app/models/user.py`: Añadida la columna `onboarding_completed` (Boolean default False) con auto-migración en `init_db()`.
  - `backend/app/schemas/onboarding.py`: Esquemas Pydantic para validación y serialización de datos de perfil y estado de onboarding.
- **Endpoints de Onboarding (`/api/v1/onboarding`)**:
  - `GET /api/v1/onboarding/status`: Verifica si el usuario actual ha completado el onboarding.
  - `POST /api/v1/onboarding/complete`: Guarda el perfil consolidado y actualiza `onboarding_completed = True`.
- **Frontend Multi-paso (Next.js & Framer Motion)**:
  - `frontend/app/onboarding/page.tsx`: Ruta protegida de onboarding.
  - `frontend/components/onboarding/OnboardingWizard.tsx`: Orquestador principal con barra de progreso superior animada por pasos e indicadores visuales.
  - `StepPersonal.tsx` (Paso 1): País, ciudad, WhatsApp y selector de moneda preferida (USD, EUR, MXN, COP, ARS, CLP).
  - `StepWork.tsx` (Paso 2): Situación laboral interactiva (Empleado, Freelance, Dueño de negocio, Estudiante) e industria.
  - `StepFinancial.tsx` (Paso 3): Rangos de ingresos, fuentes de ingreso seleccionables y frecuencia de cobro.
  - `StepGoals.tsx` (Paso 4): Diagnóstico de situación económica y selección múltiple de metas financieras.
  - `StepReferral.tsx` (Paso 5): Canal de descubrimiento de FyDry (TikTok, Instagram, recomendación, Google, etc.) y botón de finalización.
  - Redireccionamiento automático a `/onboarding` tras la verificación de OTP o autenticación con Google/GitHub.

### Aplicación Principal y Menú de Navegación (Dashboard)
- **Layout & Shell Modular**:
  - `frontend/components/dashboard/DashboardLayout.tsx`: Barra de navegación lateral fija (escritorio) y drawer colapsable (móvil) con tema claro Geist minimalista, micro-animaciones fluidas con `motion` e indicador de usuario.
- **Vistas del Menú Implementadas**:
  1. **Inicio** (`DashboardHome.tsx`): Balance general disponible, ingresos vs gastos del mes, ahorro neto generado, score de paz mental (98%), gráfico de categorías y lista de movimientos recientes.
  2. **Cuentas** (`AccountsView.tsx`): Gestión de cuentas bancarias, tarjetas de débito/crédito, billeteras y efectivo con modal interactivo para añadir nuevas cuentas.
  3. **Gastos** (`ExpensesView.tsx`): Desglose de gastos fijos vs variables, filtros por categorías, buscador en tiempo real y modal para registrar gastos.
  4. **Ingresos** (`IncomesView.tsx`): Registro y control de nóminas, proyectos freelance, inversiones y periodicidad de cobro.
  5. **Presupuesto** (`BudgetView.tsx`): Límites mensuales por categoría con cálculo en tiempo real de porcentaje consumido, alertas de sobregasto y ajuste de límites.
  6. **Deudas** (`DebtsView.tsx`): Monitoreo de pasivos, amortizaciones acumuladas, cuotas mensuales y tasas de interés.
- **Configuración y Cierre de Sesión**:
  - `SettingsModal.tsx`: Modal interactivo para ajuste de nombre, correo, moneda principal y alertas de facturación.
  - Botón de **Cerrar Sesión** con eliminación del token JWT en `localStorage` y redirección a `/login`.
- **Ruta de Acceso y Protección de Rutas (Route Guard)**:
  - `frontend/app/dashboard/page.tsx`: `/dashboard`.
  - **Auth Guard Estricto**: `DashboardLayout.tsx` valida la presencia y vigencia del token JWT contra `/api/v1/auth/me`. Si no existe sesión activa o el token expira, redirige de inmediato a `/login`.
- **Resiliencia de Red y Prevención de Cargas Infinitas**:
  - `frontend/lib/api.ts`: Añadido `AbortController` con timeout de seguridad de 9 segundos para evitar bloqueos indefinidos ante micro-cortes o reanudaciones de servidor.
### Módulo de Configuración Integral ([SettingsModal.tsx](file:///c:/Users/daryf/Documents/PORTAFOLIO/FyDry/frontend/components/dashboard/SettingsModal.tsx))
- **Arquitectura de 6 Pestañas Integradas**:
  1. **Datos Personales (`profile`)**: Edición de nombre completo, teléfono/WhatsApp, país, ciudad y confirmación visual instantánea.
  2. **Seguridad y Contraseña con OTP (`security`)**: Flujo embebido de cambio de contraseña en 3 fases: solicitud y envío de código de 6 dígitos vía Google SMTP, verificación OTP y actualización de nueva contraseña.
  3. **Idiomas y Moneda (`languages`)**: Selector de idioma (**Español [ES]** y **English [EN]**) y moneda principal (USD, EUR, MXN, COP, ARS, CLP).
  4. **Permisos y Notificaciones (`notifications`)**: Solicitud de permisos de notificaciones del navegador (Web Push API) y toggles para alertas de sobregasto (85%+), vencimiento de facturas y resumen semanal por correo.
  5. **Soporte & Contacto (`support`)**: Formulario de consulta directa con despacho a soporte (`daryfernand7@gmail.com`), chat directo de WhatsApp y preguntas frecuentes.
  6. **Restablecimiento de Datos (`danger`)**: Zona de seguridad para vaciar y resetear a cero transacciones, balances y presupuestos con doble confirmación preventiva.

### Contexto Global de Idioma (i18n ES/EN)
- **Proveedor y Hook React (`LanguageContext.tsx`)**:
  - `frontend/context/LanguageContext.tsx`: Implementado `LanguageProvider` y hook `useLanguage()` con soporte bilingüe reactivo para **Español (ES)** e **Inglés (EN)**.
  - Persistencia automática de la preferencia del usuario en `localStorage` (`fydry_language`).
- **Diccionario Centralizado (`translations.ts`)**:
  - `frontend/lib/translations.ts`: Diccionario estructurado y fuertemente tipado que abarca navegación lateral, todas las vistas del dashboard (*Inicio*, *Cuentas*, *Gastos*, *Ingresos*, *Presupuesto*, *Deudas*) y las 6 pestañas del modal de *Configuración*.
- **Integración Global**:
  - `frontend/app/layout.tsx`: Aplicación envuelta en `<LanguageProvider>`.
  - Al cambiar el idioma en la pestaña de Ajustes, toda la plataforma se actualiza instantáneamente en tiempo real sin recargar la página.

### Pantalla de Reportes Financieros y Exportación a PDF ([ReportsView.tsx](file:///c:/Users/daryf/Documents/PORTAFOLIO/FyDry/frontend/components/dashboard/views/ReportsView.tsx))
- **Estructura del Informe Consolidado**:
  - **Membrete Formal**: Período contable, fecha de emisión, titular de cuenta y sello de auditoría de FyDry.
  - **1. Resumen Ejecutivo de Flujo de Caja**: Métricas consolidadas de ingresos totales, egresos, superávit libre y tasa neta de capitalización.
  - **2. Posición de Liquidez y Custodia Bancaria**: Tabla detallada por entidad bancaria, tipo de cuenta, identificador y saldo total en custodia.
  - **3. Desglose Estructural de Gastos**: Clasificación de gastos por categoría y naturaleza (fija/necesaria vs discrecional/variable) con porcentajes de peso relativo.
  - **4. Estructura de Pasivos y Deudas**: Tabla de acreedores, principal original, saldo deudor, cuotas y porcentaje amortizado.
  - **5. Diagnóstico y Recomendaciones**: Insights automáticos de salud patrimonial.
- **Exportación Profesional a PDF**:
  - Botón interactivo de exportación a PDF con `@media print` que oculta barras de navegación, botones y estilos web para generar un PDF formal limpio y listo para impresión/descarga.
  - **Paginación Atómica (`break-inside: avoid`)**: Configurada la directiva CSS de impresión `break-inside: avoid !important` y `page-break-inside: avoid !important` en todas las secciones, tablas, filas y cards de recomendaciones. Si un bloque no cabe íntegro en la página actual, el navegador realiza un salto de página limpio y traslada la sección completa a la siguiente página, impidiendo que tablas o tarjetas queden cortadas por la mitad.
- **Sidebar Sticky de Altura Completa y Expansión Dinámica**:
  - `frontend/components/dashboard/DashboardLayout.tsx`: Actualizado el menú lateral a `h-screen sticky top-0 overflow-y-auto` para que permanezca anclado y visible en el 100% de la ventana durante scrolls extensos en cualquier pantalla.
  - Integrado botón de colapso/expansión animado con `motion` (`w-64` <-> `w-20`) para optimizar el espacio de trabajo en pantallas medianas y grandes.

### Lanzamiento V1 en Producción: Repositorio GitHub y Despliegue en Vercel
- **Repositorio Oficial en GitHub**:
  - URL del Repositorio: [https://github.com/DryFernand/FyDry](https://github.com/DryFernand/FyDry)
  - Rama Principal: `main` (código completo y sincronizado de Frontend, Backend, Onboarding, Dashboard, Reportes e i18n).
- **Despliegue y Hosting en Vercel**:
  - **Frontend (Next.js 16)**:
    - Proyecto Vercel: `fydry` (ID: `prj_I8IQ70NsKllDhxmwpGvrHZQrW8KK`)
    - URL de Producción: [https://fydry-dary.vercel.app](https://fydry-dary.vercel.app)
    - Aliases: `https://fydry.vercel.app` / `https://fydry-dary.vercel.app`
  - **Backend API (FastAPI Python Serverless)**:
    - Proyecto Vercel: `fydry-api` (ID: `prj_NyHVYOnGKO6ownwGHWPFcm6Dki0g`)
    - URL de Producción API: [https://fydry-api-dary.vercel.app](https://fydry-api-dary.vercel.app)
    - Health Check: [https://fydry-api-dary.vercel.app/api/v1/health](https://fydry-api-dary.vercel.app/api/v1/health)
    - Documentación OpenAPI / Swagger: [https://fydry-api-dary.vercel.app/api/v1/docs](https://fydry-api-dary.vercel.app/api/v1/docs)
- **Vinculación Completa Frontend & Backend en Producción**:
  - `NEXT_PUBLIC_API_URL` configurada en el frontend apuntando a `https://fydry-api-dary.vercel.app/api/v1`.
  - CORS configurado en FastAPI para autorizar `https://.*\.vercel\.app` con credenciales y cabeceras completas.
  - 27 variables de entorno inyectadas en el backend (PostgreSQL Supabase Pooler, Google SMTP, OAuth Google/GitHub y claves criptográficas JWT).

### Limpieza de Datos Simulados y Estado Inicial Limpio
- **Base de Datos Supabase PostgreSQL**: Vaciadas y reiniciadas a 0 registros las tablas `users`, `user_profiles` y `otp_codes` para garantizar un entorno virgen listo para el registro real del usuario.
- **Frontend Empty States**: Eliminados los arrays de prueba hardcodeados en `DashboardHome.tsx`, `AccountsView.tsx`, `ExpensesView.tsx`, `IncomesView.tsx`, `BudgetView.tsx`, `DebtsView.tsx` y `ReportsView.tsx`, inicializando todos los balances en `$0.00` con mensajes de bienvenida y estados vacíos intuitivos.
- **Despliegue Sincronizado**: Cambios empujados a la rama `main` de GitHub y desplegados a los proyectos `fydry` y `fydry-api` en Vercel.

### 2026-08-26 - Edición Universal, Catálogos Ampliados x5 y Filtros Inteligentes
- **Edición y Eliminación Universal en Cards y Filas**:
  - **Cuentas (`AccountsView.tsx`)**: Modal interactivo al hacer clic en cualquier tarjeta de cuenta para modificar nombre, tipo, saldo o eliminarla con confirmación.
  - **Gastos (`ExpensesView.tsx`)**: Modal interactivo al tocar cualquier fila de gasto para editar concepto, monto, categoría, cuenta debitada o borrar el registro.
  - **Ingresos (`IncomesView.tsx`)**: Modal interactivo al tocar cualquier fila de ingreso para modificar cliente/concepto, monto, categoría, cuenta receptora o eliminarlo.
  - **Presupuestos (`BudgetView.tsx`)**: Modal interactivo al hacer clic en cualquier tarjeta de presupuesto para ajustar el límite mensual o eliminar la meta.
  - **Deudas (`DebtsView.tsx`)**: Modal interactivo al tocar cualquier pasivo para editar saldo pendiente, cuota mensual, TIN o darlo de baja.
- **Catálogo de Categorías x5**:
  - Implementado archivo centralizado [`frontend/lib/categories.ts`](file:///c:/Users/daryf/Documents/PORTAFOLIO/FyDry/frontend/lib/categories.ts) con 25 categorías exhaustivas de gastos y 15 categorías de ingresos.
  - Sincronizado el catálogo de 25 categorías de gastos dentro de la creación y ajuste de presupuestos (`BudgetView.tsx`).
- **Selector de Cuentas Reales Creadas**:
  - Los formularios de Gastos e Ingresos ahora disponen de un menú desplegable `<select>` alimentado directamente por las cuentas creadas por el usuario.
- **Filtros Dinámicos Inteligentes**:
  - Los selectores de filtros en Gastos e Ingresos ahora despliegan exclusivamente las categorías en las que el usuario **realmente ha registrado movimientos**, evitando saturar con categorías vacías.
- **Persistencia Reactiva Local**: Sincronización continua de `localStorage` con eventos entre pestañas (`fydry_storage_updated`) para alimentar en tiempo real el Dashboard Home, las Cuentas y los Reportes auditados.

### 2026-08-26 - Persistencia Total en Base de Datos por Usuario, Gating de Onboarding y Sesión de 30 Días
- **Persistencia en PostgreSQL Supabase por `user_id`**:
  - Creados modelos SQLAlchemy y tablas: `accounts`, `transactions`, `budgets`, `debts` con claves foráneas asociadas al `user_id` del usuario autenticado.
  - Creados endpoints CRUD completos en FastAPI:
    - `/api/v1/accounts` (GET, POST, PUT, DELETE)
    - `/api/v1/transactions` (GET, POST, PUT, DELETE con filtro por tipo de transacción)
    - `/api/v1/budgets` (GET, POST, PUT, DELETE)
    - `/api/v1/debts` (GET, POST, PUT, DELETE)
  - Conectadas todas las vistas del Frontend (`AccountsView`, `ExpensesView`, `IncomesView`, `BudgetView`, `DebtsView`, `DashboardHome`, `ReportsView`) a la API de PostgreSQL del backend a través de [`frontend/lib/api.ts`](file:///c:/Users/daryf/Documents/PORTAFOLIO/FyDry/frontend/lib/api.ts).
- **Gating de Onboarding Exclusivo Post-Registro**:
  - Añadido campo `onboarding_completed: bool` en el modelo `User`.
  - El flujo de onboarding (`/onboarding`) solo se activa una única vez tras el registro inicial y validación OTP.
  - Al iniciar sesión con un usuario existente (`/login`), el sistema detecta `onboarding_completed == true` y redirige inmediatamente a `/dashboard` sin volver a pedir las preguntas de configuración.
  - Endpoint `/api/v1/auth/complete-onboarding` que marca el estado en BD al culminar el asistente.
- **Sesión Permanente de Larga Duración (30 Días)**:
  - Token JWT extendido a 30 días de validez (`ACCESS_TOKEN_EXPIRE_MINUTES = 43200`).
  - Almacenamiento seguro y duradero de credenciales en el cliente con autenticación persistente ante recargas de página y cambios de pestaña sin cierres inesperados.
- **Despliegue a Producción**: Actualizados y operativos los proyectos `fydry` y `fydry-api` en Vercel.
































