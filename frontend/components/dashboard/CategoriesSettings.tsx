"use client";

import { useState } from "react";
import { Check, Loader2, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { createCategoryApi, deleteCategoryApi, renameCategoryApi } from "@/lib/api";
import type { CategoryItem, CategoryKind } from "@/lib/categories";
import { CATEGORIES_UPDATED_EVENT, useCategories } from "@/lib/useCategories";

const input =
  "w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";
const iconBtn = "h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors disabled:opacity-40";

/** Avisa a todas las pantallas: recargan categorías y transacciones (los nombres pudieron cambiar). */
function notifyChanged() {
  window.dispatchEvent(new Event(CATEGORIES_UPDATED_EVENT));
  window.dispatchEvent(new Event("fydry_refresh_data"));
}

/** Pestaña de Configuración: crear, renombrar y eliminar categorías del usuario. */
export default function CategoriesSettings() {
  const { items } = useCategories();
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; moveTo: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const list = items.filter((c) => c.kind === kind);
  const otherKey = kind === "expense" ? "other_expense" : "other_income";

  const run = async (action: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await action();
      notifyChanged();
      setMsg({ ok: true, text: okText });
      return true;
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "No se pudo guardar el cambio." });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (await run(() => createCategoryApi(kind, name), `Categoría "${name}" creada.`)) setNewName("");
  };

  const saveRename = async (cat: CategoryItem) => {
    const name = editing?.name.trim() || "";
    if (!name || name === cat.name) return setEditing(null);
    if (await run(() => renameCategoryApi(cat.id, name), `"${cat.name}" ahora se llama "${name}" en todos tus movimientos.`)) {
      setEditing(null);
    }
  };

  const startDelete = (cat: CategoryItem) => {
    setEditing(null);
    const fallback = list.find((c) => c.system_key === otherKey && c.id !== cat.id) || list.find((c) => c.id !== cat.id);
    setDeleting({ id: cat.id, moveTo: fallback?.id || "" });
  };

  const confirmDelete = async (cat: CategoryItem) => {
    const target = list.find((c) => c.id === deleting?.moveTo);
    if (!target) return;
    if (await run(() => deleteCategoryApi(cat.id, target.id), `"${cat.name}" eliminada; sus movimientos pasaron a "${target.name}".`)) {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-zinc-950">Categorías</h3>
        <p className="text-xs text-zinc-500 mt-1">
          Renombra, crea o elimina tus categorías. Al renombrar, el cambio se aplica a todos tus gastos, ingresos, presupuestos y
          recurrentes. Las marcadas con candado las usa FyDry para cálculos (impuestos, deudas, ahorro, cashback): puedes
          renombrarlas, pero no eliminarlas.
        </p>
      </div>

      <div className="flex gap-2">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setEditing(null);
              setDeleting(null);
              setMsg(null);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
              kind === k ? "bg-emerald-700 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            {k === "expense" ? "Gastos" : "Ingresos"} ({items.filter((c) => c.kind === k).length})
          </button>
        ))}
      </div>

      <form onSubmit={add} className="flex gap-2">
        <input
          value={newName}
          maxLength={100}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={kind === "expense" ? "Nueva categoría de gasto, ej. Bebé" : "Nueva categoría de ingreso, ej. Propinas"}
          aria-label="Nombre de la nueva categoría"
          className={input}
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </form>

      {msg && (
        <p role="status" className={`text-[11px] font-medium ${msg.ok ? "text-green-700" : "text-rose-600"}`}>
          {msg.text}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-zinc-400" role="status">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Cargando categorías</span>
        </div>
      ) : (
        <ul className="rounded-2xl border border-zinc-200/80 divide-y divide-zinc-100 bg-white">
          {list.map((cat) => {
            const isEditing = editing?.id === cat.id;
            const isDeleting = deleting?.id === cat.id;
            return (
              <li key={cat.id} className="px-3 py-2">
                <div className="flex items-center gap-2 min-h-8">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editing.name}
                      maxLength={100}
                      aria-label={`Nuevo nombre para ${cat.name}`}
                      onChange={(e) => setEditing({ id: cat.id, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveRename(cat);
                        } else if (e.key === "Escape") {
                          e.stopPropagation();
                          setEditing(null);
                        }
                      }}
                      className={input}
                    />
                  ) : (
                    <span className="flex-1 min-w-0 truncate text-xs text-zinc-800">{cat.name}</span>
                  )}
                  {cat.system_key && !isEditing && (
                    <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-label="Categoría del sistema" />
                  )}
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => saveRename(cat)} disabled={busy} aria-label="Guardar nombre"
                        className={`${iconBtn} text-green-700 hover:bg-green-50`}>
                        <Check className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditing(null)} aria-label="Cancelar"
                        className={`${iconBtn} text-zinc-500 hover:bg-zinc-100`}>
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" disabled={busy} aria-label={`Renombrar ${cat.name}`}
                        onClick={() => {
                          setDeleting(null);
                          setEditing({ id: cat.id, name: cat.name });
                        }}
                        className={`${iconBtn} text-zinc-500 hover:bg-zinc-100`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {!cat.system_key && (
                        <button type="button" disabled={busy} aria-label={`Eliminar ${cat.name}`} onClick={() => startDelete(cat)}
                          className={`${iconBtn} text-zinc-400 hover:text-red-600 hover:bg-red-50`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {isDeleting && (
                  <div className="mt-2 p-3 rounded-xl bg-red-50/60 border border-red-200/70 space-y-2">
                    <label htmlFor={`move-${cat.id}`} className="block text-[11px] font-semibold text-zinc-800">
                      Sus gastos, ingresos, presupuesto y recurrentes pasarán a:
                    </label>
                    <select
                      id={`move-${cat.id}`}
                      value={deleting.moveTo}
                      onChange={(e) => setDeleting({ id: cat.id, moveTo: e.target.value })}
                      className={`${input} cursor-pointer`}
                    >
                      {list.filter((c) => c.id !== cat.id).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-zinc-500">Si ambas tienen presupuesto, los límites se suman en uno solo.</p>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setDeleting(null)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 cursor-pointer hover:bg-zinc-50">
                        Cancelar
                      </button>
                      <button type="button" disabled={busy || !deleting.moveTo} onClick={() => confirmDelete(cat)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50">
                        Eliminar y mover
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
