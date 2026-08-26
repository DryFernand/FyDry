const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 9000
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: data?.detail || data?.message || "Ocurrió un error en la solicitud.",
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return {
        error: "La conexión con el servidor tardó demasiado tiempo (timeout).",
        status: 504,
      };
    }
    return {
      error: "No se pudo conectar con el servidor backend de FyDry.",
      status: 500,
    };
  }
}
