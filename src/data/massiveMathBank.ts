import { Question } from '../types/nmt';

function generateMathTopicQuestions(): Question[] {
  const out: Question[] = [];

  // 1. Арифметика та алгебра (50 додаткових завдань)
  for (let i = 1; i <= 50; i++) {
    const k = i + 2;
    const m = (i % 7) + 2;
    if (i % 3 === 0) {
      // Числова задача на відсотки / пропорції / формули скороченого множення
      const base = 200 + i * 20;
      const pct = (i % 4 === 0 ? 15 : i % 2 === 0 ? 25 : 20);
      const ans = (base * pct) / 100;
      out.push({
        id: `math-bank-alg-${i}`,
        subjectId: 'math',
        topic: 'Арифметика та алгебра',
        yearOrSource: `ЗНО UA · Варіант ${i}`,
        type: 'numeric',
        text: `Товар коштував ${base} грн. Під час сезонної акції його ціну знизили на ${pct}%. На скільки гривень подешевшав товар?`,
        correctNumeric: ans,
        maxPoints: 2,
        explanation: `Знаходимо ${pct}% від числа ${base}: (${base} · ${pct}) / 100 = ${ans} грн.`,
      });
    } else if (i % 2 === 0) {
      const sq = k * k;
      out.push({
        id: `math-bank-alg-${i}`,
        subjectId: 'math',
        topic: 'Арифметика та алгебра',
        yearOrSource: `Просте ЗНО · Тренування #${i}`,
        type: 'single',
        text: `Спростіть алгебраїчний вираз: (x + ${k})² - 2x · ${k}`,
        options: [
          { id: 'А', text: `x² + ${sq}` },
          { id: 'Б', text: `x² - ${sq}` },
          { id: 'В', text: `x² + ${2 * k}x + ${sq}` },
          { id: 'Г', text: `${sq}` },
          { id: 'Д', text: `x² + ${k}` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `За формулою квадрата суми: (x + ${k})² - ${2 * k}x = x² + ${2 * k}x + ${sq} - ${2 * k}x = x² + ${sq}.`,
      });
    } else {
      const val = (k + m) * (k - m);
      out.push({
        id: `math-bank-alg-${i}`,
        subjectId: 'math',
        topic: 'Арифметика та алгебра',
        yearOrSource: `НМТ Тренажер · Завдання #${i}`,
        type: 'single',
        text: `Обчисліть значення виразу (${k} + ${m})(${k} - ${m}) за формулою різниці квадратів:`,
        options: [
          { id: 'А', text: `${val}` },
          { id: 'Б', text: `${val + 2 * m}` },
          { id: 'В', text: `${k * k + m * m}` },
          { id: 'Г', text: `${2 * k}` },
          { id: 'Д', text: `${val - m}` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Використаємо формулу різниці квадратів (a + b)(a - b) = a² - b²: ${k}² - ${m}² = ${k * k} - ${m * m} = ${val}.`,
      });
    }
  }

  // 2. Раціональні, ірраціональні та степеневі вирази (52 завдання)
  for (let i = 1; i <= 52; i++) {
    const p = i + 3;
    const q = (i % 5) + 2;
    if (i % 3 === 0) {
      const rootVal = (i % 9) + 2;
      const inside = rootVal * rootVal * 3;
      const ans = rootVal * 3;
      out.push({
        id: `math-bank-rat-${i}`,
        subjectId: 'math',
        topic: 'Раціональні, ірраціональні та степеневі вирази',
        yearOrSource: `ЗНО UA · Степені та корені #${i}`,
        type: 'numeric',
        text: `Обчисліть значення ірраціонального виразу: √${inside} · √3.`,
        correctNumeric: ans,
        maxPoints: 2,
        explanation: `За властивістю добутку квадратних коренів: √${inside} · √3 = √(${inside} · 3) = √${ans * ans} = ${ans}.`,
      });
    } else {
      const expAns = p + q - 2;
      out.push({
        id: `math-bank-rat-${i}`,
        subjectId: 'math',
        topic: 'Раціональні, ірраціональні та степеневі вирази',
        yearOrSource: `Просте ЗНО · Вирази #${i}`,
        type: 'single',
        text: `Спростіть степеневий вираз (a^${p} · a^${q}) / a² при a ≠ 0:`,
        options: [
          { id: 'А', text: `a^${expAns}` },
          { id: 'Б', text: `a^${p * q - 2}` },
          { id: 'В', text: `a^${p + q + 2}` },
          { id: 'Г', text: `a^${p - q}` },
          { id: 'Д', text: `a²` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `При множенні степенів з однаковою основою показники додаються, а при діленні — віднімаються: a^(${p} + ${q} - 2) = a^${expAns}.`,
      });
    }
  }

  // 3. Показникові та логарифмічні вирази (52 завдання)
  const bases = [2, 3, 4, 5, 6, 7];
  for (let i = 1; i <= 52; i++) {
    const b = bases[i % bases.length];
    const power = (i % 3) + 2;
    const mult = (i % 5) + 2;
    const bPow = Math.pow(b, power);
    if (i % 3 === 0) {
      const addVal = i + 5;
      const ans = power + addVal;
      out.push({
        id: `math-bank-log-${i}`,
        subjectId: 'math',
        topic: 'Показникові та логарифмічні вирази',
        yearOrSource: `ЗНО UA · Логарифми #${i}`,
        type: 'numeric',
        text: `Обчисліть значення виразу: log_${b}(${bPow * mult}) - log_${b}(${mult}) + ${addVal}.`,
        correctNumeric: ans,
        maxPoints: 2,
        explanation: `Різниця логарифмів дорівнює логарифму частки: log_${b}(${bPow * mult} / ${mult}) = log_${b}(${bPow}) = ${power}. Додаємо ${addVal}: ${power} + ${addVal} = ${ans}.`,
      });
    } else {
      out.push({
        id: `math-bank-log-${i}`,
        subjectId: 'math',
        topic: 'Показникові та логарифмічні вирази',
        yearOrSource: `Просте ЗНО · Логарифми #${i}`,
        type: 'single',
        text: `Обчисліть значення логарифмічного виразу: log_${b}(${bPow}) + ${i}`,
        options: [
          { id: 'А', text: `${power + i}` },
          { id: 'Б', text: `${bPow + i}` },
          { id: 'В', text: `${power * i}` },
          { id: 'Г', text: `${b + power + i}` },
          { id: 'Д', text: `${i}` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Оскільки ${b}^${power} = ${bPow}, то log_${b}(${bPow}) = ${power}. Тоді ${power} + ${i} = ${power + i}.`,
      });
    }
  }

  // 4. Тригонометричні вирази та рівняння (52 завдання)
  for (let i = 1; i <= 52; i++) {
    const k = i + 4;
    if (i % 3 === 0) {
      out.push({
        id: `math-bank-trig-${i}`,
        subjectId: 'math',
        topic: 'Тригонометричні вирази та рівняння',
        yearOrSource: `ЗНО UA · Тригонометрія #${i}`,
        type: 'numeric',
        text: `Обчисліть значення тригонометричного виразу: ${k} · sin²(${i * 3}°) + ${k} · cos²(${i * 3}°).`,
        correctNumeric: k,
        maxPoints: 2,
        explanation: `Винесемо ${k} за дужки: ${k} · (sin²α + cos²α). За основною тригонометричною тотожністю sin²α + cos²α = 1, отже результат дорівнює ${k} · 1 = ${k}.`,
      });
    } else if (i % 2 === 0) {
      const coeff = (i % 8) + 2;
      const maxVal = coeff + i;
      out.push({
        id: `math-bank-trig-${i}`,
        subjectId: 'math',
        topic: 'Тригонометричні вирази та рівняння',
        yearOrSource: `Просте ЗНО · Тригонометрія #${i}`,
        type: 'single',
        text: `Знайдіть найбільше значення виразу: ${coeff} · cos(x) + ${i}`,
        options: [
          { id: 'А', text: `${maxVal}` },
          { id: 'Б', text: `${i - coeff}` },
          { id: 'В', text: `${coeff}` },
          { id: 'Г', text: `${i}` },
          { id: 'Д', text: `${coeff * i}` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Оскільки найбільше значення функції cos(x) дорівнює 1, то найбільше значення виразу ${coeff} · cos(x) + ${i} дорівнює ${coeff} · 1 + ${i} = ${maxVal}.`,
      });
    } else {
      const mult = (i + 1) * 2;
      const ans = mult / 2;
      out.push({
        id: `math-bank-trig-${i}`,
        subjectId: 'math',
        topic: 'Тригонометричні вирази та рівняння',
        yearOrSource: `НМТ Тренажер · Тригонометрія #${i}`,
        type: 'single',
        text: `Обчисліть значення виразу: ${mult} · sin 30°`,
        options: [
          { id: 'А', text: `${ans}` },
          { id: 'Б', text: `${mult}` },
          { id: 'В', text: `${ans}√3` },
          { id: 'Г', text: `${ans}√2` },
          { id: 'Д', text: `${mult * 2}` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Табличне значення sin 30° = 1/2 = 0,5. Отже, ${mult} · 0,5 = ${ans}.`,
      });
    }
  }

  // 5. Функції та їх графіки (50 додаткових завдань)
  for (let i = 1; i <= 50; i++) {
    const k = i + 2;
    const b = (i % 7) + 1;
    if (i % 3 === 0) {
      const x0 = (i % 5) + 2;
      const y0 = k * x0 - b;
      out.push({
        id: `math-bank-func-${i}`,
        subjectId: 'math',
        topic: 'Функції та їх графіки',
        yearOrSource: `ЗНО UA · Функції #${i}`,
        type: 'numeric',
        text: `Функцію задано формулою f(x) = ${k}x - ${b}. Обчисліть значення f(${x0}).`,
        correctNumeric: y0,
        maxPoints: 2,
        explanation: `Підставимо x = ${x0} у формулу функції: f(${x0}) = ${k} · ${x0} - ${b} = ${k * x0} - ${b} = ${y0}.`,
      });
    } else {
      out.push({
        id: `math-bank-func-${i}`,
        subjectId: 'math',
        topic: 'Функції та їх графіки',
        yearOrSource: `Просте ЗНО · Графіки функцій #${i}`,
        type: 'single',
        diagramId: i % 4 === 0 ? 'math-func-1' : undefined,
        text: `Укажіть координати вершини параболи, заданої рівнянням y = (x - ${k})² + ${b}:`,
        options: [
          { id: 'А', text: `(${k}; ${b})` },
          { id: 'Б', text: `(-${k}; ${b})` },
          { id: 'В', text: `(${k}; -${b})` },
          { id: 'Г', text: `(${b}; ${k})` },
          { id: 'Д', text: `(-${k}; -${b})` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Для параболи вигляду y = a(x - m)² + n вершиною є точка (m; n), тобто (${k}; ${b}).`,
      });
    }
  }

  // 6. Рівняння та нерівності (50 додаткових завдань)
  for (let i = 1; i <= 50; i++) {
    const r1 = i + 1;
    const r2 = (i % 6) + 2;
    const sumRoots = r1 + r2;
    const prodRoots = r1 * r2;
    if (i % 3 === 0) {
      out.push({
        id: `math-bank-eq-${i}`,
        subjectId: 'math',
        topic: 'Рівняння та нерівності',
        yearOrSource: `ЗНО UA · Рівняння #${i}`,
        type: 'numeric',
        text: `Знайдіть більший корінь квадратного рівняння x² - ${sumRoots}x + ${prodRoots} = 0.`,
        correctNumeric: Math.max(r1, r2),
        maxPoints: 2,
        explanation: `За теоремою Вієта сума коренів x₁ + x₂ = ${sumRoots}, а добуток x₁ · x₂ = ${prodRoots}. Коренями є числа ${r1} і ${r2}, більший із них дорівнює ${Math.max(r1, r2)}.`,
      });
    } else {
      const rhs = (i + 3) * 4;
      const bound = rhs / 4;
      out.push({
        id: `math-bank-eq-${i}`,
        subjectId: 'math',
        topic: 'Рівняння та нерівності',
        yearOrSource: `Просте ЗНО · Нерівності #${i}`,
        type: 'single',
        text: `Розв’яжіть лінійну нерівність: 4x - ${rhs} ≤ 0`,
        options: [
          { id: 'А', text: `(-∞; ${bound}]` },
          { id: 'Б', text: `[${bound}; +∞)` },
          { id: 'В', text: `(-∞; ${bound})` },
          { id: 'Г', text: `(${bound}; +∞)` },
          { id: 'Д', text: `[-${bound}; ${bound}]` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Перенесемо доданок у праву частину: 4x ≤ ${rhs} ⇒ x ≤ ${bound}, що відповідає проміжку (-∞; ${bound}].`,
      });
    }
  }

  // 7. Числові послідовності та прогресії (50 додаткових завдань)
  for (let i = 1; i <= 50; i++) {
    const a1 = i + 2;
    const d = (i % 5) + 2;
    const n = (i % 6) + 5;
    const an = a1 + d * (n - 1);
    if (i % 2 === 0) {
      out.push({
        id: `math-bank-prog-${i}`,
        subjectId: 'math',
        topic: 'Числові послідовності та прогресії',
        yearOrSource: `ЗНО UA · Прогресії #${i}`,
        type: 'numeric',
        text: `В арифметичній прогресії (aₙ) перший член a₁ = ${a1}, а різниця d = ${d}. Обчисліть член a_${n} цієї прогресії.`,
        correctNumeric: an,
        maxPoints: 2,
        explanation: `За формулою n-го члена арифметичної прогресії aₙ = a₁ + d(n - 1): a_${n} = ${a1} + ${d} · (${n} - 1) = ${an}.`,
      });
    } else {
      out.push({
        id: `math-bank-prog-${i}`,
        subjectId: 'math',
        topic: 'Числові послідовності та прогресії',
        yearOrSource: `Просте ЗНО · Послідовності #${i}`,
        type: 'single',
        text: `Числову послідовність задано формулою n-го члена xₙ = 3n + ${i}. Знайдіть п’ятий член (x₅) цієї послідовності:`,
        options: [
          { id: 'А', text: `${15 + i}` },
          { id: 'Б', text: `${12 + i}` },
          { id: 'В', text: `${18 + i}` },
          { id: 'Г', text: `${5 * i + 3}` },
          { id: 'Д', text: `${8 + i}` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Підставимо n = 5 у формулу xₙ = 3n + ${i}: x₅ = 3 · 5 + ${i} = ${15 + i}.`,
      });
    }
  }

  // 8. Планіметрія (48 додаткових завдань із геометричними рисунками)
  const planDiagrams = [
    'math-3',
    'math-6',
    'math-24',
    'math-25',
    'math-zno-16',
    'math-geom-1',
    'math-geom-2',
    'math-geom-3',
    'math-geom-4',
    'math-geom-5',
  ];
  for (let i = 1; i <= 48; i++) {
    const diag = planDiagrams[i % planDiagrams.length];
    if (i % 3 === 0) {
      const d1 = (i % 9 + 3) * 2;
      const d2 = (i % 7 + 4) * 2;
      const area = (d1 * d2) / 2;
      out.push({
        id: `math-bank-plan-${i}`,
        subjectId: 'math',
        topic: 'Планіметрія',
        yearOrSource: `ЗНО UA · Планіметрія з рисунком #${i}`,
        type: 'numeric',
        diagramId: 'math-6',
        text: `На рисунку зображено ромб ABCD, діагоналі якого взаємно перпендикулярні й дорівнюють ${d1} см і ${d2} см. Обчисліть площу цього ромба (у см²).`,
        correctNumeric: area,
        maxPoints: 2,
        explanation: `Площа ромба дорівнює півдобутку його діагоналей: S = (${d1} · ${d2}) / 2 = ${area} см².`,
      });
    } else if (i % 3 === 1) {
      const centralAngle = 60 + (i % 10) * 10;
      const inscribed = centralAngle / 2;
      out.push({
        id: `math-bank-plan-${i}`,
        subjectId: 'math',
        topic: 'Планіметрія',
        yearOrSource: `Просте ЗНО · Коло та кути #${i}`,
        type: 'single',
        diagramId: 'math-geom-1',
        text: `На рисунку зображено коло з центром у точці O. Центральний кут ∠AOB дорівнює ${centralAngle}°. Знайдіть градусну міру вписаного кута ∠ACB, що спирається на дугу AB.`,
        options: [
          { id: 'А', text: `${inscribed}°` },
          { id: 'Б', text: `${centralAngle}°` },
          { id: 'В', text: `${180 - centralAngle}°` },
          { id: 'Г', text: `${inscribed + 15}°` },
          { id: 'Д', text: `${centralAngle * 2}°` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `За теоремою про вписаний кут: ∠ACB = ∠AOB / 2 = ${centralAngle}° / 2 = ${inscribed}°.`,
      });
    } else {
      const a = 4 + (i % 8);
      const b = a + 6 + (i % 4) * 2;
      const mid = (a + b) / 2;
      out.push({
        id: `math-bank-plan-${i}`,
        subjectId: 'math',
        topic: 'Планіметрія',
        yearOrSource: `НМТ · Трапеція з рисунком #${i}`,
        type: 'single',
        diagramId: diag === 'math-25' ? 'math-25' : 'math-geom-4',
        text: `На рисунку зображено трапецію ABCD, основи якої дорівнюють BC = ${a} см і AD = ${b} см. Знайдіть довжину середньої лінії MN цієї трапеції:`,
        options: [
          { id: 'А', text: `${mid} см` },
          { id: 'Б', text: `${b - a} см` },
          { id: 'В', text: `${a + b} см` },
          { id: 'Г', text: `${mid + 2} см` },
          { id: 'Д', text: `${mid - 1} см` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Середня лінія трапеції дорівнює півсумі її основ: MN = (${a} + ${b}) / 2 = ${mid} см.`,
      });
    }
  }

  // 9. Стереометрія (48 додаткових завдань із 3D-рисунками)
  for (let i = 1; i <= 48; i++) {
    if (i % 3 === 0) {
      const a = (i % 7) + 2;
      const b = (i % 5) + 3;
      const c = (i % 6) + 4;
      const vol = a * b * c;
      out.push({
        id: `math-bank-ster-${i}`,
        subjectId: 'math',
        topic: 'Стереометрія',
        yearOrSource: `ЗНО UA · Многогранники #${i}`,
        type: 'numeric',
        diagramId: 'math-27',
        text: `На рисунку зображено прямокутний паралелепіпед із лінійними вимірами a = ${a} см, b = ${b} см та c = ${c} см. Обчисліть його об’єм (у см³).`,
        correctNumeric: vol,
        maxPoints: 2,
        explanation: `Об’єм прямокутного паралелепіпеда дорівнює добутку трьох його вимірів: V = ${a} · ${b} · ${c} = ${vol} см³.`,
      });
    } else if (i % 3 === 1) {
      const r = (i % 6) + 2;
      const h = (i % 7) + 3;
      const vCoeff = r * r * h;
      out.push({
        id: `math-bank-ster-${i}`,
        subjectId: 'math',
        topic: 'Стереометрія',
        yearOrSource: `Просте ЗНО · Циліндр #${i}`,
        type: 'single',
        diagramId: 'math-12',
        text: `На рисунку зображено циліндр із радіусом основи R = ${r} см і висотою H = ${h} см. Знайдіть об’єм цього циліндра:`,
        options: [
          { id: 'А', text: `${vCoeff}π см³` },
          { id: 'Б', text: `${2 * r * h}π см³` },
          { id: 'В', text: `${r * h}π см³` },
          { id: 'Г', text: `${vCoeff * 2}π см³` },
          { id: 'Д', text: `${r * r + h}π см³` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Об’єм циліндра V = πR²H = π · ${r}² · ${h} = ${vCoeff}π см³.`,
      });
    } else {
      const edge = (i % 8) + 2;
      const surf = 6 * edge * edge;
      out.push({
        id: `math-bank-ster-${i}`,
        subjectId: 'math',
        topic: 'Стереометрія',
        yearOrSource: `НМТ · Стереометрія з рисунком #${i}`,
        type: 'single',
        diagramId: 'math-13',
        text: `На рисунку зображено куб, довжина ребра якого a = ${edge} см. Знайдіть площу повної поверхні цього куба:`,
        options: [
          { id: 'А', text: `${surf} см²` },
          { id: 'Б', text: `${edge * edge * edge} см²` },
          { id: 'В', text: `${4 * edge * edge} см²` },
          { id: 'Г', text: `${12 * edge} см²` },
          { id: 'Д', text: `${2 * edge * edge} см²` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `У куба 6 рівних квадратних граней, тому площа повної поверхні S = 6a² = 6 · ${edge}² = ${surf} см².`,
      });
    }
  }

  // 10. Координати та вектори у просторі (52 завдання з рисунками)
  for (let i = 1; i <= 52; i++) {
    const vx = i + 1;
    const vy = (i % 5) + 2;
    const vz = (i % 4) + 1;
    if (i % 2 === 0) {
      const dotAns = vx * 2 - vy * 1 + vz * 3;
      out.push({
        id: `math-bank-vec-${i}`,
        subjectId: 'math',
        topic: 'Координати та вектори у просторі',
        yearOrSource: `ЗНО UA · Вектори у просторі #${i}`,
        type: 'numeric',
        diagramId: 'math-zno-11',
        text: `У прямокутній системі координат у просторі задано вектори a(${vx}; -${vy}; ${vz}) та b(2; 1; 3). Обчисліть скалярний добуток векторів a · b.`,
        correctNumeric: dotAns,
        maxPoints: 2,
        explanation: `Скалярний добуток дорівнює сумі добутків відповідних координат: a · b = ${vx} · 2 + (-${vy}) · 1 + ${vz} · 3 = ${dotAns}.`,
      });
    } else {
      out.push({
        id: `math-bank-vec-${i}`,
        subjectId: 'math',
        topic: 'Координати та вектори у просторі',
        yearOrSource: `Просте ЗНО · Координати #${i}`,
        type: 'single',
        diagramId: 'math-zno-13',
        text: `Знайдіть координати вектора AB у просторі, якщо точка A(1; 2; 3), а точка B(${vx + 1}; ${vy + 2}; ${vz + 3}):`,
        options: [
          { id: 'А', text: `(${vx}; ${vy}; ${vz})` },
          { id: 'Б', text: `(${vx + 2}; ${vy + 4}; ${vz + 6})` },
          { id: 'В', text: `(-${vx}; -${vy}; -${vz})` },
          { id: 'Г', text: `(${vx}; ${vy}; 0)` },
          { id: 'Д', text: `(1; ${vy}; ${vz})` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `Від координат кінця B віднімаємо координати початку A: (${vx + 1} - 1; ${vy + 2} - 2; ${vz + 3} - 3) = (${vx}; ${vy}; ${vz}).`,
      });
    }
  }

  // 11. Похідна та інтеграл (50 додаткових завдань)
  for (let i = 1; i <= 50; i++) {
    const a = (i % 5) + 2;
    const b = i + 3;
    const x0 = (i % 4) + 1;
    if (i % 2 === 0) {
      const derivVal = 2 * a * x0 + b;
      out.push({
        id: `math-bank-calc-${i}`,
        subjectId: 'math',
        topic: 'Похідна та інтеграл',
        yearOrSource: `ЗНО UA · Похідна #${i}`,
        type: 'numeric',
        text: `Знайдіть значення похідної функції f(x) = ${a}x² + ${b}x - 7 у точці x₀ = ${x0}.`,
        correctNumeric: derivVal,
        maxPoints: 2,
        explanation: `Знаходимо похідну: f′(x) = ${2 * a}x + ${b}. Підставляємо x₀ = ${x0}: f′(${x0}) = ${2 * a} · ${x0} + ${b} = ${derivVal}.`,
      });
    } else {
      out.push({
        id: `math-bank-calc-${i}`,
        subjectId: 'math',
        topic: 'Похідна та інтеграл',
        yearOrSource: `Просте ЗНО · Первісна #${i}`,
        type: 'single',
        text: `Знайдіть похідну функції f(x) = x^${i + 2} + ${b}x:`,
        options: [
          { id: 'А', text: `f′(x) = ${i + 2}x^${i + 1} + ${b}` },
          { id: 'Б', text: `f′(x) = x^${i + 1} + ${b}` },
          { id: 'В', text: `f′(x) = ${i + 2}x^${i + 3} + ${b}x²` },
          { id: 'Г', text: `f′(x) = ${i + 1}x^${i + 2}` },
          { id: 'Д', text: `f′(x) = ${i + 2}x + ${b}` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `За правилом диференціювання степеневої функції (xⁿ)′ = n·xⁿ⁻¹ та (bx)′ = b: f′(x) = ${i + 2}x^${i + 1} + ${b}.`,
      });
    }
  }

  // 12. Теорія ймовірностей (50 додаткових завдань)
  for (let i = 1; i <= 50; i++) {
    const fav = (i % 7) + 3;
    const total = 20;
    const prob = fav / total;
    if (i % 2 === 0) {
      const nChoices = i + 4;
      const kChoices = (i % 5) + 3;
      const ways = nChoices * kChoices;
      out.push({
        id: `math-bank-prob-${i}`,
        subjectId: 'math',
        topic: 'Теорія ймовірностей',
        yearOrSource: `ЗНО UA · Комбінаторика #${i}`,
        type: 'numeric',
        text: `У меню шкільної їдальні є ${nChoices} види перших страв і ${kChoices} види напоїв. Скількома способами учень може обрати обід із однієї першої страви та одного напою?`,
        correctNumeric: ways,
        maxPoints: 2,
        explanation: `За комбінаторним правилом добутку кількість способів дорівнює ${nChoices} · ${kChoices} = ${ways}.`,
      });
    } else {
      const rest = total - fav;
      out.push({
        id: `math-bank-prob-${i}`,
        subjectId: 'math',
        topic: 'Теорія ймовірностей',
        yearOrSource: `Просте ЗНО · Ймовірність #${i}`,
        type: 'single',
        text: `На наукову конференцію приїхали ${fav} доповідачів із Києва та ${rest} — зі Львова (усього ${total} учасників, випадковий порядок виступів №${i}). Яка ймовірність того, що першим виступатиме доповідач із Києва?`,
        options: [
          { id: 'А', text: `${prob.toString().replace('.', ',')}` },
          { id: 'Б', text: `${((total - fav) / total).toString().replace('.', ',')}` },
          { id: 'В', text: `0,5` },
          { id: 'Г', text: `0,1` },
          { id: 'Д', text: `0,95` },
        ],
        correctOptionId: 'А',
        maxPoints: 1,
        explanation: `За класичним означенням ймовірності P = m / n = ${fav} / ${total} = ${prob.toString().replace('.', ',')}.`,
      });
    }
  }

  return out;
}

export const MASSIVE_MATH_QUESTIONS: Question[] = generateMathTopicQuestions();
