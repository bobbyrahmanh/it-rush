"use client";

import { useEffect, useRef, useState } from "react";

type MascotProps = {
  className?: string;
};

export default function Mascot({ className = "" }: MascotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const updatePointer = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const eyeCenterX = rect.left + rect.width * 0.5;
      const eyeCenterY = rect.top + rect.height * 0.4;

      const dx = clientX - eyeCenterX;
      const dy = clientY - eyeCenterY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        setGaze({ x: 0, y: 0 });
        return;
      }

      const maxOffset = 8.5;
      const factor = Math.min(dist / 320, 1) * maxOffset;
      setGaze({
        x: Number(((dx / dist) * factor).toFixed(2)),
        y: Number(((dy / dist) * factor).toFixed(2)),
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const dots = [
    [125, 180],
    [125, 198],
    [125, 216],
    [155, 180],
    [155, 198],
    [155, 216],
  ];

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 280 280"
      role="img"
      aria-label="Owli, maskot burung hantu SIGNIFY dengan enam titik Braille"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ground shadow */}
      <ellipse
        cx="137"
        cy="263"
        rx="76"
        ry="10"
        fill="#1B1B3A"
        opacity=".16"
      />

      <g className="animate-floaty">
        {/* Body */}
        <path
          d="
            M66 126
            C65 91 90 66 137 66
            C184 66 210 94 210 136
            L207 208
            C205 240 179 255 139 255
            C98 255 72 239 69 208
            Z
          "
          fill="#8B72E8"
          stroke="#1B1B3A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Left wing */}
        <path
          d="
            M76 143
            C57 155 43 183 43 211
            C43 231 56 241 70 231
            C84 220 94 191 96 169
            C97 151 90 137 76 143Z
          "
          fill="#A995F5"
          stroke="#1B1B3A"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M65 190 Q77 178 82 161 M59 211 Q74 202 82 190"
          fill="none"
          stroke="#7259D1"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Right wing behind body */}
        <path
          d="
            M195 145
            C217 142 235 158 232 174
            C230 185 220 192 209 192
            C224 199 226 211 216 220
            C205 230 190 220 181 211
          "
          fill="#A995F5"
          stroke="#1B1B3A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Head silhouette and feather tufts */}
        <path
          d="
            M48 112
            C40 81 55 52 83 39
            L66 18
            Q105 23 126 36
            Q143 29 161 36
            Q183 22 215 18
            L197 47
            C220 65 231 91 225 119
            C218 153 188 172 137 172
            C85 172 55 151 48 112Z
          "
          fill="#8B72E8"
          stroke="#1B1B3A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Forehead feather detail */}
        <path
          d="
            M51 94
            Q83 55 119 76
            Q139 60 158 76
            Q191 54 222 95
            Q194 79 176 91
            Q156 75 138 93
            Q116 75 96 92
            Q72 80 51 94Z
          "
          fill="#7259D1"
        />

        {/* Eye patches */}
        <ellipse
          cx="99"
          cy="112"
          rx="39"
          ry="42"
          fill="#FFF5DF"
          stroke="#1B1B3A"
          strokeWidth="5"
        />
        <ellipse
          cx="177"
          cy="112"
          rx="39"
          ry="42"
          fill="#FFF5DF"
          stroke="#1B1B3A"
          strokeWidth="5"
        />

        {/* Eye rings */}
        <circle
          cx="99"
          cy="112"
          r="29"
          fill="#FFC93C"
          stroke="#5B4BDB"
          strokeWidth="5"
        />
        <circle
          cx="177"
          cy="112"
          r="29"
          fill="#FFC93C"
          stroke="#5B4BDB"
          strokeWidth="5"
        />

        {/* Eyes (mengikuti arah kursor & sentuhan) */}
        <g
          style={{
            transform: `translate(${gaze.x}px, ${gaze.y}px)`,
            transition: "transform 0.09s ease-out",
          }}
        >
          <circle cx="99" cy="112" r="18" fill="#1B1B3A" />
          <circle cx="105" cy="105" r="7.5" fill="white" />
          <circle cx="92" cy="121" r="3.8" fill="#B9A9F5" />
        </g>
        <g
          style={{
            transform: `translate(${gaze.x}px, ${gaze.y}px)`,
            transition: "transform 0.09s ease-out",
          }}
        >
          <circle cx="177" cy="112" r="18" fill="#1B1B3A" />
          <circle cx="183" cy="105" r="7.5" fill="white" />
          <circle cx="170" cy="121" r="3.8" fill="#B9A9F5" />
        </g>

        {/* Kelopak mata kiri */}
        <ellipse
          cx="99"
          cy="112"
          rx="30"
          ry="32"
          fill="#8B72E8"
          className="animate-blink"
        />

        {/* Kelopak mata kanan */}
        <ellipse
          cx="175"
          cy="112"
          rx="30"
          ry="32"
          fill="#8B72E8"
          className="animate-blink"
        />
        
        {/* Beak */}
        <path
          d="M126 126 L151 126 L139 145Z"
          fill="#FFB84D"
          stroke="#1B1B3A"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Cheeks */}
        <ellipse
          cx="62"
          cy="145"
          rx="9"
          ry="6"
          fill="#FF8D9B"
          opacity=".8"
        />
        <ellipse
          cx="215"
          cy="145"
          rx="9"
          ry="6"
          fill="#FF8D9B"
          opacity=".8"
        />

        {/* Belly */}
        <path
          d="
            M94 160
            C105 150 174 150 185 160
            C195 172 196 209 187 229
            C177 248 101 248 91 229
            C81 209 82 174 94 160Z
          "
          fill="#FFF5DF"
          stroke="#1B1B3A"
          strokeWidth="5"
        />

        {/* Six Braille dots */}
        {dots.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5.5"
            fill={i === 0 || i === 3 ? "#8B72E8" : "#FFF5DF"}
            stroke="#1B1B3A"
            strokeWidth="3"
          />
        ))}

        {/* Feet */}
        <path
          d="M99 245 Q83 241 80 251 Q78 261 96 261 L122 260
             Q133 259 131 251 Q128 244 115 246Z"
          fill="#FFC93C"
          stroke="#1B1B3A"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M157 246 Q145 243 144 251 Q142 259 155 260
             L181 261 Q198 261 196 251 Q194 241 177 245Z"
          fill="#FFC93C"
          stroke="#1B1B3A"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Toes */}
        <path
          d="M91 253 L83 259 M108 253 L104 261
             M162 253 L158 261 M181 253 L188 259"
          fill="none"
          stroke="#1B1B3A"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Waving wing */}
        <g
          className="animate-wave"
          style={{
            transformBox: "view-box",
            transformOrigin: "211px 165px",
          }}
        >
          <path
            d="
              M202 169
              C216 159 226 142 227 123
              C228 108 240 105 247 115
              C253 125 247 145 239 161
              C233 175 220 188 207 190
            "
            fill="#A995F5"
            stroke="#1B1B3A"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M231 131 Q240 123 246 116"
            fill="none"
            stroke="#7259D1"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}


type BrailleMascotProps = {
  activity?: "reading" | "writing" | "thinking" | "celebrating";
  className?: string;
};

export function BrailleMascot({
  activity = "reading",
  className = "",
}: BrailleMascotProps) {
  const messages = {
    reading: "Yuk, baca pola Braille!",
    writing: "Yuk, belajar menyusun titik Braille!",
    thinking: "Hmm... apa jawabannya?",
    celebrating: "Hebat! Kamu berhasil!",
  };

  const isThinking = activity === "thinking";
  const isCelebrating = activity === "celebrating";
  const isReading = activity === "reading";
  const isWriting = activity === "writing";

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      role="img"
      aria-label={`Owli ${activity}`}
    >
      <div className="mb-3 relative max-w-[220px] rounded-2xl border-2 border-ink bg-sun px-4 py-3 text-center text-sm font-bold text-ink shadow-popsm">
        {messages[activity]}

        {/* Ekor bubble chat */}
        <span className="absolute -bottom-[9px] right-3 h-4 w-4 rotate-45 border-b-2 border-r-2 border-ink bg-sun" />
      </div>

      <svg
        viewBox="0 0 280 300"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full ${isCelebrating ? "mascot-celebrate" : ""}`}
      >
        {/* Ground shadow */}
        <ellipse
          cx="140"
          cy="278"
          rx="70"
          ry="8"
          fill="#1B1B3A"
          opacity=".15"
        />

        {/* Body */}
        <g>
          <path
            d="M66 126 C65 91 90 66 137 66 C184 66 210 94 210 136 L207 208 C205 240 179 255 139 255 C98 255 72 239 69 208Z"
            fill="#8B72E8"
            stroke="#1B1B3A"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Head */}
          <path
            d="M48 112 C40 81 55 52 83 39 L66 18 Q105 23 126 36 Q143 29 161 36 Q183 22 215 18 L197 47 C220 65 231 91 225 119 C218 153 188 172 137 172 C85 172 55 151 48 112Z"
            fill="#8B72E8"
            stroke="#1B1B3A"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Head feather detail */}
          <path
            d="M51 94 Q83 55 119 76 Q139 60 158 76 Q191 54 222 95 Q194 79 176 91 Q156 75 138 93 Q116 75 96 92 Q72 80 51 94Z"
            fill="#7259D1"
          />

          {/* Left wing */}
          <g
            className={
              isCelebrating
                ? "mascot-wing-left-celebrate"
                : isWriting
                  ? "mascot-wing-left-writing"
                  : isReading
                    ? "mascot-wing-left-reading"
                    : ""
            }
            style={{
              transformBox: "view-box",
              transformOrigin: "76px 190px",
            }}
          >
            {isCelebrating ? (
              <path
                d="M78 165 C58 145 37 111 45 94 C52 80 67 91 75 111 C87 91 101 101 96 125 C94 145 88 159 78 165Z"
                fill="#A995F5"
                stroke="#1B1B3A"
                strokeWidth="6"
              />
            ) : (
              <path
                d="M76 143 C57 155 43 183 43 211 C43 231 56 241 70 231 C84 220 94 191 96 169 C97 151 90 137 76 143Z"
                fill="#A995F5"
                stroke="#1B1B3A"
                strokeWidth="6"
              />
            )}
          </g>

          {/* Right wing */}
          <g
            className={
              isCelebrating
                ? "mascot-wing-right-celebrate"
                : isThinking
                  ? "mascot-wing-thinking"
                  : isWriting
                    ? "mascot-wing-writing"
                    : ""
            }
            style={{
              transformBox: "view-box",
              transformOrigin: "195px 180px",
            }}
          >
            {isThinking ? (
              <path
                d="M190 174 C211 166 217 146 203 135 C194 128 181 136 177 151 C174 164 178 174 190 174Z"
                fill="#A995F5"
                stroke="#1B1B3A"
                strokeWidth="6"
                strokeLinecap="round"
              />
            ) : isCelebrating ? (
              <path
                d="M200 165 C221 145 243 111 235 94 C228 80 213 91 205 111 C193 91 179 101 184 125 C186 145 192 159 200 165Z"
                fill="#A995F5"
                stroke="#1B1B3A"
                strokeWidth="6"
              />
            ) : (
              <path
                d="M195 145 C217 142 235 158 232 174 C230 185 220 192 209 192 C224 199 226 211 216 220 C205 230 190 220 181 211Z"
                fill="#A995F5"
                stroke="#1B1B3A"
                strokeWidth="6"
              />
            )}
          </g>

          {/* Face patches */}
          <ellipse cx="99" cy="112" rx="39" ry="42" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="5" />
          <ellipse cx="177" cy="112" rx="39" ry="42" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="5" />

          {/* Eyes */}
          <circle cx="99" cy="112" r="29" fill="#FFC93C" stroke="#5B4BDB" strokeWidth="5" />
          <circle cx="177" cy="112" r="29" fill="#FFC93C" stroke="#5B4BDB" strokeWidth="5" />

          {isCelebrating ? (
            <>
              <circle cx="99" cy="112" r="18" fill="#1B1B3A" />
              <circle cx="177" cy="112" r="18" fill="#1B1B3A" />
              <path d="M89 108 L94 102 L99 108 L104 102 L109 108" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <path d="M167 108 L172 102 L177 108 L182 102 L187 108" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : isThinking ? (
            <>
              <circle cx="105" cy="108" r="17" fill="#1B1B3A" />
              <circle cx="183" cy="108" r="17" fill="#1B1B3A" />
              <circle cx="111" cy="101" r="7" fill="white" />
              <circle cx="189" cy="101" r="7" fill="white" />
              <path d="M78 72 Q99 59 116 75 M162 75 Q180 59 198 72" fill="none" stroke="#1B1B3A" strokeWidth="5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="99" cy="112" r="19" fill="#1B1B3A" />
              <circle cx="177" cy="112" r="19" fill="#1B1B3A" />
              <circle cx="106" cy="104" r="8" fill="white" />
              <circle cx="184" cy="104" r="8" fill="white" />
            </>
          )}

          {/* Beak */}
          <path
            d="M126 126 L151 126 L139 145Z"
            fill="#FFB84D"
            stroke="#1B1B3A"
            strokeWidth="4"
          />

          {/* Cheeks */}
          <ellipse cx="62" cy="145" rx="9" ry="6" fill="#FF8D9B" />
          <ellipse cx="215" cy="145" rx="9" ry="6" fill="#FF8D9B" />

          {/* Belly */}
          <path
            d="M94 160 C105 150 174 150 185 160 C195 172 196 209 187 229 C177 248 101 248 91 229 C81 209 82 174 94 160Z"
            fill="#FFF5DF"
            stroke="#1B1B3A"
            strokeWidth="5"
          />

          {/* Braille dots */}
          {[180, 198, 216].map((y) => (
            <g key={y}>
              <circle cx="125" cy={y} r="5.5" fill="#8B72E8" stroke="#1B1B3A" strokeWidth="3" />
              <circle cx="155" cy={y} r="5.5" fill="#8B72E8" stroke="#1B1B3A" strokeWidth="3" />
            </g>
          ))}

          {/* Feet */}
          <path d="M99 245 Q83 241 80 251 Q78 261 96 261 L122 260 Q133 259 131 251 Q128 244 115 246Z" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="5" />
          <path d="M157 246 Q145 243 144 251 Q142 259 155 260 L181 261 Q198 261 196 251 Q194 241 177 245Z" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="5" />

          {/* Reading: animated book */}
          {isReading && (
            <g
              className="mascot-book"
              style={{
                transformBox: "view-box",
                transformOrigin: "137px 230px",
              }}
            >
              <path d="M75 207 Q103 193 137 211 L137 250 Q105 231 75 244Z" fill="#FFB84D" stroke="#1B1B3A" strokeWidth="4" />
              <path d="M137 211 Q170 193 201 207 L201 244 Q170 231 137 250Z" fill="#FFF5DF" stroke="#1B1B3A" strokeWidth="4" />
              <path d="M137 211 L137 250" stroke="#1B1B3A" strokeWidth="3" />
              <path d="M91 218 L119 221 M91 229 L119 232 M154 221 L185 218 M154 232 L185 229" stroke="#7259D1" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* Writing: paper and animated pencil */}
          {isWriting && (
            <g>
              <path d="M91 202 L177 202 L177 253 L91 253Z" fill="white" stroke="#1B1B3A" strokeWidth="4" />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <circle cx="112" cy={216 + i * 12} r="3.5" fill="#8B72E8" />
                  <circle cx="128" cy={216 + i * 12} r="3.5" fill="#8B72E8" />
                </g>
              ))}
              <g
                className="mascot-pencil"
                style={{
                  transformBox: "view-box",
                  transformOrigin: "170px 215px",
                }}
              >
                <path d="M181 178 L195 184 L160 248 L147 251 L150 237Z" fill="#FFB84D" stroke="#1B1B3A" strokeWidth="4" strokeLinejoin="round" />
                <path d="M147 251 L150 237 L160 248Z" fill="#1B1B3A" />
              </g>
            </g>
          )}

          {/* Thinking: question bubble */}
          {isThinking && (
            <g className="mascot-question">
              <path d="M201 39 Q201 18 223 18 L250 18 Q270 18 270 38 Q270 57 250 57 L234 57 L221 69 L223 57 Q201 57 201 39Z" fill="white" stroke="#1B1B3A" strokeWidth="4" />
              <text x="236" y="47" textAnchor="middle" fontSize="29" fontWeight="bold" fill="#8B72E8">?</text>
            </g>
          )}

          {/* Celebration sparkles */}
          {isCelebrating && (
            <g className="mascot-sparkles" fill="#FFC93C" stroke="#1B1B3A" strokeWidth="2">
              <path d="M39 75 L44 89 L58 94 L44 99 L39 113 L34 99 L20 94 L34 89Z" />
              <path d="M235 75 L240 89 L254 94 L240 99 L235 113 L230 99 L216 94 L230 89Z" />
              <path d="M137 9 L141 20 L152 24 L141 28 L137 39 L133 28 L122 24 L133 20Z" />
            </g>
          )}
        </g>
      </svg>

    </div>
  );
}

export type AuthMascotPose = "idle" | "covering" | "peeking";

export interface TypingGazeTarget {
  charIndex: number;
  field: "name" | "email" | "password";
  seq: number;
}

type AuthMascotProps = {
  pose: AuthMascotPose;
  mode?: "login" | "register";
  typingTarget?: TypingGazeTarget | null;
  className?: string;
};

export function AuthMascot({
  pose,
  mode = "login",
  typingTarget = null,
  className = "",
}: AuthMascotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const isCovering = pose === "covering";
  const isPeeking = pose === "peeking";

  // Saat mengetik huruf di input, arahkan bola mata mengikuti posisi huruf terakhir yang diketik
  useEffect(() => {
    if (!typingTarget || isCovering) return;
    const progress = Math.min(Math.max(typingTarget.charIndex, 0), 28) / 28;
    const targetX = -8.5 + progress * 17;
    const targetY =
      typingTarget.field === "name"
        ? 5.5
        : typingTarget.field === "email"
          ? 7
          : 8.5;
    setGaze({ x: targetX, y: targetY });
  }, [typingTarget, isCovering]);

  // Saat kursor mouse atau sentuhan jari digerakkan
  useEffect(() => {
    const updatePointer = (clientX: number, clientY: number) => {
      if (isCovering) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const eyeCenterX = rect.left + rect.width * 0.5;
      const eyeCenterY = rect.top + rect.height * 0.42;

      const dx = clientX - eyeCenterX;
      const dy = clientY - eyeCenterY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        setGaze({ x: 0, y: 0 });
        return;
      }

      const maxOffset = 9;
      const factor = Math.min(dist / 180, 1) * maxOffset;
      setGaze({
        x: Number(((dx / dist) * factor).toFixed(2)),
        y: Number(((dy / dist) * factor).toFixed(2)),
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isCovering]);

  const pupilX = isCovering ? 0 : isPeeking ? gaze.x * 0.65 - 2 : gaze.x;
  const pupilY = isCovering ? 0 : isPeeking ? Math.max(3.5, gaze.y * 0.7) : gaze.y;

  const statusText = isCovering
    ? "Tenang, aku tutup mata saat kamu mengetik kata sandi!"
    : isPeeking
      ? "Eh, mengintip sedikit biar tidak salah ketik ya!"
      : mode === "register"
        ? "Halo! Yuk isi data untuk membuat akun barumu."
        : "Halo! Masukkan email dan kata sandimu di bawah ya.";

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      role="img"
      aria-label={`Owli maskot: ${statusText}`}
    >
      <div className="relative mb-2 max-w-[300px] rounded-2xl border-2 border-ink bg-sun px-4 py-2 text-center text-xs font-bold text-ink shadow-popsm transition-all duration-200 sm:text-sm">
        {statusText}
        <span className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-ink bg-sun" />
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 280 265"
        xmlns="http://www.w3.org/2000/svg"
        className="h-48 w-48 sm:h-56 sm:w-56"
      >
        {/* Bayangan bawah */}
        <ellipse
          cx="138"
          cy="252"
          rx="68"
          ry="8"
          fill="#1B1B3A"
          opacity=".15"
        />

        {/* Badan */}
        <path
          d="M66 126 C65 91 90 66 137 66 C184 66 210 94 210 136 L207 208 C205 240 179 250 139 250 C98 250 72 239 69 208Z"
          fill="#8B72E8"
          stroke="#1B1B3A"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Grup Kepala yang sedikit miring halus mengikuti pandangan */}
        <g
          style={{
            transformBox: "view-box",
            transformOrigin: "138px 135px",
            transform: isCovering
              ? "rotate(0deg)"
              : `rotate(${(pupilX * 0.35).toFixed(2)}deg)`,
            transition: "transform 0.12s ease-out",
          }}
        >
          {/* Kepala */}
          <path
            d="M48 112 C40 81 55 52 83 39 L66 18 Q105 23 126 36 Q143 29 161 36 Q183 22 215 18 L197 47 C220 65 231 91 225 119 C218 153 188 172 137 172 C85 172 55 151 48 112Z"
            fill="#8B72E8"
            stroke="#1B1B3A"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Detail bulu dahi */}
          <path
            d="M51 94 Q83 55 119 76 Q139 60 158 76 Q191 54 222 95 Q194 79 176 91 Q156 75 138 93 Q116 75 96 92 Q72 80 51 94Z"
            fill="#7259D1"
          />

          {/* Lingkar wajah mata */}
          <ellipse
            cx="99"
            cy="112"
            rx="39"
            ry="42"
            fill="#FFF5DF"
            stroke="#1B1B3A"
            strokeWidth="5"
          />
          <ellipse
            cx="177"
            cy="112"
            rx="39"
            ry="42"
            fill="#FFF5DF"
            stroke="#1B1B3A"
            strokeWidth="5"
          />

          {/* Cincin kuning mata */}
          <circle
            cx="99"
            cy="112"
            r="29"
            fill="#FFC93C"
            stroke="#5B4BDB"
            strokeWidth="5"
          />
          <circle
            cx="177"
            cy="112"
            r="29"
            fill="#FFC93C"
            stroke="#5B4BDB"
            strokeWidth="5"
          />

          {/* Bola mata kiri */}
          <g>
            <g
              style={{
                transform: `translate(${pupilX}px, ${pupilY}px)`,
                transition: "transform 0.09s ease-out",
              }}
            >
              <circle cx="99" cy="112" r="18" fill="#1B1B3A" />
              <circle cx="105" cy="105" r="7.5" fill="white" />
              <circle cx="92" cy="121" r="3.8" fill="#B9A9F5" />
            </g>
            {(isCovering || isPeeking) && (
              <>
                <circle
                  cx="99"
                  cy="112"
                  r="29"
                  fill="#8B72E8"
                  stroke="#1B1B3A"
                  strokeWidth="4"
                />
                <path
                  d="M78 114 Q99 128 120 114"
                  fill="none"
                  stroke="#1B1B3A"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>

          {/* Bola mata kanan (mengikuti kursor/ketikan, dan bisa mengintip saat isPeeking) */}
          <g>
            <g
              style={{
                transform: `translate(${pupilX}px, ${pupilY}px)`,
                transition: "transform 0.09s ease-out",
              }}
            >
              <circle cx="177" cy="112" r="18" fill="#1B1B3A" />
              <circle cx="183" cy="105" r="7.5" fill="white" />
              <circle cx="170" cy="121" r="3.8" fill="#B9A9F5" />
            </g>

            {isCovering && (
              <>
                <circle
                  cx="177"
                  cy="112"
                  r="29"
                  fill="#8B72E8"
                  stroke="#1B1B3A"
                  strokeWidth="4"
                />
                <path
                  d="M156 114 Q177 128 198 114"
                  fill="none"
                  stroke="#1B1B3A"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </>
            )}

            {isPeeking && (
              <path
                d="M148 102 Q177 89 206 102 L206 82 L148 82 Z"
                fill="#8B72E8"
                stroke="#1B1B3A"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            )}
          </g>

          {/* Paruh */}
          <path
            d="M126 126 L151 126 L139 145Z"
            fill="#FFB84D"
            stroke="#1B1B3A"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Pipi */}
          <ellipse cx="62" cy="145" rx="9" ry="6" fill="#FF8D9B" opacity=".85" />
          <ellipse cx="215" cy="145" rx="9" ry="6" fill="#FF8D9B" opacity=".85" />
        </g>

        {/* Perut & 6 Titik Braille */}
        <path
          d="M94 160 C105 150 174 150 185 160 C195 172 196 209 187 229 C177 245 101 245 91 229 C81 209 82 174 94 160Z"
          fill="#FFF5DF"
          stroke="#1B1B3A"
          strokeWidth="5"
        />
        {[180, 198, 216].map((y, idx) => (
          <g key={y}>
            <circle
              cx="125"
              cy={y}
              r="5"
              fill={idx === 0 ? "#8B72E8" : "#FFF5DF"}
              stroke="#1B1B3A"
              strokeWidth="3"
            />
            <circle
              cx="155"
              cy={y}
              r="5"
              fill={idx === 0 ? "#8B72E8" : "#FFF5DF"}
              stroke="#1B1B3A"
              strokeWidth="3"
            />
          </g>
        ))}

        {/* Kaki */}
        <path
          d="M99 242 Q83 238 80 248 Q78 256 96 256 L122 255 Q133 254 131 248 Q128 241 115 243Z"
          fill="#FFC93C"
          stroke="#1B1B3A"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M157 243 Q145 240 144 248 Q142 254 155 255 L181 256 Q198 256 196 248 Q194 238 177 242Z"
          fill="#FFC93C"
          stroke="#1B1B3A"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* SAYAP KIRI (Menutup mata kiri saat covering maupun peeking) */}
        <g
          style={{
            transformBox: "view-box",
            transformOrigin: "68px 168px",
            transform:
              isCovering || isPeeking
                ? "translate(18px, -54px) rotate(38deg)"
                : "translate(0px, 0px) rotate(0deg)",
            transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <path
            d="
              M64 140
              C42 152 36 184 44 212
              C50 232 69 236 83 220
              C97 204 104 174 99 152
              C95 136 80 131 64 140Z
            "
            fill="#A995F5"
            stroke="#1B1B3A"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M58 190 Q73 177 80 158 M55 210 Q71 200 81 184"
            fill="none"
            stroke="#7259D1"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>

        {/* SAYAP KANAN (Menutup mata kanan saat covering, turun sedikit saat peeking agar mata mengintip) */}
        <g
          style={{
            transformBox: "view-box",
            transformOrigin: "212px 168px",
            transform: isCovering
              ? "translate(-18px, -54px) rotate(-38deg)"
              : isPeeking
                ? "translate(-6px, -22px) rotate(-16deg)"
                : "translate(0px, 0px) rotate(0deg)",
            transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <path
            d="
              M216 140
              C238 152 244 184 236 212
              C230 232 211 236 197 220
              C183 204 176 174 181 152
              C185 136 200 131 216 140Z
            "
            fill="#A995F5"
            stroke="#1B1B3A"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M222 190 Q207 177 200 158 M225 210 Q209 200 199 184"
            fill="none"
            stroke="#7259D1"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

