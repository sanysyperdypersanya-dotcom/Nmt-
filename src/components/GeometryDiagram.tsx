import React from 'react';
import { Compass } from 'lucide-react';

interface GeometryDiagramProps {
  diagramId: string;
  compact?: boolean;
}

export const GeometryDiagram: React.FC<GeometryDiagramProps> = ({
  diagramId,
  compact = false,
}) => {
  const renderSvg = () => {
    switch (diagramId) {
      // 1. Прямокутний трикутник із катетами 6 і 8 та медіаною до гіпотенузи
      case 'math-3':
        return (
          <svg viewBox="0 0 320 200" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Заливка трикутника */}
            <polygon
              points="50,160 50,40 250,160"
              fill="rgba(16, 185, 129, 0.08)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Прямий кут C */}
            <polyline
              points="50,144 66,144 66,160"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.6"
            />
            {/* Медіана CM до середини гіпотенузи M(150, 100) */}
            <line
              x1="50"
              y1="160"
              x2="150"
              y2="100"
              stroke="#059669"
              strokeWidth="2.2"
              strokeDasharray="5,3"
            />
            {/* Позначки рівності відрізків AM = MB */}
            <line x1="96" y1="62" x2="104" y2="76" stroke="#18181b" strokeWidth="1.8" />
            <line x1="196" y1="122" x2="204" y2="136" stroke="#18181b" strokeWidth="1.8" />
            {/* Точка M */}
            <circle cx="150" cy="100" r="3.5" fill="#059669" />
            {/* Вершини */}
            <text x="32" y="42" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="32" y="168" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="258" y="166" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="155" y="94" className="text-[13px] font-bold fill-emerald-700">M</text>
            {/* Підписи сторін */}
            <text x="14" y="105" className="text-[12px] font-mono font-semibold fill-zinc-700">6 см</text>
            <text x="135" y="182" className="text-[12px] font-mono font-semibold fill-zinc-700">8 см</text>
            <text x="90" y="142" className="text-[12px] font-mono font-bold fill-emerald-700">CM = ?</text>
          </svg>
        );

      // 2. Ромб із діагоналями 12 см і 16 см
      case 'math-6':
        return (
          <svg viewBox="0 0 320 200" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Контур ромба */}
            <polygon
              points="160,25 275,100 160,175 45,100"
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Діагоналі */}
            <line x1="45" y1="100" x2="275" y2="100" stroke="#2563eb" strokeWidth="1.8" />
            <line x1="160" y1="25" x2="160" y2="175" stroke="#059669" strokeWidth="1.8" />
            {/* Прямий кут у центрі перетину діагоналей */}
            <polyline
              points="160,88 172,88 172,100"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.5"
            />
            {/* Риски рівності сторін */}
            <line x1="98" y1="58" x2="106" y2="68" stroke="#18181b" strokeWidth="1.6" />
            <line x1="214" y1="58" x2="206" y2="68" stroke="#18181b" strokeWidth="1.6" />
            <line x1="98" y1="142" x2="106" y2="132" stroke="#18181b" strokeWidth="1.6" />
            <line x1="214" y1="142" x2="206" y2="132" stroke="#18181b" strokeWidth="1.6" />
            {/* Вершини */}
            <text x="155" y="18" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="282" y="104" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="155" y="193" className="text-[13px] font-bold fill-zinc-900">D</text>
            <text x="27" y="104" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="145" y="95" className="text-[12px] font-bold fill-zinc-700">O</text>
            {/* Підписи діагоналей */}
            <text x="195" y="116" className="text-[11px] font-mono font-bold fill-blue-700">d₁ = 16 см</text>
            <text x="166" y="64" className="text-[11px] font-mono font-bold fill-emerald-700">d₂ = 12 см</text>
          </svg>
        );

      // 3. Циліндр (R = 3 см, H = 5 см)
      case 'math-12':
        return (
          <svg viewBox="0 0 320 210" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Тіло циліндра */}
            <path
              d="M 85,50 L 85,155 A 75,22 0 0,0 235,155 L 235,50 Z"
              fill="rgba(99, 102, 241, 0.08)"
              stroke="none"
            />
            {/* Верхня основа */}
            <ellipse
              cx="160"
              cy="50"
              rx="75"
              ry="22"
              fill="rgba(99, 102, 241, 0.13)"
              stroke="#18181b"
              strokeWidth="2"
            />
            {/* Нижня основа: задня невидима дуга */}
            <path
              d="M 85,155 A 75,22 0 0,1 235,155"
              fill="none"
              stroke="#71717a"
              strokeWidth="1.6"
              strokeDasharray="5,4"
            />
            {/* Нижня основа: передня видима дуга */}
            <path
              d="M 85,155 A 75,22 0 0,0 235,155"
              fill="none"
              stroke="#18181b"
              strokeWidth="2"
            />
            {/* Бічні твірні */}
            <line x1="85" y1="50" x2="85" y2="155" stroke="#18181b" strokeWidth="2" />
            <line x1="235" y1="50" x2="235" y2="155" stroke="#18181b" strokeWidth="2" />
            {/* Вісь циліндра OO₁ */}
            <line
              x1="160"
              y1="50"
              x2="160"
              y2="155"
              stroke="#059669"
              strokeWidth="1.8"
              strokeDasharray="4,3"
            />
            {/* Радіус R = 3 см */}
            <line x1="160" y1="155" x2="235" y2="155" stroke="#e11d48" strokeWidth="2.2" />
            <circle cx="160" cy="50" r="3" fill="#18181b" />
            <circle cx="160" cy="155" r="3" fill="#18181b" />
            {/* Прямий кут між віссю і радіусом */}
            <polyline
              points="160,145 170,145 170,155"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.4"
            />
            {/* Підписи */}
            <text x="144" y="46" className="text-[12px] font-bold fill-zinc-800">O₁</text>
            <text x="145" y="168" className="text-[12px] font-bold fill-zinc-800">O</text>
            <text x="176" y="149" className="text-[12px] font-mono font-bold fill-rose-600">R = 3 см</text>
            <text x="244" y="108" className="text-[12px] font-mono font-bold fill-emerald-700">H = 5 см</text>
          </svg>
        );

      // 4. Куб (S_повн = 150 см², V = ?)
      case 'math-13':
        return (
          <svg viewBox="0 0 320 210" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Передня грань */}
            <polygon
              points="75,75 185,75 185,180 75,180"
              fill="rgba(16, 185, 129, 0.08)"
              stroke="#18181b"
              strokeWidth="2"
            />
            {/* Верхня грань */}
            <polygon
              points="75,75 125,35 235,35 185,75"
              fill="rgba(16, 185, 129, 0.14)"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Права грань */}
            <polygon
              points="185,75 235,35 235,140 185,180"
              fill="rgba(16, 185, 129, 0.05)"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Невидимі ребра */}
            <line x1="125" y1="35" x2="125" y2="140" stroke="#71717a" strokeWidth="1.6" strokeDasharray="5,4" />
            <line x1="75" y1="180" x2="125" y2="140" stroke="#71717a" strokeWidth="1.6" strokeDasharray="5,4" />
            <line x1="125" y1="140" x2="235" y2="140" stroke="#71717a" strokeWidth="1.6" strokeDasharray="5,4" />
            {/* Підписи ребер */}
            <text x="125" y="196" className="text-[13px] font-mono font-bold fill-zinc-900">a</text>
            <text x="216" y="168" className="text-[13px] font-mono font-bold fill-zinc-900">a</text>
            <text x="243" y="95" className="text-[13px] font-mono font-bold fill-zinc-900">a</text>
            <text x="90" y="128" className="text-[12px] font-mono font-bold fill-emerald-800">S = 6a² = 150 см²</text>
            <text x="112" y="148" className="text-[12px] font-mono font-bold fill-zinc-700">V = a³ = ?</text>
          </svg>
        );

      // 5. Паралелограм ABCD (сума трьох кутів 250°)
      case 'math-24':
        return (
          <svg viewBox="0 0 320 190" className="w-full max-w-[320px] h-auto mx-auto">
            <polygon
              points="85,45 265,45 225,155 45,155"
              fill="rgba(245, 158, 11, 0.08)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Дуга гострого кута A */}
            <path
              d="M 73,155 A 28,28 0 0,0 55,129"
              fill="rgba(16, 185, 129, 0.25)"
              stroke="#059669"
              strokeWidth="2"
            />
            {/* Дуга тупого кута B */}
            <path
              d="M 76,70 A 26,26 0 0,0 111,45"
              fill="none"
              stroke="#d97706"
              strokeWidth="1.8"
            />
            {/* Вершини */}
            <text x="28" y="162" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="72" y="36" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="272" y="46" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="234" y="164" className="text-[13px] font-bold fill-zinc-900">D</text>
            {/* Підписи кутів */}
            <text x="78" y="144" className="text-[12px] font-mono font-bold fill-emerald-700">α = ?</text>
            <text x="96" y="68" className="text-[12px] font-mono font-semibold fill-amber-700">β</text>
            <text x="115" y="112" className="text-[11px] font-mono fill-zinc-600">∠A + ∠B + ∠C = 250°</text>
          </svg>
        );

      // 6. Трапеція ABCD (основи 7 і 13, висота 6)
      case 'math-25':
        return (
          <svg viewBox="0 0 320 195" className="w-full max-w-[320px] h-auto mx-auto">
            <polygon
              points="95,45 215,45 265,155 45,155"
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Висота BH */}
            <line
              x1="95"
              y1="45"
              x2="95"
              y2="155"
              stroke="#e11d48"
              strokeWidth="2"
              strokeDasharray="5,3"
            />
            {/* Прямий кут H */}
            <polyline
              points="95,143 107,143 107,155"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.5"
            />
            {/* Вершини */}
            <text x="30" y="162" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="86" y="36" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="218" y="36" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="272" y="162" className="text-[13px] font-bold fill-zinc-900">D</text>
            <text x="90" y="172" className="text-[12px] font-bold fill-zinc-700">H</text>
            {/* Підписи */}
            <text x="132" y="36" className="text-[12px] font-mono font-bold fill-zinc-800">a = 7 см</text>
            <text x="135" y="176" className="text-[12px] font-mono font-bold fill-zinc-800">b = 13 см</text>
            <text x="103" y="106" className="text-[12px] font-mono font-bold fill-rose-600">h = 6 см</text>
          </svg>
        );

      // 7. Конус (L = 10 см, R = 6 см, H = ?)
      case 'math-26':
        return (
          <svg viewBox="0 0 320 210" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Тіло конуса */}
            <polygon
              points="160,28 80,160 240,160"
              fill="rgba(16, 185, 129, 0.07)"
            />
            {/* Задня дуга основи */}
            <path
              d="M 80,160 A 80,22 0 0,1 240,160"
              fill="none"
              stroke="#71717a"
              strokeWidth="1.6"
              strokeDasharray="5,4"
            />
            {/* Передня дуга основи */}
            <path
              d="M 80,160 A 80,22 0 0,0 240,160"
              fill="none"
              stroke="#18181b"
              strokeWidth="2.2"
            />
            {/* Твірні */}
            <line x1="160" y1="28" x2="80" y2="160" stroke="#18181b" strokeWidth="2.2" />
            <line x1="160" y1="28" x2="240" y2="160" stroke="#18181b" strokeWidth="2.2" />
            {/* Висота SO */}
            <line
              x1="160"
              y1="28"
              x2="160"
              y2="160"
              stroke="#059669"
              strokeWidth="2.2"
              strokeDasharray="5,3"
            />
            {/* Радіус OA */}
            <line x1="160" y1="160" x2="240" y2="160" stroke="#2563eb" strokeWidth="2.2" />
            {/* Прямий кут O */}
            <polyline
              points="160,148 172,148 172,160"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.5"
            />
            <circle cx="160" cy="160" r="3" fill="#18181b" />
            {/* Підписи */}
            <text x="155" y="20" className="text-[13px] font-bold fill-zinc-900">S</text>
            <text x="145" y="173" className="text-[12px] font-bold fill-zinc-800">O</text>
            <text x="246" y="165" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="208" y="92" className="text-[12px] font-mono font-bold fill-zinc-900">L = 10 см</text>
            <text x="175" y="154" className="text-[12px] font-mono font-bold fill-blue-700">R = 6 см</text>
            <text x="108" y="106" className="text-[12px] font-mono font-bold fill-emerald-700">H = ?</text>
          </svg>
        );

      // 8. Прямокутний паралелепіпед (3 см, 4 см, 5 см)
      case 'math-27':
        return (
          <svg viewBox="0 0 320 205" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Передня грань */}
            <polygon
              points="60,80 195,80 195,175 60,175"
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#18181b"
              strokeWidth="2"
            />
            {/* Верхня грань */}
            <polygon
              points="60,80 115,40 250,40 195,80"
              fill="rgba(59, 130, 246, 0.14)"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Права грань */}
            <polygon
              points="195,80 250,40 250,135 195,175"
              fill="rgba(59, 130, 246, 0.05)"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Невидимі ребра */}
            <line x1="115" y1="40" x2="115" y2="135" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            <line x1="60" y1="175" x2="115" y2="135" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            <line x1="115" y1="135" x2="250" y2="135" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            {/* Виміри */}
            <text x="108" y="193" className="text-[12px] font-mono font-bold fill-zinc-900">a = 4 см</text>
            <text x="228" y="166" className="text-[12px] font-mono font-bold fill-blue-700">b = 3 см</text>
            <text x="256" y="94" className="text-[12px] font-mono font-bold fill-emerald-700">c = 5 см</text>
          </svg>
        );

      // 9. Сфера (S = 36π см², R = ?)
      case 'math-28':
        return (
          <svg viewBox="0 0 320 205" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Тіло кулі */}
            <circle
              cx="160"
              cy="102"
              r="72"
              fill="rgba(99, 102, 241, 0.08)"
              stroke="#18181b"
              strokeWidth="2.2"
            />
            {/* Задня дуга екватора */}
            <path
              d="M 88,102 A 72,22 0 0,1 232,102"
              fill="none"
              stroke="#71717a"
              strokeWidth="1.5"
              strokeDasharray="5,4"
            />
            {/* Передня дуга екватора */}
            <path
              d="M 88,102 A 72,22 0 0,0 232,102"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.8"
            />
            {/* Радіус */}
            <line x1="160" y1="102" x2="232" y2="102" stroke="#e11d48" strokeWidth="2.2" />
            <circle cx="160" cy="102" r="3.5" fill="#18181b" />
            <text x="146" y="98" className="text-[12px] font-bold fill-zinc-900">O</text>
            <text x="176" y="95" className="text-[12px] font-mono font-bold fill-rose-600">R = ?</text>
            <text x="115" y="155" className="text-[12px] font-mono font-bold fill-indigo-700">S = 4πR² = 36π</text>
          </svg>
        );

      // 10. Перпендикулярні вектори у просторі
      case 'math-zno-11':
        return (
          <svg viewBox="0 0 320 200" className="w-full max-w-[320px] h-auto mx-auto">
            <defs>
              <marker id="arrowDark" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#71717a" />
              </marker>
              <marker id="arrowBlue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#2563eb" />
              </marker>
              <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#059669" />
              </marker>
            </defs>
            {/* Осі координат */}
            <line x1="140" y1="125" x2="140" y2="22" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#arrowDark)" />
            <line x1="140" y1="125" x2="270" y2="125" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#arrowDark)" />
            <line x1="140" y1="125" x2="65" y2="178" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#arrowDark)" />
            <text x="146" y="26" className="text-[12px] font-bold fill-zinc-600">z</text>
            <text x="275" y="129" className="text-[12px] font-bold fill-zinc-600">y</text>
            <text x="52" y="184" className="text-[12px] font-bold fill-zinc-600">x</text>
            {/* Вектор a */}
            <line x1="140" y1="125" x2="95" y2="55" stroke="#2563eb" strokeWidth="2.5" markerEnd="url(#arrowBlue)" />
            {/* Вектор b */}
            <line x1="140" y1="125" x2="220" y2="75" stroke="#059669" strokeWidth="2.5" markerEnd="url(#arrowGreen)" />
            {/* Знак прямого кута між векторами */}
            <polyline
              points="132,112 145,103 153,116"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.6"
            />
            <text x="42" y="48" className="text-[12px] font-mono font-bold fill-blue-700">a(3; -2; 4)</text>
            <text x="218" y="68" className="text-[12px] font-mono font-bold fill-emerald-700">b(2; m; 1)</text>
            <text x="155" y="152" className="text-[12px] font-mono font-bold fill-zinc-800">a ⊥ b ⇒ a · b = 0</text>
          </svg>
        );

      // 11. Модуль вектора у просторі a(3; -4; 12)
      case 'math-zno-12':
        return (
          <svg viewBox="0 0 320 200" className="w-full max-w-[320px] h-auto mx-auto">
            <defs>
              <marker id="arrAxis" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#71717a" />
              </marker>
              <marker id="arrVec" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#e11d48" />
              </marker>
            </defs>
            {/* Осі */}
            <line x1="120" y1="140" x2="120" y2="20" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#arrAxis)" />
            <line x1="120" y1="140" x2="275" y2="140" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#arrAxis)" />
            <line x1="120" y1="140" x2="55" y2="185" stroke="#71717a" strokeWidth="1.5" markerEnd="url(#arrAxis)" />
            {/* Проєкційні лінії */}
            <line x1="120" y1="140" x2="225" y2="165" stroke="#a1a1aa" strokeWidth="1.4" strokeDasharray="4,3" />
            <line x1="225" y1="165" x2="225" y2="50" stroke="#a1a1aa" strokeWidth="1.4" strokeDasharray="4,3" />
            <line x1="120" y1="35" x2="225" y2="50" stroke="#a1a1aa" strokeWidth="1.4" strokeDasharray="4,3" />
            {/* Вектор a */}
            <line x1="120" y1="140" x2="222" y2="53" stroke="#e11d48" strokeWidth="2.6" markerEnd="url(#arrVec)" />
            <circle cx="120" cy="140" r="3" fill="#18181b" />
            <text x="104" y="145" className="text-[12px] font-bold fill-zinc-800">O</text>
            <text x="126" y="25" className="text-[12px] font-bold fill-zinc-600">z</text>
            <text x="280" y="144" className="text-[12px] font-bold fill-zinc-600">y</text>
            <text x="42" y="190" className="text-[12px] font-bold fill-zinc-600">x</text>
            <text x="185" y="42" className="text-[12px] font-mono font-bold fill-rose-600">a(3; -4; 12)</text>
            <text x="135" y="115" className="text-[12px] font-mono font-bold fill-zinc-900">|a| = ?</text>
          </svg>
        );

      // 12. Середина відрізка AB у просторі
      case 'math-zno-13':
        return (
          <svg viewBox="0 0 320 175" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Відрізок AB */}
            <line x1="55" y1="125" x2="265" y2="55" stroke="#18181b" strokeWidth="2.4" />
            {/* Риски рівності AM = MB */}
            <line x1="104" y1="101" x2="110" y2="115" stroke="#059669" strokeWidth="2" />
            <line x1="210" y1="65" x2="216" y2="79" stroke="#059669" strokeWidth="2" />
            {/* Точки A, M, B */}
            <circle cx="55" cy="125" r="4.5" fill="#2563eb" />
            <circle cx="160" cy="90" r="5" fill="#059669" />
            <circle cx="265" cy="55" r="4.5" fill="#2563eb" />
            {/* Підписи */}
            <text x="25" y="148" className="text-[12px] font-mono font-bold fill-blue-700">A(-2; 4; 6)</text>
            <text x="128" y="74" className="text-[12px] font-mono font-bold fill-emerald-700">M(x; y; z)</text>
            <text x="205" y="38" className="text-[12px] font-mono font-bold fill-blue-700">B(6; -2; 0)</text>
          </svg>
        );

      // 13. Коло, описане навколо прямокутного трикутника (катети 9 і 12)
      case 'math-zno-16':
        return (
          <svg viewBox="0 0 320 210" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Описане коло */}
            <circle
              cx="160"
              cy="105"
              r="82"
              fill="rgba(59, 130, 246, 0.05)"
              stroke="#2563eb"
              strokeWidth="2"
            />
            {/* Прямокутний трикутник ABC: гіпотенуза AB — діаметр */}
            <polygon
              points="78,105 242,105 115,36"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Центр кола O на середині гіпотенузи */}
            <circle cx="160" cy="105" r="3.8" fill="#e11d48" />
            {/* Вершини */}
            <text x="60" y="110" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="248" y="110" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="108" y="28" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="155" y="123" className="text-[12px] font-bold fill-rose-600">O</text>
            {/* Підписи катетів та радіуса */}
            <text x="64" y="68" className="text-[12px] font-mono font-bold fill-zinc-800">9 см</text>
            <text x="182" y="64" className="text-[12px] font-mono font-bold fill-zinc-800">12 см</text>
            <text x="106" y="100" className="text-[11px] font-mono font-bold fill-rose-600">R</text>
            <text x="195" y="100" className="text-[11px] font-mono font-bold fill-rose-600">R = ?</text>
          </svg>
        );

      // 14. Конус (R = 6 см, H = 8 см, l = ?)
      case 'math-zno-17':
        return (
          <svg viewBox="0 0 320 210" className="w-full max-w-[320px] h-auto mx-auto">
            <polygon points="160,26 82,162 238,162" fill="rgba(59, 130, 246, 0.07)" />
            <path d="M 82,162 A 78,22 0 0,1 238,162" fill="none" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            <path d="M 82,162 A 78,22 0 0,0 238,162" fill="none" stroke="#18181b" strokeWidth="2.2" />
            <line x1="160" y1="26" x2="82" y2="162" stroke="#18181b" strokeWidth="2.2" />
            <line x1="160" y1="26" x2="238" y2="162" stroke="#e11d48" strokeWidth="2.5" />
            <line x1="160" y1="26" x2="160" y2="162" stroke="#059669" strokeWidth="2" strokeDasharray="5,3" />
            <line x1="160" y1="162" x2="238" y2="162" stroke="#2563eb" strokeWidth="2.2" />
            <polyline points="160,150 172,150 172,162" fill="none" stroke="#18181b" strokeWidth="1.5" />
            <circle cx="160" cy="162" r="3" fill="#18181b" />
            <text x="155" y="19" className="text-[13px] font-bold fill-zinc-900">S</text>
            <text x="145" y="175" className="text-[12px] font-bold fill-zinc-800">O</text>
            <text x="244" y="166" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="108" y="104" className="text-[12px] font-mono font-bold fill-emerald-700">H = 8 см</text>
            <text x="174" y="156" className="text-[12px] font-mono font-bold fill-blue-700">R = 6 см</text>
            <text x="208" y="92" className="text-[12px] font-mono font-bold fill-rose-600">l = ?</text>
          </svg>
        );

      // 15. Центральний і вписаний кути в колі (∠AOB = 110°, ∠ACB = ?)
      case 'math-geom-1':
        return (
          <svg viewBox="0 0 320 215" className="w-full max-w-[320px] h-auto mx-auto">
            <circle
              cx="160"
              cy="108"
              r="80"
              fill="rgba(99, 102, 241, 0.05)"
              stroke="#18181b"
              strokeWidth="2.2"
            />
            {/* Вписаний кут ACB */}
            <polyline
              points="96,156 160,28 224,156"
              fill="none"
              stroke="#059669"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Центральний кут AOB */}
            <polyline
              points="96,156 160,108 224,156"
              fill="rgba(245, 158, 11, 0.12)"
              stroke="#d97706"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Дуга центрального кута */}
            <path d="M 142,121 A 22,22 0 0,0 178,121" fill="none" stroke="#d97706" strokeWidth="1.8" />
            {/* Дуга вписаного кута */}
            <path d="M 149,50 A 25,25 0 0,0 171,50" fill="none" stroke="#059669" strokeWidth="1.8" />
            <circle cx="160" cy="108" r="3.5" fill="#18181b" />
            <text x="155" y="21" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="78" y="168" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="231" y="168" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="155" y="100" className="text-[12px] font-bold fill-zinc-900">O</text>
            <text x="143" y="139" className="text-[12px] font-mono font-bold fill-amber-700">110°</text>
            <text x="154" y="68" className="text-[12px] font-mono font-bold fill-emerald-700">?</text>
          </svg>
        );

      // 16. Паралельні прямі a || b і січна c (∠1 = 132°, ∠2 = ?)
      case 'math-geom-2':
        return (
          <svg viewBox="0 0 320 195" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Паралельні прямі a і b */}
            <line x1="35" y1="65" x2="285" y2="65" stroke="#18181b" strokeWidth="2.2" />
            <line x1="35" y1="140" x2="285" y2="140" stroke="#18181b" strokeWidth="2.2" />
            {/* Січна c */}
            <line x1="215" y1="20" x2="105" y2="178" stroke="#2563eb" strokeWidth="2.2" />
            {/* Дуга кута 1 (тупий зверху зліва: між лівим променем a та верхнім променем c) */}
            <path
              d="M 156,65 A 28,28 0 0,1 199,43"
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#d97706"
              strokeWidth="1.8"
            />
            {/* Дуга кута 2 (гострий внутрішній на прямій b: між правим променем b та верхнім c) */}
            <path
              d="M 147,118 A 26,26 0 0,1 158,140"
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#059669"
              strokeWidth="1.8"
            />
            <text x="272" y="56" className="text-[13px] font-serif italic font-bold fill-zinc-800">a</text>
            <text x="272" y="131" className="text-[13px] font-serif italic font-bold fill-zinc-800">b</text>
            <text x="222" y="30" className="text-[13px] font-serif italic font-bold fill-blue-700">c</text>
            <text x="122" y="54" className="text-[12px] font-mono font-bold fill-amber-800">∠1 = 132°</text>
            <text x="166" y="132" className="text-[12px] font-mono font-bold fill-emerald-700">∠2 = ?</text>
          </svg>
        );

      // 17. Трикутник ABC зі сторонами 8 см, 10 см і кутом 30° між ними
      case 'math-geom-3':
        return (
          <svg viewBox="0 0 320 190" className="w-full max-w-[320px] h-auto mx-auto">
            <polygon
              points="45,155 270,155 185,48"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Дуга кута 30° при вершині A */}
            <path
              d="M 88,155 A 43,43 0 0,0 79,129"
              fill="rgba(245, 158, 11, 0.25)"
              stroke="#d97706"
              strokeWidth="2"
            />
            <text x="27" y="162" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="182" y="38" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="278" y="162" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="95" y="146" className="text-[12px] font-mono font-bold fill-amber-800">30°</text>
            <text x="82" y="92" className="text-[12px] font-mono font-bold fill-zinc-900">8 см</text>
            <text x="142" y="176" className="text-[12px] font-mono font-bold fill-zinc-900">10 см</text>
            <text x="148" y="122" className="text-[12px] font-mono font-bold fill-emerald-700">S = ?</text>
          </svg>
        );

      // 18. Рівнобічна трапеція з середньою лінією MN = 11 см і меншою основою BC = 7 см
      case 'math-geom-4':
        return (
          <svg viewBox="0 0 320 195" className="w-full max-w-[320px] h-auto mx-auto">
            <polygon
              points="95,45 225,45 270,155 50,155"
              fill="rgba(99, 102, 241, 0.08)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Середня лінія MN */}
            <line
              x1="72.5"
              y1="100"
              x2="247.5"
              y2="100"
              stroke="#059669"
              strokeWidth="2.4"
              strokeDasharray="6,3"
            />
            <circle cx="72.5" cy="100" r="3.5" fill="#059669" />
            <circle cx="247.5" cy="100" r="3.5" fill="#059669" />
            {/* Вершини */}
            <text x="33" y="162" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="86" y="36" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="228" y="36" className="text-[13px] font-bold fill-zinc-900">C</text>
            <text x="277" y="162" className="text-[13px] font-bold fill-zinc-900">D</text>
            <text x="53" y="104" className="text-[13px] font-bold fill-emerald-700">M</text>
            <text x="255" y="104" className="text-[13px] font-bold fill-emerald-700">N</text>
            {/* Підписи */}
            <text x="132" y="36" className="text-[12px] font-mono font-bold fill-zinc-900">BC = 7 см</text>
            <text x="122" y="93" className="text-[12px] font-mono font-bold fill-emerald-700">MN = 11 см</text>
            <text x="135" y="176" className="text-[12px] font-mono font-bold fill-rose-600">AD = ?</text>
          </svg>
        );

      // 19. Дотична AB до кола з центром O (OA = 5 см, OB = 13 см, AB = ?)
      case 'math-geom-5':
        return (
          <svg viewBox="0 0 320 200" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Коло */}
            <circle
              cx="105"
              cy="115"
              r="62"
              fill="rgba(59, 130, 246, 0.07)"
              stroke="#18181b"
              strokeWidth="2.2"
            />
            {/* Прямокутний трикутник OAB (OA ⊥ AB у точці A(105, 53)) */}
            <polygon
              points="105,115 105,53 265,53"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#059669"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Прямий кут у точці дотику A */}
            <polyline
              points="105,65 117,65 117,53"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.5"
            />
            <circle cx="105" cy="115" r="3.5" fill="#18181b" />
            <circle cx="105" cy="53" r="3.5" fill="#e11d48" />
            <circle cx="265" cy="53" r="3.5" fill="#18181b" />
            <text x="88" y="122" className="text-[13px] font-bold fill-zinc-900">O</text>
            <text x="98" y="42" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="272" y="57" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="58" y="90" className="text-[12px] font-mono font-bold fill-blue-700">R = 5 см</text>
            <text x="175" y="106" className="text-[12px] font-mono font-bold fill-zinc-800">OB = 13 см</text>
            <text x="165" y="43" className="text-[12px] font-mono font-bold fill-emerald-700">AB = ?</text>
          </svg>
        );

      // 20. Правильна чотирикутна піраміда SABCD (a = 6 см, SO = 4 см, апофема SM = ?)
      case 'math-geom-6':
        return (
          <svg viewBox="0 0 320 215" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Основа ABCD */}
            <polygon
              points="55,170 195,170 255,130 115,130"
              fill="rgba(59, 130, 246, 0.06)"
              stroke="none"
            />
            {/* Невидимі ребра основи */}
            <line x1="55" y1="170" x2="115" y2="130" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            <line x1="115" y1="130" x2="255" y2="130" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            <line x1="155" y1="25" x2="115" y2="130" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            {/* Видимі ребра основи */}
            <line x1="55" y1="170" x2="195" y2="170" stroke="#18181b" strokeWidth="2" />
            <line x1="195" y1="170" x2="255" y2="130" stroke="#18181b" strokeWidth="2" />
            {/* Видимі бічні ребра */}
            <line x1="155" y1="25" x2="55" y2="170" stroke="#18181b" strokeWidth="2" />
            <line x1="155" y1="25" x2="195" y2="170" stroke="#18181b" strokeWidth="2" />
            <line x1="155" y1="25" x2="255" y2="130" stroke="#18181b" strokeWidth="2" />
            {/* Прямокутний трикутник SOM всередині піраміди */}
            <polygon
              points="155,25 155,150 225,150"
              fill="rgba(16, 185, 129, 0.15)"
            />
            {/* Висота SO */}
            <line x1="155" y1="25" x2="155" y2="150" stroke="#059669" strokeWidth="2.2" strokeDasharray="4,3" />
            {/* Відрізок OM = a/2 = 3 см */}
            <line x1="155" y1="150" x2="225" y2="150" stroke="#2563eb" strokeWidth="2" />
            {/* Апофема SM */}
            <line x1="155" y1="25" x2="225" y2="150" stroke="#e11d48" strokeWidth="2.5" />
            {/* Прямий кут O */}
            <polyline points="155,140 165,140 165,150" fill="none" stroke="#18181b" strokeWidth="1.4" />
            <circle cx="155" cy="150" r="3" fill="#18181b" />
            <circle cx="225" cy="150" r="3" fill="#e11d48" />
            {/* Підписи */}
            <text x="150" y="18" className="text-[13px] font-bold fill-zinc-900">S</text>
            <text x="40" y="176" className="text-[12px] font-bold fill-zinc-900">A</text>
            <text x="196" y="184" className="text-[12px] font-bold fill-zinc-900">B</text>
            <text x="262" y="134" className="text-[12px] font-bold fill-zinc-900">C</text>
            <text x="142" y="162" className="text-[12px] font-bold fill-zinc-800">O</text>
            <text x="232" y="156" className="text-[12px] font-bold fill-rose-600">M</text>
            <text x="106" y="98" className="text-[11px] font-mono font-bold fill-emerald-700">H = 4</text>
            <text x="198" y="88" className="text-[12px] font-mono font-bold fill-rose-600">SM = ?</text>
            <text x="105" y="186" className="text-[12px] font-mono font-bold fill-zinc-800">a = 6 см</text>
          </svg>
        );

      // 21. Пряма трикутна призма (катети основи 3 і 4 см, бічне ребро 10 см)
      case 'math-geom-7':
        return (
          <svg viewBox="0 0 320 215" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Нижня основа */}
            <polygon
              points="75,165 225,165 135,190"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Верхня основа */}
            <polygon
              points="75,50 225,50 135,75"
              fill="rgba(59, 130, 246, 0.14)"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Бічні ребра */}
            <line x1="75" y1="50" x2="75" y2="165" stroke="#18181b" strokeWidth="2" />
            <line x1="135" y1="75" x2="135" y2="190" stroke="#18181b" strokeWidth="2" />
            <line x1="225" y1="50" x2="225" y2="165" stroke="#18181b" strokeWidth="2" />
            {/* Задня лінія AB невидима */}
            <line x1="75" y1="165" x2="225" y2="165" stroke="#71717a" strokeWidth="1.5" strokeDasharray="5,4" />
            {/* Підписи */}
            <text x="58" y="170" className="text-[12px] font-bold fill-zinc-900">A</text>
            <text x="130" y="205" className="text-[12px] font-bold fill-zinc-900">C (90°)</text>
            <text x="232" y="170" className="text-[12px] font-bold fill-zinc-900">B</text>
            <text x="72" y="190" className="text-[11px] font-mono font-bold fill-blue-700">3 см</text>
            <text x="182" y="188" className="text-[11px] font-mono font-bold fill-blue-700">4 см</text>
            <text x="234" y="112" className="text-[12px] font-mono font-bold fill-emerald-700">H = 10 см</text>
          </svg>
        );

      // 22. Прямокутний трикутник із висотою CH до гіпотенузи (AH = 4 см, BH = 9 см)
      case 'math-geom-8':
        return (
          <svg viewBox="0 0 320 195" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Трикутник ABC (∠C = 90° у вершині C(117, 45), A(45, 153), B(279, 153)) */}
            <polygon
              points="45,153 275,153 117,45"
              fill="rgba(16, 185, 129, 0.08)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Висота CH */}
            <line x1="117" y1="45" x2="117" y2="153" stroke="#e11d48" strokeWidth="2.2" />
            {/* Прямий кут при H */}
            <polyline points="117,141 129,141 129,153" fill="none" stroke="#18181b" strokeWidth="1.5" />
            {/* Вершини */}
            <text x="28" y="158" className="text-[13px] font-bold fill-zinc-900">A</text>
            <text x="112" y="35" className="text-[13px] font-bold fill-zinc-900">C (90°)</text>
            <text x="282" y="158" className="text-[13px] font-bold fill-zinc-900">B</text>
            <text x="112" y="170" className="text-[12px] font-bold fill-rose-600">H</text>
            {/* Проєкції */}
            <text x="62" y="172" className="text-[12px] font-mono font-bold fill-blue-700">AH = 4 см</text>
            <text x="172" y="172" className="text-[12px] font-mono font-bold fill-emerald-700">BH = 9 см</text>
            <text x="124" y="106" className="text-[12px] font-mono font-bold fill-rose-600">h</text>
          </svg>
        );

      // 23. Графік параболи y = (x - 2)² + 1 або (x - 2)² - 3 у системі координат
      case 'math-func-1':
        return (
          <svg viewBox="0 0 320 205" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Сітка */}
            <g stroke="#e4e4e7" strokeWidth="1">
              <line x1="40" y1="35" x2="280" y2="35" />
              <line x1="40" y1="65" x2="280" y2="65" />
              <line x1="40" y1="95" x2="280" y2="95" />
              <line x1="40" y1="125" x2="280" y2="125" />
              <line x1="40" y1="155" x2="280" y2="155" />
              <line x1="70" y1="20" x2="70" y2="180" />
              <line x1="100" y1="20" x2="100" y2="180" />
              <line x1="130" y1="20" x2="130" y2="180" />
              <line x1="160" y1="20" x2="160" y2="180" />
              <line x1="190" y1="20" x2="190" y2="180" />
              <line x1="220" y1="20" x2="220" y2="180" />
              <line x1="250" y1="20" x2="250" y2="180" />
            </g>
            {/* Вісь Ox (y=0 на рівні y=155) та Oy (x=0 на рівні x=130) */}
            <line x1="35" y1="155" x2="285" y2="155" stroke="#18181b" strokeWidth="1.8" />
            <line x1="130" y1="185" x2="130" y2="18" stroke="#18181b" strokeWidth="1.8" />
            {/* Стрілки осей */}
            <polygon points="288,155 280,151 280,159" fill="#18181b" />
            <polygon points="130,14 126,22 134,22" fill="#18181b" />
            {/* Пунктири від вершини (2; 5) -> x = 130 + 2*30 = 190, y = 155 - 5*18 = 65 */}
            <line x1="190" y1="65" x2="190" y2="155" stroke="#059669" strokeWidth="1.5" strokeDasharray="4,3" />
            <line x1="130" y1="65" x2="190" y2="65" stroke="#059669" strokeWidth="1.5" strokeDasharray="4,3" />
            {/* Гілки параболи з вершиною в (190, 65), що відкривається вгору */}
            <path
              d="M 142,15 Q 190,115 238,15"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="190" cy="65" r="4" fill="#e11d48" />
            <text x="275" y="172" className="text-[12px] font-bold fill-zinc-900">x</text>
            <text x="114" y="26" className="text-[12px] font-bold fill-zinc-900">y</text>
            <text x="117" y="170" className="text-[11px] font-mono fill-zinc-700">0</text>
            <text x="186" y="170" className="text-[11px] font-mono font-bold fill-emerald-700">2</text>
            <text x="115" y="69" className="text-[11px] font-mono font-bold fill-emerald-700">5</text>
            <text x="200" y="72" className="text-[11px] font-mono font-bold fill-rose-600">y = (x - 2)² + 5</text>
          </svg>
        );

      // 24. Графік функції y = f(x) на проміжку [-3; 4] для знаходження нулів / найбільшого значення
      case 'math-func-2':
        return (
          <svg viewBox="0 0 320 205" className="w-full max-w-[320px] h-auto mx-auto">
            {/* Сітка (крок 25px, початок координат O(140, 115)) */}
            <g stroke="#e4e4e7" strokeWidth="1">
              {[40, 65, 90, 115, 140, 165, 190, 215, 240, 265].map((x) => (
                <line key={`vx-${x}`} x1={x} y1="15" x2={x} y2="190" />
              ))}
              {[40, 65, 90, 115, 140, 165].map((y) => (
                <line key={`hy-${y}`} x1="35" y1={y} x2="280" y2={y} />
              ))}
            </g>
            {/* Осі Ox та Oy */}
            <line x1="30" y1="115" x2="285" y2="115" stroke="#18181b" strokeWidth="1.8" />
            <line x1="140" y1="192" x2="140" y2="14" stroke="#18181b" strokeWidth="1.8" />
            <polygon points="288,115 280,111 280,119" fill="#18181b" />
            <polygon points="140,10 136,18 144,18" fill="#18181b" />
            {/* Крива графіка: від (-3; -2) -> (65,165), через (-2; 0) -> (90,115), макс у (0; 3) -> (140,40), через (2; 0) -> (190,115), мін у (3; -1) -> (215,140), через (4; 0) -> (240,115) */}
            <path
              d="M 65,165 C 78,140 82,125 90,115 C 108,80 124,40 140,40 C 158,40 175,85 190,115 C 200,132 208,140 215,140 C 224,140 232,128 240,115"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            {/* Кінцеві точки та нулі функції */}
            <circle cx="65" cy="165" r="3.5" fill="#18181b" />
            <circle cx="90" cy="115" r="4" fill="#e11d48" />
            <circle cx="190" cy="115" r="4" fill="#e11d48" />
            <circle cx="240" cy="115" r="4" fill="#e11d48" />
            <circle cx="140" cy="40" r="3.5" fill="#059669" />
            <text x="275" y="130" className="text-[12px] font-bold fill-zinc-900">x</text>
            <text x="125" y="24" className="text-[12px] font-bold fill-zinc-900">y</text>
            <text x="129" y="129" className="text-[10px] font-mono fill-zinc-700">0</text>
            <text x="162" y="129" className="text-[10px] font-mono fill-zinc-700">1</text>
            <text x="80" y="131" className="text-[10px] font-mono font-bold fill-rose-600">-2</text>
            <text x="187" y="131" className="text-[10px] font-mono font-bold fill-rose-600">2</text>
            <text x="237" y="131" className="text-[10px] font-mono font-bold fill-rose-600">4</text>
            <text x="127" y="44" className="text-[10px] font-mono font-bold fill-emerald-700">3</text>
            <text x="152" y="36" className="text-[11px] font-mono font-bold fill-blue-700">y = f(x)</text>
          </svg>
        );

      default:
        return null;
    }
  };

  const svgContent = renderSvg();
  if (!svgContent) return null;

  const isFuncGraph = diagramId.startsWith('math-func');

  return (
    <div
      className={`bg-zinc-50/90 border border-zinc-200 rounded-xl ${
        compact ? 'p-3' : 'p-4'
      } flex flex-col items-center justify-center shadow-2xs`}
    >
      <div className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 pb-1.5 border-b border-zinc-200/70">
        <span className="flex items-center gap-1.5 text-zinc-700">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {isFuncGraph
              ? 'Графік функції до задачі'
              : 'Геометричний рисунок до задачі'}
          </span>
        </span>
        <span className="font-mono text-[10px] text-zinc-400">
          {isFuncGraph ? 'НМТ · Функції та графіки' : 'НМТ · Геометрія'}
        </span>
      </div>
      <div className="w-full py-1">{svgContent}</div>
    </div>
  );
};
