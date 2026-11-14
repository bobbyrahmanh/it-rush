
type MascotProps = {
  className?: string;
};

export default function Mascot({ className = "" }: MascotProps) {
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

        {/* Eyes */}
        <g className="">
          <circle cx="99" cy="112" r="19" fill="#1B1B3A" />
          <circle cx="106" cy="104" r="8" fill="white" />
          <circle cx="91" cy="122" r="4" fill="#B9A9F5" />
        </g>
        <g className="">
          <circle cx="177" cy="112" r="19" fill="#1B1B3A" />
          <circle cx="184" cy="104" r="8" fill="white" />
          <circle cx="169" cy="122" r="4" fill="#B9A9F5" />
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
