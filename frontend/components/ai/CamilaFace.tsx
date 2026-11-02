"use client";

import React, { useEffect, useRef } from "react";

export type CamilaExpression = "neutral" | "happy" | "listening" | "thinking" | "asking";

export interface CamilaFaceProps {
  expression?: CamilaExpression;
  speaking?: boolean;
  mouthLevel?: number;
  className?: string;
  size?: number;
  interactiveGaze?: boolean;
}

interface EyeParams {
  w: number;
  h: number;
  round: number;
  lid: number;
  tilt: number;
  smile: number;
}

const NEUTRAL: EyeParams = {
  w: 0.25,
  h: 0.31,
  round: 0.075,
  lid: 0.0,
  tilt: 0.0,
  smile: 0.0,
};

function approach(current: number, target: number, speed: number, dt: number): number {
  return current + (target - current) * (1.0 - Math.exp(-speed * dt));
}

function hash(n: number): number {
  let x = (Math.imul(n, 0x9e3779b9) ^ 0x85ebca6b) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  x = Math.imul(x, 0x2c1b3c6d) >>> 0;
  x = (x ^ (x >>> 12)) >>> 0;
  return (x & 0xffff) / 65535.0;
}

function eyeFor(expression: CamilaExpression, side: number): EyeParams {
  switch (expression) {
    case "neutral":
      return { ...NEUTRAL };
    case "happy":
      return { ...NEUTRAL, w: 0.27, h: 0.30, round: 0.09, smile: 1.0 };
    case "listening":
      return { ...NEUTRAL, w: 0.27, h: 0.35, round: 0.085 };
    case "thinking":
      return side === 0
        ? { ...NEUTRAL, h: 0.28, lid: 0.42, tilt: 0.25 }
        : { ...NEUTRAL, h: 0.32, lid: 0.12, tilt: -0.1 };
    case "asking":
      return side === 0
        ? { ...NEUTRAL, h: 0.29, lid: 0.38 }
        : { ...NEUTRAL, w: 0.27, h: 0.35, round: 0.085 };
  }
}

function eyeDistance(
  x: number,
  y: number,
  eye: EyeParams,
  blink: number,
  outer: number
): number {
  const h = eye.h * (1.0 - 0.92 * blink);
  const hw = eye.w / 2.0;
  const hh = h / 2.0;
  const r = Math.min(eye.round, hw, hh);
  const qx = Math.abs(x) - hw + r;
  const qy = Math.abs(y) - hh + r;
  const mx = Math.max(qx, 0.0);
  const my = Math.max(qy, 0.0);
  const outside = Math.sqrt(mx * mx + my * my);
  const rounded = outside + Math.min(Math.max(qx, qy), 0.0) - r;

  const lidY = -hh + eye.lid * h + eye.tilt * x * outer;
  const lid = lidY - y;

  let bite = -1e9;
  if (eye.smile > 0.01) {
    const cy = hh * 1.35;
    const cr = h * 0.95 * eye.smile;
    bite = cr - Math.sqrt(x * x + (y - cy) * (y - cy));
  }

  return Math.max(rounded, lid, bite);
}

const BG_R = 8;
const BG_G = 10;
const BG_B = 14;
const FG_R = 0;
const FG_G = 210;
const FG_B = 255;

export default function CamilaFace({
  expression = "neutral",
  speaking = false,
  mouthLevel,
  className = "",
  size,
  interactiveGaze = true,
}: CamilaFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ expression, speaking, mouthLevel, interactiveGaze });

  useEffect(() => {
    propsRef.current = { expression, speaking, mouthLevel, interactiveGaze };
  }, [expression, speaking, mouthLevel, interactiveGaze]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const state = {
      t: 0,
      gazeX: 0,
      gazeY: 0,
      headX: 0,
      headY: 0,
      wanderX: 0,
      wanderY: 0,
      nextWander: 1.5,
      nextBlink: 2.2,
      blinkStart: -1.0,
      blink: 0,
      mouth: 0,
      syllableTarget: 0,
      nextSyllable: 0,
      seed: 1,
      pointerX: null as number | null,
      pointerY: null as number | null,
      lastPointerAt: 0,
      eyes: [{ ...NEUTRAL }, { ...NEUTRAL }] as [EyeParams, EyeParams],
    };

    const handlePointerMove = (ev: MouseEvent) => {
      if (!propsRef.current.interactiveGaze) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = Math.max(-1, Math.min(1, (ev.clientX - cx) / (window.innerWidth * 0.45)));
      const ny = Math.max(-1, Math.min(1, -(ev.clientY - cy) / (window.innerHeight * 0.45)));
      state.pointerX = nx * 0.75;
      state.pointerY = ny * 0.65;
      state.lastPointerAt = performance.now();
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    let imgData: ImageData | null = null;
    let covBuf: Float32Array | null = null;
    let bufW = 0;
    let bufH = 0;

    const mouthCurveX = new Float32Array(121);
    const mouthCurveY = new Float32Array(121);
    const mouthThick = new Float32Array(121);

    const render = (now: number) => {
      const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      state.t = (now - startTime) / 1000;
      const t = state.t;

      const {
        expression: expr,
        speaking: isSpeaking,
        mouthLevel: explicitMouth,
        interactiveGaze: allowGaze,
      } = propsRef.current;

      // 1. Mirada objetivo
      let targetGazeX = 0;
      let targetGazeY = 0;

      if (expr === "thinking") {
        targetGazeX = -0.6;
        targetGazeY = 0.6;
      } else if (expr === "happy" || expr === "listening") {
        if (allowGaze && state.pointerX !== null && state.pointerY !== null && now - state.lastPointerAt < 2200) {
          targetGazeX = state.pointerX * 0.45;
          targetGazeY = state.pointerY * 0.45;
        } else {
          targetGazeX = 0;
          targetGazeY = 0;
        }
      } else if (allowGaze && state.pointerX !== null && state.pointerY !== null && now - state.lastPointerAt < 2200) {
        targetGazeX = state.pointerX;
        targetGazeY = state.pointerY;
      } else {
        if (t >= state.nextWander) {
          state.seed += 1;
          const centerChance = hash(state.seed * 5);
          if (centerChance < 0.4) {
            state.wanderX = 0;
            state.wanderY = 0;
          } else {
            state.wanderX = (hash(state.seed) - 0.5) * 1.6;
            state.wanderY = (hash(state.seed * 7) - 0.5) * 1.0;
          }
          state.nextWander = t + 1.8 + hash(state.seed * 13) * 3.0;
        }
        targetGazeX = state.wanderX;
        targetGazeY = state.wanderY;
      }

      state.gazeX = approach(state.gazeX, targetGazeX, 18.0, dt);
      state.gazeY = approach(state.gazeY, targetGazeY, 18.0, dt);
      state.headX = approach(state.headX, targetGazeX, 3.0, dt);
      state.headY = approach(state.headY, targetGazeY, 3.0, dt);

      // 2. Parpadeo natural (simple y doble)
      if (t >= state.nextBlink) {
        state.blinkStart = t;
        state.seed += 1;
        const isDouble = hash(state.seed * 31) < 0.15;
        state.nextBlink = t + (isDouble ? 0.35 : 2.5 + hash(state.seed * 17) * 4.0);
      }
      const b = t - state.blinkStart;
      state.blink =
        b >= 0 && b < 0.07
          ? b / 0.07
          : b >= 0.07 && b < 0.22
          ? 1.0 - (b - 0.07) / 0.15
          : 0.0;

      // 3. Interpolación de ojos
      for (let side = 0; side < 2; side++) {
        const target = eyeFor(expr, side);
        const eye = state.eyes[side];
        const k = 12.0;
        eye.w = approach(eye.w, target.w, k, dt);
        eye.h = approach(eye.h, target.h, k, dt);
        eye.round = approach(eye.round, target.round, k, dt);
        eye.lid = approach(eye.lid, target.lid, k, dt);
        eye.tilt = approach(eye.tilt, target.tilt, k, dt);
        eye.smile = approach(eye.smile, target.smile, k, dt);
      }

      // 4. Nivel de boca (habla silábica natural o nivel explícito)
      let targetMouth = 0;
      if (typeof explicitMouth === "number") {
        targetMouth = Math.max(0, Math.min(1, explicitMouth));
      } else if (isSpeaking) {
        if (t >= state.nextSyllable) {
          state.seed += 1;
          const pauseRoll = hash(state.seed * 19);
          if (pauseRoll < 0.16) {
            state.syllableTarget = 0.08;
            state.nextSyllable = t + 0.09 + hash(state.seed * 23) * 0.09;
          } else {
            state.syllableTarget = 0.35 + hash(state.seed * 29) * 0.57;
            state.nextSyllable = t + 0.09 + hash(state.seed * 37) * 0.09;
          }
        }
        targetMouth = state.syllableTarget;
      } else {
        targetMouth = 0;
      }
      state.mouth = approach(state.mouth, targetMouth, 30.0, dt);

      // 5. Dimensiones del buffer del canvas
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(24, Math.round(rect.width || size || 120));
      const cssH = Math.max(24, Math.round(rect.height || size || 120));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Limitar resolución interna para mantener 60fps ultraligeros con SDF antialiasing perfecto
      const maxDim = 260;
      const scaleFactor = Math.min(dpr, maxDim / Math.max(cssW, cssH));
      const w = Math.max(32, Math.round(cssW * scaleFactor));
      const h = Math.max(32, Math.round(cssH * scaleFactor));

      if (canvas.width !== w || canvas.height !== h || !imgData || !covBuf) {
        canvas.width = w;
        canvas.height = h;
        imgData = ctx.createImageData(w, h);
        covBuf = new Float32Array(w * h);
        bufW = w;
        bufH = h;
      }

      covBuf.fill(0);

      const unit = Math.min(bufH, bufW / 1.4);
      const bob = Math.sin(t * 1.3) * 0.008;
      const centerX = bufW * 0.5 + state.headX * 0.035 * unit;
      const centerY = bufH * 0.46 - state.headY * 0.035 * unit + bob * unit;

      const gx = state.gazeX * 0.055;
      const gy = -state.gazeY * 0.045;

      const fillShape = (
        x0: number,
        x1: number,
        y0: number,
        y1: number,
        distFn: (u: number, v: number) => number
      ) => {
        const px0 = Math.max(0, Math.min(bufW, Math.floor(centerX + x0 * unit)));
        const px1 = Math.max(0, Math.min(bufW, Math.ceil(centerX + x1 * unit)));
        const py0 = Math.max(0, Math.min(bufH, Math.floor(centerY + y0 * unit)));
        const py1 = Math.max(0, Math.min(bufH, Math.ceil(centerY + y1 * unit)));

        for (let py = py0; py < py1; py++) {
          const v = (py + 0.5 - centerY) / unit;
          const rowOffset = py * bufW;
          for (let px = px0; px < px1; px++) {
            const u = (px + 0.5 - centerX) / unit;
            const d = distFn(u, v);
            const cover = Math.max(0.0, Math.min(1.0, 0.5 - d * unit));
            if (cover > covBuf![rowOffset + px]) {
              covBuf![rowOffset + px] = cover;
            }
          }
        }
      };

      // 6. Dibujar ambos ojos
      const eyePositions: [number, number, number][] = [
        [-0.235, 0, -1.0],
        [0.235, 1, 1.0],
      ];

      for (const [ex, side, outer] of eyePositions) {
        const eye = state.eyes[side];
        const hw = eye.w / 2.0 + 0.02;
        const hh = eye.h / 2.0 + 0.02;
        const ox = ex + gx;
        const oy = gy - 0.04;
        fillShape(ox - hw, ox + hw, oy - hh, oy + hh, (u, v) =>
          eyeDistance(u - ox, v - oy, eye, state.blink, outer)
        );
      }

      // 7. Dibujar la boca (sonrisa en reposo, onda de audio al hablar)
      const my = 0.31 + gy * 0.45;
      const mw = 0.15;
      const mx = gx * 0.5;
      const smile = expr === "happy" ? 0.05 : 0.022;
      const steps = 120;

      for (let i = 0; i <= steps; i++) {
        const m = (i / steps) * 2.0 - 1.0;
        const curve = -smile * m * m;
        const wave =
          Math.sin(m * 5.0 + t * 13.0) * 0.6 + Math.sin(m * 9.0 - t * 19.0) * 0.4;
        const yOffset =
          curve + (state.mouth > 0.02 ? wave * state.mouth * 0.06 * (1.0 - m * m) : 0);
        mouthCurveX[i] = mx + m * mw;
        mouthCurveY[i] = my + yOffset;
        mouthThick[i] = 0.011 + state.mouth * 0.012 * (1.0 - m * m);
      }

      fillShape(mx - mw - 0.035, mx + mw + 0.035, my - 0.11, my + 0.11, (u, v) => {
        const norm = ((u - mx) / mw + 1.0) * 0.5 * steps;
        const at = Math.max(0, Math.min(steps, Math.round(norm)));
        const startIdx = Math.max(0, at - 14);
        const endIdx = Math.min(steps, at + 14);
        let minDist = 1e9;
        for (let i = startIdx; i <= endIdx; i++) {
          const dx = u - mouthCurveX[i];
          const dy = v - mouthCurveY[i];
          const d = Math.sqrt(dx * dx + dy * dy) - mouthThick[i];
          if (d < minDist) minDist = d;
        }
        return minDist;
      });

      // 8. Volcar cobertura a ImageData con los colores exactos #080A0E y #00D2FF
      const data = imgData.data;
      const totalPixels = bufW * bufH;
      for (let i = 0; i < totalPixels; i++) {
        const c = covBuf[i];
        const idx = i * 4;
        if (c <= 0) {
          data[idx] = BG_R;
          data[idx + 1] = BG_G;
          data[idx + 2] = BG_B;
          data[idx + 3] = 255;
        } else if (c >= 1) {
          data[idx] = FG_R;
          data[idx + 1] = FG_G;
          data[idx + 2] = FG_B;
          data[idx + 3] = 255;
        } else {
          data[idx] = Math.round(BG_R + (FG_R - BG_R) * c);
          data[idx + 1] = Math.round(BG_G + (FG_G - BG_G) * c);
          data[idx + 2] = Math.round(BG_B + (FG_B - BG_B) * c);
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handlePointerMove);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={
        size
          ? { width: `${size}px`, height: `${size}px`, backgroundColor: "#080A0E" }
          : { backgroundColor: "#080A0E" }
      }
      className={`block select-none ${size ? "" : "w-full h-full"} ${className}`}
      aria-label="Rostro animado de Camila"
    />
  );
}
