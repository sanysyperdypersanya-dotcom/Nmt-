import React, { useState } from 'react';
import { SubjectId } from '../types/nmt';
import { REFERENCE_MATERIALS } from '../data/referenceMaterials';
import { SUBJECT_METADATA } from '../utils/scoring';
import {
  X,
  Search,
  FileText,
  BookOpen,
  Calculator,
  Landmark,
  Globe,
  ArrowLeft,
  LayoutGrid,
  AlignJustify,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

interface ReferenceModalProps {
  initialSubjectId: SubjectId;
  onClose: () => void;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({
  initialSubjectId,
  onClose,
}) => {
  const [activeSubject, setActiveSubject] = useState<SubjectId>(initialSubjectId);
  const [activeSectionTitle, setActiveSectionTitle] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'textbook' | 'grid'>('textbook');

  const currentCategory = REFERENCE_MATERIALS.find((r) => r.subjectId === activeSubject);
  const currentSubjectMeta = SUBJECT_METADATA[activeSubject];

  const subjects: SubjectId[] = ['math', 'ukr', 'eng', 'history'];

  const subjectIcons: Record<SubjectId, React.ReactNode> = {
    ukr: <BookOpen className="w-4 h-4 text-blue-600" />,
    math: <Calculator className="w-4 h-4 text-emerald-600" />,
    history: <Landmark className="w-4 h-4 text-amber-600" />,
    eng: <Globe className="w-4 h-4 text-violet-600" />,
  };

  // Filter sections by selected section tab and search query
  const filteredSections =
    currentCategory?.sections
      .filter((section) => activeSectionTitle === 'ALL' || section.title === activeSectionTitle)
      .map((section) => {
        if (!searchQuery.trim()) return section;
        const query = searchQuery.toLowerCase();
        const matchingItems = section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.formulaOrValue.toLowerCase().includes(query) ||
            (item.note && item.note.toLowerCase().includes(query))
        );
        return {
          ...section,
          items: matchingItems,
        };
      })
      .filter((section) => section.items.length > 0) || [];

  const totalItemsInSubject =
    currentCategory?.sections.reduce((acc, s) => acc + s.items.length, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-white text-zinc-900 flex flex-col overflow-hidden">
      {/* FULL-SCREEN TOP NAVIGATION BAR */}
      <header className="border-b border-zinc-200 bg-white px-4 sm:px-6 py-3.5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Back button + Title */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад до тренажера</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 hidden sm:flex">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-zinc-950">
                    Теорія та Довідкові матеріали НМТ 2027
                  </h1>
                  <span className="hidden md:inline-block text-[11px] font-mono bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md">
                    Повноекранний конспект
                  </span>
                </div>
                <p className="text-xs text-zinc-500 hidden sm:block">
                  {currentCategory?.title} · {totalItemsInSubject} правил, формул і прикладів
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              title="Закрити"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Subject Tabs + Search + View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Subject Switcher */}
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((subId) => {
                const meta = SUBJECT_METADATA[subId];
                const isSelected = activeSubject === subId;
                const cat = REFERENCE_MATERIALS.find((r) => r.subjectId === subId);
                const count = cat?.sections.reduce((sum, s) => sum + s.items.length, 0) || 0;
                return (
                  <button
                    key={subId}
                    type="button"
                    onClick={() => {
                      setActiveSubject(subId);
                      setActiveSectionTitle('ALL');
                      setSearchQuery('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                        : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {subjectIcons[subId]}
                    <span>{meta.name}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук у теорії..."
                className="pl-8 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 w-full sm:w-52"
              />
            </div>

            {/* Reading mode switcher: Конспект vs Сітка */}
            <div className="hidden sm:inline-flex p-1 bg-zinc-100 border border-zinc-200 rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayout('textbook')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewLayout === 'textbook'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
                title="Режим підручника (конспект теорії)"
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span>Конспект</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewLayout === 'grid'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
                title="Компактні картки формул"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Картки</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* FULL-SCREEN BODY: SIDEBAR TABLE OF CONTENTS + MAIN THEORY CANVAS */}
      <div className="flex-1 overflow-hidden bg-zinc-50/50">
        <div className="max-w-7xl mx-auto h-full flex flex-col lg:flex-row">
          {/* LEFT SIDEBAR: Table of Contents (Зміст розділів дисципліни) */}
          <aside className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white lg:overflow-y-auto p-4 sm:p-5">
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-zinc-800" />
                  <span>Зміст теорії: {currentSubjectMeta.name}</span>
                </div>

                {/* Mobile horizontal scroll / Desktop vertical list */}
                <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                  <button
                    type="button"
                    onClick={() => setActiveSectionTitle('ALL')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shrink-0 border cursor-pointer ${
                      activeSectionTitle === 'ALL'
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                        : 'bg-zinc-50 text-zinc-800 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>Усі розділи програми</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        activeSectionTitle === 'ALL'
                          ? 'bg-zinc-800 text-zinc-200'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {totalItemsInSubject}
                    </span>
                  </button>

                  {currentCategory?.sections.map((sec, idx) => {
                    const isSelected = activeSectionTitle === sec.title;
                    return (
                      <button
                        key={sec.title}
                        type="button"
                        onClick={() => setActiveSectionTitle(sec.title)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 shrink-0 border cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div
                            className={`text-[10px] font-mono uppercase ${
                              isSelected ? 'text-zinc-300' : 'text-zinc-400'
                            }`}
                          >
                            Розділ {String(idx + 1).padStart(2, '0')}
                          </div>
                          <div className="leading-snug mt-0.5 line-clamp-2">{sec.title}</div>
                        </div>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-1 ${
                            isSelected
                              ? 'bg-zinc-800 text-zinc-200'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {sec.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exam Structure Info Card on Desktop */}
              <div className="hidden lg:block p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Довідка блоку НМТ</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Дисципліна <strong>«{currentSubjectMeta.name}»</strong> містить{' '}
                  <strong>{currentSubjectMeta.topics.length}</strong> обов’язкових тематичних
                  розділів програми УЦОЯО. Максимальний тестовий бал —{' '}
                  <strong>{currentSubjectMeta.maxOfficialPoints} б.</strong> (переводиться у шкалу
                  100–200).
                </p>
              </div>
            </div>
          </aside>

          {/* MAIN FULL-SCREEN THEORY READING AREA */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
            {/* Banner for selected discipline */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {subjectIcons[activeSubject]}
                  <span>Конспект теоретичного матеріалу · {currentSubjectMeta.name}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950">
                  {activeSectionTitle === 'ALL'
                    ? currentCategory?.title
                    : activeSectionTitle}
                </h2>
              </div>

              {activeSectionTitle !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setActiveSectionTitle('ALL')}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 transition-colors shrink-0 cursor-pointer"
                >
                  Показати всі розділи ({currentCategory?.sections.length})
                </button>
              )}
            </div>

            {/* Theory Sections */}
            {filteredSections.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center space-y-2">
                <div className="text-sm font-bold text-zinc-900">
                  За запитом «{searchQuery}» нічого не знайдено
                </div>
                <p className="text-xs text-zinc-500">
                  Спробуйте змінити пошуковий запит або перемкнути дисципліну у верхній панелі.
                </p>
              </div>
            ) : (
              filteredSections.map((sec, sIdx) => (
                <section
                  key={sec.title}
                  className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-5"
                >
                  {/* Section Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        Теоретичний блок {String(sIdx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-zinc-950 pt-1">
                        {sec.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      {sec.items.length} правил / формул
                    </span>
                  </div>

                  {/* Items inside Section: Textbook Mode vs Compact Card Grid Mode */}
                  {viewLayout === 'textbook' ? (
                    <div className="divide-y divide-zinc-200/80">
                      {sec.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="py-4 first:pt-1 last:pb-1 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-start"
                        >
                          {/* Left 4 cols: Concept / Rule Name */}
                          <div className="lg:col-span-4 flex items-start gap-2.5">
                            <span className="font-mono text-xs font-bold text-zinc-400 mt-0.5 shrink-0">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <div className="text-sm font-bold text-zinc-900 leading-snug">
                              {item.label}
                            </div>
                          </div>

                          {/* Right 8 cols: Formula / Rule Content + Note */}
                          <div className="lg:col-span-8 space-y-2">
                            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono font-bold text-zinc-950 text-sm sm:text-base leading-relaxed">
                              {item.formulaOrValue}
                            </div>
                            {item.note && (
                              <div className="text-xs text-zinc-600 leading-relaxed pl-3 border-l-2 border-amber-500">
                                <span className="font-semibold text-zinc-800">Зверніть увагу: </span>
                                {item.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {sec.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 hover:border-zinc-300 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-zinc-700 leading-snug">
                              {item.label}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="font-mono font-bold text-zinc-950 text-sm sm:text-base leading-relaxed bg-white p-3 rounded-lg border border-zinc-200/80">
                            {item.formulaOrValue}
                          </div>
                          {item.note && (
                            <div className="text-[11px] text-zinc-600 leading-snug pt-1">
                              💡 {item.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
