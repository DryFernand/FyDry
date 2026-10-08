# Registro de Cambios y Documentación del Proyecto (Documentatio.md)

## [2026-10-08] - Rediseño de Pantalla de Gastos (Fase 2: Métricas Analíticas del Ciclo, Filtro Rápido por Cuenta Debitada y Previsualización de Saldo)

### Resumen
Se completó la implementación de la Fase 2 en `ExpensesView.tsx` para FyDry Frontend. Se enriqueció el tablero analítico superior expandiendo a 4 tarjetas ejecutivas (incorporando el Gasto Promedio Diario según los días transcurridos del ciclo y la Categoría de Mayor Consumo con su peso porcentual), se añadió un filtro directo para auditar gastos por cuenta bancaria debitada, y se integró un simulador contable dentro del modal de gastos que proyecta el saldo resultante y previene sobregiros antes de guardar.

### Cambios Realizados:
- **Métricas Analíticas del Ciclo (Grilla Responsive de 4 Tarjetas)**:
  - **Tarjeta 1 - Total Gastado en Ciclo**: `$totalSpentSelectedCycle` con desglose exacto de transacciones del ciclo actual vs historial global.
  - **Tarjeta 2 - Gasto Promedio Diario (`dailyAverageSpent`)**: Cálculo reactivo basado en los días transcurridos dentro del ciclo (`elapsedDays`), contemplando días transcurridos en el ciclo vigente y duración total en ciclos históricos pasados.
  - **Tarjeta 3 - Categoría de Mayor Consumo (`topCategory`)**: Detección dinámica de la categoría con mayor impacto financiero en el ciclo, mostrando su icono semántico (`getCategoryIcon`), monto gastado y porcentaje de concentración (`${percentage}% del ciclo`).
  - **Tarjeta 4 - Historial Total Acumulado**: Total global consolidado con insignia integrada del día de corte mensual (`Reinicio: Día ${budgetResetDay}`).
- **Filtro Rápido por Cuenta Debitada**:
  - Selector desplegable con icono de billetera (`Wallet`) junto a la barra de búsqueda y filtros de categoría.
  - Permite alternar entre *"Todas las Cuentas"* y cuentas específicas del usuario (`acc.name`), evaluado concurrentemente en `filteredExpenses`.
- **Previsualización de Impacto en Saldo en el Modal de Gastos**:
  - Simulador contable reactivo (`accountImpactPreview`) que evalúa en tiempo real el saldo de la cuenta elegida, compensando el monto previo si se está editando un gasto existente.
  - Proyección de *"Saldo disponible actual"* y *"Saldo tras este gasto"*.
  - Alerta preventiva ámbar si el gasto utiliza cupo de sobregiro autorizado (`⚠️ Usará $X de margen de sobregiro`).
  - Alerta crítica roja de bloqueo si el gasto supera el saldo disponible y sobregiro total (`⛔ Excede fondos disponibles`).
- **Auditoría de Calidad y Ciclo de Vida**:
  - Veredicto de Seguridad: LUZ VERDE (blindaje contra división por cero en días transcurridos o porcentajes, prevención de fugas de datos y preservación de sanitización de inputs).
  - Veredicto de QA: LUZ VERDE (`npx tsc --noEmit` exit code 0 y build Next.js Turbopack completado con éxito).

---

## [2026-10-08] - Rediseño de Pantalla de Gastos (Fase 1: Iconografía Semántica, Navegador de Ciclos Históricos y Blindaje de Formularios)

### Resumen
Se completó la implementación de la Fase 1 en `ExpensesView.tsx` para FyDry Frontend. Se erradicó la iconografía monótona repetitiva reemplazándola por 25 iconos contextuales de `lucide-react` alojados en cápsulas monocromáticas refinadas, se incorporó un navegador de ciclos históricos sincronizado con el día de corte (`budgetResetDay`) con alternancia de alcance (Ciclo vs Todo el Historial), y se blindó el formulario de gastos contra valores inválidos, comas regionales y sobregiros indebidos.

### Cambios Realizados:
- **Iconografía Semántica por Categoría (`getCategoryIcon`)**:
  - Mapeo dinámico y reactivo para las 25 categorías del sistema (`Home`, `ShoppingCart`, `Utensils`, `Zap`, `Wifi`, `Fuel`, `HeartPulse`, `ShieldCheck`, `Dumbbell`, etc.) con fallback defensivo a `ArrowDownRight`.
  - Reemplazo del contenedor de flecha roja por una cápsula monocromática limpia en `bg-zinc-100 text-zinc-700 border border-zinc-200/60`.
  - Previsualización dinámica del icono en tiempo real dentro de la cabecera y selector del modal de registro y edición.
- **Navegador de Ciclos y Meses Históricos**:
  - Controles interactivos `<` y `>` para auditar ciclos mensuales anteriores o futuros, con botón de retorno al ciclo actual (`RotateCcw`).
  - Sincronización estricta con la fecha de corte presupuestario (`budgetResetDay`) mediante `getCycleRange`.
  - Selector de alcance: alternancia fluida entre *"Por Ciclo"* e *"Historial Completo"*, recalculando automáticamente métricas, gastos visibles y categorías activas.
- **Blindaje Defensivo del Formulario y Control de Sobregiro**:
  - Normalización de comas decimales regionales (`amount.replace(",", ".")`).
  - Validación aritmética rigurosa contra montos negativos, ceros, `NaN` y valores infinitos.
  - Validación de fondos disponibles (`balance + overdraftLimit`) contra la cuenta de débito seleccionada, reintegrando el monto original si se edita un gasto existente.
  - Alerta preventiva clara en banner si el gasto sobrepasa el saldo y cupo de sobregiro autorizado.
- **Auditoría de Calidad y Ciclo de Vida**:
  - Preservación íntegra de la sincronización de eventos `fydry_storage_updated` y soporte de borradores automáticos (`initialDraft`) procedentes de notificaciones.
  - Veredicto de Seguridad: LUZ VERDE (cero vulnerabilidades, sanitización e integridad en inputs).
  - Veredicto de QA: LUZ VERDE (`npx tsc --noEmit` código 0 y build Next.js Turbopack completado en 3.3s).

---

## [2026-10-08] - Rediseño de Pantalla de Movimientos y Modal Rápido (Fase 2: Filtros por Tipo de Traspaso y Previsualización Contable de Saldos)

### Resumen
Se implementó la Fase 2 en `MovementsView.tsx` y en el modal global `QuickTransactionModal.tsx`, introduciendo filtros rápidos para aislar traspasos hacia fondos de ahorro frente a movimientos entre cuentas corrientes/efectivo, y un simulador interactivo de previsualización contable que proyecta los saldos resultantes en origen y destino antes de confirmar la transacción.

### Cambios Realizados:
- **Filtros Rápidos por Naturaleza de Traspaso en `MovementsView.tsx`**:
  - Pestañas interactivas situadas junto al buscador: *Todos ({total})*, *Hacia Ahorro ({savings})* con icono `PiggyBank`, y *Entre Cuentas ({standard})*.
  - Detección reactiva de traspasos cuyo destino sea una cuenta de tipo `'savings'`.
  - Estados vacíos contextuales personalizados con gráficos acordes al filtro activo.
- **Previsualización Contable de Saldos Resultantes**:
  - En el modal de traspasos de `MovementsView.tsx`: cálculo en vivo del saldo resultante estimado en la cuenta emisora (`fromBalanceAfter`) y en la cuenta receptora (`toBalanceAfter`).
  - En el modal global `QuickTransactionModal.tsx`: despliegue interactivo en tiempo real al seleccionar la pestaña *Transferir* con monto válido.
  - Alerta preventiva sutil (`⚠️ Uso de margen de sobregiro ($|monto|)`) si la cuenta de origen entra en el margen de sobregiro permitido.
- **Auditoría de Calidad**:
  - Blindaje matemático sin divisiones por cero y preservación estricta de las reglas de sanitización SEC-01 a SEC-04.
  - Veredicto de Seguridad: LUZ VERDE.
  - Veredicto de QA: LUZ VERDE (`tsc --noEmit` exit code 0 y build Next.js Turbopack en 3.1s).

---

## [2026-10-08] - Rediseño de Pantalla de Movimientos y Modal Rápido (Fase 1: Homogeneización Visual, Impuesto en Transferencias y Blindaje)

### Resumen
Se implementó la Fase 1 del rediseño en `MovementsView.tsx` y en el modal global `QuickTransactionModal.tsx`. Se unificó la estética visual monocromática eliminando colores discordantes en transferencias entre cuentas propias, se incorporó el soporte para registrar comisiones e impuestos bancarios directamente en la pestaña de transferencia del modal rápido, y se blindaron los cálculos contra comisiones negativas, decimales regionales con coma y desbordamientos aritméticos.

### Cambios Realizados:
- **Homogeneización en `MovementsView.tsx`**:
  - Unificación de las tarjetas superiores de resumen (Total Traspasado, Retenciones/Impuestos y Reinicio de Presupuesto) a escala monocromática `zinc-950` y contenedores neutros `zinc-100`.
  - Reemplazo de las píldoras de colores discordantes (`text-rose-600` y `text-emerald-600`) en la lista de movimientos por un flujo neutral y sobrio: `De: Cuenta` ➔ `A: Cuenta` en `bg-zinc-100 text-zinc-800 border-zinc-200/60`.
  - Badge de impuestos unificado a tono carbón neutro.
- **Unificación y Nuevas Capacidades en `QuickTransactionModal.tsx`**:
  - Estilización del tab de "Transferir" y botón de envío a negro carbón de alto contraste (`bg-zinc-950 hover:bg-zinc-800 text-white`), reemplazando el azul cielo chillón.
  - Nuevo campo opcional: *"Comisión / Impuesto bancario ($)"* en la pestaña de transferencia para capturar retenciones DGII o comisiones interbancarias, sincronizado con `createTransferApi`.
- **Blindaje de Seguridad y Validación Financiera**:
  - Normalización de decimales regionales con coma (`.replace(",", ".")`) en montos y comisiones.
  - Validación matemática estricta contra valores negativos, `NaN` e `Infinity` en comisiones e importes transferidos.
  - Validación universal de fondos disponibles (`balance + overdraftLimit`) aplicada a todas las cuentas emisoras contra el monto total debitado (`parsedAmount + parsedTax`).
- **Auditoría de Calidad**:
  - Veredicto de Seguridad: LUZ VERDE tras la resolución de hallazgos SEC-01 a SEC-04.
  - Veredicto de QA: LUZ VERDE (`tsc --noEmit` exit code 0 y build Next.js Turbopack en 2.2s).

---

## [2026-10-07] - Rediseño de Pantalla de Reportes (Fase 2: Métricas Patrimoniales, Score de Salud Financiera y Diagnóstico)

### Resumen
Se implementó la Fase 2 del módulo de reportes en `ReportsView.tsx`, convirtiendo el informe formal en un estado financiero ejecutivo completo. Se expandió el resumen a 6 indicadores clave (incorporando Patrimonio Neto Operativo y Carga Financiera DTI), y se introdujo la Sección de Diagnóstico con el algoritmo del Índice de Salud Financiera FyDry (0 a 100), acompañado de clasificación por niveles (A+, B, C, D) y tres recomendaciones analíticas personalizadas.

### Cambios Realizados:
- **Métricas Patrimoniales y de Solvencia**:
  - Incorporación del cómputo de `totalDebts`, `totalMonthlyDebtPayment`, `netWorth` (Patrimonio Neto: Activos Líquidos - Deudas Pendientes) y `dtiRatio` (Debt-to-Income: Cuotas de Deuda / Ingresos).
  - Expansión de la Sección 1 a 6 tarjetas ejecutivas: Total Ingresos, Total Gastos, Flujo Neto, Tasa de Ahorro, Patrimonio Neto y Carga Financiera DTI.
- **Índice de Salud Financiera FyDry (Sección 5)**:
  - Algoritmo ponderado de scoring (0 a 100) evaluando tasa de ahorro, margen operativo de flujo y ratio de endeudamiento, acotado con clamping matemático estricto.
  - Clasificación por categorías con badge de alto contraste (`A+`, `B`, `C`, `D`) y barra visual de progreso de salud.
  - 3 bloques de recomendaciones financieras dinámicas y adaptadas al estado real del usuario:
    1. Diagnóstico de flujo de caja y cobertura mensual.
    2. Proyección de tasa de ahorro hacia el fondo de tranquilidad (3-6 meses).
    3. Análisis de solvencia, apalancamiento y sugerencias de amortización acelerada.
- **Auditoría de Calidad**:
  - Blindaje matemático contra divisiones por cero (`totalIncomes > 0`) y desbordamientos numéricos.
  - Veredictos aprobatorios de Seguridad (LUZ VERDE) y QA (LUZ VERDE, `tsc --noEmit` exit code 0 y build Next.js Turbopack en 1.4s).

---

## [2026-10-07] - Rediseño de Pantalla de Reportes (Fase 1: Navegador de Ciclos Históricos, Homogeneización y Barras de Distribución)

### Resumen
Se implementó la Fase 1 del módulo de reportes en `ReportsView.tsx`, permitiendo por primera vez auditar y exportar estados financieros de cualquier mes o ciclo histórico configurable (`budgetResetDay`). Asimismo, se aplicó la homogeneización estética monocromática en tablas y resúmenes ejecutivos, complementado con mini-barras visuales de peso porcentual en el desglose de gastos.

### Cambios Realizados:
- **Navegador de Meses / Ciclos Históricos**:
  - Estado `selectedDate` y controles interactivos `<` `Ciclo Seleccionado` `>` que recalculan dinámicamente el rango del ciclo (`cycleRange`) y su etiqueta formal (`cycleLabel`).
  - Selector de alcance con alternancia fluida entre *"Ciclo Seleccionado"* e *"Historial Completo"*.
  - Filtrado reactivo de transacciones (`filteredIncomes`, `filteredExpenses`) según las fechas de inicio y fin del ciclo seleccionado.
- **Homogeneización Monocromática**:
  - Unificación de las tarjetas del resumen ejecutivo a contenedores sobrios en `bg-zinc-50 border border-zinc-200/80` con cifras en negro carbón (`text-zinc-950 font-bold`).
  - En la tabla de deudas y pasivos, sustitución de colores chillones por tipografía monocromática (`text-zinc-950 font-bold`).
- **Mini-barras de Distribución en Desglose de Gastos**:
  - Incorporación en cada categoría de gasto de una mini-barra de progreso visual (`bg-zinc-950 h-full rounded-full`) alineada con el porcentaje relativo `{percent}%`.
- **Auditoría de Calidad y Preservación**:
  - Mantenimiento íntegro de la exportación a PDF (`handleExportPDF` / `window.print()`), reglas `@media print` y sincronización mediante `fydry_storage_updated`.
  - Veredictos aprobatorios de seguridad (sin vectores XSS, sin inyección CSS) y QA (`tsc --noEmit` y `npm run build` en 0 errores).

---

## [2026-10-07] - Rediseño de Pantalla de Deudas (Fase 2: Filtros de Estado, Estrategias Avalancha/Bola de Nieve y Validaciones)

### Resumen
Se implementó la Fase 2 del módulo de deudas en `DebtsView.tsx`, introduciendo filtros rápidos por ciclo de vida (*Todas*, *Activas*, *Liquidadas*), un motor de priorización inteligente de amortización basado en las estrategias financieras de Avalancha (mayor interés) y Bola de Nieve (menor saldo), y blindaje defensivo en los formularios de captura y abono.

### Cambios Realizados:
- **Barra de Filtros Rápidos de Estado**:
  - Pestañas con estilo monocromático situadas encima de la lista: *Todas (N)*, *Activas (N)* y *Liquidadas (N)* con contadores actualizados en vivo.
  - Vistas vacías contextuales y motivacionales al seleccionar filtros sin registros (ej. felicitación de libertad de deudas si no hay activas, o mensaje de motivación en liquidadas con retorno rápido al listado activo).
- **Estrategia Inteligente de Priorización de Pagos**:
  - **Prioridad Avalancha (Mayor Interés)**: Detección algorítmica de la deuda activa con la tasa de interés más alta (`interestRate > 0`) acompañada del badge tenue con icono `Zap`.
  - **Prioridad Bola de Nieve (Menor Saldo)**: Detección de la deuda activa con menor capital insoluto (evitando colisión con la de avalancha) destacada con badge tenue e icono `Sparkles`.
- **Validaciones Defensivas y Blindaje**:
  - En `handleSaveDebt`: rechazo explícito de saldos menores o iguales a cero (`parsedRemaining <= 0`).
  - Atributos HTML5 `min="0.01"` y `step="0.01"` en los campos de monto total, saldo y cuota mensual, junto con `min="0"` en la tasa de interés.
  - Validación de fondos y sobregiro activo en el modal de pagos antes de emitir la llamada API.
- **Auditoría de Calidad**:
  - Veredicto de Seguridad: LUZ VERDE (prevención de XSS, sanitización estricta, mitigación de race conditions en pagos).
  - Veredicto de QA: LUZ VERDE (`tsc --noEmit` exit code 0 y build de producción Next.js Turbopack completado en 1.8s).

---

## [2026-10-07] - Rediseño de Pantalla de Deudas (Fase 1: Iconografía Semántica, Saldo Monocromático y Proyección Temporal)

### Resumen
Se implementó la Fase 1 del rediseño en `DebtsView.tsx`, adoptando la paleta monocromática refinada de FyDry, eliminando los tonos rojizos estridentes en favor de negro carbón y zinc neutro. Se incorporó una iconografía semántica que identifica de inmediato el tipo de compromiso y un cálculo predictivo del tiempo estimado de liquidación para cada deuda.

### Cambios Realizados:
- **Homogeneización Cromática y Estética Monocromática**:
  - Sustitución de `text-rose-600` en la cifra de Total Deuda Pendiente e icono `Building2` por tipografía carbón (`text-zinc-950 font-bold`) e icono en `text-zinc-500`.
  - Icono de Cuota Mensual Comprometida unificado a `text-zinc-500`.
  - Porcentaje de Liquidación unificado a `text-zinc-950 font-bold` con track en `bg-zinc-100` y barra dinámica en `bg-zinc-950` (`bg-emerald-600` al alcanzar el 100%).
  - En las tarjetas individuales, el monto restante ahora se muestra en `text-zinc-950 font-bold` (o `text-emerald-600 line-through` si está liquidada).
  - Botón "Pagar / Abonar" rediseñado con estilo sobrio y minimalista, reemplazando el icono verde saturado por `text-zinc-300`.
- **Iconografía Semántica por Tipo de Compromiso (`getDebtIcon`)**:
  - Mapeo diferenciado para los 7 tipos de pasivos: Hipoteca (`Home`), Préstamo Auto (`Car`), Préstamo Estudiantil (`GraduationCap`), Tarjeta de Crédito (`CreditCard`), Línea de Crédito (`Landmark`), Familiar/Amigos (`Users`) y Préstamo Personal/Default (`Building2`).
  - Contenedor en cápsula monocromática `w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-700 border border-zinc-200/60` (o `bg-emerald-50 text-emerald-700` con `CheckCircle2` cuando la deuda está liquidada).
- **Proyección y Tiempo Estimado de Liquidación**:
  - Cálculo dinámico de meses restantes: `estimatedMonths = Math.ceil(d.remainingAmount / d.monthlyPayment)`.
  - Cápsula informativa con icono `Clock`: `~N meses para liquidar` (o `"Sin cuota fija definida"` si no tiene cuota asignada).
- **Auditoría y Preservación**:
  - Preservación íntegra de los flujos de creación, edición, eliminación y abono con débito automático a cuenta bancaria y validación de sobregiros.
  - Veredictos aprobatorios de seguridad (sin riesgos XSS, sin inyección, sanitización) y QA (`tsc --noEmit` y `npm run build` en 0 errores).

---

## [2026-10-06] - Rediseño de Pantalla de Presupuesto (Fase 2: Ritmo de Gasto Burn Rate y Filtros Rápidos)

### Resumen
Se implementó la Fase 2 del módulo de presupuestos en `BudgetView.tsx`, introduciendo analítica predictiva de consumo financiero y filtros rápidos de estado. Ahora el usuario cuenta con una métrica de ritmo de gasto diario sugerido ("Burn Rate"), detección anticipada de ritmo acelerado en categorías propensas a sobregiro, y botones de filtrado instantáneo para aislar categorías holgadas o en peligro.

### Cambios Realizados:
- **Barra de Filtros Rápidos de Categoría**:
  - Pestañas estilizadas encima de la grilla de categorías: *Todas ({total})*, *En Riesgo / Excedidas ({risk})* con badge rojo dinámico cuando existen alertas, y *Con Margen ({ok})*.
  - Vista vacía contextual cuando no hay categorías en riesgo (*"No hay categorías en riesgo en este período 🎉"*).
- **Inteligencia de Ritmo de Gasto Diario ("Burn Rate")**:
  - Cálculo en tiempo real de `dailySafeSpend = remainingBudget / daysRemaining`.
  - Micro-indicador en la tarjeta de resumen global: *"Ritmo seguro sugerido: $... / día"*.
- **Alerta Preventiva de Ritmo Acelerado**:
  - Detección algorítmica de desproporción de gasto en función del tiempo transcurrido del ciclo mensual (`percentage > timeElapsedPercent + 25`).
  - Badge preventivo sutil en la tarjeta: *"Ritmo acelerado"* para alertar al usuario antes de rebasar el límite.
- **Sanitización y Validación Defensiva**:
  - Protección ante valores nulos/indefinidos en `getCategoryIcon`.
  - Rechazo de presupuestos negativos o nulos (`parsedAllocated <= 0`) con atributo `min="0.01"` en el modal.
- **Auditoría de Calidad**:
  - Blindaje matemático contra divisiones por cero (`Math.max(1, ...)` en divisores temporales y verificación de días restantes).
  - Veredictos aprobatorios de seguridad (LUZ VERDE) y QA (LUZ VERDE, `tsc --noEmit` exit code 0 y build Next.js Turbopack en 1.5s).

---

## [2026-10-06] - Rediseño de Pantalla de Presupuesto (Fase 1: Iconografía Semántica, Saldo Restante y Días del Ciclo)

### Resumen
Se implementó la Fase 1 de modernización en `BudgetView.tsx`, reemplazando el icono genérico repetitivo de pastel por un sistema exhaustivo de iconografía semántica para más de 25 categorías de gasto. Además, se integró el cálculo directo y visible del saldo disponible restante por categoría y un indicador en tiempo real de días remanentes para el reinicio del ciclo financiero.

### Cambios Realizados:
- **Iconografía Semántica por Categoría (`getCategoryIcon`)**:
  - Mapeo contextual de iconos de `lucide-react` para cada categoría (vivienda, supermercado, restaurantes, luz/agua, transporte, salud, gimnasio, educación, suscripciones, mascotas, viajes, ahorro, etc.) dentro de la cápsula monocromática `w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 border border-zinc-200/60`.
  - Icono dinámico reactivo también integrado en el encabezado del modal de creación/edición de presupuestos.
- **Saldo Remanente Directo por Tarjeta**:
  - Incorporación del cómputo explícito `remaining = b.allocated - b.spent` en cada tarjeta de categoría.
  - Indicador claro: *"Te quedan: ${remaining}"* en tipografía carbón cuando está en orden, o *"Excedido por: ${Math.abs(remaining)}"* en rojo cuando el límite es rebasado.
- **Resumen Global Enriquecido**:
  - Cálculo de días restantes (`daysRemaining`) en función del día de corte/reinicio configurado (`budgetResetDay`) y la fecha de cierre del ciclo mensual.
  - Pastilla informativa discreta: *"Quedan N días en este ciclo"* junto a la fecha activa.
- **Auditoría y Preservación**:
  - Mantenidas al 100% las vistas Mensual, Quincenal y Semanal, el cómputo de movimientos de ahorro hacia cuentas `savings`, y los flujos de creación, edición y descarte de presupuestos.
  - Veredictos aprobatorios de seguridad (sin riesgos XSS, sin inyección) y QA (`tsc --noEmit` y `npm run build` en 0 errores).

---

## [2026-10-06] - Rediseño de Pantalla de Cuentas (Fase 2: Datos Enriquecidos, Barra de Cupo y Alertas)

### Resumen
Se implementó la Fase 2 del rediseño en `AccountsView.tsx`, enriqueciendo las tarjetas de cuenta con métricas financieras de alto impacto que antes estaban ocultas. Se integró una barra dinámica de uso de cupo para tarjetas de crédito, visualización de fechas de corte y límites de pago, monitoreo de margen de sobregiro y alertas reactivas ante saldos inferiores al mínimo establecido.

### Cambios Realizados:
- **Tarjetas de Crédito (`acc.type === 'credit_card'`)**:
  - Incorporación de barra visual de progreso de consumo de crédito (`usedPercent`) con ancho acotado y cambio adaptativo de color a `bg-rose-500` si el uso sobrepasa el 90% o existe sobregiro.
  - Leyenda analítica detallada con formato de moneda: *"Consumido: RD$ X / RD$ Y (Z%)"*.
  - Cápsulas de fechas operativas: día de corte mensual (`Corte: día X` con icono `Calendar`) y días de gracia tras el corte (`Límite pago: +Y días` con icono `Clock`).
  - Margen de sobregiro habilitado con indicador de importe adicional permitido.
  - Modificación de la etiqueta inferior de saldo a *"Saldo Consumido"*.
- **Cuentas Bancarias y Débito**:
  - Alerta condicional de saldo mínimo (`minBalance`): advertencia visual en rojo (`⚠️ Por debajo del saldo mínimo`) cuando el saldo cae bajo el umbral, o recordatorio sutil de mínimo requerido.
- **Fondos de Ahorro (`savings`)**:
  - Distintivo visual *"Fondo protegido / Reserva"* en píldora neutra.
- **Auditoría de Calidad**:
  - Verificación de seguridad: blindaje contra desbordamientos, inyecciones de CSS y divisiones por cero.
  - Validación QA: compilación limpia en Next.js Turbopack (2.7s) y 0 errores de TypeScript (`tsc --noEmit`).

---

## [2026-10-06] - Rediseño de Pantalla de Cuentas (Fase 1: Homogeneización Visual y Métricas Monocromáticas)

### Resumen
Se implementó la Fase 1 del rediseño en `AccountsView.tsx`, erradicando la dispersión cromática (azules, morados, verdes y amarillos) tanto en las 4 tarjetas de estadísticas superiores como en los identificadores de cada cuenta. La interfaz se alineó con la identidad visual fintech de FyDry fundamentada en tonos monocromáticos zinc de alto contraste.

### Cambios Realizados:
- **Tarjetas Superiores de Estadísticas (`AccountsView.tsx`)**:
  - Reemplazo de los colores en iconos (`text-blue-600`, `text-purple-600`, `text-emerald-600`) por un tono neutro elegante (`text-zinc-500`).
  - Unificación de los montos totales (crédito, ahorros, bancos y liquidez) a tipografía carbón (`text-zinc-950 font-bold tracking-tight text-2xl`).
- **Badges e Iconos de Cuentas Individuales**:
  - Homogeneización del contenedor de iconos a una cápsula refinada (`w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 border border-zinc-200/60`).
  - Iconos de tipo (`Building2`, `CreditCard`, `PiggyBank`, `Wallet`, `Banknote`) unificados a `text-zinc-700`.
  - Badges de categoría (`getAccountTypeLabel`) estandarizados a un estilo sutil (`bg-zinc-100 text-zinc-700 border border-zinc-200/60`).
  - Balances individuales unificados en negro carbón (`text-zinc-950 font-bold`).
- **Auditoría y Preservación Funcional**:
  - Mantenidas al 100% las operaciones interactivas (`openCreateModal`, `openEditModal`, `handleSaveAccount`, `handleDeleteAccount`, `loadAccounts` y el evento reactivo `fydry_storage_updated`).
  - Veredictos aprobatorios de seguridad (sin riesgos XSS, sin fuga de datos de tarjetas en DOM) y QA (`tsc --noEmit` y `npm run build` en 0 errores).

---

## [2026-10-06] - Rediseño de Notificaciones (Fase 2: Header Popover, Estados de No Leído y Badge Exterior)

### Resumen
Se implementó la Fase 2 del rediseño del sistema de notificaciones en `NotificationBell.tsx`, eliminando por completo los tonos morados disonantes y la animación de parpadeo intrusiva. La interfaz se adaptó a la línea estética monocromática y sobria de FyDry (fondos zinc, acentos carbón y bordes sutiles).

### Cambios Realizados:
- **Badge exterior de la campanita (`NotificationBell.tsx`)**:
  - Se removió la animación `animate-pulse` del indicador numérico para evitar distracciones visuales continuas.
  - Se rediseñó el badge con un estilo nítido en fondo negro carbón (`bg-zinc-950 text-white shadow-xs ring-2 ring-white`).
- **Header del desplegable**:
  - Se eliminaron el fondo y texto morado (`bg-purple-50 text-purple-600`) junto con el icono `Sparkles`.
  - Se incorporó un contenedor de cabecera sobrio con icono `Bell` (`bg-zinc-100 text-zinc-900 border border-zinc-200/60`).
  - Se estilizó el botón "Activar en PC y Celular" reemplazando el enlace subrayado morado por un botón secundario discreto (`text-zinc-600 hover:text-zinc-950 bg-zinc-100 border border-zinc-200/60 rounded-lg`).
- **Estados de lectura en las tarjetas**:
  - Las tarjetas no leídas cambiaron su fondo de `bg-purple-50/20` a `bg-zinc-50/90`.
  - El indicador puntual de no leído ahora utiliza `bg-zinc-950` para avisos habituales y `bg-rose-500` para alertas financieras críticas o sobregiros.
- **Auditoría funcional y de tipos**:
  - Preservadas intactas las 6 interacciones del componente (apertura/cierre, click outside, apertura de borradores, descarte, solicitud de permisos y recarga reactiva de alertas).
  - TypeScript y build de producción de Next.js validados con salida limpia (`tsc --noEmit` y `npm run build` en 0 errores).

---

## [2026-09-21] - Integración de Movimientos a Metas de Ahorro con el Presupuesto de "Ahorro Programado"

### Resumen
Se integró el cómputo automático de los movimientos/traspasos entre cuentas con destino a fondos/metas de ahorro (`type === 'savings'`) dentro del presupuesto de la categoría **"Ahorro Programado"**. El cálculo opera de forma reactiva y retrocompatible, reflejando tanto movimientos pasados como futuros dentro de su mes/ciclo/período correspondiente (mensual, quincenal o semanal).

### Cambios Realizados:
- **Frontend (`BudgetView.tsx`)**:
  - Se importaron `fetchAccountsApi` y `fetchMovementsApi` junto a los tipos `AccountItem` y `MovementItem`.
  - Se agregaron los estados `accounts` y `movements` cargados de forma concurrente con `Promise.all` en `loadData()`.
  - Se implementaron los helpers `getMovementTimestamp` e `isMovementInPeriod` con soporte para formatos ISO, numéricos y textuales (español e inglés), respetando el día de corte/reinicio del ciclo (`budgetResetDay`) y las sub-vistas quincenales y semanales.
  - Se identifican dinámicamente las cuentas de tipo `'savings'` (`savingsAccountIds` y `savingsAccountNames`).
  - En el cálculo de `budgetsWithSpent`, para la categoría `"Ahorro Programado"`, el monto gastado (`spent`) suma los gastos directos registrados más la suma total de los traspasos hacia metas de ahorro (`filteredSavingsMovements`) dentro del período seleccionado.
- **Backend (`financial.py` & `financial.py models/schemas`)**:
  - Auditoría del contrato de datos de `AccountResponse` y `MovementResponse`, validando soporte de `type='savings'` y consistencia en la partida doble.
  - Blindaje de esquemas Pydantic con validadores `Field(gt=0)` y `Field(ge=0)` para prevenir montos negativos o inconsistencias contables.
  - Mitigación IDOR y aislamiento multi-tenant en `update_movement` y `delete_movement` asegurando filtros estrictos por `Account.user_id == current_user.id`.
  - Validación de cupo de crédito y sobregiro en modificaciones (`update_expense` y `update_movement`).
  - Saneamiento de foreign keys huérfanas en `create_expense` y `create_income`.

---

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

### 2026-08-26 - Persistencia y Carga de Configuraciones de Usuario, Preferencias y Reseteo Seguro
- **Persistencia de Configuraciones en PostgreSQL**:
  - Extendida la tabla `user_profiles` en Supabase con las columnas: `language`, `notifications_enabled`, `email_notifications`, `budget_alerts`, `weekly_digest`.
  - Creados endpoints en FastAPI:
    - `GET /api/v1/auth/settings`: Recupera el perfil consolidado del usuario autenticado (nombre, email, teléfono, ciudad, moneda preferida, idioma y configuración de notificaciones).
    - `PUT /api/v1/auth/settings`: Actualiza datos de perfil y preferencias del usuario en base de datos.
    - `POST /api/v1/financial/reset-data`: Borrado selectivo y seguro de transacciones, cuentas, presupuestos y deudas exclusivamente pertenecientes al usuario actual.
- **Sincronización en el Frontend**:
  - Modal de Ajustes ([`SettingsModal.tsx`](file:///c:/Users/daryf/Documents/PORTAFOLIO/FyDry/frontend/components/dashboard/SettingsModal.tsx)):
    - Carga en tiempo real las preferencias del usuario al abrirse.
    - Sincronización inmediata al cambiar de idioma (Español / Inglés) y moneda principal.
    - Almacenamiento instantáneo de preferencias de notificaciones (alertas de presupuesto, resúmenes por correo).
    - Conexión del botón de "Restablecer Datos" de la Zona de Peligro al endpoint seguro del backend.
  - Layout del Dashboard ([`DashboardLayout.tsx`](file:///c:/Users/daryf/Documents/PORTAFOLIO/FyDry/frontend/components/dashboard/DashboardLayout.tsx)):
    - Carga automática del nombre y credenciales del usuario al iniciar sesión y mantener activa la sesión.
- **Despliegue a Producción**: Actualizados y verificados los servicios `fydry` y `fydry-api` en Vercel con `npx tsc --noEmit` completado sin errores.

### 2026-08-26 - Corrección y Resiliencia de Google OAuth en Producción
- **Resolución Dinámica de `redirect_uri` en Google Token Exchange**:
  - Actualizado el endpoint `/api/v1/auth/google` y el servicio `exchange_google_code_or_token` para recibir dinámicamente el `redirect_uri` utilizado por el cliente web (`window.location.origin/auth/callback/google`).
  - Implementado fallback automático que prueba las URIs candidatas de redirección (`https://fydry-dary.vercel.app`, `https://fydry.vercel.app`, `http://localhost:3000`) para evitar errores por `redirect_uri_mismatch`.
- **Persistencia de Sesión OAuth en el Cliente**:
  - En `frontend/app/auth/callback/[provider]/page.tsx`, se guardan de forma permanente `fydry_access_token`, `fydry_token` y `fydry_user`.
  - Redirección inteligente post-autenticación: si el usuario ya completó el onboarding va directo a `/dashboard`; si es un usuario recién creado, entra a `/onboarding`.
- **Despliegue a Producción**: Recompilados y desplegados `fydry` y `fydry-api` en Vercel con estado `READY`.
- **Corrección de Startup NameError y CORS Preflight (200 OK)**:
  - Resuelto `NameError` en `backend/app/api/v1/endpoints/auth.py` importando `UserSettingsResponse`, `UserSettingsUpdate` y `UserProfile`.
  - Verificado el preflight `OPTIONS` devolviendo código `200 OK` con cabecera `access-control-allow-origin: https://fydry-dary.vercel.app`.

### 2026-08-27 - Aplicación Contable Automática a Cuentas y Nueva Pantalla de Movimientos
- **Aplicación Automática de Ingresos y Gastos sobre Saldos de Cuentas**:
  - **Creación de Transacciones (`POST /api/v1/transactions`)**:
    - Al registrar un ingreso (`type: "income"`), el saldo de la cuenta receptora se incrementa automáticamente (`balance += amount`).
    - Al registrar un gasto (`type: "expense"`), el saldo de la cuenta origen se debita automáticamente (`balance -= amount`).
  - **Edición y Recálculo (`PUT /api/v1/transactions/{id}`)**:
    - Reversión automática del impacto contable en la cuenta original y aplicación del nuevo monto/tipo sobre la cuenta correspondiente.
  - **Eliminación y Restauración (`DELETE /api/v1/transactions/{id}`)**:
    - Al eliminar una transacción, su efecto se revierte de inmediato restaurando el saldo de la cuenta asociada.
- **Nueva Pantalla de Movimientos (`MovementsView.tsx`)**:
  - Libro mayor unificado con la cronología completa de ingresos y gastos consolidados.
  - Tarjetas de resumen en vivo: Ingresos Totales, Gastos Totales y Flujo Neto Consolidado.
  - Filtros avanzados: selector de tipo (Todos, Ingresos, Gastos), categorías con consumos reales y selector por cuenta bancaria.
  - Modal interactivo para crear y editar movimientos con selector reactivo de tipo (Gasto/Ingreso) y cuenta aplicada.
- **Integración de Navegación e Internacionalización**:
  - Añadida sección "Movimientos" / "Movements" en la barra lateral con icono interactivo y soporte bilingüe (Español / Inglés).
- **Despliegue a Producción**: Compilado con 0 errores en TypeScript y desplegado en los proyectos `fydry` y `fydry-api` en Vercel.

### 2026-08-27 - Tablas Dedicadas en Supabase (Expenses, Incomes, Movements) y Traspasos entre Cuentas
- **Creación y Verificación de Tablas Dedicadas en Supabase PostgreSQL**:
  - `expenses`: Almacena exclusivamente los gastos debitados con su categoría, cuenta de débito, concepto y monto.
  - `incomes`: Almacena exclusivamente los ingresos acreditados con su categoría, cuenta receptora, concepto y monto.
  - `movements`: Almacena los traspasos y transferencias de dinero entre dos cuentas (`from_account` ➔ `to_account`).
  - Verificadas las 10 tablas en la base de datos: `accounts`, `budgets`, `debts`, `expenses`, `incomes`, `movements`, `otp_codes`, `transactions`, `user_profiles`, `users`.
- **Lógica Contable de Movimientos (Transferencias entre Cuentas)**:
  - Al realizar un movimiento de $X de Cuenta Origen a Cuenta Destino:
    - `Cuenta Origen`: Saldo debitado (`balance -= amount`).
    - `Cuenta Destino`: Saldo acreditado (`balance += amount`).
  - Al editar o eliminar un movimiento, ambos saldos se recalculan y restauran de inmediato.
- **Rediseño de la Pantalla de Movimientos (`MovementsView.tsx`)**:
  - Interfaz de transferencias y traspasos entre cuentas con visualización de flujo `[Cuenta Origen] ➔ [Cuenta Destino]`.
  - Selector de cuenta origen y cuenta destino con visualización de saldo en tiempo real.
  - Métricas de volumen transferido y cuentas involucradas.
- **Despliegue a Producción**: Compilado con `npx tsc --noEmit` (0 errores) y desplegado con éxito en Vercel.

### 2026-08-27 - Cuentas de Ahorros e Impuesto/Comisión con Integración a Presupuestos en Movimientos
- **Nuevo Tipo de Cuenta: Ahorros (`savings`)**:
  - Añadido tipo `savings` ("Ahorros / Inversión") en modelos de backend y componentes de frontend con icono `PiggyBank`, badge distintivo y métrica agregada en `AccountsView.tsx`.
- **Campo de Impuesto / Comisión en Movimientos (`tax_amount`)**:
  - La cuenta origen es debitada por `amount + tax_amount`, mientras que la cuenta destino recibe exactamente `amount`.
  - **Integración con Presupuesto de Impuestos**:
    - Si el usuario tiene un presupuesto creado en la categoría `Impuestos` (o `Impuestos y Comisiones` / `Taxes`) con límite asignado (`allocated_amount > 0`), se registra automáticamente el asiento de gasto correspondiente en `expenses` para computar contra el límite presupuestario y generar alertas.
    - Si no tiene un presupuesto con límite definido para impuestos, no se crea asiento en presupuestos pero el impuesto **sí se debita de la cuenta de origen** sumado al total transferido.
  - Al editar o eliminar un movimiento, ambos saldos y el asiento presupuestario asociado se restauran automáticamente.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Cómputo Sistemático de Impuestos en Límite de Categoría y Presupuesto General
- **Asiento y Cómputo de Impuestos de Transferencias en Presupuestos**:
  - Todo impuesto o comisión de transferencias se registra sistemáticamente en la categoría `Impuestos & Tasas`.
  - **Límite de Categoría**: La tarjeta de presupuesto de `Impuestos & Tasas` refleja en tiempo real el monto gastado (`spent`), el porcentaje consumido del límite (`percent%`) con barra de color dinámica y alertas de sobrepresupuesto.
  - **Presupuesto General**: El consumo global (`totalSpent` y `overallPercentage`) suma automáticamente estos gastos de impuestos.
  - Badge visual en `BudgetView.tsx`: `• Incluye impuestos de transferencias` para total claridad contable.
- **Despliegue a Producción**: Compilado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Bloqueo de Zoom Móvil y Aislamiento Estricto de Categoría de Impuestos
- **Corrección de Viewport & Zoom en Móviles**:
  - Configuración de Next.js `Viewport` con `userScalable: false`, `maximumScale: 1`, `width: 'device-width'` y `viewportFit: 'cover'`.
  - En `globals.css`: `touch-action: pan-y`, `max-width: 100vw`, `overflow-x: hidden` y tamaño mínimo de fuente de 16px en inputs para dispositivos móviles, impidiendo que iOS/Android hagan zoom automático involuntario o desplacen la vista lateralmente.
- **Aislamiento Estricto de Categorías de Presupuesto**:
  - Corregido el filtro de coincidencia para que las categorías que contienen `"Taxi"` o `"Transporte"` (ej. `"Transporte Público & Taxi"`) no sean tomadas erróneamente como categorías de impuesto.
  - Normalizada la base de datos de PostgreSQL para asegurar que los asientos de impuestos pertenezcan únicamente a `"Impuestos & Tasas"`.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Configuración Dinámica de Tarjetas de Crédito y Reglas de Numeración por Tipo de Cuenta
- **Configuración Específica por Tipo de Cuenta**:
  - **Tarjeta de Crédito (`credit_card`)**:
    - Campos requeridos y específicos: **Número de Tarjeta**, **Día de Corte del Mes (1-31)**, **Días para el Pago (Plazo tras corte)** y **Monto de Sobregiro / Límite de Crédito**.
    - Tarjeta visual en `AccountsView.tsx` con desglose de corte, días de gracia y límite de crédito.
  - **Tarjeta de Débito (`debit_card`)**:
    - Solicita **Número de Tarjeta** (no número de cuenta).
  - **Cuenta Bancaria (`bank`)**:
    - Solicita **Número de Cuenta / IBAN / Clave Interbancaria**.
  - **Cuentas de Ahorros (`savings`), Efectivo (`cash`) y Billeteras Digitales (`wallet`)**:
    - No solicitan ningún número de cuenta ni tarjeta.
- **Base de Datos & Backend**:
  - Añadidas columnas `card_number`, `cutoff_day`, `grace_days`, `overdraft_limit` a la tabla `accounts` en Supabase PostgreSQL.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Automatización de Correos Bancarios (Google Gmail) y Campanita de Notificaciones Inteligentes
- **Motor de Escaneo y Extracción Financiera (`backend/app/api/v1/endpoints/notifications.py`)**:
  - Parser heurístico y regex multi-formato para correos bancarios que detecta cargos de tarjetas, traspasos interbancarios y nóminas/salarios.
  - Inferencia inteligente de categorías (`Supermercado & Alimentación`, `Restaurantes & Bares`, `Transporte Público & Taxi`, `Salario / Nómina Principal`, etc.).
  - Generación de borradores automáticos guardados en la tabla `pending_notifications` de PostgreSQL.
- **Base de Datos & Backend**:
  - Creadas tablas `email_integrations` y `pending_notifications` vinculadas a los usuarios en Supabase PostgreSQL.
  - Endpoints REST para consultar notificaciones, marcar como leídas/procesadas, descartar borradores y sincronizar cuenta de Google.
- **Campanita de Notificaciones Interactiva (`NotificationBell.tsx` & `DashboardLayout.tsx`)**:
  - Icono de campanita en el Header (móvil y desktop) con contador en vivo y animación de pulsación.
  - Menú desplegable con listado de transacciones bancarias detectadas.
  - Al pulsar en cualquier notificación, redirige a la pestaña correspondiente (**Gastos**, **Ingresos** o **Movimientos**) y abre el modal pre-cargado con monto, concepto, cuenta y categoría para que el usuario confirme o modifique el asiento con 1 clic.
  - Al guardar la transacción confirmada, el borrador se marca automáticamente como procesado.
  - Soporte para notificaciones nativas del navegador (`Notification.requestPermission()`).
- **Configuración de Cuenta (`SettingsModal.tsx`)**:
  - Nueva pestaña **"Sincronización Gmail"** para conectar la cuenta de Google con servicios de lectura bancaria, ver el estado en tiempo real y botón para disparar escaneo manual instantáneo.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Reglas de Tarjetas de Crédito, Saldo Mínimo y Sistema de Alertas Nativas (PC & Teléfono)
- **Tarjetas de Crédito (`AccountsView.tsx`)**:
  - Removido el recuadro de detalles incrustado en el card para mantener una vista limpia, uniforme y estética.
  - Agregado el campo obligatorio **Límite de la Tarjeta ($)** (`credit_limit`) en el formulario de creación/edición de tarjetas de crédito.
- **Saldo Mínimo por Cuenta**:
  - Agregado el campo **Saldo Mínimo Aceptado ($)** (`min_balance`) en el formulario para todos los tipos de cuenta, permitiendo configurar un umbral de seguridad.
- **Sistema de 5 Alertas Financieras Automáticas (`backend/app/api/v1/endpoints/notifications.py`)**:
  1. 📅 **Día de corte de la tarjeta**: Notifica cuando se aproxima o llega el día de corte mensual.
  2. ⏰ **Día final de pago**: Notifica cuando vence el plazo de pago tras el corte.
  3. 🚨 **Alerta de sobregiro**: Notifica cuando el consumo de la tarjeta de crédito excede su cupo/límite.
  4. 📉 **Saldo mínimo alcanzado**: Notifica cuando cualquier cuenta baja a o por debajo de su mínimo aceptado.
  5. 📊 **Presupuesto > 80%**: Notifica cuando cualquier categoría presupuestada consume el 80% o más de su asignación.
- **Notificaciones Push Nativas a PC y Teléfono (`frontend/lib/pushNotifications.ts`)**:
  - Despachador de notificaciones web (`Notification API` / `ServiceWorker.showNotification`) que proyecta las alertas como notificaciones emergentes del sistema con sonido/vibración en computadoras (Windows/macOS) y dispositivos móviles (Android/iOS), además de la campanita del Dashboard.
- **Base de Datos**:
  - Agregadas columnas `credit_limit` y `min_balance` a la tabla `accounts` en Supabase PostgreSQL.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Corrección de Duplicación Cíclica de Notificaciones y Soporte de Notificaciones con Web Cerrada (Service Worker)
- **Eliminación de la Duplicación en Backend (`notifications.py`)**:
  - Reemplazados los IDs con timestamps dinámicos por identificadores fijos y determinísticos vinculados al usuario, evitando que se generen transacciones de prueba repetidas cada vez que se abre la app.
  - Ejecutada limpieza de registros duplicados antiguos en Supabase PostgreSQL.
- **Persistencia de Alertas Mostradas en Dispositivo (`pushNotifications.ts`)**:
  - Implementado almacenamiento en `localStorage` (`fydry_sent_native_alert_ids`) para registrar qué notificaciones ya fueron emitidas en la pantalla de la computadora o del teléfono, garantizando que cada alerta se envíe **exactamente una sola vez** y que las alertas existentes no se vuelvan a disparar en bucle.
- **Service Worker para Notificaciones en Segundo Plano (`public/sw.js`)**:
  - Creado y registrado el Service Worker que escucha eventos `push` y `notificationclick` para recibir alertas cuando la pestaña o el navegador estén cerrados en teléfonos móviles (Android, iOS PWA) y computadoras, enfocando o abriendo automáticamente la app al pulsar la notificación.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Corrección de Persistencia en el Descarte de Notificaciones y Alertas
- **Descarte Permanente sin Regeneración (`notifications.py` & PostgreSQL)**:
  - Añadida la columna `is_dismissed` a la tabla `pending_notifications`.
  - Cuando el usuario elimina o descarta una alerta, se marca permanentemente como `is_dismissed = "true"`.
  - El evaluador de alertas (`check_financial_alerts`) verifica los identificadores descartados para que al refrescar la página o volver a cargar el Dashboard **no se vuelvan a generar ni reaparecer** en la bandeja.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Reglas Estrictas de Sobregiro y Bloqueo de Límite en Tarjetas de Crédito
- **Disparo de Alerta de Sobregiro al bajar de $0 (`notifications.py`)**:
  - Configurada la alerta automática para que se emita en el instante en que el saldo de una tarjeta de crédito es negativo (`balance < 0`), informando el monto del sobregiro y el margen restante.
- **Bloqueo Estricto de Transacciones que Excedan el Límite + Sobregiro (`financial.py`, `ExpensesView.tsx`, `MovementsView.tsx`)**:
  - En gastos y traspasos, se calcula el cupo total disponible: `Disponible = Saldo + Margen de Sobregiro Autorizado`.
  - Si una compra, gasto o traspaso supera este monto total (cuando el cupo incluyendo el sobregiro llega a 0 o se intenta gastar por debajo del sobregiro permitido), la transacción se **bloquea inmediatamente**:
    - **Frontend**: Validación preventiva que detiene el envío y muestra un mensaje explicativo con los fondos disponibles.
    - **Backend**: Rechazo de seguridad con código `HTTP 400 Bad Request`.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Corrección de Doble Despacho de Notificaciones Push y Alertas
- **Centralización en `DashboardLayout.tsx`**:
  - Se identificó que la presencia de `<NotificationBell />` en el header móvil y en el header desktop provocaba la ejecución paralela y simultánea de dos efectos de despacho de alertas.
  - Se centralizó el estado `notifications` y la llamada `dispatchNativeAlerts` a un único despachador global en `DashboardLayout`, pasando el estado a los componentes hijos como observadores.
- **Bloqueo Síncrono en Memoria (`pushNotifications.ts`)**:
  - Implementado `inMemoryDispatchedIds` y asignación de `tag` estricto por ID para bloquear cualquier intento concurrente y asegurar que el sistema operativo colapse e impida emitir dos notificaciones idénticas.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Ciclo Mensual Recurrente de Presupuestos y Selector de Mes
- **Selector de Período Mensual (`BudgetView.tsx`)**:
  - Incorporado control interactivo para navegar entre meses (`<` y `>`) con indicador visual de fecha activa (ej. `Agosto 2026`) y botón de retorno rápido a "Mes actual".
  - El consumo acumulado de cada categoría (`spent`) se calcula dinámicamente según los gastos realizados en el mes y año seleccionados.
- **Restablecimiento Automático Mensual**:
  - Los topes y límites presupuestarios asignados se preservan de forma permanente mes a mes.
  - Al iniciar cada nuevo mes (día 1), el contador de consumo acumulado vuelve automáticamente a **$0.00** para todo el período nuevo.
- **Alertas de Presupuesto del Mes Actual (`notifications.py`)**:
  - La comprobación automática del umbral del 80% evalúa estrictamente las transacciones pertenecientes al mes en curso.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Módulo de Pago y Abono a Deudas con Integración Contable y Presupuestaria
- **Acción "Pagar / Abonar" en Deudas (`DebtsView.tsx`)**:
  - Incorporado botón de pago en cada compromiso de deuda con modal inteligente.
  - Opciones de pago rápido: *Pagar Cuota Mensual*, *Liquidar Total* o ingresar un *Monto personalizado*.
  - Selector de cuenta de origen mostrando saldo disponible en tiempo real.
- **Doble Impacto Contable y Amortización (`financial.py`)**:
  - Endpoint dedicado `POST /api/v1/debts/{debt_id}/pay`.
  - Valida fondos y cupo de sobregiro antes de debitar el dinero de la cuenta seleccionada.
  - Reduce automáticamente el saldo pendiente de la deuda (`remaining_amount`).
- **Asiento Automático en Presupuesto y Gastos**:
  - Genera automáticamente un gasto en la categoría **`"Pago de Deudas & Préstamos"`**, reflejándose en el presupuesto mensual del período actual y en el control de gastos.
- **Categorías Financieras (`categories.ts`)**:
  - Añadida la categoría oficial **`"Pago de Deudas & Préstamos"`** a las categorías de gastos y presupuestos.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Menú Lateral Estático y Optimización de Carga Instantánea al Refrescar
- **Menú Lateral Estático (`DashboardLayout.tsx`)**:
  - Convertido el sidebar de escritorio en un elemento estático y fijo de ancho completo (`w-64`), removiendo botones de colapso y asegurando una vista uniforme, limpia y firme.
- **Carga Optimista Instantánea (0ms de espera)**:
  - Eliminado el bloqueo en la pantalla de carga durante los refrescos de página (`F5`).
  - La sesión del usuario se inicializa de inmediato desde `localStorage` permitiendo interactuar con el Dashboard al instante.
  - La revalidación con el servidor se realiza en segundo plano protegida con un timeout de 3.5 segundos (`AbortController`), impidiendo que caídas de red o demoras atrapen al usuario en el spinner de carga.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Menú Lateral Fijo y Bloqueo de Scroll en Sidebar
- **Anclaje Fijo del Sidebar (`DashboardLayout.tsx`)**:
  - Configurado el sidebar con posicionamiento `fixed top-0 left-0 bottom-0 h-screen w-64`, garantizando que permanezca 100% visible, estático e inmutable en su posición mientras el usuario hace scroll en páginas largas de transacciones, informes o presupuestos.
  - El área de contenido principal se adaptó con `md:pl-64`, permitiendo un desplazamiento vertical fluido sin empujar ni desfasar el menú lateral.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Soporte Integral para República Dominicana (RD) y Moneda DOP (RD$)
- **Onboarding de Nuevos Usuarios (`StepPersonal.tsx`)**:
  - Incorporado el país **`"República Dominicana"`** en la lista principal de selección geográfica.
  - Añadida la moneda oficial **`Peso Dominicano (DOP / RD$)`** con su símbolo correspondiente.
- **Configuración de Preferencias (`SettingsModal.tsx`)**:
  - Añadida la opción **`DOP (RD$) - Peso Dominicano`** en el selector de moneda principal del usuario.
- **Gestión de Cuentas y Tarjetas (`AccountsView.tsx`)**:
  - Incorporado selector de moneda por cuenta (`DOP`, `USD`, `EUR`, `MXN`, `COP`, etc.) en los modales de creación y edición.
  - Renderizado dinámico de balances con el símbolo oficial (`RD$` para cuentas dominicanas) y badge visual del código ISO (`DOP`).
- **Análisis Inteligente de Notificaciones Bancarias (`notifications.py`)**:
  - Actualizado el motor de expresiones regulares para identificar montos expresados en `RD$`, `DOP` y `RD` procedentes de notificaciones de bancos dominicanos (Banreservas, Banco Popular, BHD, APAP, etc.).
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-27 - Calibración de Rangos Salariales Reales para República Dominicana (DOP)
- **Rangos de Ingresos Dinámicos en Onboarding (`StepFinancial.tsx`)**:
  - Sustituidos los rangos genéricos en dólares por rangos de mercado reales de República Dominicana en Pesos Dominicanos (`RD$`):
    - *Menos de RD$ 25,000 / mes*
    - *RD$ 25,000 - RD$ 60,000 / mes*
    - *RD$ 60,000 - RD$ 150,000 / mes*
    - *Más de RD$ 150,000 / mes*
  - Adaptación automática contextual si el usuario elige USD, EUR, COP o MXN.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-28 - Sistema de Presupuestos Multivista (Mensual, Quincenal ÷2 y Semanal ÷4)
- **3 Vistas de Periodicidad en Presupuestos (`BudgetView.tsx`)**:
  - **Mensual (Principal / Base)**: Muestra el 100% del límite asignado y computa los gastos acumulados de todo el mes seleccionado.
  - **Quincenal (÷2)**: Divide automáticamente el límite mensual entre 2 y permite monitorear el consumo de la 1ra Quincena (Días 1-15) o 2da Quincena (Días 16-Fin de mes).
  - **Semanal (÷4)**: Divide automáticamente el límite mensual entre 4 y permite monitorear el consumo por cada semana del mes (S1: 1-7, S2: 8-14, S3: 15-21, S4: 22+).
- **Sub-selectores Contextuales**:
  - Selector dinámico de Quincenas y Semanas integrado en la cabecera para navegar cómodamente entre los diferentes períodos de corte.
- **Modal de Presupuesto con Equivalencias**:
  - Al ingresar el presupuesto mensual, el modal calcula y muestra en tiempo real su valor quincenal y semanal.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-28 - Simplificación Visual de Etiquetas en Presupuestos Multivista
- **Etiquetas Limpias (`BudgetView.tsx`)**:
  - Eliminados los indicadores de división (`÷2`, `÷4`, `(÷2)`, `(÷4)`) de todas las vistas, botones de pestañas, badges y tarjetas de categoría.
  - La interfaz muestra limpiamente los nombres puros de los períodos: **Mensual**, **Quincenal** y **Semanal**.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-28 - Integración de Logo Oficial Redondeado y Metadatos Globales (SEO & Redes Sociales)
- **Metadatos y OpenGraph (`layout.tsx`)**:
  - Configurados favicon y accesos directos con `/FyDry.jpeg`.
  - Añadida metadata enriquecida para previsualizaciones en redes sociales (Open Graph y Twitter Cards) con `/FyDry.jpeg` a 800x800.
  - Implementada estructura de datos Schema.org (JSON-LD) para indexación con logo en Google Search.
- **Logo Redondeado en la Interfaz**:
  - **Barra de Navegación (`Navbar.tsx`)**: Logo oficial redondeado con efecto hover y relieve.
  - **Pie de Página (`Footer.tsx`)**: Logo redondeado oficial.
  - **Panel de Control (`DashboardLayout.tsx`)**: Logo redondeado integrado en el Sidebar fijo de escritorio y en la cabecera móvil.
  - **Asistente de Bienvenida (`OnboardingWizard.tsx`)**: Logo redondeado en el encabezado.
  - **Autenticación (`AuthCard.tsx`)**: Cabecera visual con logo redondeado antes del formulario.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-08-28 - Generación de Favicon Circular Multi-Resolución para Pestañas de Navegador
- **Generación de Favicons Nativos (`app/favicon.ico`, `app/icon.png`, `public/`)**:
  - Procesado `FyDry.jpeg` con máscara circular y antialiasing para crear archivos nativos de icono de pestaña:
    - `favicon.ico` con capas de 16x16, 32x32, 48x48, 64x64, 128x128 y 256x256 píxeles con transparencia.
    - `icon.png` (512x512) y `apple-touch-icon.png` (180x180).
  - Eliminado el icono por defecto de Next.js/Vercel en la pestaña del navegador.
  - Inclusión de etiquetas `<link rel="icon">` directas en el `<head>` de `layout.tsx`.
- **Despliegue a Producción**: Verificado con `npx tsc --noEmit` (0 errores) y desplegado en Vercel (`READY`).

### 2026-09-01 - Descarga de Skills de Agentes y Actualización Integral del Portafolio en Vercel
- **Instalación de Skills de Agentes**:
  - Descarga e integración de las 25 skills de desarrollo desde `https://github.com/addyosmani/agent-skills.git` en `C:\Users\daryf\.agent\skills`.
- **Auditoría y Actualización del Portafolio Web (`daryfernandez.vercel.app`)**:
  - **Validación y Detección de Despliegues en Vercel**:
    - Portafolio: `Portafolio-DaryFernandez` (`daryfernandez.vercel.app`).
    - Detección y corrección de enlaces rotos (URL de `sistema-control-inventario-frontend-dary.vercel.app`).
  - **Integración de Nuevos Proyectos Destacados**:
    - **FyDry** (`https://fydry-dary.vercel.app`): Plataforma SaaS financiera con Next.js 16, FastAPI, Supabase, IA y Framer Motion con asset oficial (`/projects/FyDry.jpeg`).
    - **Partido PIN** (`https://partido-pin.vercel.app`): Plataforma institucional moderna con asset oficial (`/projects/Logo-pin.jpeg`).
    - **Centro Automotriz Carlos** (`https://centro-automotriz-carlos.vercel.app`): Portal interactivo con asset oficial (`/projects/centro-automotriz.png`).
    - **La Pastelerie RD** (`https://demo-la-pastelerie-rd.vercel.app`): Catálogo interactivo e-commerce.
    - **ASM Veterinaria** (`https://asm-veterinaria.vercel.app`): Portal clínico para salud animal con Astro.
  - **Mejoras Arquitectónicas y UI/UX**:
    - Sistema de filtrado interactivo por categorías con `Framer Motion` (`AnimatePresence`).
    - Enlaces directos a producción en Vercel y repositorios de código en GitHub.
    - Corrección total de codificación de caracteres UTF-8 (tildes, eñes y caracteres especiales) en todas las secciones (`Hero`, `About`, `Projects`, `Skills`, `Services`, `Experience`, `Contact`, `Footer`, `Navbar` y `metadata`).
    - Actualización del stack técnico en `Skills.tsx` y badges dinámicos.
    - Corrección de colisión de `id`s duplicados en la línea de tiempo de `Experience.tsx`.
  - **Verificación y Despliegue**:
    - `npx tsc --noEmit` completado con 0 errores.
    - `npm run build` verificado exitosamente con Turbopack.
    - Commit y push automáticos a GitHub; despliegue exitoso en producción en Vercel (`READY`).
  - **Actualización de Fotografía Principal del Hero**:
    - Importada y optimizada la fotografía de perfil desde `C:\Users\daryf\Downloads\Dary Fernandez.jpeg` a `public/profile.jpeg`.
    - Actualizado el componente `Hero.tsx` vinculando el asset oficial con Next.js Image y priority loading.
    - Verificado y desplegado en Vercel (`READY`).
  - **Reinicio Automático y Configurable del Presupuesto (`budget_reset_day`)**:
    - **Backend & Database**:
      - Añadida la columna `budget_reset_day` (`Integer`, default=1) al modelo SQLAlchemy `UserProfile` en `backend/app/models/user_profile.py`.
      - Migración automática configurada en `backend/app/core/database.py` (`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS budget_reset_day INTEGER DEFAULT 1;`).
      - Actualizados los schemas Pydantic `UserSettingsResponse` y `UserSettingsUpdate` en `backend/app/schemas/auth.py`.
      - Integrado en los endpoints `GET /api/v1/auth/settings` y `PUT /api/v1/auth/settings` en `backend/app/api/v1/endpoints/auth.py`.
    - **Frontend & UI/UX**:
      - Actualizada la interfaz `UserSettingsData` y `updateUserSettingsApi` en `frontend/lib/api.ts`, disparando el evento de sincronización `fydry_storage_updated`.
      - Agregado el control de **Día de Reinicio de Presupuesto** en la pestaña de Idioma & Preferencias de `SettingsModal.tsx` con selector del día 1 al 31, atajos rápidos (1, 15, 25, 28) y preview explicativo del ciclo activo en tiempo real.
      - Agregadas las traducciones en español e inglés en `frontend/lib/translations.ts`.
      - Refactorizado el cálculo de períodos en `BudgetView.tsx` (`getCycleRange`, `isExpenseInPeriod`, subperíodos quincenales y semanales adaptativos, y badge dinámico de reinicio en la cabecera).
      - **Aislamiento Estricto de Períodos y Registros Históricos**:
        - Implementado parser inteligente multi-formato (`YYYY-MM-DD`, `DD/MM/YYYY`, `28 ago`, timestamps ISO) con prioridad en la fecha contable de la transacción.
        - Los gastos efectuados antes del día de reinicio (ej. antes del día 1 del mes activo) se asignan estricta y automáticamente a su período anterior correspondiente y no computan en el nuevo ciclo activo.
        - Añadido soporte del campo `created_at` en `ExpenseResponse`, `IncomeResponse` y `MovementResponse` en el backend y mapeo en `frontend/lib/api.ts`.
      - **Pantalla de Inicio (`DashboardHome.tsx`) y Reportes Auditados (`ReportsView.tsx`)**:
        - Centralizada la lógica de ciclos y fechas en el nuevo módulo `frontend/lib/cycle.ts`.
        - En la pantalla de inicio, las métricas de flujo (Ingresos del Mes, Gastos del Mes, Ahorro Neto y Tasa de Ahorro) calculan estrictamente las transacciones del ciclo mensual activo (desde el día 1 o día configurado en adelante), mientras que el balance acumulado preserva la liquidez total.
        - En la vista de Reportes Auditados (`ReportsView.tsx`), se agregó un selector dinámico de alcance para auditar tanto el **Mes Actual** (con badge del ciclo activo y día de corte) como el **Histórico Completo Consolidado**.
      - **Vistas de Gastos (`ExpensesView.tsx`), Ingresos (`IncomesView.tsx`) y Movimientos (`MovementsView.tsx`)**:
        - Las tarjetas métricas superiores ("Total Gastado Este Mes", "Total Ingresos de Este Mes", "Total Traspasado Este Mes" e "Impuestos / Comisiones") se recalculan dinámicamente según el **ciclo activo actual** (reiniciándose en cero al comenzar el día 1 o el día de corte configurado).
        - Las tablas principales conservan todos los registros históricos con búsqueda, filtros por categoría/cuenta y formato de fechas limpio.
      - **Corrección de Etiquetas de Idioma & Mes (`translations.ts`)**:
        - Reemplazadas las cadenas estáticas `"Ingresos (Agosto)"`, `"Gastos (Agosto)"` y sus equivalentes en inglés por `"Ingresos (Este Mes)"` / `"Incomes (This Month)"` y `"Gastos (Este Mes)"` / `"Expenses (This Month)"`.
    - **Verificación**: `npx tsc --noEmit` completado con 0 errores y módulos backend verificados.
  - **2026-09-02 (Rediseño Maestro de Portafolio - Dary Fernández)**:
    - **Activación Integral de Skills de Diseño, Animación y Arquitectura Frontend**:
      - Aplicadas las directrices de `ui-ux-pro-max`, `high-end-visual-design`, `apple-design`, `minimalist-ui`, `animate`, `animation-vocabulary`, `find-animation-opportunities`, `impeccable` y `clean-code`.
      - Eliminación completa de caracteres corruptos de codificación en todo el proyecto asegurando UTF-8 impecable.
      - **Navbar Flotante Glassmorphic (`Navbar.tsx`)**: Barra cápsula con desenfoque de fondo, indicador animado de sección activa con Motion `layoutId`, badges de estado y menú móvil fluido.
      - **Hero Section Premium (`Hero.tsx`)**: Halo de iluminación ambiental multicapa, badge dinámico de disponibilidad con pulso radar, tipografía de alto contraste con gradiente moderno, tarjetas de tecnologías con logos oficiales de Devicon y marco flotante de fotografía con reflejos de luz.
      - **Proyectos Insignia (`Projects.tsx`)**: Filtros por categoría interactivos, tarjetas con relieve 3D al hover, badges tecnológicos con paleta oscura y enlaces directos a demos en vivo y repositorios en GitHub.
      - **Habilidades Técnicas (`Skills.tsx`)**: Arquitectura por 6 dominios de ingeniería (Lenguajes, Frontend, Backend, Bases de Datos, IA & Automatización, DevOps/Cloud) con iconografía Lucide moderna.
      - **Servicios Profesionales (`Services.tsx`) & Experiencia (`Experience.tsx`)**: Tarjetas de alto impacto con deliverables claros y línea de tiempo interactiva con nodos luminosos y enlaces a certificaciones oficiales (freeCodeCamp, Cisco Networking Academy).
      - **Contacto Directo (`Contact.tsx`) & Footer (`Footer.tsx`)**: Acceso directo a correo, WhatsApp y LinkedIn con botón de retorno al inicio suave.
    - **Validación**: `npx tsc --noEmit` con 0 errores y `npm run build` completado exitosamente (5/5 páginas estáticas prerenderizadas).
    - **Control de Versiones**: Commiteado y sincronizado a `main` en `DryFernand/Portafolio-DaryFernandez`.
  - **2026-09-02 (Refactorización Editorial de Alto Criterio - Eliminación de Clichés de IA)**:
    - **Principios Aplicados (`minimalist-ui`, `emil-design-eng`, `apple-design`)**:
      - Eliminadas las luces artificiales de neón estridentes (`blur-[140px]`), gradientes excesivos en encabezados y sombras artificiales.
      - Adopción de una paleta monocromática profunda (`#09090b` obsidian y `#111113` para superficies) con bordes ultra-delgados de 1px (`rgba(255,255,255,0.08)`).
      - Redacción auténtica, directa y con lenguaje de ingeniería real sin textos genéricos de IA ni buzzwords.
      - **Hero**: Presentación sobria y contundente, retrato profesional con escala de grises sutil y transición suave, enlaces limpios en monospace y métricas concretas en producción.
      - **Proyectos**: Formato de estudio de caso editorial con previsualización, ficha técnica en monospace, síntesis del problema resuelto y enlaces directos (`↗`).
      - **Stack y Experiencia**: Organización minimalista sin iconos saturados, resaltando tu rol real en AutoSpot, FyDry y certificaciones oficiales.
    - **Validación**: `npx tsc --noEmit` (0 errores) y `npm run build` de producción superado en 8.3s. Sincronizado en `main`.
  - **2026-09-02 (Restauración Total de la Información Original & Animaciones Nativas)**:
    - **Corrección Estricta sin Componentes Genéricos**:
      - Eliminado el componente extra `SpotlightCard.tsx` respetando la arquitectura y archivos existentes del proyecto.
      - **Restauración al 100% de la información auténtica del usuario**: Biografía real, roles y empresas verídicas (**AutoSpot**, **Red Bajas**, **Color Visión**), instituciones académicas (**ITLA**, **Instituto Técnico Salesiano**), los 9 proyectos con sus textos originales y catálogo de habilidades.
      - **Corrección Integral de Codificación de Caracteres**: Reparados todos los símbolos corruptos (`ǭ`, `?`, `Ǹ`) a caracteres UTF-8 limpios con sus acentos, tildes y eñes correctas.
      - **Animaciones Nativas y Dinamismo Preservado**: Mantenidas las animaciones nativas de `motion/react` (entradas escalonadas `staggerContainer`, flotación de tecnologías `floatingIcon`, filtros interactivos en proyectos con `AnimatePresence`, transiciones de hover y micro-interacciones de botones).
    - **Validación**: `npx tsc --noEmit` completado con 0 errores y `npm run build` de producción superado exitosamente (5/5 páginas estáticas prerenderizadas). Sincronizado a `main` en `DryFernand/Portafolio-DaryFernandez`.
  - **2026-09-02 (Elevación Visual: Diseño Profesional y Minimalista con Información Intacta)**:
    - **Mejoras Visuales de Alto Nivel sin Modificar Datos**:
      - **Superficies y Contrastes**: Paleta oscura refinada (`#060608`), bordes sutiles de 1px (`border-white/10` con transiciones a `hover:border-emerald-500/40`), eliminando gradientes estridentes y adoptando una estética de producto de ingeniería.
      - **Títulos de Sección Elegantes (`SectionTitle.tsx`)**: Tipografía con tracking ajustado y línea de acento milimétrica (`h-[2px] bg-emerald-500/60`).
      - **Navbar Flotante Minimalista (`Navbar.tsx`)**: Barra con `backdrop-blur-xl`, enlaces con espaciado óptimo y CTA directo *"Hablemos"*.
      - **Hero Equilibrado (`Hero.tsx`)**: Retrato con marco de doble borde y acento tenue, iconos tecnológicos con acabado oscuro uniforme (`bg-white/[0.03] border-white/10`) y micro-animaciones elásticas.
      - **Tarjetas de Proyectos Depuradas (`Projects.tsx`)**: Diseño sobrio con tipografía mono para stacks y categorías, badges de estado discretos y botones de acción fluidos.
    - **Validación**: `npx tsc --noEmit` (0 errores) y `npm run build` de producción en 4.9s. Desplegado a `main`.



























































## [2026-10-05] - Rediseño de Navegación y Jerarquía Visual del Dashboard (Fase 1)

### Módulo: Frontend (Dashboard Navigation & Layout)
- **Archivo afectado:** `frontend/components/dashboard/DashboardLayout.tsx`
- **Cambios realizados:**
  - **Reorganización en 3 grupos lógicos de navegación:**
    - `PRINCIPAL`: Inicio (`home`).
    - `OPERACIONES`: Movimientos (`movements`), Gastos (`expenses`), Ingresos (`incomes`).
    - `PATRIMONIO Y GESTIÓN`: Cuentas (`accounts`), Deudas (`debts`), Presupuesto (`budget`), Reportes (`reports`).
  - **Elevación visual de la interfaz:**
    - Incorporación de separadores sutiles y encabezados de sección con tracking optimizado.
    - Estados activos en alto contraste (`bg-zinc-950 text-white shadow-xs`) y hover refinado con escalado armónico de micro-iconos.
    - Navegación móvil (`mobile menu drawer`) sincronizada con la misma estructura agrupada y scroll vertical adaptativo.
  - **Refuerzo de Seguridad y Sesión (Auditoría Adversarial):**
    - Protección contra FOUC (Flash of Unauthenticated Content) manteniendo el estado de carga activo durante redirecciones no autenticadas.
    - Saneamiento integral de almacenamiento local (`clearAllSessionStorage()`) purgando tokens y entidades financieras cacheadas al cerrar sesión o recibir respuestas 401/403.
    - Unificación de precedencia de tokens con la capa de API (`api.ts`).
  - **Auditoría Funcional (`functions-comparison`):** 100% de funciones interactivas, callbacks de draft, handlers de configuración y renderizado condicional de vistas conservadas.
- **Validaciones:**
  - `security-agent`: **🟢 LUZ VERDE**
  - `qa-agent`: **🟢 LUZ VERDE** (`npx tsc --noEmit` exit code 0, `npm run build` exit code 0).


## [2026-10-05] - Botón Global de Acción Rápida y Modal de Transacciones (Fase 2)

### Módulo: Frontend (Quick Actions & Dashboard Layout)
- **Archivos afectados/creados:**
  - `frontend/components/dashboard/QuickTransactionModal.tsx` (Nuevo)
  - `frontend/components/dashboard/DashboardLayout.tsx`
  - `frontend/lib/api.ts`
- **Cambios realizados:**
  - **Componente `QuickTransactionModal`:**
    - Modal accesible con animaciones fluidas (`motion/react` y `AnimatePresence`), backdrop blur y cierre por tecla Escape o click fuera.
    - Selector dinámico de 3 operaciones: 🔴 Gasto, 🟢 Ingreso y 🔄 Transferencia entre cuentas.
    - Validación de saldo y sobregiro: Bloquea egresos que excedan los fondos disponibles más el límite de sobregiro (`overdraftLimit`) de la cuenta origen.
    - Manejo seguro de transferencias con resolución automática `targetToAccount` previniendo transferencias con destino vacío o cuentas idénticas.
    - Sanitización y validación estricta de entradas numéricas (`!isFinite`, `> 0`) y restricción de descripción a 255 caracteres.
    - Sincronización reactiva inmediata mediante el despacho del evento `fydry_storage_updated` para refrescar balances, widgets y listas en todas las pantallas.
  - **Integración Global en `DashboardLayout`:**
    - Botón primario estilizado `+ Registrar` en el Sidebar desktop sobre los menús de navegación.
    - Botón de acceso rápido en el top bar desktop junto a `NotificationBell`.
    - Botón táctil circular (+) en el header móvil.
    - Inclusión de `"fydry_movements"` en la purga exhaustiva de sesión `clearAllSessionStorage()`.
- **Validaciones:**
  - `security-agent`: **🟢 LUZ VERDE**
  - `qa-agent`: **🟢 LUZ VERDE** (`npx tsc --noEmit` exit code 0, `npm run build` Turbopack exit code 0).


## [2026-10-05] - Modernización del Dashboard Principal y Pulido de Botón de Acción (Fase 3)

### Módulo: Frontend (Dashboard Home & Layout)
- **Archivos afectados:**
  - `frontend/components/dashboard/DashboardLayout.tsx`
  - `frontend/components/dashboard/views/DashboardHome.tsx`
- **Cambios realizados:**
  - **Ajuste del Botón de Registro:**
    - Se dejó exclusivamente el icono `Plus` estilizado en el Sidebar desktop (eliminando la redundancia `+ +registrar`) con `title` y `aria-label` bilingües.
    - Se ajustó el texto del botón en la barra superior desktop a `"Registrar"` evitando duplicidad de signos.
  - **Rediseño Integral de `DashboardHome.tsx`:**
    - **Hero Card Financiero:** Tarjeta principal en tono oscuro (`zinc-950`) con destellos difusos, saldo total consolidado de alto impacto, indicador de ciclo activo y accesos directos.
    - **Barra de Pulso y Salud Financiera:** Monitoreo visual con diagnóstico de estado, barras de progreso para tasa de ahorro, ratio de gasto/ingreso y presupuesto mensual consumido.
    - **Grid de Métricas Clave:** 4 tarjetas interactivas (Ingresos, Gastos, Ahorro Neto, Cuentas) con badges de rendimiento y enlaces a sus respectivas vistas.
    - **Feed de Movimientos Recientes:** Tipografía optimizada, chips de categoría con contrastes suaves, formateo de fechas relativas ("Hoy", "Ayer") y montos contrastados.
    - **Widget de Cuentas y Liquidez:** Cuentas con iconos contextuales (`Building2`, `CreditCard`, `Banknote`, `Wallet`), saldos formateados y numeración enmascarada (`••• 1234`).
  - **Auditoría Funcional (`functions-comparison`):** 100% de los callbacks `onNavigate` preservados hacia todas las vistas.
- **Validaciones:**
  - `security-agent`: **🟢 LUZ VERDE** (Protección XSS, aritmética segura contra división por cero, enmascaramiento de cuentas).
  - `qa-agent`: **🟢 LUZ VERDE** (`npx tsc --noEmit` exit code 0, `npm run build` Turbopack exit code 0).


## [2026-10-05] - Barra de Navegación Inferior Móvil (Bottom Dock) y Depuración de UI (Fase 4)

### Módulo: Frontend (Mobile Navigation & Layout)
- **Archivo afectado:**
  - `frontend/components/dashboard/DashboardLayout.tsx`
- **Cambios realizados:**
  - **Eliminación de Botones Duplicados:**
    - Se retiró el botón de más del menú sidebar desktop, dejando un sidebar limpio enfocado exclusivamente en la navegación por secciones.
    - Se retiró el botón de más del header móvil superior para concentrar la acción en el dock inferior táctil.
  - **Implementación del Bottom Dock Móvil (`md:hidden`):**
    - Barra inferior ergonómica y fija con fondo desenfocado (`bg-white/90 backdrop-blur-md`) y soporte para `env(safe-area-inset-bottom)`.
    - 5 accesos directos pensados para el uso con una sola mano:
      - 🏠 Inicio (`home`)
      - 🔄 Movimientos (`movements`)
      - ➕ Botón central elevado (`-mt-4 w-11 h-11 rounded-full bg-zinc-950 text-white shadow-md`) para abrir `QuickTransactionModal`.
      - 💳 Cuentas (`accounts`)
      - 📊 Presupuesto (`budget`)
  - **Ajuste de Padding Inferior:**
    - Contenedor principal con `pb-24 md:pb-8` asegurando que ningún elemento quede tapado por la barra inferior fija en teléfonos.
  - **Menú Superior Secundario:**
    - Se mantiene el menú hamburguesa móvil para acceder a Deudas, Reportes, Ajustes y Cerrar Sesión.
- **Validaciones:**
  - `security-agent`: **🟢 LUZ VERDE** (Aislamiento de eventos, accesibilidad ARIA, sin regresiones de sesión).
  - `qa-agent`: **🟢 LUZ VERDE** (`npx tsc --noEmit` exit code 0, `npm run build` Turbopack exit code 0).


## [2026-10-06] - Rediseño de Notificaciones: Limpieza Cromática de Tarjetas (Fase 1)

### Módulo: Frontend (Notifications & Alerts)
- **Archivo afectado:**
  - `frontend/components/dashboard/NotificationBell.tsx`
- **Cambios realizados:**
  - **Eliminación del Arcoíris de Colores en Alertas:**
    - Se retiraron los 7 colores no estandarizados (púrpura, índigo, ámbar, naranja y azul brillante) de los badges e iconos.
    - Se unificó bajo una paleta semántica y sobria acorde a FyDry:
      - Alertas críticas de sobregiro o límite excedido en `rose-600` / `bg-rose-50 border-rose-100`.
      - Ingresos y entradas en `emerald-600` / `bg-emerald-50 border-emerald-100`.
      - Todo el resto (presupuestos, cortes de tarjeta, pagos pendientes, movimientos, balances) en escala neutra elegante `zinc-700` / `bg-zinc-100 border-zinc-200/60`.
  - **Acciones y Enlaces de Tarjetas:**
    - Enlaces de acción "Ver Detalle" / "Revisar & Asentar" unificados de texto morado a `text-zinc-900 font-semibold hover:text-zinc-600`.
    - Botón de descarte integrado en gris neutro `text-zinc-400 hover:text-rose-600 hover:bg-rose-50`.
  - **Auditoría Funcional (`functions-comparison`):** 100% de las 6 funciones interactivas preservadas (toggle popover, apertura de borradores, marcado de leídas, descarte individual, permisos nativos push y sincronización por eventos).
- **Validaciones:**
  - `security-agent`: **🟢 LUZ VERDE** (Prevención XSS, higiene de listeners y permisos nativos).
  - `qa-agent`: **🟢 LUZ VERDE** (`npx tsc --noEmit` exit code 0, `npm run build` Turbopack exit code 0).
