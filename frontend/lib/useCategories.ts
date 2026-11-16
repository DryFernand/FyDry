"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCategoriesApi } from "@/lib/api";
import {
  CategoryItem,
  CategoryKind,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  SYSTEM_CATEGORY_DEFAULTS,
  SystemCategoryKey,
} from "@/lib/categories";

/** Se dispara al crear, renombrar o eliminar una categoría para que todas las pantallas recarguen. */
export const CATEGORIES_UPDATED_EVENT = "fydry_categories_updated";

// Últimas categorías del usuario cargadas: las usan también funciones fuera de componentes (asistente de IA)
let current: CategoryItem[] | null = null;
let inflight: Promise<CategoryItem[] | null> | null = null;

function loadCategories(): Promise<CategoryItem[] | null> {
  inflight ??= fetchCategoriesApi()
    .then((items) => {
      if (items.length > 0) current = items;
      return current;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Nombres de las categorías del usuario de ese tipo (las predefinidas mientras no carguen). */
export function categoryNames(kind: CategoryKind, items: CategoryItem[] | null = current): string[] {
  if (!items) return [...(kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)];
  return items.filter((c) => c.kind === kind).map((c) => c.name);
}

/** Nombre actual de una categoría del sistema, aunque el usuario la haya renombrado. */
export function systemCategoryName(key: SystemCategoryKey, items: CategoryItem[] | null = current): string {
  return items?.find((c) => c.system_key === key)?.name ?? SYSTEM_CATEGORY_DEFAULTS[key];
}

/** Categorías del usuario. Se recargan solas cuando alguien las cambia (CATEGORIES_UPDATED_EVENT). */
export function useCategories() {
  const [items, setItems] = useState<CategoryItem[] | null>(() => current);

  useEffect(() => {
    let alive = true;
    const load = () => loadCategories().then((r) => alive && setItems(r));
    load();
    window.addEventListener(CATEGORIES_UPDATED_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, load);
    };
  }, []);

  return useMemo(
    () => ({
      items: items ?? [],
      expense: categoryNames("expense", items),
      income: categoryNames("income", items),
      nameOf: (key: SystemCategoryKey) => systemCategoryName(key, items),
    }),
    [items]
  );
}
