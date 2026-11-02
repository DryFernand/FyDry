import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://fydry-api-dary.vercel.app/api/v1"
).replace(/\/+$/, "");

async function backendGet<T>(
  path: string,
  token: string
): Promise<{ ok: boolean; status: number; data: T | null }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? ((await res.json()) as T) : null,
    };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(key);
  if (!entry || now >= entry.resetAt) {
    RATE_LIMIT_MAP.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function paraLeer(text: string): string {
  const words = text
    .split(/\s+/)
    .map((w) =>
      w.startsWith("http://") || w.startsWith("https://") || w.startsWith("www.")
        ? "un enlace"
        : w
    );
  let out = "";
  for (const c of words.join(" ")) {
    if ("*_`#~|<>[]{}".includes(c)) continue;
    if (c === "%") {
      out += " por ciento";
    } else if (c === "&") {
      out += " y ";
    } else if (c === "+") {
      out += " más ";
    } else if (c === "=") {
      out += " igual a ";
    } else if (/[\p{L}\p{N}\s.,;:¿?¡!'"()\-/°$€]/u.test(c)) {
      out += c;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

function createWavFromPcm16(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1
): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(buffer, 44);
  return buffer;
}

function computeEnvelope(wavBuffer: Buffer): number[] {
  let dataOffset = -1;
  for (let i = 0; i <= wavBuffer.length - 4; i++) {
    if (
      wavBuffer[i] === 0x64 &&
      wavBuffer[i + 1] === 0x61 &&
      wavBuffer[i + 2] === 0x74 &&
      wavBuffer[i + 3] === 0x61
    ) {
      dataOffset = i + 8;
      break;
    }
  }
  if (dataOffset < 0 || dataOffset >= wavBuffer.length) return [];

  const rate = wavBuffer.length >= 28 ? wavBuffer.readUInt32LE(24) : 24000;
  const data = wavBuffer.subarray(dataOffset);
  const sampleCount = Math.floor(data.length / 2);
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    samples[i] = data.readInt16LE(i * 2) / 32768.0;
  }

  const windowSize = Math.max(1, Math.floor(rate / 50));
  const rms: number[] = [];
  for (let i = 0; i < samples.length; i += windowSize) {
    const end = Math.min(samples.length, i + windowSize);
    const len = end - i;
    let sumSq = 0;
    for (let j = i; j < end; j++) {
      sumSq += samples[j] * samples[j];
    }
    rms.push(Math.sqrt(sumSq / len));
  }

  if (rms.length === 0) return [];
  const sorted = [...rms].sort((a, b) => a - b);
  const peakIdx = Math.min(
    sorted.length - 1,
    Math.floor((sorted.length * 95) / 100)
  );
  const peak = Math.max(1e-4, sorted[peakIdx] ?? 1.0);

  return rms.map((r) => {
    const clamped = Math.min(1.0, Math.max(0.0, r / peak));
    return Number(Math.pow(clamped, 0.7).toFixed(3));
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación estricta de sesión autenticada (idéntica a /api/ai/chat)
    const authHeader = req.headers.get("authorization");
    const sessionCookie =
      req.cookies.get("fydry_token")?.value ||
      req.cookies.get("fydry_access_token")?.value ||
      req.cookies.get("access_token")?.value;

    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader?.trim();
    const token = bearerToken || sessionCookie;

    const unauthorized = () =>
      NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Tu sesión expiró. Inicia sesión de nuevo para escuchar a Camila.",
        },
        { status: 401 }
      );

    if (
      !token ||
      token.length < 10 ||
      token.length > 4096 ||
      !/^[A-Za-z0-9-_.]+$/.test(token)
    ) {
      return unauthorized();
    }

    const me = await backendGet<{ id: string | number }>("/auth/me", token);
    if (!me.ok || !me.data?.id) {
      return me.status === 0
        ? NextResponse.json(
            {
              error: "BACKEND_UNAVAILABLE",
              message: "No pude conectar con FyDry. Intenta de nuevo en un momento.",
            },
            { status: 503 }
          )
        : unauthorized();
    }

    // 2. Rate limiting indexado por userId autenticado y por IP
    const userId = String(me.data.id);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (checkRateLimit(`user:${userId}`) || checkRateLimit(`ip:${ip}`)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Demasiadas solicitudes de voz." },
        { status: 429 }
      );
    }

    // 3. Uso exclusivo de AI_API_KEY en servidor
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NO_API_KEY", message: "Servicio de voz no disponible." },
        { status: 503 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { text?: string };
    const rawText = typeof body.text === "string" ? body.text.trim() : "";
    if (!rawText) {
      return NextResponse.json(
        { error: "EMPTY_TEXT", message: "Texto vacío." },
        { status: 400 }
      );
    }

    const cleanText = paraLeer(rawText).slice(0, 600);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Lee en español con voz cálida, fluida, serena y natural:\n\n${cleanText}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "TTS_FAILED", message: "No se pudo sintetizar la voz." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const inlineData =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return NextResponse.json(
        { error: "NO_AUDIO", message: "Respuesta sin datos de audio." },
        { status: 502 }
      );
    }

    const pcmBuffer = Buffer.from(inlineData.data, "base64");
    const wavBuffer = createWavFromPcm16(pcmBuffer, 24000, 1);
    const envelope = computeEnvelope(wavBuffer);

    return NextResponse.json({
      audioBase64: wavBuffer.toString("base64"),
      mimeType: "audio/wav",
      envelope,
    });
  } catch (err) {
    console.error("[/api/ai/tts] Error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Error al generar voz." },
      { status: 500 }
    );
  }
}
