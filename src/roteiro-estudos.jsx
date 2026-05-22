import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

/* ── STORAGE ── */
const sk = (k) => k.replace(/[/\s'"\\]/g, "_");
const Db = {
  async get(k) {
    try {
      const { data, error } = await supabase
        .from("roteiro_storage")
        .select("value")
        .eq("key", sk(k))
        .single();

      if (error || !data) return {};
      return JSON.parse(data.value);
    } catch {
      return {};
    }
  },

  async set(k, v) {
    try {
      const { error } = await supabase.from("roteiro_storage").upsert(
        { key: sk(k), value: JSON.stringify(v) },
        { onConflict: "key" } // Atualiza se a chave já existir
      );
      if (error) console.error(error);
    } catch (e) {
      console.error(e);
    }
  },

  async getAll(ks) {
    const o = {};
    for (const k of ks) {
      o[k] = await Db.get(k);
    }
    return o;
  },
};

/* ── TOKENS ── */
const SUBJ = {
  japanese: {
    label: "Japonês",
    icon: "語",
    color: "#be123c",
    light: "#fff1f2",
    accent: "#fb7185",
    exam: "MEXT",
  },
  math: {
    label: "Matemática",
    icon: "∑",
    color: "#1d4ed8",
    light: "#eff6ff",
    accent: "#93c5fd",
    exam: "Todos",
  },
  physics: {
    label: "Física",
    icon: "⚛",
    color: "#7c3aed",
    light: "#f5f3ff",
    accent: "#c4b5fd",
    exam: "Todos",
  },
  chemistry: {
    label: "Química",
    icon: "⚗",
    color: "#065f46",
    light: "#ecfdf5",
    accent: "#6ee7b7",
    exam: "Todos",
  },
  biology: {
    label: "Biologia",
    icon: "🧬",
    color: "#0369a1",
    light: "#f0f9ff",
    accent: "#7dd3fc",
    exam: "ENEM",
  },
  portuguese: {
    label: "Português",
    icon: "✍",
    color: "#92400e",
    light: "#fffbeb",
    accent: "#fcd34d",
    exam: "ENEM/EFOMM",
  },
  english: {
    label: "Inglês",
    icon: "E",
    color: "#1e3a5f",
    light: "#f0f4ff",
    accent: "#a5b4fc",
    exam: "EFOMM/MEXT",
  },
  humanities: {
    label: "Humanas",
    icon: "🌐",
    color: "#4a1d96",
    light: "#f5f3ff",
    accent: "#ddd6fe",
    exam: "ENEM",
  },
};
const PRIO = {
  crítica: { label: "Crítica", color: "#dc2626", bg: "#fef2f2" },
  alta: { label: "Alta", color: "#d97706", bg: "#fffbeb" },
  média: { label: "Média", color: "#2563eb", bg: "#eff6ff" },
  baixa: { label: "Baixa", color: "#6b7280", bg: "#f9fafb" },
};
const CONF = {
  none: { label: "—", color: "#9ca3af", bg: "#f9fafb" },
  fraco: { label: "Fraco", color: "#dc2626", bg: "#fef2f2" },
  ok: { label: "Ok", color: "#d97706", bg: "#fffbeb" },
  dominei: { label: "Dominei", color: "#16a34a", bg: "#f0fdf4" },
};
const BTYPE = {
  self: { label: "Autoestudo", color: "#0369a1" },
  cursinho: { label: "Cursinho", color: "#6b7280" },
  simulado: { label: "Simulado", color: "#7c3aed" },
};

/* ── PHASES + EXAMS ── */
const PHASES = [
  {
    id: "efomm",
    label: "SPRINT EFOMM",
    months: ["Jun/26", "Jul/26"],
    color: "#ea580c",
    bg: "#fff7ed",
  },
  {
    id: "enem",
    label: "BASE + ENEM",
    months: ["Ago/26", "Set/26", "Out/26", "Nov/26"],
    color: "#dc2626",
    bg: "#fff1f2",
  },
  {
    id: "base",
    label: "FUNDAÇÃO MEXT",
    months: ["Dez/26", "Jan/27", "Fev/27"],
    color: "#0f766e",
    bg: "#f0fdfa",
  },
  {
    id: "prep",
    label: "PREPARAÇÃO MEXT",
    months: ["Mar/27", "Abr/27", "Mai/27"],
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    id: "sprint",
    label: "SPRINT MEXT",
    months: ["Jun/27", "Jul/27"],
    color: "#1d4ed8",
    bg: "#eff6ff",
  },
];
const EXAMS = [
  { name: "EFOMM", date: "2026-07-25", color: "#ea580c", approx: false },
  { name: "ENEM", date: "2026-11-08", color: "#dc2626", approx: false },
  { name: "MEXT", date: "2027-06-20", color: "#7c3aed", approx: true },
];
const ALL_MONTHS = PHASES.flatMap((p) => p.months);
const phaseOf = (m) => PHASES.find((p) => p.months.includes(m)) || PHASES[0];
const daysUntil = (d) => {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return Math.ceil((t - n) / 86400000);
};
const DAYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const DAY_LABELS = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};
const DAY_SHORT = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
};
const fmt = (min) => {
  if (!min && min !== 0) return "";
  const h = Math.floor(min / 60),
    m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? m + "min" : ""}` : `${m}min`;
};

/* ──────────────────────────────────────────────────
   WEEKLY SCHEDULES
   Acordar: 06:10 | Sair de casa: 06:55
   Japonês: bloco matinal 06:10–06:50 (40-60 min)
   Sábado: sem aulas de cursinho após o simulado
──────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────
   WEEKLY SCHEDULES — 4 semanas distintas por fase
   Estrutura: WS[fase][semN][dia] = [blocos]
   Acordar: 06:10 | Sair de casa: 06:55
   Japonês: bloco matinal 06:10–06:50 (40-60 min)
   Sábado: simulado pela manhã + análise à tarde
──────────────────────────────────────────────────── */
const WS = {
  /* ══════════════════════════════════════════════════
     FASE: SPRINT EFOMM  (Jun/26 e Jul/26)
     Sem 1 — diagnóstico + base trigonometria + cinemática
     Sem 2 — trigonometria avançada + dinâmica + funções org.
     Sem 3 — combinatória + energia + funções inorgânicas
     Sem 4 — revisão geral + simulados cronometrados
  ══════════════════════════════════════════════════ */
  efomm: {
    /* ─── Semana 1 ─── */
    sem1: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Diagnóstico inicial — escrever Hiragana completo de memória (sem tabela). Marcar as colunas com dificuldade. Anki: criar deck com as sílabas erradas. Meta: identificar lacunas antes de iniciar o sprint.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Estrutura dissertativa-argumentativa: Introdução com tese clara. Argumentação em 2 parágrafos com repertório sociocultural (filósofo, dado estatístico, fato histórico). Proposta de intervenção com os 5 elementos ENEM.",
        },
        {
          id: "mat4",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat 4 — Trigonometria: definição de seno, cosseno e tangente no triângulo retângulo. Relações métricas (cateto oposto, cateto adjacente, hipotenusa). Tabela de valores especiais: 30°, 45°, 60°. Resolver 10 exercícios de identificação de razões.",
        },
        {
          id: "qui1",
          subj: "chemistry",
          type: "cursinho",
          slot: "17:00",
          estMin: 100,
          what: "⚗ Qui 1 — Estrutura Atômica: prótons (Z), nêutrons (A-Z), elétrons. Modelos atômicos de Dalton, Thomson, Rutherford e Bohr. Isótopos, isóbaros e isótonos. Resolver 8 exercícios de configuração eletrônica.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Hiragana — revisar colunas Ra, Wa, N. Praticar sons combinados: きゃ、しゅ、ちょ、にゃ、ひゅ. Anki: 20 cartões de revisão. Meta: ler 5 palavras em Hiragana sem consultar tabela.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Interpretação de texto: gêneros discursivos (artigo de opinião, charge, infográfico) e tipologia textual. Coesão referencial (pronomes, sinônimos) e sequencial (conectivos). Resolver 5 questões EFOMM de interpretação.",
        },
        {
          id: "fis1",
          subj: "physics",
          type: "cursinho",
          slot: "17:30",
          estMin: 100,
          what: "⚛ Fís 1 — Cinemática Escalar: MRU — equação horária s=s₀+vt. Significado físico de cada variável. Gráficos s×t (reta) e v×t (horizontal). ⚠️ Antes de qualquer fórmula: escreva o que a grandeza representa fisicamente.",
        },
        {
          id: "fis1b",
          subj: "physics",
          type: "cursinho",
          slot: "19:10",
          estMin: 100,
          what: "⚛ Fís 1 — MRUV: equações v=v₀+at e s=s₀+v₀t+½at². Equação de Torricelli (v²=v₀²+2aΔs). Gráficos a×t, v×t e s×t do MRUV. Construir tabela comparativa MRU×MRUV com exemplos físicos.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Katakana — iniciar colunas A, Ka, Sa com Tofugu. Comparar visualmente com Hiragana correspondente. Anki: deck Katakana novos. Escrever 5 estrangeirismos em Katakana: テレビ、コーヒー、パソコン…",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui 2 — Estequiometria: conceito de mol (6,02×10²³ partículas). Massa molar: cálculo a partir da tabela periódica. Relações molares em equações balanceadas. Resolver 6 exercícios de mol e massa molar.",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat 1 — Conjuntos: operações de união (A∪B), interseção (A∩B), diferença (A-B) e complementar. Lei de Morgan. Diagramas de Venn com 2 e 3 conjuntos. Resolver 8 problemas de contagem com conjuntos.",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís 3 — Eletrização: cargas positivas e negativas, conservação e quantização (q=n·e). Condutores e isolantes. Eletrização por atrito, contato e indução. Lei de Coulomb: F=k·q₁q₂/d² — comparação com gravitação.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Katakana — colunas Ta, Na, Ha. Anki: Hiragana (revisão) + Katakana (novo). Escuta passiva: 10 min NHK for School. Meta: já conseguir identificar 30 caracteres Katakana.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Formato EFOMM: questões de leitura (reading comprehension) + gramática explícita. Passive voice: formação (to be + past participle) e uso. Conditionals 0 e 1ª. Modal verbs: can, must, should, might. Resolver 5 questões EFOMM.",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís 2 — Termometria: escalas Celsius, Fahrenheit, Kelvin — fórmulas de conversão. Dilatação térmica: linear (ΔL=L₀αΔT), superficial e volumétrica. Calorimetria: calor sensível Q=mcΔT e calor latente Q=mL.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat 2 — Álgebra Básica: produtos notáveis (quadrado da soma, diferença de quadrados, cubo da soma). Fatoração: fator comum, agrupamento, trinômio quadrado perfeito. Equação do 2º grau: discriminante Δ e fórmula de Bhaskara.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Katakana — colunas Ma, Ya, Ra, Wa, N. Ler estrangeirismos: テレビ、コーヒー、パソコン. Anki: revisão dupla Hiragana + Katakana.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Autoestudo Qui 1 — Feltre Vol.1. Teoria Quântica: números quânticos n, l, m, s. Distribuição eletrônica (regra de Aufbau, exclusão de Pauli, regra de Hund). Propriedades Periódicas: raio atômico, eletronegatividade, energia de ionização.",
        },
        {
          id: "qui2r",
          subj: "chemistry",
          type: "cursinho",
          slot: "17:00",
          estMin: 80,
          what: "⚗ Qui 2 — Estequiometria: reagente limitante e em excesso. Cálculo de rendimento (%) e pureza (%). Resolver 6 exercícios contextualizados estilo EFOMM/ENEM.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Revisão semanal — Anki: todos os kana da semana. Ler 10 palavras em Hiragana e 10 em Katakana sem consultar tabela. Escuta passiva: 10 min.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado EFOMM diagnóstico (prova completa cronometrada). Após: refazer TODAS as questões erradas SEM ver gabarito primeiro. Registrar cada erro: matéria | frente | tipo (conceito faltando / erro de cálculo / distração).",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise do simulado — sem aulas após. Mat 4 (Trigonometria): revisar definições com Iezzi. Fís 1 (Cinemática): rever conceito de cada questão errada. Qui 1 (Atomística): consolidar modelos e tabela periódica. Criar lista de prioridades.",
        },
        {
          id: "rev-s",
          subj: "japanese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "🇯🇵 Japonês | Consolidação — rever flashcards com mais erros. Escrever manualmente 5× os kana com mais falhas. Listar pontos fracos para foco na semana seguinte.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês | Escrever Hiragana e Katakana completos de memória (teste pessoal). Anotar o que ainda falha. Escuta passiva: 15 min NHK for School.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 4 — Autoestudo Trigonometria: Lei dos Senos (a/sinA=b/sinB) e Lei dos Cossenos (a²=b²+c²-2bc·cosA). Resolver 8 exercícios de resolução de triângulos com essas leis. Anotar cada erro.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 1 — Queda livre e lançamento vertical: g=10 m/s². Subida: v=v₀-gt, hmax=v₀²/2g. Descida: v=gt, h=½gt². Resolver 8 exercícios de lançamento vertical com e sem velocidade inicial.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 1 — Tabela Periódica: grupos IA-VIIA + 0 e metais de transição. Propriedades periódicas: raio atômico (↑→↓, ↓→↑), eletronegatividade (↑→↑). Resolver 6 questões de propriedades periódicas.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "15:00",
          estMin: 50,
          what: "E Inglês — Resolver seção inglês de 1 prova EFOMM (cronometrado, ~40 min). Revisar erros: gramática explícita (modals, passive voice) + vocabulário técnico científico.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros por frente. Definir 1 ponto fraco prioritário por matéria para a semana seguinte.",
        },
      ],
    },

    /* ─── Semana 2 ─── */
    sem2: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Katakana — revisar todos os diacríticos (ガ、ザ、ダ、バ、パ…) e sons combinados (キャ、シュ、チョ…). Escrever 10 estrangeirismos sem consultar tabela.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Argumentação: como construir raciocínio lógico em 3 etapas (dado → raciocínio → conclusão). Praticar inserção de repertório filosófico (Aristóteles, Montesquieu, Rousseau). Escrever 1 parágrafo argumentativo completo.",
        },
        {
          id: "mat4",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat 4 — Trigonometria: círculo trigonométrico. Ângulos no 2º, 3º e 4º quadrantes. Sinal de sen, cos, tan em cada quadrante. Identidades fundamentais: sen²θ+cos²θ=1, tan=sen/cos. Resolver 10 questões de identidades.",
        },
        {
          id: "qui1",
          subj: "chemistry",
          type: "cursinho",
          slot: "17:00",
          estMin: 100,
          what: "⚗ Qui 1 — Ligação Iônica: formação (metal → cátion + não-metal → ânion), retículo cristalino, energia de rede. Ligação Covalente: elétrons compartilhados, fórmulas de Lewis. Regra do octeto e exceções. Resolver 8 exercícios.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Katakana completo — ler estrangeirismos: アイスクリーム、スポーツ、コンピューター. Anki: consolidar deck Katakana. Meta: ler Katakana sem hesitar em 90% das sílabas.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Tipos textuais aprofundados: dissertação argumentativa vs. expositiva. Modalização e marcadores discursivos. Resolver 5 questões EFOMM de interpretação com textos de divulgação científica.",
        },
        {
          id: "fis1",
          subj: "physics",
          type: "cursinho",
          slot: "17:30",
          estMin: 100,
          what: "⚛ Fís 1 — Cinemática Vetorial: vetores posição, velocidade e aceleração. Lançamento oblíquo: v₀x=v₀cosθ, v₀y=v₀sinθ. Alcance R=v₀²sin2θ/g e altura máxima H=v₀²sin²θ/2g. Resolver 6 exercícios de lançamento.",
        },
        {
          id: "fis1b",
          subj: "physics",
          type: "cursinho",
          slot: "19:10",
          estMin: 100,
          what: "⚛ Fís 1 — Dinâmica Retilínea: 1ª Lei de Newton (inércia), 2ª Lei (F=ma) e 3ª Lei (ação-reação). Diagramas de corpo livre. Força de atrito (estático e cinético). Resolver 8 exercícios de aplicação das Leis de Newton.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Consolidar Hiragana + Katakana — ler sem tabela. Iniciar vocabulário básico N5: números (1-100), dias da semana, meses. Anki: 10 palavras novas. Escuta: 10 min NHK for School.",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui 2 — Gases: Lei de Boyle (PV=constante), Lei de Charles (V/T=constante), Lei de Gay-Lussac (P/T=constante). Lei dos Gases Ideais: PV=nRT. Resolver 6 exercícios de transformações gasosas.",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat 1 — Funções de 1º Grau: f(x)=ax+b. Gráfico, raiz (zero), monotonia. Função afim: crescente (a>0) e decrescente (a<0). Resolver 8 exercícios de análise de gráfico de função afim.",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís 3 — Eletrostática: campo elétrico E=F/q — definição, sentido convencional, linhas de campo. Campo elétrico uniforme entre placas paralelas. Potencial elétrico V=kq/r e diferença de potencial U=W/q. Resolver 6 exercícios.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Vocabulário N5: cores, família, objetos da sala de aula. Anki: revisão de todos os kana + 10 novas palavras. Praticar leitura de placas e sinais em japonês (imagens de fotos reais).",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Conditionals 2ª (If I were…) e 3ª (If I had been…). Relative clauses: who, which, that, whose. Vocabulário técnico: physics (force, velocity, acceleration, mass), chemistry (element, compound, bond). Resolver 5 questões EFOMM.",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís 2 — Termodinâmica: 1ª Lei ΔU=Q-W. Trabalho de um gás W=pΔV (isobárico), zero em isocórico. 2ª Lei: sentido espontâneo do calor. Rendimento de máquina térmica η=1-Tc/Tq (Carnot). Resolver 6 exercícios.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat 2 — Números Complexos: forma algébrica z=a+bi. Conjugado z̄=a-bi, módulo |z|=√(a²+b²). Operações: soma, subtração, multiplicação e divisão. Argumento θ e forma trigonométrica z=|z|(cosθ+isinθ). Resolver 8 exercícios.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Consolidação semanal — escrever frases simples em japonês com palavras aprendidas. Anki: revisar flashcards com erro. Leitura: tentar ler 1 frase simples em Hiragana.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Autoestudo Qui 1 — Geometria Molecular (VSEPR): formas lineares, angular, piramidal, tetraédrica. Forças Intermoleculares: dipolo-dipolo, London (Van der Waals), pontes de hidrogênio. Relação com propriedades físicas (ponto de ebulição). Resolver 8 exercícios.",
        },
        {
          id: "qui2r",
          subj: "chemistry",
          type: "cursinho",
          slot: "17:00",
          estMin: 80,
          what: "⚗ Qui 1 — Ácidos e Bases Inorgânicos: teoria de Arrhenius. Ácidos: classificação (mono/poliprótico, forte/fraco, oxiácido/hidrácido). Bases: classificação (mono/poliacídica, forte/fraca). Nomenclatura IUPAC. Resolver 8 exercícios.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Revisão semanal — ler 10 palavras em Katakana sem hesitar. Escuta passiva: 10 min. Anki: revisão geral dos dois decks.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado EFOMM (2ª semana) — foco nas matérias com mais erros do simulado 1. Condições reais. Após: refazer todas as questões erradas SEM gabarito primeiro.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise do simulado — comparar com semana 1 (houve progresso?). Mat 4 (trig avançada): rever identidades e círculo. Fís 1 (dinâmica): rever Leis de Newton nos erros. Qui 1 (ligações): consolidar Lewis e polaridade.",
        },
        {
          id: "rev-s",
          subj: "japanese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "🇯🇵 Japonês | Criar 10 flashcards novos com estrangeirismos lidos esta semana. Praticar Katakana escrevendo palavras do cotidiano: アイスクリーム、スポーツ、ゲーム.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês | Escrever Hiragana e Katakana completos de memória. Ler 5 palavras novas N5. Escuta passiva: 15 min.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 4 — Trigonometria avançada: identidades de adição e subtração (sen(a±b), cos(a±b)). Duplo ângulo: sen2a=2·sena·cosa, cos2a=cos²a-sen²a. Resolver 8 exercícios de prova EFOMM de trigonometria.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 1 — Dinâmica Curvilínea: força centrípeta Fc=mv²/r. MCU: período T, frequência f, ω=2π/T, v=ωR, acp=ω²R. Resolver 6 exercícios de MCU (pêndulo, loop, curva banqueada).",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 1 — Sais e Óxidos Inorgânicos: classificação de sais (neutro, ácido, básico, duplo). Óxidos: básico, ácido, anfótero, indiferente. Nomenclatura IUPAC. Resolver 8 exercícios.",
        },
        {
          id: "por-d",
          subj: "portuguese",
          type: "self",
          slot: "15:00",
          estMin: 50,
          what: "✍ Português — Resolver seção Português de 1 prova EFOMM (cronometrado). Identificar questões de interpretação vs. gramática. Anotar erros por tipo.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros. Planejar foco da semana 3: priorizar Combinatória (Mat 3) e Energia (Fís 1).",
        },
      ],
    },

    /* ─── Semana 3 ─── */
    sem3: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Vocabulário N5: verbos essenciais (comer, beber, ir, vir, fazer, ver, ouvir, falar, estudar, trabalhar). Anki: 10 verbos novos. Escrever 5 frases simples com verbo + objeto em japonês.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Proposta de intervenção detalhada: agente (quem), ação (o quê), modo (como), finalidade (para quê), efeito (por quê é importante). Praticar escrever propostas para 3 temas diferentes em 5 min cada.",
        },
        {
          id: "mat3",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat 3 — Análise Combinatória: princípio fundamental da contagem. Permutação simples P(n)=n! e com repetição P(n;r₁,r₂…). Arranjo A(n,k)=n!/(n-k)!. Resolver 10 exercícios de identificação e aplicação.",
        },
        {
          id: "qui1",
          subj: "chemistry",
          type: "cursinho",
          slot: "17:00",
          estMin: 100,
          what: "⚗ Qui 1 — Reações Inorgânicas: síntese (A+B→AB), decomposição (AB→A+B), simples troca (A+BC→AC+B), dupla troca (AB+CD→AD+CB). Balanceamento pelo método das tentativas e algébrico. Resolver 10 exercícios de balanceamento.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Introdução às partículas: は (tema), が (sujeito), を (objeto). Formar frases simples: [Sujeito]は [Objeto]を [Verbo]. Anki: revisão geral. Escuta: tentar identificar palavras no áudio NHK.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Gramática para EFOMM: concordância verbal (sujeito composto, sujeito posposto). Concordância nominal (adjetivo + substantivo). Crase: regras básicas e exceções. Resolver 8 questões gramaticais estilo EFOMM.",
        },
        {
          id: "fis1",
          subj: "physics",
          type: "cursinho",
          slot: "17:30",
          estMin: 100,
          what: "⚛ Fís 1 — Estática: equilíbrio de forças (ΣF=0). Torque (momento de força): M=F×d. Equilíbrio de torques: ΣM=0. Centro de massa. Resolver 8 exercícios de equilíbrio estático (alavancas, vigas).",
        },
        {
          id: "fis1b",
          subj: "physics",
          type: "cursinho",
          slot: "19:10",
          estMin: 100,
          what: "⚛ Fís 1 — Hidrostática: pressão P=F/A e P=ρgh. Princípio de Arquimedes: E=ρ_fluido×V_submerso×g. Vasos comunicantes. Resolver 8 exercícios de pressão e empuxo.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Partículas: に (direção/tempo/localização) e で (local de ação/meio). Diferenciar com exemplos: 学校に行く (ir à escola) vs. 学校で勉強する (estudar na escola). Anki: 10 novas palavras. NHK: ler 1 manchete.",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui 2 — Misturas e Soluções: concentração comum C=m/V e molar M=n/V. Diluição: C₁V₁=C₂V₂. Mistura de soluções: calcular concentração resultante. Resolver 8 exercícios de soluções estilo ENEM/EFOMM.",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat 1 — Funções de 2º Grau: f(x)=ax²+bx+c. Parábola: vértice (xv=-b/2a, yv=-Δ/4a), raízes, concavidade. Funções quadráticas no contexto de problemas de otimização. Resolver 8 exercícios.",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís 3 — Eletrodinâmica: corrente elétrica i=Δq/Δt. Resistência elétrica e resistividade. Lei de Ohm: U=Ri. Efeito Joule: Q=Ri²t. Potência elétrica P=Ui=Ri²=U²/R. Resolver 8 exercícios de circuitos simples.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Vocabulário N5: adjetivos de estado (quente, frio, grande, pequeno, novo, velho, bom, ruim). Anki: revisão. Escuta: identificar adjetivos no áudio NHK. Meta: acumular 100 palavras N5.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Reading comprehension: textos de ciência e tecnologia. Inferência e referência textual. Vocabulário científico: experiment, hypothesis, conclusion, data, observation. Resolver 1 seção completa de inglês EFOMM cronometrada.",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís 2 — Ondas: classificação (mecânica/eletromagnética, transversal/longitudinal). Comprimento de onda λ, frequência f, velocidade v=λ·f. Acústica: frequência (grave/agudo), amplitude (intensidade), timbre. Resolver 6 exercícios.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat 2 — Matrizes: definição, tipos (quadrada, identidade, nula, transposta). Operações: soma, subtração e multiplicação. Determinante 2×2 (regra de Sarrus simples). Resolver 10 exercícios de operações com matrizes.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Consolidação semanal — rever gramática e partículas. Escrever 5 frases usando は, が, を, に, で. Anki: revisão completa. Leitura: 1 manchete NHK em Hiragana.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Autoestudo Qui 1+2 — Qui 1: Sólidos — iônico, covalente (molecular, atômico), metálico e suas propriedades. Qui 2: Oxidação e Redução — número de oxidação (NOX), regras de atribuição, balanceamento redox (método das semi-reações).",
        },
        {
          id: "qui2r",
          subj: "chemistry",
          type: "cursinho",
          slot: "17:00",
          estMin: 80,
          what: "⚗ Qui 2 — Precipitação e Neutralização: reações ácido-base (HA+BOH→sal+H₂O). Cálculo estequiométrico em soluções. Resolver 8 exercícios contextualizados.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Revisão semanal — Anki completo. Escuta passiva: 10 min. Ler 5 frases simples em Hiragana sem auxílio.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado EFOMM (3ª semana) — resolver com foco nas frentes de Mat 3 (combinatória/probabilidade), Fís 1 (estática/hidrostática) e Qui 1 (reações). Condições reais.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise do simulado — avaliar evolução em 3 semanas. Combinatória: revisar qual tipo de contagem errou. Estática: verificar se domina torques. Qui 1 Reações: identificar balanceamento.",
        },
        {
          id: "rev-s",
          subj: "japanese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "🇯🇵 Japonês | Consolidação — escrever 10 frases misturando as partículas aprendidas. Criar flashcards para cada frase errada.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês | Revisão completa — ler 1 parágrafo curto em Hiragana + Katakana. Escuta: 15 min. Anki: deck completo.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 3 — Combinação simples C(n,k)=n!/k!(n-k)!. Probabilidade: espaço amostral, eventos, P(A)=nA/n. Probabilidade condicional P(A|B)=P(A∩B)/P(B). Resolver 10 exercícios EFOMM de combinatória e probabilidade.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 1 — Energia: trabalho W=F·d·cosθ. Energia cinética Ec=½mv². Energia potencial gravitacional Ep=mgh. Teorema trabalho-energia: W=ΔEc. Conservação de energia mecânica. Resolver 8 exercícios.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 2 — Estequiometria revisão: resolver 8 exercícios de provas EFOMM envolvendo mol, massa molar, reagente limitante e rendimento. Anotar tipo de cada erro.",
        },
        {
          id: "por-d",
          subj: "portuguese",
          type: "self",
          slot: "15:00",
          estMin: 50,
          what: "✍ Português — Escrever 1 redação completa (60 min, cronometrado) sobre tema de ciência e tecnologia. Autocorrigir pelos critérios ENEM/EFOMM.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros. Planejar semana 4: revisão geral + simulados cronometrados finais antes da prova.",
        },
      ],
    },

    /* ─── Semana 4 ─── */
    sem4: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Vocabulário N5: completar 200 palavras acumuladas. Revisão intensiva Anki. Escuta: 10 min NHK for School, anotar palavras reconhecidas.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Revisão de redações anteriores: identificar padrão de erros (introdução fraca? proposta incompleta? coesão ruim?). Reescrever os parágrafos com mais problemas. 1 treino rápido de proposta de intervenção (15 min).",
        },
        {
          id: "mat-rev",
          subj: "math",
          type: "self",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat — Revisão geral EFOMM: Mat 4 (Trigonometria: lei dos senos/cossenos, identidades). Mat 5 (Geometria Plana: áreas). Mat 1 (Funções: f. quadrática e modular). Mat 3 (Probabilidade). Resolver 12 exercícios mistos estilo EFOMM.",
        },
        {
          id: "qui-rev",
          subj: "chemistry",
          type: "self",
          slot: "17:00",
          estMin: 100,
          what: "⚗ Qui — Revisão geral EFOMM: Qui 1 (estrutura atômica, ligações, funções inorgânicas). Qui 2 (estequiometria, reagente limitante, rendimento). Resolver 10 exercícios de provas EFOMM anteriores.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Katakana final — ler estrangeirismos de vocabulário científico: エネルギー、アルゴリズム、フィジックス. Anki: revisão completa dos dois decks. Meta: identificar 100% do Katakana.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Resolver 1 seção completa de Português de prova EFOMM (cronometrada, ~40 min). Analisar cada erro: foi interpretação? gramática? vocabulário? Criar lista de pontos fracos restantes.",
        },
        {
          id: "fis-rev",
          subj: "physics",
          type: "self",
          slot: "17:30",
          estMin: 100,
          what: "⚛ Fís — Revisão geral EFOMM: Fís 1 (cinemática completa: MRU, MRUV, lançamentos, MCU, dinâmica, estática, hidrostática, energia). Resolver 12 exercícios mistos de provas EFOMM.",
        },
        {
          id: "fis1b",
          subj: "physics",
          type: "cursinho",
          slot: "19:10",
          estMin: 100,
          what: "⚛ Fís 2 — Termometria revisão: escalas, dilatação, calorimetria. Fís 4 — Óptica revisão: reflexão e espelhos planos. Resolver 6 questões de cada frente estilo EFOMM.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Revisão final pré-EFOMM — Anki completo. Escuta passiva: 15 min. Ler 5 frases mistas Hiragana + Katakana. Consolidar: pode reconhecer os dois silabários com fluência.",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui — Revisão Qui 1 + 2: resolver 10 questões de provas EFOMM anteriores (2021-2023) de Química. Identificar quais frentes ainda têm dúvidas e focar no estudo noturno.",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat — Revisão Mat 1 + 2: Sistemas lineares: escalonamento e regra de Cramer. Matrizes: determinante 3×3 (Sarrus). Resolver 8 questões de prova EFOMM de álgebra.",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís 3 — Revisão rápida Eletrostática para EFOMM: Lei de Coulomb, campo elétrico e potencial. Resolver 6 questões EFOMM de Fís 3. ⚠️ Foco total: nada de tópico novo esta semana.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Manutenção pré-prova — Anki: revisão rápida (20 min). Escuta passiva: 10 min. Não intensificar — EFOMM não avalia japonês.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Resolver seção inglês de 2 provas EFOMM (cronometradas). Revisar erros específicos de estrutura gramatical. Vocabulário técnico final: scientific method, periodic table, chemical reaction, velocity, force.",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís — Revisão final integrada: resolver 10 questões mistas de Fís 1-3 de provas EFOMM. Gestão de tempo: 3 min por questão de múltipla escolha. ⚠️ Nenhum tópico novo a partir de agora.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat — Revisão final integrada: resolver 10 questões mistas de Mat 1-5 de provas EFOMM. Identificar os 2-3 tipos de questão que mais caem. Nenhum tópico novo.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Manutenção — Anki rápido: 15 min. Escuta: 10 min. Descansar a mente para o simulado de amanhã.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Revisão final Qui — Criar folha de referência pessoal de Química (1 página): fórmulas de estequiometria, nomenclatura de ácidos e bases, tipos de reação. Reler e memorizar antes de dormir.",
        },
        {
          id: "eng-r",
          subj: "english",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "E Inglês — Revisão final: reler anotações de gramática (passive voice, conditionals, modals). Vocabulário científico: criar 10 flashcards dos termos mais difíceis. Descansar cedo.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês | Revisão leve pré-simulado — Anki: 15 min. Escuta: 10 min. Ler folha de kana.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 SIMULADO EFOMM FINAL — condições absolutamente reais: sem consulta, cronômetro, silêncio. Simular o ambiente da prova. Após: refazer CADA questão errada sem gabarito. Identificar padrão final de erros.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise final do simulado — comparar com semana 1: quanto evoluiu? Criar lista de pontos ainda em aberto. Fazer peace with it: o que não foi aprendido nas 4 semanas não será resolvido nos últimos dias. Focar no consolidado.",
        },
        {
          id: "rev-s",
          subj: "japanese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "🇯🇵 Japonês | Consolidação final — escrever Hiragana e Katakana de memória. Anotar quaisquer kana ainda incertos. Descanso.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 40,
          what: "🇯🇵 Japonês | Revisão leve — Anki: 20 min. Escuta passiva: 10 min. ⚠️ Não intensificar — prova em poucos dias.",
        },
        {
          id: "rev-final",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 90,
          what: "📋 Revisão final integrada — reler folhas de referência pessoais de Mat, Fís e Qui (1 página por matéria). Fazer 5 questões fáceis de cada matéria para ganhar confiança. ⚠️ Nada de tópico novo.",
        },
        {
          id: "por-d",
          subj: "portuguese",
          type: "self",
          slot: "11:30",
          estMin: 50,
          what: "✍ Português — Reler 1 redação anterior bem-feita. Revisar mentalmente a estrutura. Descansar.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "13:00",
          estMin: 40,
          what: "E Inglês — Reler anotações de gramática (10 min). Ler 1 texto científico curto em inglês (10 min). Descansar.",
        },
        {
          id: "descanso",
          subj: "math",
          type: "self",
          slot: "14:00",
          estMin: 40,
          what: "🌟 Descanso estratégico — comer bem, dormir cedo. Revisar logística da prova: local, horário, documentos, material permitido. A preparação está feita.",
        },
      ],
    },
  },

  /* ══════════════════════════════════════════════════
     FASE: BASE + ENEM  (Ago/26 a Nov/26)
     Sem 1 — diagnóstico ENEM + base das novas frentes
     Sem 2 — aprofundamento + primeiras provas ENEM
     Sem 3 — integração entre matérias + redação
     Sem 4 — revisão + simulado completo
  ══════════════════════════════════════════════════ */
  enem: {
    /* ─── Semana 1 ─── */
    sem1: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Genki I: partículas は (tema) vs が (sujeito enfático). を (objeto direto). Escrever 5 frases simples: [Nome]は [Objeto]を [Verbo]. Anki N5: 10 novas palavras + revisão.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Repertório sociocultural: filósofos (Rousseau, Kant, Foucault), dados estatísticos e fatos históricos. Como inserir sem fugir da tese. Proposta de intervenção com os 5 elementos ENEM. Praticar 1 proposta.",
        },
        {
          id: "mat4",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat 5 — Geometria Plana (início): conceitos básicos (ângulos, tipos de triângulos). Congruência de triângulos (LLL, LAL, ALA, LAAo). Semelhança: razão de semelhança e Teorema de Tales. Resolver 8 exercícios.",
        },
        {
          id: "qui4",
          subj: "chemistry",
          type: "cursinho",
          slot: "16:10",
          estMin: 100,
          what: "⚗ Qui 4 — Introdução à Química Orgânica: carbono tetravalente e suas propriedades. Cadeias carbônicas: abertas (normais, ramificadas) e fechadas (cíclicas, aromáticas). Saturadas e insaturadas. Classificar 10 cadeias.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Verbos do grupo 1 (u-verbs) e grupo 2 (ru-verbs) — forma て. Forma ている: ação em progresso vs. estado resultante. Anki N5: revisão espaçada. Escuta: NHK for School, 10 min.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Literatura: Romantismo brasileiro 1ª geração (indianismo: Gonçalves Dias — 'Canção do Exílio'). 2ª geração (ultrarromantismo: Álvares de Azevedo). Figuras de linguagem: metáfora, metonímia, hipérbole. Resolver 5 questões ENEM.",
        },
        {
          id: "fis1",
          subj: "physics",
          type: "cursinho",
          slot: "17:30",
          estMin: 200,
          what: "⚛ Fís 2 — Termologia: Termometria (escalas Celsius, Fahrenheit, Kelvin). Dilatação linear ΔL=L₀αΔT e volumétrica ΔV=V₀γΔT. Calorimetria: calor sensível Q=mcΔT e latente Q=mL. Resolver 8 exercícios contextualizados ENEM.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Forma negativa ない/ません, passado (た/ました), negativo-passado (なかった). Escrever 3 frases conjugando um verbo em todas as 4 formas. NHK Web Easy: ler 1 manchete com dicionário.",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui 2 — Soluções: concentração em g/L e molaridade M=n/V. Diluição C₁V₁=C₂V₂. Mistura de soluções com mesmo soluto. Resolver 6 exercícios de soluções contextualizados (rótulos de produto, farmácia).",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat 1 — Funções: conceito (domínio, contradomínio, imagem). Função composta f∘g(x). Função inversa: condição e cálculo. Resolver 8 exercícios de análise de funções estilo ENEM.",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís 3 — Eletrostática: cargas, Lei de Coulomb. Campo elétrico E=F/q. Potencial elétrico V=kq/r. Capacitores: capacitância C=Q/V, energia E=CV²/2. Resolver 6 questões ENEM de Eletrostática.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Anki N5: kanji introdutórios (日,月,火,水,木,金,土,人,口,山). Leitura, escrita e significado. Escuta passiva: NHK for School 10 min.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Reading comprehension: textos de divulgação científica. Relative clauses (who/which/that/whose). Reported speech. Vocabulário científico. Resolver 5 questões EFOMM/ENEM de inglês.",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís 2 — Termodinâmica: 1ª Lei ΔU=Q-W. 2ª Lei e rendimento de máquina térmica η=1-Tc/Tq. Entropia: aumento em processos irreversíveis (conceitual). Resolver 6 questões ENEM de termodinâmica contextualizada.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat 2 — Álgebra Básica: produtos notáveis e fatoração. Equação do 2º grau: Bhaskara e relações de Girard (soma e produto das raízes). Resolver 8 questões ENEM de álgebra.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Consolidação semanal: rever toda a gramática N5 aprendida. Escrever 3 frases usando os padrões novos. Anki: revisar flashcards com erro da semana.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Autoestudo Qui 1+2 — Qui 1: propriedades periódicas aprofundadas (raio atômico, eletronegatividade, energia de ionização). Qui 2: Reações químicas — tipos e balanceamento. Resolver 8 questões ENEM estilo contextualizado.",
        },
        {
          id: "bio",
          subj: "biology",
          type: "self",
          slot: "17:00",
          estMin: 50,
          what: "🧬 Biologia — Citologia: estrutura da célula (membrana, citoplasma, núcleo). Organelas: mitocôndria (respiração), cloroplasto (fotossíntese), ribossomo (síntese proteica), retículo. Resolver 5 questões ENEM de citologia.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Anki rápido: revisão da semana. Escuta passiva NHK for School: 10 min.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado ENEM diagnóstico (prova completa). Condições reais. Anotar por matéria e frente: Mat I-V, Fís I-IV, Qui I-IV, Bio, Port, Humanas. Identificar as 3 frentes com mais erros em cada área.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise do simulado — Mat 5 (Geometria Plana) + Mat 1 (Funções): revisar com Iezzi. Fís 2 (Termologia) + Fís 3 (Eletrostática): rever com Guisolli. Qui 2 (Soluções): refazer questões de concentração.",
        },
        {
          id: "red-s",
          subj: "portuguese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "✍ Redação ENEM — 1 tema (banco de temas dos últimos 5 anos). Escrever em 60 min com cronômetro. Auto-corrigir pelos 5 critérios: norma culta, tema/gênero, argumentação, coesão, proposta.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão completa da semana. Leitura: 1 artigo NHK Web Easy + anotar 5 palavras novas. Escrever 5 frases com a gramática da semana.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 5 — Autoestudo Geometria Plana: triângulos (Pitágoras, áreas, relações métricas). Quadriláteros (paralelogramo, trapézio — áreas). Círculo: comprimento C=2πr, área A=πr². Resolver 8 exercícios ENEM.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 4 — Óptica Geométrica I: reflexão — lei da reflexão (θi=θr). Espelhos planos: construção de imagens, translação e rotação. Câmara escura. Resolver 6 questões ENEM de óptica geométrica.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 4 — Alcanos e Cicloalcanos: nomenclatura IUPAC (cadeia principal + ramificações). Propriedades físicas: ponto de ebulição e fusão. Reações de combustão. Resolver 6 questões ENEM de nomenclatura orgânica.",
        },
        {
          id: "bio-d",
          subj: "biology",
          type: "self",
          slot: "15:00",
          estMin: 60,
          what: "🧬 Biologia — Divisão celular: mitose (fases: prófase, metáfase, anáfase, telófase) vs. meiose (redução cromossômica, crossing-over). Resolver 8 questões ENEM de divisão celular.",
        },
        {
          id: "hum",
          subj: "humanities",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "🌐 Humanas — Resolver 10 questões de HU de 1 ENEM anterior. Identificar os 3 tópicos com mais erros e anotar para revisão futura.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "17:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros por matéria e frente. Planejar ponto fraco prioritário por matéria para a semana seguinte.",
        },
      ],
    },

    /* ─── Semana 2 ─── */
    sem2: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Genki I: adjetivos i/na — forma predicativa (adj-i: きれいだ) e modificadora (adj-i+名詞). Existência: います (animados) vs. あります (inanimados). Anki N5: 10 novas palavras. Escuta: NHK.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Construção da introdução: contextualização + apresentação da tese + delimitação temática. Treinar 3 introduções diferentes para o mesmo tema em 10 min cada. Corrigir com foco na clareza da tese.",
        },
        {
          id: "mat4",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat 5 — Geometria Plana: relações métricas no triângulo (mediana, bissetriz, altura). Polígonos regulares: diagonal, perímetro e área (A=n·a·ap/2). Resolver 8 exercícios contextualizados ENEM.",
        },
        {
          id: "qui4",
          subj: "chemistry",
          type: "cursinho",
          slot: "16:10",
          estMin: 100,
          what: "⚗ Qui 4 — Alcenos e Alcinos: nomenclatura IUPAC, graus de insaturação. Reações de adição: hidrogenação, halogenação, hidratação (Markovnikov). Resolver 8 questões de nomenclatura e reações de alcenos.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Expressões de tempo: 前に (antes de), 後で (depois de), とき (quando). Escrever 5 frases com expressões temporais. NHK Web Easy: 1 artigo + anotar palavras. Meta: acumular 150 palavras N5.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Literatura: Romantismo 3ª geração (condorerismo: Castro Alves — 'Navio Negreiro'). Realismo: Machado de Assis ('Dom Casmurro' — narrador não-confiável). Resolver 5 questões ENEM de literatura.",
        },
        {
          id: "fis1",
          subj: "physics",
          type: "cursinho",
          slot: "17:30",
          estMin: 200,
          what: "⚛ Fís 3 — Eletrodinâmica: corrente elétrica i=Δq/Δt. Resistência e resistividade. Lei de Ohm U=Ri. Efeito Joule Q=Ri²t. Potência P=Ui. Associação de resistores: série (Req=R₁+R₂) e paralelo (1/Req=1/R₁+1/R₂). Resolver 8 questões.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Revisão de partículas e formas verbais. Introdução a kanji N5: 山、川、田、人、口、目、耳、手、足、木. Anki: deck kanji. Escuta: 10 min NHK.",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui 2 — Gases: Lei de Boyle PV=cte, Lei de Charles V/T=cte, Gay-Lussac P/T=cte. Lei dos Gases Ideais PV=nRT. Gases reais. Resolver 8 exercícios de gases contextualizados ENEM (pneu, balão, mergulho).",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat 1 — Logaritmo: definição (log_b(a)=x ↔ bˣ=a), propriedades (produto, quociente, potência, mudança de base). Equações logarítmicas básicas. Resolver 8 exercícios de logaritmo no contexto ENEM (escala Richter, dB).",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís 3 — Circuitos elétricos: associação mista de resistores. Geradores: fem ε, resistência interna r, tensão terminal V=ε-ri. Potência do gerador P=εi-ri². Resolver 8 questões ENEM de circuitos.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Kanji N5: continuar lista (山、川、田、日、月、火、水、木、金、土). Anki: 10 novas palavras N5. Praticar escrita de kanji (5× cada). Escuta: NHK 10 min.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Reading: textos jornalísticos e de ciência em inglês. Inferência e argumentação. Conjunções adversativas e concessivas: however, although, despite, in spite of, nevertheless. Resolver 5 questões ENEM de inglês.",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís 4 — Óptica Geométrica II: espelhos esféricos. Equação de Gauss: 1/f=1/p+1/p'. Ampliação: m=-p'/p. Tipos de imagem. Refração: lei de Snell-Descartes n₁senθ₁=n₂senθ₂. Resolver 8 questões.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat 1 — Função Exponencial: f(x)=aˣ. Gráfico e propriedades. Equações exponenciais: redução à mesma base e uso de logaritmo. Crescimento/decaimento exponencial no contexto ENEM. Resolver 8 questões.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Consolidação semanal: escrever 5 frases usando expressões de tempo. Anki: revisar erros. Leitura: 1 parágrafo NHK Web Easy com dicionário. Meta: completar 200 palavras N5 acumuladas.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Autoestudo Qui 2 + 4 — Qui 2: Oxidação e Redução (NOX, balanceamento redox). Qui 4: Álcoois, Éteres e Fenóis — estrutura, nomenclatura, propriedades físicas e aplicações no cotidiano. Resolver 8 questões ENEM.",
        },
        {
          id: "bio",
          subj: "biology",
          type: "self",
          slot: "17:00",
          estMin: 50,
          what: "🧬 Biologia — Genética: 1ª Lei de Mendel (monoibridismo): quadrado de Punnett, fenótipo e genótipo. Dominância completa e incompleta. Resolver 8 questões ENEM de genética.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Anki rápido: revisão da semana. Escuta passiva: 10 min.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado ENEM 2 — comparar com semana 1: as frentes com mais erros melhoraram? Condições reais. Anotar evolução por frente.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise do simulado — Mat 1 (Log/Exp) + Mat 5 (Geometria): rever com Iezzi. Fís 3 (Eletrodinâmica) + Fís 4 (Óptica): rever com Guisolli. Qui 4 (Orgânica básica): refazer questões de nomenclatura.",
        },
        {
          id: "red-s",
          subj: "portuguese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "✍ Redação ENEM — 1 nova redação (60 min cronometrado). Corrigir critério por critério. Comparar com a redação da semana 1 e identificar evolução.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão completa: 1 artigo NHK Web Easy + 5 novas palavras. Escrever 5 frases usando os padrões da semana. Anki: deck completo.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 5 — Círculos: posição relativa de ponto/reta/circunferência. Relações métricas do círculo (corda, secante, tangente). Áreas de figuras compostas. Resolver 8 exercícios ENEM de geometria circular.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 4 — Lentes: convergente (f>0) e divergente (f<0). Equação de Gauss para lentes: 1/f=1/p+1/p'. Vergência (dioptrias D=1/f). Olho humano: miopia, hipermetropia. Resolver 6 questões ENEM.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 4 — Aldeídos e Cetonas: grupo carbonila. Nomenclatura IUPAC. Reação de oxidação do aldeído. Ácidos Carboxílicos: ácido acético, fórmico. Resolver 6 questões ENEM de funções oxigenadas.",
        },
        {
          id: "bio-d",
          subj: "biology",
          type: "self",
          slot: "15:00",
          estMin: 60,
          what: "🧬 Biologia — Ecologia: biomas brasileiros (Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa, Pantanal). Cadeias e teias alimentares. Ciclos biogeoquímicos (carbono, nitrogênio). Resolver 8 questões ENEM.",
        },
        {
          id: "hum",
          subj: "humanities",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "🌐 Humanas — Era Vargas (1930-1945): Estado Novo, trabalhismo. Ditadura Militar brasileira: AI-5, repressão política, 'milagre econômico'. Resolver 10 questões ENEM de História do Brasil.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "17:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros. Priorizar para semana 3: Geometria Espacial e Estatística em Mat, Magnetismo em Fís.",
        },
      ],
    },

    /* ─── Semana 3 ─── */
    sem3: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Genki I: completar 200 palavras N5. Kanji N5: revisar os 20 kanji anteriores (escrita sem consulta). Anki: deck N5 completo. NHK Web Easy: 1 artigo + anotar 5 palavras novas.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Coesão e coerência: conectivos de causa (pois, porque), consequência (logo, portanto), concessão (embora, apesar de), adição (além disso, ademais). Revisar uma redação antiga reescrevendo os conectivos de forma mais sofisticada.",
        },
        {
          id: "mat4",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat 5 — Geometria Espacial: prismas (volume V=Abase×h, área total). Pirâmides (V=⅓Abase×h). Tronco de pirâmide. Resolver 8 exercícios contextualizados ENEM de volumes.",
        },
        {
          id: "qui4",
          subj: "chemistry",
          type: "cursinho",
          slot: "16:10",
          estMin: 100,
          what: "⚗ Qui 4 — Aminas e Amidas: estrutura, classificação (1ª, 2ª, 3ª). Basicidade das aminas. Ácidos Carboxílicos e Ésteres: esterificação e saponificação. Resolver 8 questões ENEM de orgânica.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Revisão de gramática N5 completa: partículas, formas verbais, adjetivos, existência. Escrever 1 parágrafo curto em japonês descrevendo sua rotina. NHK Web Easy: 1 artigo.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Literatura: Naturalismo (Aluísio Azevedo — 'O Cortiço') e Parnasianismo (Olavo Bilac). Vanguardas europeias: cubismo, futurismo, expressionismo — influência no Modernismo. Resolver 5 questões ENEM.",
        },
        {
          id: "fis1",
          subj: "physics",
          type: "cursinho",
          slot: "17:30",
          estMin: 200,
          what: "⚛ Fís 3 — Eletromagnetismo I: campo magnético (grandeza vetorial, unidade Tesla). Força magnética sobre fio F=BIL e sobre partícula F=qvB (Lorentz). Regra da mão direita. Resolver 6 questões ENEM de magnetismo.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Introdução a N4: ている aprofundado (estado resultante). たら condicional. Anki N4: iniciar com as 10 primeiras palavras. Escuta: NHK for School ou JapanesePod101 N5/N4.",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui 2 — Leis de Velocidade: taxa de reação, lei da velocidade (r=k[A]ᵐ[B]ⁿ). Fatores que afetam velocidade: temperatura, concentração, catalisador, superfície. Resolver 6 questões ENEM de cinética contextualizada.",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat 3 — Progressões Aritméticas: termo geral an=a₁+(n-1)r, soma Sn=n(a₁+an)/2. Progressões Geométricas: an=a₁·qⁿ⁻¹, soma Sn=a₁(qⁿ-1)/(q-1). Resolver 8 questões ENEM de PA e PG.",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís 3 — Eletromagnetismo II: indução eletromagnética. Lei de Faraday: ε=-ΔΦ/Δt. Lei de Lenz: corrente induzida opõe a variação do fluxo. Transformadores: V₁/V₂=N₁/N₂. Resolver 6 questões ENEM.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — N4: formas condicionais ば e なら. Voz passiva japonesa (れる/られる). Anki N4: 10 novas palavras. Escuta: JapanesePod101 N4, 10 min.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Reading: textos argumentativos e editoriais. Vocabulário: argumentação (furthermore, on the other hand, in conclusion). Estruturas de inversão: Not only…but also, Hardly…when. Resolver 5 questões ENEM de inglês.",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís 2 — Ondas e Acústica: classificação de ondas, λ=v/f. Acústica: frequência (grave/agudo), amplitude (intensidade), timbre. Efeito Doppler: f'=f(v±vobs)/(v∓vfonte). Resolver 6 questões ENEM.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat 3 — Estatística: média, mediana, moda. Desvio padrão e variância. Gráficos: barras, setores, histograma, box-plot. Resolver 10 questões ENEM de estatística com análise de gráfico.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Consolidação semanal: escrever 5 frases usando gramática N4 aprendida. Anki: revisão de erro. NHK Web Easy: 1 artigo sem dicionário (tentar compreender pelo contexto).",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Autoestudo Qui 3 — Equilíbrio Químico: expressão de Kc e Kp. Grau de dissociação. Princípio de Le Chatelier: efeito de temperatura, pressão e concentração no equilíbrio. Resolver 8 questões ENEM de equilíbrio.",
        },
        {
          id: "bio",
          subj: "biology",
          type: "self",
          slot: "17:00",
          estMin: 50,
          what: "🧬 Biologia — Evolução: Darwin e seleção natural. Neodarwinismo: mutação, seleção e deriva genética. Especiação (alopátrica, simpátrica). Evidências: fósseis, homologia. Resolver 8 questões ENEM de evolução.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Anki rápido: revisão da semana. Escuta: 10 min. Leitura: 1 artigo NHK Web Easy.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado ENEM 3 — foco na gestão de tempo: 2 min por questão de ciências, 3 min de matemática. Condições absolutamente reais. Anotar hora de início e fim de cada área.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise do simulado — Mat 3 (Estatística/Sequências): rever conceitos. Fís 3 (Eletromagnetismo): verificar domínio de Faraday/Lenz. Qui 3 (Equilíbrio): rever Le Chatelier. Bio: identificar tópico com mais erro.",
        },
        {
          id: "red-s",
          subj: "portuguese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "✍ Redação ENEM — tema de ciência, tecnologia e inovação. 60 min cronometrado. Corrigir com atenção especial para o critério IV (coesão e coerência textual).",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão completa: 1 artigo NHK Web Easy. Anki: deck N5 + primeiras palavras N4. Escrever 5 frases misturando N5 e N4.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 5 — Geometria Espacial: cilindros (V=πr²h, Alateral=2πrh), cones (V=⅓πr²h, Al=πrl), esferas (V=4πr³/3, A=4πr²). Combinação de sólidos. Resolver 10 questões ENEM de geometria espacial.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 2 — MHS: equação x=A·cos(ωt+φ). Velocidade v=-Aω·sen(ωt+φ). Energia: cinética, potencial elástica e total (conservação). Aplicações: pêndulo e mola. Resolver 6 questões.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 4 — Isomeria: plana (cadeia, posição, função, tautomeria). Espacial: cis/trans (geométrica) e optical (carbono quiral — conceitual). Resolver 8 questões ENEM de isomeria.",
        },
        {
          id: "bio-d",
          subj: "biology",
          type: "self",
          slot: "15:00",
          estMin: 60,
          what: "🧬 Biologia — Fisiologia humana: sistema circulatório (coração, circulação pulmonar/sistêmica). Sistema respiratório (hematose). Sistema nervoso (neurônio, sinapse, SNC e SNP). Resolver 8 questões ENEM.",
        },
        {
          id: "hum",
          subj: "humanities",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "🌐 Humanas — Filosofia: iluminismo (Locke, Rousseau, Montesquieu). Sociologia: estratificação social, mobilidade, cultura de massa. Resolver 10 questões ENEM de Filosofia e Sociologia.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "17:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros. Planejar semana 4: revisão geral + simulado com análise aprofundada.",
        },
      ],
    },

    /* ─── Semana 4 ─── */
    sem4: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Revisão N5 completa: gramática + vocabulário (200 palavras) + kanji (20 kanji). Anki: deck completo. Leitura: 1 artigo NHK Web Easy sem dicionário. Medir o progresso.",
        },
        {
          id: "red",
          subj: "portuguese",
          type: "cursinho",
          slot: "13:40",
          estMin: 100,
          what: "✍ Redação — Revisão de redações anteriores: identificar padrão de erros recorrentes. Escrever o parágrafo de conclusão de 3 redações diferentes em 5 min cada. Foco em proposta de intervenção completa.",
        },
        {
          id: "mat-rev",
          subj: "math",
          type: "self",
          slot: "15:20",
          estMin: 160,
          what: "∑ Mat — Revisão integrada: Mat 3 (Combinatória + Probabilidade + Estatística). Mat 5 (Geometria completa: plana + espacial). Resolver 15 questões mistas de provas ENEM dos últimos 3 anos.",
        },
        {
          id: "qui-rev",
          subj: "chemistry",
          type: "self",
          slot: "17:00",
          estMin: 100,
          what: "⚗ Qui — Revisão integrada: Qui 1 (funções inorgânicas + ligações). Qui 2 (soluções + redox). Qui 4 (orgânica básica: hidrocarbonetos + funções oxigenadas). Resolver 12 questões ENEM de Química.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — N4: consolidar ている, たら, ば, なら, voz passiva. Anki N4: revisão das palavras aprendidas. Escuta: JapanesePod101 N4, 10 min. Meta: 50 palavras N4 acumuladas.",
        },
        {
          id: "por1",
          subj: "portuguese",
          type: "cursinho",
          slot: "14:30",
          estMin: 100,
          what: "✍ Português — Modernismo: Semana de 22 e 1ª fase (Mário de Andrade, Oswald de Andrade). 2ª fase: João Cabral de Melo Neto. Gramática: crase (regras + exceções), pontuação (vírgula, ponto-e-vírgula). Resolver 8 questões ENEM.",
        },
        {
          id: "fis-rev",
          subj: "physics",
          type: "self",
          slot: "17:30",
          estMin: 200,
          what: "⚛ Fís — Revisão integrada: Fís 2 (Termologia + Termodinâmica + Ondas). Fís 3 (Eletrostática + Eletrodinâmica + Eletromagnetismo). Fís 4 (Óptica + Lentes). Resolver 15 questões ENEM.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Consolidação geral: escrever 10 frases misturando N5 e N4. Revisão Anki completa. NHK Web Easy: 1 artigo. Analisar progresso: quantas palavras N5 domino agora?",
        },
        {
          id: "qui2",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 50,
          what: "⚗ Qui — Revisão integrada Qui 3: Equilíbrio químico (Kc, Le Chatelier). Ácido-base (pH, Ka). Resolver 8 questões ENEM de equilíbrio e ácido-base.",
        },
        {
          id: "mat1",
          subj: "math",
          type: "cursinho",
          slot: "15:20",
          estMin: 100,
          what: "∑ Mat — Revisão Mat 1+2: Funções (afim, quadrática, modular, log, exp). Álgebra (produtos notáveis, fatoração). Matrizes e Determinantes. Sistemas lineares. Resolver 10 questões ENEM.",
        },
        {
          id: "fis3",
          subj: "physics",
          type: "cursinho",
          slot: "18:20",
          estMin: 150,
          what: "⚛ Fís — Revisão Mat 4 Trigonometria para Física: usar seno e cosseno em decomposição de forças. Resolver 6 questões ENEM de Física que exigem trigonometria (plano inclinado, lançamento).",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Manutenção pré-prova: Anki rápido 20 min. Escuta: 10 min. Escrever 3 frases. Não intensificar.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Revisão final: resolver 1 seção de inglês de prova ENEM cronometrada. Revisar erros de gramática e vocabulário. Leitura de texto científico em inglês (abstract de artigo).",
        },
        {
          id: "fis2",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 150,
          what: "⚛ Fís — Revisão final: Fís 1 (Cinemática + Dinâmica + Energia). Quantidade de Movimento: impulso I=FΔt, conservação do momento. Colisões: elástica e inelástica. Resolver 8 questões ENEM.",
        },
        {
          id: "mat2",
          subj: "math",
          type: "cursinho",
          slot: "17:30",
          estMin: 150,
          what: "∑ Mat — Revisão final: resolver 10 questões mistas de prova ENEM completa de Matemática. Gestão de tempo: 3 min/questão. Anotar quais tipos ainda causam dificuldade.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Manutenção: Anki 20 min. Escuta: 10 min NHK. Não intensificar — foco na semana está em Exatas e Redação.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Qui — Revisão final: criar folha de referência (1 página) com: tabela periódica resumida, fórmulas de estequiometria, nomenclatura de funções orgânicas, equilíbrio químico. Reler antes de dormir.",
        },
        {
          id: "bio",
          subj: "biology",
          type: "self",
          slot: "17:00",
          estMin: 50,
          what: "🧬 Biologia — Revisão final: Genética molecular (DNA, RNA, síntese proteica, biotecnologia). Imunologia: sistema imune inato/adaptativo, vacinas. Resolver 8 questões ENEM. Criar mapa mental de Bio.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Anki: revisão rápida (15 min). Escuta passiva: 10 min. Ler folha de kana e 5 palavras N5.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado ENEM final — todas as áreas em condições absolutamente reais. Marcar hora de início de cada área. Após: refazer CADA questão errada sem gabarito. Esse é o barómetro de onde você está.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise final do simulado ENEM — comparar com semana 1: evolução por matéria. Criar lista definitiva dos 3 pontos mais fracos por área. Essas são as prioridades dos últimos dias antes da prova.",
        },
        {
          id: "red-s",
          subj: "portuguese",
          type: "self",
          slot: "16:00",
          estMin: 60,
          what: "✍ Redação final pré-ENEM — 1 redação completa em 60 min. Revisar pelos 5 critérios. Identificar o que melhorou e o que ainda está fraco. Guardar para releitura na véspera.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão semanal: 1 artigo NHK Web Easy. Anki completo. Escrever 5 frases. Consolidar: quanto do N5 já está dominado?",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat — Folha de referência pessoal: 1 página com fórmulas-chave de Mat 1-5. Reler lentamente e visualizar onde cada fórmula é aplicada. Resolver 5 questões das frentes mais fracas.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís — Folha de referência pessoal: Fís 1-4. Reler e memorizar constantes físicas essenciais (g, c, h). Resolver 5 questões das frentes mais fracas.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui — Folha de referência pessoal: Qui 1-4. Resolver 5 questões das frentes mais fracas. Ler folha de referência antes de dormir.",
        },
        {
          id: "hum",
          subj: "humanities",
          type: "self",
          slot: "15:00",
          estMin: 60,
          what: "🌐 Humanas — Revisão final: Geopolítica (globalização, blocos econômicos). Filosofia (iluminismo, existencialismo). Sociologia (Durkheim, Weber, Marx). Resolver 10 questões ENEM de Humanas.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "📋 Planejamento para a reta final — descanso 2 dias antes de cada dia de prova. Organizar documentos, material, horário de chegada. A preparação está feita.",
        },
      ],
    },
  },

  /* ══════════════════════════════════════════════════
     FASE: FUNDAÇÃO MEXT  (Dez/26 a Fev/27)
     Sem 1 — aprofundamento pós-ENEM + base MEXT
     Sem 2 — tópicos exclusivos MEXT (GA, Complexos)
     Sem 3 — Física Moderna + Qui avançada
     Sem 4 — primeiras provas MEXT + análise de estilo
  ══════════════════════════════════════════════════ */
  base: {
    /* ─── Semana 1 ─── */
    sem1: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — N4: ている (estado resultante vs. ação em curso). たら (condicional — hipótese concluída). Anki N4: 10 novas palavras + revisão do deck N5 completo.",
        },
        {
          id: "cur-m",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat 5 — Geometria Espacial: prismas (V=Abase×h, área total). Pirâmides (V=⅓Abase×h, área lateral). Troncos. Sólidos de revolução: cilindro (V=πr²h), cone (V=⅓πr²h), esfera (V=4πr³/3). Resolver 8 problemas de combinação de sólidos estilo MEXT.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — N4: forma condicional ば (Se A, então B — condição geral). Comparar ば vs. たら com exemplos. Anki N4: 10 novas palavras. Escuta: JapanesePod101 N4 10 min.",
        },
        {
          id: "cur-q",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚗ Qui 2 — Mecanismos de Reação: etapas elementares, estado de transição. Energia de Ativação (Ea): diagrama de energia, catalisadores. Leis de Velocidade: r=k[A]ᵐ[B]ⁿ, determinação de ordem por dados experimentais. Resolver 8 questões MEXT.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — N4: voz passiva (れる/られる). Causativa básica (せる/させる). Escrever 5 frases em voz passiva. Anki: revisão completa N5+N4. Escuta: NHK Web Easy.",
        },
        {
          id: "cur-f",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚛ Fís 3 — Eletromagnetismo I: campo magnético — lei de Biot-Savart (conceitual). Fio reto, solenoide, espira. Força de Lorentz sobre fio F=BIL e sobre partícula F=qvB. Regra da mão direita/corkscrew. Resolver 8 questões MEXT.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Kanji N5: revisão completa dos 80 kanji (teste escrito sem consulta). Marcar os que ainda falham. Anki: criar deck separado para kanji com erro. Meta: dominar 100% do kanji N5.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Analisar formato das questões de inglês da MEXT: leitura científica (abstract, results, conclusion). Vocabulário técnico: hypothesis, methodology, findings, implications. Resolver 1 seção de inglês MEXT.",
        },
        {
          id: "cur-mat",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat 2 — Polinômios: operações (soma, subtração, multiplicação). Divisão de Briot-Ruffini. Teorema do Resto e fator: p(a)=0 ↔ (x-a) divide p(x). Relações de Girard: soma e produto das raízes. Resolver 8 questões MEXT de polinômios.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Consolidação semanal: escrever 5 frases usando gramática N4. Anki: revisão de erros. NHK Web Easy: 1 artigo + vocabulário. Progresso: quantas palavras N4 acumulei?",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Qui 2 — Radioatividade: tipos de emissão (α, β⁻, β⁺, γ). Meia-vida T½: N=N₀(½)^(t/T½). Reações nucleares: escrita e balanceamento. Aplicações (medicina nuclear, datação). Resolver 8 questões MEXT de radioatividade.",
        },
        {
          id: "mat-s",
          subj: "math",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "∑ Mat 2 — Autoestudo Números Complexos: forma algébrica z=a+bi, módulo |z|=√(a²+b²), conjugado, argumento θ. Operações: soma, produto, divisão. Resolver 8 exercícios.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Anki rápido: revisão da semana. Escuta: 10 min. NHK Web Easy: 1 artigo.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado estilo MEXT (primeira tentativa) — Mat + Fís + Qui. Condições reais. Diagnosticar: quais frentes você ainda não foi exposto no MEXT? Quais são o estilo das questões MEXT?",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise do primeiro simulado MEXT — comparar estilo com ENEM/EFOMM: as questões são mais teóricas, pedindo desenvolvimento e justificativa. Mat 5 (Geometria Espacial): rever conceitos. Fís 3 (Eletromagnetismo): rever força de Lorentz.",
        },
        {
          id: "qui-s2",
          subj: "chemistry",
          type: "self",
          slot: "16:30",
          estMin: 60,
          what: "⚗ Qui 2 — Reações Nucleares aprofundadas: fissão (Urânio-235), fusão (Hidrogênio-3+Deutério → Hélio-4). Energia nuclear E=mc². Resolver 6 questões MEXT de reações nucleares.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão completa: 1 artigo NHK Web Easy. Escrever 10 frases usando N5+N4. Anki: deck completo.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 4 — Geometria Analítica (início): ponto no plano, distância entre pontos d=√[(x₂-x₁)²+(y₂-y₁)²], ponto médio M=((x₁+x₂)/2,(y₁+y₂)/2). Equação da reta: formas geral e reduzida. Resolver 8 questões GA básica.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 3 — Eletromagnetismo II: indução eletromagnética. Lei de Faraday ε=-ΔΦ/Δt. Lei de Lenz. Transformadores. Geradores: fem, resistência interna, tensão terminal. Resolver 6 questões MEXT.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 3 — Equilíbrio Químico: expressão Kc e Kp, grau de dissociação α. Princípio de Le Chatelier: temperatura, pressão, concentração. Resolver 8 questões MEXT de equilíbrio.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "15:00",
          estMin: 50,
          what: "E Inglês — Leitura de 1 artigo científico em inglês (área de física ou química). Anotar 10 palavras técnicas novas. Resumir o abstract em português.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros. Planejar foco da semana 2: GA avançada e Números Complexos forma trigonométrica.",
        },
      ],
    },

    /* ─── Semana 2 ─── */
    sem2: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — N4: concessão ても (mesmo que) e のに (apesar de que). Comparar: ても vs. のに. Escrever 5 frases de concessão. Anki N4: 10 novas palavras.",
        },
        {
          id: "cur-m",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat 4 — GA: retas. Coeficiente angular m=(y₂-y₁)/(x₂-x₁). Posições relativas: paralelas (m₁=m₂), perpendiculares (m₁·m₂=-1). Distância de ponto a reta d=|ax₀+by₀+c|/√(a²+b²). Resolver 10 exercícios GA estilo MEXT.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — N4: propósito ために (para/com o objetivo de) e ように (para que/de modo que). Diferenças de uso. Escrever 5 frases de propósito. Vocabulário N4: completar 400 palavras. Anki: revisão.",
        },
        {
          id: "cur-q",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚗ Qui 3 — Ácido-Base: pH=-log[H⁺] e pOH=-log[OH⁻]. Ka (constante de acidez) e Kb (basicidade). Ácidos e bases fortes vs. fracos: grau de ionização. Resolver 8 questões MEXT de pH e equilíbrio ácido-base.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Kanji N4: iniciar lista (10 kanji/semana). Primeiro grupo: 食、飲、見、聞、話、書、読、来、帰、起. Anki: adicionar ao deck. Escuta: JapanesePod101 N4.",
        },
        {
          id: "cur-f",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚛ Fís 4 — Física Quântica: efeito fotoelétrico — equação de Einstein Ec=hf-φ. Modelo de Bohr: estados de energia En=-13,6/n² eV, espectros de emissão e absorção. Dualidade onda-partícula de de Broglie: λ=h/p. Resolver 8 questões MEXT.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Kanji N4: revisar os 10 kanji da semana (teste escrito). Anki: 10 novas palavras N4. Escuta: NHK Web Easy 2 artigos + vocabulário.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Leitura técnica: abstract de artigos de física (quantum mechanics, electromagnetic field, thermodynamics). Identificar argumentação: claim, evidence, conclusion. Resolver 1 seção de inglês MEXT cronometrada.",
        },
        {
          id: "cur-mat",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat 4 — GA: circunferência — equação geral x²+y²+Dx+Ey+F=0 e reduzida (x-a)²+(y-b)²=r². Posição relativa de ponto e reta com a circunferência. Resolver 8 exercícios MEXT de circunferência.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Consolidação semanal: escrever 5 frases usando ために e ように. Anki: revisão completa. NHK Web Easy: 1 artigo sem dicionário. Progresso: 30 kanji N4 acumulados.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Qui 3 — Células Eletroquímicas: pilha galvânica (ânodo: oxidação, cátodo: redução). Potencial de célula E°=E°cátodo-E°ânodo. Eletrólise: ígnea e aquosa. Lei de Faraday: m=MIt/nF. Resolver 8 questões MEXT de eletroquímica.",
        },
        {
          id: "mat-s",
          subj: "math",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "∑ Mat 2 — Números Complexos: forma trigonométrica z=|z|(cosθ+isinθ). Fórmula de De Moivre: zⁿ=|z|ⁿ(cosnθ+isennθ). Raízes n-ésimas de complexos. Resolver 6 exercícios MEXT.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Revisão dos erros dos simulados de japonês. Anki: revisão. Praticar 自己紹介 (apresentação pessoal) em voz alta — 3 repetições.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado MEXT 2 — com foco nas novas frentes: Mat 4 GA (circunferência), Fís 4 Física Quântica, Qui 3 Eletroquímica. Condições reais. Avaliar adaptação ao estilo MEXT.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise — GA: verificar domínio de circunferência. Física Quântica: rever efeito fotoelétrico e Bohr. Eletroquímica: verificar cálculo de E° e eletrólise. Atualizar lista de erros MEXT.",
        },
        {
          id: "qui-s2",
          subj: "chemistry",
          type: "self",
          slot: "16:30",
          estMin: 60,
          what: "⚗ Qui 3 — Potenciais de Eletrodo aprofundados: tabela de redução padrão. Espontaneidade: ΔG=-nFE°. Diagrama de Latimer. Resolver 6 questões MEXT de potencial de eletrodo.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão completa: 2 artigos NHK Web Easy. Escrever 5 frases. Anki: deck completo N5+N4. Teste: escrever 20 kanji N4 de memória.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 4 — Cônicas: elipse — definição (|PF₁|+|PF₂|=2a), equação x²/a²+y²/b²=1, focos, excentricidade e=c/a. Parábola: definição (equidistante do foco e diretriz), equação y²=4ax. Resolver 6 exercícios de cônicas.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 4 — Relatividade Restrita: postulados de Einstein. Dilatação do tempo: Δt=Δt₀/√(1-v²/c²). Contração do espaço: L=L₀√(1-v²/c²). Equivalência massa-energia E=mc². Resolver 4 questões conceituais MEXT.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 3 — Equilíbrio de Solubilidade: Kps (produto de solubilidade). Precipitação seletiva. Propriedades das Soluções: pressão osmótica π=MRT, elevação do ponto de ebulição ΔTe=Kb·m·i. Resolver 6 questões MEXT.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "15:00",
          estMin: 50,
          what: "E Inglês — Leitura técnica: artigo de Física Quântica em inglês. Anotar 10 termos novos. Praticar leitura de abstract sem dicionário — inferir significado pelo contexto.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros MEXT. Planejar semana 3: Física Moderna completa + Qui 4 avançada (mecanismos de reação orgânica).",
        },
      ],
    },

    /* ─── Semana 3 ─── */
    sem3: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — N4: honoríficos básicos (ます, ください, お〜ください). Linguagem formal vs. informal. Escrever 3 frases formais e 3 informais com o mesmo conteúdo. Anki N4: 10 novas palavras.",
        },
        {
          id: "cur-m",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat 4 — Limites: conceito informal (tendência de f(x) quando x→a). Indeterminações 0/0 e ∞/∞ — fatoração e L'Hôpital (conceitual). Continuidade. Derivadas: definição por limite f'(x)=lim[f(x+h)-f(x)]/h. Regras: potência, soma, produto, quociente. Resolver 8 questões MEXT.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Kanji N4: segundo grupo (20 kanji acumulados): 来、帰、起、行、買、売、聞、読、話、書 + 10 novos. Anki: revisão completa. Escuta: JapanesePod101 N4, 15 min.",
        },
        {
          id: "cur-q",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚗ Qui 4 — Halogeno-alcanos: nomenclatura e propriedades. Reações de Substituição Nucleofílica: SN1 (carbocátion intermediário, 2ª ou 3ª ordem) e SN2 (backside attack, 1ª ordem). Eliminação E1 e E2. Resolver 8 questões MEXT.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Consolidação kanji: teste escrito sem consulta dos 20 kanji. Vocabulário N4: completar 500 palavras. Shadowing: 10 min imitando áudio nativo. NHK Web Easy: 1 artigo.",
        },
        {
          id: "cur-f",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚛ Fís 2 — MHS aprofundado: equação diferencial (conceitual), energia total Et=½kA². Ondas: reflexão, refração, difração e interferência. Ondas estacionárias: nós e ventres, f=n·v/2L. Quantidade de Movimento: impulso, conservação, colisões. Resolver 8 questões MEXT.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Simulado parcial de japonês: vocabulário N4 (20 min) + gramática N4 (20 min). Cronometrado. Analisar erros imediatamente. Identificar padrões de erro.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Leitura técnica: artigos de Química Orgânica em inglês (reaction mechanism, nucleophilic substitution, elimination). Interpretar esquemas de reação. Resolver 1 seção de inglês MEXT.",
        },
        {
          id: "cur-mat",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat 4 — Aplicações de Derivada: máximos e mínimos (f'(x)=0 + análise do sinal). Funções crescentes/decrescentes. Concavidade (f''(x)). Problemas de otimização. Mat 3 — Números Binomiais: triângulo de Pascal, teorema binomial (a+b)ⁿ. Resolver 8 questões MEXT.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Consolidação semanal: escrever 5 frases usando gramática N4 variada. Anki: revisão de erros. NHK Web Easy: 2 artigos. Progresso: 50 kanji N4 acumulados.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Qui 4 — Aromáticos: benzeno e ressonância. Aromaticidade (regra de Hückel: 4n+2 elétrons π). Substituição eletrofílica aromática: halogenação, nitração, sulfonação. Derivados do benzeno. Resolver 8 questões MEXT.",
        },
        {
          id: "mat-s",
          subj: "math",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "∑ Mat 1 — Sistemas Lineares: escalonamento (método de Gauss). Regra de Cramer: xi=Di/D. Discussão: sistema possível e determinado, possível e indeterminado, impossível. Resolver 6 questões MEXT de sistemas.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Revisão dos erros do simulado de ontem. Anki: criar cards para cada gramática errada. 自己紹介 em voz alta — 3 repetições.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 Simulado MEXT 3 — Mat 4 (Derivadas), Fís 2 (MHS/Ondas), Qui 4 (Orgânica avançada). Condições absolutamente reais. Registrar hora início/fim de cada seção.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 120,
          what: "📊 Análise — Derivadas: verificar domínio de regras e aplicações. MHS/Ondas: rever fórmulas de ondas estacionárias. Qui 4 Orgânica: identificar tipo de mecanismo errado. Atualizar lista de prioridades MEXT.",
        },
        {
          id: "qui-s2",
          subj: "chemistry",
          type: "self",
          slot: "16:30",
          estMin: 60,
          what: "⚗ Qui 4 — Isomeria Espacial aprofundada: enantiômeros (carbono quiral, rotação da luz polarizada), diastereômeros, compostos meso. Isomeria geométrica cis/trans. Resolver 6 questões MEXT.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão completa: 2 artigos NHK Web Easy. Anki: deck completo N5+N4. Escrever 10 frases. Teste kanji: escrever 30 kanji N4 de memória.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat 1 — Matrizes avançadas: determinante 3×3 (Sarrus e Laplace), matriz inversa (pelo adjunto). Aplicações: área de triângulo com coordenadas, colinearidade. Resolver 8 questões MEXT de matrizes e determinantes.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 60,
          what: "⚛ Fís 4 — Gravitação Universal: lei de Newton F=Gm₁m₂/r². 1ª lei de Kepler (órbitas elípticas). 3ª lei: T²/a³=constante. Velocidade de escape. Resolver 6 questões MEXT de gravitação.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "13:30",
          estMin: 60,
          what: "⚗ Qui 3 — Termoquímica: entalpia ΔH. Lei de Hess. Energia de ligação. Entropia ΔS. Energia Livre de Gibbs ΔG=ΔH-TΔS: espontaneidade. Resolver 6 questões MEXT de termoquímica.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "15:00",
          estMin: 50,
          what: "E Inglês — Leitura técnica: artigo de Física Moderna (quantum mechanics, de Broglie wavelength, uncertainty principle). Anotar termos. Praticar leitura sem parar no desconhecido.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "16:30",
          estMin: 40,
          what: "📋 Revisão semanal — atualizar lista de erros. Planejar semana 4: primeiras provas MEXT completas + análise de estilo de questão.",
        },
      ],
    },

    /* ─── Semana 4 ─── */
    sem4: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Simulado parcial de japonês estilo MEXT: vocabulário N4 (25 min) + gramática N4 (25 min) + leitura (25 min). Cronometrado. Analisar erros por seção.",
        },
        {
          id: "cur-m",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat — Resolução de 1 prova MEXT completa de Matemática (cronometrada). Abrange: Mat 1-5. Analisar: quais frentes causaram mais erros? O estilo das questões é diferente do ENEM? Como?",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Revisão dos erros do simulado de ontem: criar flashcards para cada erro de gramática e vocabulário. Anki: revisão completa. Shadowing: 15 min.",
        },
        {
          id: "cur-q",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚗ Qui — Resolução de 1 prova MEXT completa de Química (cronometrada). Abrange: Qui 1-4. Analisar: Qui 3 (equilíbrio, eletroquímica, termoquímica) e Qui 4 (orgânica avançada) são os mais cobrados?",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — N4: revisão geral de toda a gramática N4 vista até agora. Escrever 10 frases usando padrões variados. Vocabulário N4: completar 600 palavras. Kanji N4: 60 kanji acumulados.",
        },
        {
          id: "cur-f",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚛ Fís — Resolução de 1 prova MEXT completa de Física (cronometrada). Abrange: Fís 1-4. Analisar: Física Moderna (Fís 4) e Eletromagnetismo (Fís 3) são os mais cobrados? Confirmar padrão.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Simulado japonês completo estilo MEXT: vocabulário (25 min) + gramática (30 min) + leitura (35 min). Condições reais de prova. Analisar erros por seção imediatamente.",
        },
        {
          id: "ing",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Resolver 5 provas MEXT de inglês (seções). Identificar padrão: quais tipos de questão (vocabulário, gramática, inferência, referência) mais aparecem? Criar estratégia de abordagem.",
        },
        {
          id: "cur-mat",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "∑ Mat — Análise profunda dos erros das 2 provas MEXT de Mat: categorizar por frente Mat 1-5. Refazer cada questão errada do zero (sem gabarito). Identificar os 3 tipos de questão com mais erros.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Revisão dos erros do simulado de ontem. Anki: revisão completa. Escuta: NHK Web Easy + JapanesePod101. Meta: 600 palavras N4 + 60 kanji N4 acumulados.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "⚗ Qui — Análise profunda dos erros das provas MEXT de Qui: refazer cada questão errada. Qui 3: consolidar equilíbrio químico e eletroquímica. Qui 4: consolidar mecanismos de reação orgânica.",
        },
        {
          id: "mat-s",
          subj: "math",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "∑ Mat — Análise profunda Fís: refazer cada questão errada das provas MEXT. Fís 4: consolidar efeito fotoelétrico e Bohr. Fís 3: consolidar Faraday e Lorentz.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 50,
          what: "🇯🇵 Japonês — Revisão semanal completa: Anki completo N5+N4. Shadowing: 15 min. Praticar 自己紹介 e 志望動機 em voz alta.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 SIMULADO MEXT COMPLETO — Mat + Fís + Qui + Japonês + Inglês. Condições absolutamente reais: sem pausas, cronômetro, sem consulta. Registrar hora de início/fim de cada seção para análise de gestão de tempo.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 150,
          what: "📊 Análise TOTAL do simulado — cada erro é OBRIGATÓRIO entender. Mat: categorizar Mat 1-5. Fís: categorizar Fís 1-4. Qui: categorizar Qui 1-4. Japonês: erros por seção. Criar lista definitiva de prioridades para a fase de Preparação MEXT.",
        },
        {
          id: "qui-s2",
          subj: "chemistry",
          type: "self",
          slot: "16:30",
          estMin: 60,
          what: "⚗ Qui + Fís — Consolidação das duas frentes mais cobradas na MEXT: Qui 3 (equilíbrio/eletroquímica) + Fís 4 (Física Moderna). Resolver mais 6 questões de cada frente.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Praticar 志望動機 (motivo de candidatura) e 自己紹介 em voz alta. Anki: revisão completa. Escuta: 20 min.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "09:30",
          estMin: 120,
          what: "∑ Mat — Folha de referência pessoal: 1 página por frente (Mat 1-5). Mat 4: GA (distâncias, cônicas), Trigonometria, Derivadas. Mat 2: Complexos (De Moivre). Mat 3: Combinatória, Binomiais. Resolver questões dos pontos mais fracos.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "12:00",
          estMin: 90,
          what: "⚛ Fís — Folha de referência: 1 página por frente (Fís 1-4). Constantes: g=9,8 m/s², c=3×10⁸ m/s, h=6,63×10⁻³⁴ J·s, e=1,6×10⁻¹⁹ C. Resolver questões dos pontos mais fracos.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "14:00",
          estMin: 90,
          what: "⚗ Qui — Folha de referência: 1 página por frente (Qui 1-4). Qui 3: fórmulas de ΔG, E°, pH, Kps. Qui 4: tabela de funções orgânicas + mecanismos. Resolver questões dos pontos mais fracos.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "16:00",
          estMin: 50,
          what: "E Inglês — Preparação para entrevista MEXT em inglês: 'Why Japan?', 'What is your field?', 'What are your goals?'. Escrever respostas e praticar em voz alta.",
        },
        {
          id: "rev",
          subj: "japanese",
          type: "self",
          slot: "17:30",
          estMin: 45,
          what: "📋 Planejamento da fase de Preparação MEXT — atualizar lista pessoal de erros Mat 1-5, Fís 1-4, Qui 1-4. Definir 1 ponto fraco prioritário por frente. Revisar folhas de referência.",
        },
      ],
    },
  },

  /* ══════════════════════════════════════════════════
     FASE: PREPARAÇÃO + SPRINT MEXT  (Mar/27 a Jul/27)
     Sem 1 — simulados semanais + revisão por erro
     Sem 2 — reforço das frentes mais fracas
     Sem 3 — revisão intensiva + japonês intensificado
     Sem 4 — descanso estratégico + véspera de prova
  ══════════════════════════════════════════════════ */
  sprint: {
    /* ─── Semana 1 ─── */
    sem1: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — Simulado parcial MEXT: vocabulário N4 (25 min) + gramática N4 (30 min). Cronometrado. Analisar erros por tipo. Criar flashcards para erros recorrentes.",
        },
        {
          id: "cur-m",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "∑ Mat — Revisão dirigida pelos erros do simulado da semana anterior. Reforço da frente com mais erros (verificar lista pessoal). Resolver 10 questões MEXT dessa frente específica.",
        },
        {
          id: "mat-r",
          subj: "math",
          type: "self",
          slot: "20:30",
          estMin: 40,
          what: "∑ Mat — 5 questões MEXT de Matemática (cronometradas, 3 min/questão). Foco nas frentes com maior taxa de erro. Analisar cada erro antes de dormir.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — N4: vocabulário N4: acumular 700 palavras. Kanji N4: 80 kanji acumulados. Leitura: NHK Web Easy 2 artigos. Escrita: 1 parágrafo em japonês.",
        },
        {
          id: "cur-p",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "⚛ Fís — Revisão dirigida pelos erros do simulado. Reforço da frente com mais erros em Física. Resolver 10 questões MEXT da frente específica.",
        },
        {
          id: "fis-r",
          subj: "physics",
          type: "self",
          slot: "20:30",
          estMin: 40,
          what: "⚛ Fís — 5 questões MEXT de Física (cronometradas). Foco nas frentes com maior taxa de erro. Analisar cada erro antes de dormir.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — Shadowing: 20 min imitando áudio nativo (NHK News Web). NHK Web Easy: 2 artigos + anotar vocabulário. Manter ritmo auditivo.",
        },
        {
          id: "cur-q",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "⚗ Qui — Revisão dirigida pelos erros do simulado. Reforço da frente com mais erros em Química. Resolver 10 questões MEXT da frente específica.",
        },
        {
          id: "qui-r",
          subj: "chemistry",
          type: "self",
          slot: "20:30",
          estMin: 40,
          what: "⚗ Qui — 5 questões MEXT de Química (cronometradas). Foco nas frentes com maior taxa de erro. Analisar antes de dormir.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Simulado parcial de japonês — gramática N4 (25 min) + leitura N4 (35 min). Cronometrado. Analisar erros por seção. Criar flashcards para padrões gramaticais com erro recorrente.",
        },
        {
          id: "cur-i",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Preparação para entrevista MEXT: perguntas típicas (Why Japan?, What is your research interest?). Vocabulário acadêmico formal: hypothesis, methodology, findings, implications. Praticar respostas em voz alta.",
        },
        {
          id: "cur-f",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚛ Fís — Revisão integrada MEXT: Fís 1 (Cinemática, Dinâmica, Estática, Hidrostática), Fís 2 (Termodinâmica, MHS, Ondas). Questões de alto nível estilo MEXT: análise de gráficos, desenvolvimento de raciocínio. Resolver 10 questões.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 SIMULADO JAPONÊS COMPLETO — vocabulário N4 (25 min) + gramática N4 (30 min) + leitura N4 (35 min). Condições reais. Analisar erros por seção imediatamente após.",
        },
        {
          id: "mat-r2",
          subj: "math",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "∑ Mat — 1 prova MEXT completa de Matemática (cronometrada, 90 min). Gestão de tempo: dividir equitativamente por frente. Analisar tempo gasto por questão.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "17:00",
          estMin: 90,
          what: "📊 Revisão profunda dos erros da prova de hoje. Atualizar lista pessoal de pontos fracos. Estudar o conceito de CADA erro. Nenhum tópico novo — apenas consolidação.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão dos erros do simulado de ontem. Criar Anki para cada gramática errada. Praticar 自己紹介 e 志望動機 em voz alta (3 repetições).",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 SIMULADO MEXT COMPLETO — Mat + Fís + Qui + Japonês + Inglês. Condições absolutamente reais (sem pausas, cronômetro, sem consulta). Registrar hora de início e fim de cada seção.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 150,
          what: "📊 Análise TOTAL do simulado. Cada erro é OBRIGATÓRIO entender. Mat: categorizar Mat 1-5. Fís: Fís 1-4. Qui: Qui 1-4. Japonês: por seção. Comparar com simulado anterior: evoluiu?",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "16:30",
          estMin: 60,
          what: "⚗ Qui + Fís — Consolidação dos pontos mais fracos identificados no simulado. Resolver 5 questões adicionais de cada frente com mais erros.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 90,
          what: "🇯🇵 Japonês — Praticar 志望動機 e 自己紹介 em voz alta (simular entrevista com cronômetro). Anki: revisão completa N5+N4. Escuta passiva: 20 min.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "10:00",
          estMin: 120,
          what: "∑ Mat — Folha de referência pessoal: revisar e atualizar. 1 página por frente Mat 1-5. Resolver questões dos pontos mais fracos identificados no simulado. Nenhum tópico novo.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "13:00",
          estMin: 90,
          what: "⚛ Fís — Folha de referência: revisar e atualizar. Resolver questões dos pontos mais fracos. Focar nos tipos de questão que mais aparecem na MEXT (análise de padrão).",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "15:00",
          estMin: 90,
          what: "⚗ Qui — Folha de referência: revisar e atualizar. Resolver questões dos pontos mais fracos. Confirmar: Qui 3 (equilíbrio/eletroquímica) e Qui 4 (orgânica) estão consolidados?",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "E Inglês — Preparação para entrevista MEXT: praticar respostas em inglês em voz alta. Área de interesse, objetivos no Japão, planos de carreira. Vocabulário: field of study, research focus, career goals.",
        },
        {
          id: "rev",
          subj: "japanese",
          type: "self",
          slot: "18:30",
          estMin: 45,
          what: "📋 Planejamento da semana — atualizar lista de erros. Definir 1 ponto fraco prioritário por frente (Mat 1-5, Fís 1-4, Qui 1-4). Revisar folhas de referência.",
        },
      ],
    },

    /* ─── Semana 2 ─── */
    sem2: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — N4: gramática avançada restante. Redação em japonês: 自己紹介 (100 palavras) — reescrever após feedback/autocorrect. Vocabulário N4: 750 palavras acumuladas. Kanji N4: 100 kanji.",
        },
        {
          id: "cur-m",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "∑ Mat — Reforço da 2ª frente com mais erros (verificar lista pessoal). Resolver 10 questões MEXT. Análise de padrão: qual tipo de desenvolvimento a MEXT pede nessa frente?",
        },
        {
          id: "mat-r",
          subj: "math",
          type: "self",
          slot: "20:30",
          estMin: 40,
          what: "∑ Mat — 5 questões MEXT de Matemática (cronometradas). Foco na frente em reforço. Analisar cada erro antes de dormir.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — Redação em japonês: 志望動機 (150 palavras) — por que quer estudar no Japão. Revisão e reescrita. Anki N4: revisão completa. Shadowing: 15 min.",
        },
        {
          id: "cur-p",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "⚛ Fís — Reforço da 2ª frente com mais erros em Física. Resolver 10 questões MEXT de alto nível com desenvolvimento completo. Verificar: está respondendo com justificativa completa?",
        },
        {
          id: "fis-r",
          subj: "physics",
          type: "self",
          slot: "20:30",
          estMin: 40,
          what: "⚛ Fís — 5 questões MEXT de Física (cronometradas). Foco na frente em reforço. Analisar cada erro.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — Simulado parcial de japonês MEXT: todas as seções em 90 min. Cronometrado. Analisar erros por seção. Focar nos padrões de erro recorrentes.",
        },
        {
          id: "cur-q",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "⚗ Qui — Reforço da 2ª frente com mais erros em Química. Resolver 10 questões MEXT. Análise de padrão: Qui 3 (termodinâmica/equilíbrio) ou Qui 4 (mecanismos orgânicos)?",
        },
        {
          id: "qui-r",
          subj: "chemistry",
          type: "self",
          slot: "20:30",
          estMin: 40,
          what: "⚗ Qui — 5 questões MEXT de Química (cronometradas). Foco na frente em reforço. Analisar antes de dormir.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — N4: kanji avançados (120 kanji acumulados). Vocabulário N4: 800 palavras. Leitura: 2 artigos NHK Web Easy sem dicionário. Shadowing: 15 min.",
        },
        {
          id: "cur-i",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Vocabulário científico avançado para MEXT: thermodynamics, quantum mechanics, organic synthesis, nuclear reaction, electromagnetic induction. Resolver 1 seção de inglês MEXT.",
        },
        {
          id: "cur-f",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚛ Fís — Revisão integrada MEXT: Fís 3 (Eletrostática, Eletrodinâmica, Eletromagnetismo), Fís 4 (Óptica, Física Quântica, Relatividade). Questões de alto nível estilo MEXT. Resolver 10 questões.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 SIMULADO JAPONÊS COMPLETO — condições reais. Analisar tempo gasto por seção. Identificar se o vocabulário ou a gramática causam mais erros.",
        },
        {
          id: "mat-r2",
          subj: "math",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "∑ Mat — 1 prova MEXT completa de Matemática (90 min, cronometrada). Focar na gestão de tempo. Identificar questões que tomam muito tempo.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "17:00",
          estMin: 90,
          what: "📊 Revisão profunda dos erros da prova de hoje. Nenhum tópico novo. Consolidar os padrões de erro identificados.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão dos erros do simulado de ontem. Praticar 志望動機 e 自己紹iei em voz alta. Anki: revisão completa.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 SIMULADO MEXT COMPLETO — condições absolutamente reais. Comparar com semana 1: o score melhorou? As frentes de reforço evoluíram?",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 150,
          what: "📊 Análise TOTAL — comparar com a semana passada por frente. O reforço surtiu efeito? Definir novas frentes prioritárias para a semana 3.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "16:30",
          estMin: 60,
          what: "⚗ Consolidação adicional: 5 questões das frentes com mais erros no simulado de hoje.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 90,
          what: "🇯🇵 Japonês — Praticar discurso completo de apresentação: 自己紹介 (2 min) + 志望動機 (2 min). Simular entrevista com cronômetro. Anki: deck completo. Escuta: 20 min.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "10:00",
          estMin: 120,
          what: "∑ Mat — Resolver questões MEXT das frentes menos estudadas (verificar se alguma frente está negligenciada). Criar 1 exercício tipo MEXT para si mesmo em cada frente.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "13:00",
          estMin: 90,
          what: "⚛ Fís — Resolver questões MEXT das frentes menos estudadas. Confirmar: Treliças (Fís 1) e Hidrodinâmica (Fís 1) estão dominados? São eliminatórios na MEXT.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "15:00",
          estMin: 90,
          what: "⚗ Qui — Consolidação final de Qui 3 (Calor/Entropia/Energia Livre + Equilíbrio Tampão). Resolver questões MEXT específicas dessas frentes.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "E Inglês — Interpretação de gráficos e tabelas em inglês (estilo MEXT). Ler abstract de artigo científico em inglês e responder questões de compreensão.",
        },
        {
          id: "rev",
          subj: "japanese",
          type: "self",
          slot: "18:30",
          estMin: 45,
          what: "📋 Planejamento — prioridades para a semana 3 (sprint final de japonês: 1h30 matinal + 30 min noturno). Atualizar lista de erros por frente.",
        },
      ],
    },

    /* ─── Semana 3 ─── */
    sem3: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 90,
          what: "🇯🇵 Japonês — Intensificação: 1h30 matinal. Resolver TODAS as provas MEXT de japonês disponíveis (seção de hoje: vocabulário). Analisar cada erro. Criar flashcards para erros recorrentes.",
        },
        {
          id: "cur-m",
          subj: "math",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "∑ Mat — Resolver + revisar todas as provas MEXT de Matemática disponíveis (cronometradas). Criar folha de referência pessoal final: 1 página por frente (Mat 1-5). Focar no que você erra, não no que já domina.",
        },
        {
          id: "mat-r",
          subj: "math",
          type: "self",
          slot: "20:30",
          estMin: 30,
          what: "🇯🇵 Japonês — Revisão noturna: 30 min. Anki: deck completo N5+N4. Reler notas de gramática com mais erros. Escuta passiva: 10 min antes de dormir.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 90,
          what: "🇯🇵 Japonês — 1h30 matinal. Provas MEXT (seção de hoje: gramática). Analisar erros. Lista pessoal: padrões gramaticais que mais erro. Revisar diariamente.",
        },
        {
          id: "cur-p",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "⚛ Fís — Resolver + revisar todas as provas MEXT de Física disponíveis. Folha de referência Fís 1-4: fórmulas e constantes essenciais. Confirmar: Treliças e Hidrodinâmica estão dominados.",
        },
        {
          id: "fis-r",
          subj: "physics",
          type: "self",
          slot: "20:30",
          estMin: 30,
          what: "🇯🇵 Japonês — Revisão noturna: 30 min. Anki N4. Shadowing: 10 min. Reler gramática com mais erros.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 90,
          what: "🇯🇵 Japonês — 1h30 matinal. Provas MEXT (seção: leitura). Analisar padrões de erro na compreensão textual. Vocabulário N4: 900 palavras acumuladas. Kanji N4: 150 kanji.",
        },
        {
          id: "cur-q",
          subj: "chemistry",
          type: "cursinho",
          slot: "14:30",
          estMin: 200,
          what: "⚗ Qui — Resolver + revisar todas as provas MEXT de Química disponíveis. Folha de referência Qui 1-4. Reações orgânicas principais: resumo em 1 página.",
        },
        {
          id: "qui-r",
          subj: "chemistry",
          type: "self",
          slot: "20:30",
          estMin: 30,
          what: "🇯🇵 Japonês — Revisão noturna: 30 min. Anki completo. Reler lista pessoal de erros de japonês.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 90,
          what: "🇯🇵 Japonês — 1h30 matinal. SIMULADO JAPONÊS COMPLETO em condições reais. Analisar erros por seção. Identificar: evoluiu em relação à semana 1?",
        },
        {
          id: "cur-i",
          subj: "english",
          type: "cursinho",
          slot: "13:40",
          estMin: 50,
          what: "E Inglês — Preparação final para entrevista MEXT: praticar respostas completas em inglês (2-3 min cada). Simulação de entrevista: Why Japan? What will you research? What are your post-graduation plans?",
        },
        {
          id: "cur-f",
          subj: "physics",
          type: "cursinho",
          slot: "14:30",
          estMin: 300,
          what: "⚛ Fís + Mat — Revisão integrada final: resolver questões que combinam múltiplas frentes (ex: lançamento oblíquo com energia, circuito com lei de Gauss). Estilo MEXT avançado.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 90,
          what: "🇯🇵 Japonês — 1h30 matinal. 2 artigos NHK Web Easy sem dicionário. Shadowing: 20 min. Anki: revisão completa. Reler lista pessoal de erros.",
        },
        {
          id: "mat-r2",
          subj: "math",
          type: "self",
          slot: "15:30",
          estMin: 90,
          what: "∑ Mat — 1 prova MEXT completa de Matemática (cronometrada). Análise profunda de cada erro. Nenhum tópico novo.",
        },
        {
          id: "rev",
          subj: "math",
          type: "self",
          slot: "17:00",
          estMin: 90,
          what: "📊 Revisão profunda final. Atualizar lista de erros definitiva. Focar nos 2-3 tipos de questão com mais erros em cada matéria.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão dos erros do simulado. Anki: deck completo. Praticar 志望動機 e 自己紹介 em voz alta. Descansar.",
        },
        {
          id: "sim",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "📝 SIMULADO MEXT COMPLETO FINAL — condições absolutamente reais. Este é o simulado de referência: comparar com semana 1 para medir evolução total.",
        },
        {
          id: "sim-r",
          subj: "math",
          type: "self",
          slot: "13:30",
          estMin: 150,
          what: "📊 Análise FINAL do simulado. Comparar com semana 1: quantos pontos a mais? Criar lista definitiva de: (1) o que domino, (2) o que ainda está fraco, (3) o que não aprendi e preciso peace with it.",
        },
        {
          id: "qui-s",
          subj: "chemistry",
          type: "self",
          slot: "16:30",
          estMin: 60,
          what: "⚗ Últimas questões de reforço: 5 questões das frentes com mais erros no simulado de hoje. Nenhum tópico novo.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 90,
          what: "🇯🇵 Japonês — Revisão leve: 1h30. Anki completo. Praticar discurso de apresentação completo (自己紹介 + 志望動機). Escuta: 20 min. Descansar a mente.",
        },
        {
          id: "mat-d",
          subj: "math",
          type: "self",
          slot: "10:00",
          estMin: 120,
          what: "∑ Mat — Reler folhas de referência pessoais Mat 1-5. Resolver 5 questões fáceis de cada frente (para ganhar confiança). ⚠️ Nada de tópico novo.",
        },
        {
          id: "fis-d",
          subj: "physics",
          type: "self",
          slot: "13:00",
          estMin: 90,
          what: "⚛ Fís — Reler folhas de referência Fís 1-4. Resolver 5 questões fáceis de cada frente. Revisualizar as constantes físicas essenciais.",
        },
        {
          id: "qui-d",
          subj: "chemistry",
          type: "self",
          slot: "15:00",
          estMin: 90,
          what: "⚗ Qui — Reler folhas de referência Qui 1-4. Resolver 5 questões fáceis de cada frente. A preparação está completa.",
        },
        {
          id: "ing-d",
          subj: "english",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "E Inglês — Última preparação para entrevista: praticar respostas em inglês e japonês alternadas. Estar pronto para responder na língua que pedirem.",
        },
        {
          id: "rev",
          subj: "japanese",
          type: "self",
          slot: "18:30",
          estMin: 45,
          what: "📋 Planejamento para a semana de prova — descanso estratégico: nada de novo. Rever logística: local, horário, documentos. Dormir bem nos 3 dias anteriores à prova.",
        },
      ],
    },

    /* ─── Semana 4 ─── */
    sem4: {
      seg: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — Revisão leve: 1h15. Anki: revisão rápida dos erros mais recentes. Shadowing: 10 min. Escuta passiva: 10 min. ⚠️ Nada de tópico novo.",
        },
        {
          id: "mat-rev",
          subj: "math",
          type: "self",
          slot: "14:30",
          estMin: 120,
          what: "∑ Mat — Reler folhas de referência pessoais (Mat 1-5). Resolver 3 questões de cada frente (apenas as fáceis para manter o ritmo). ⚠️ Nada de novo.",
        },
        {
          id: "fis-rev",
          subj: "physics",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "⚛ Fís — Reler folhas de referência (Fís 1-4). Resolver 2 questões de cada frente (apenas as fáceis). Revisualizar constantes.",
        },
      ],
      ter: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 75,
          what: "🇯🇵 Japonês — Revisão leve: 1h15. Anki rápido. Praticar 自己紹介 e 志望動機 em voz alta (3 repetições cada). Escuta passiva: 10 min.",
        },
        {
          id: "qui-rev",
          subj: "chemistry",
          type: "self",
          slot: "14:30",
          estMin: 120,
          what: "⚗ Qui — Reler folhas de referência (Qui 1-4). Resolver 3 questões de cada frente (apenas as fáceis). Rever reações orgânicas principais.",
        },
        {
          id: "ing-rev",
          subj: "english",
          type: "self",
          slot: "17:00",
          estMin: 60,
          what: "E Inglês — Revisão final: reler anotações de vocabulário técnico. Praticar respostas de entrevista em inglês. Preparar mentalmente.",
        },
      ],
      qua: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 60,
          what: "🇯🇵 Japonês — Revisão leve: 1h. Anki: apenas os erros mais recorrentes. Escuta passiva: 15 min. Ler folha de gramática N4 resumida. ⚠️ Nada de novo.",
        },
        {
          id: "rev-all",
          subj: "math",
          type: "self",
          slot: "14:30",
          estMin: 90,
          what: "📋 Revisão integrada final — reler todas as folhas de referência (Mat, Fís, Qui) em sequência. Visualizar onde cada fórmula se aplica. Fazer pace with it: o que não foi aprendido em meses não será resolvido agora.",
        },
        {
          id: "jpn-eve",
          subj: "japanese",
          type: "self",
          slot: "17:00",
          estMin: 30,
          what: "🇯🇵 Japonês — Sessão noturna final: praticar discurso completo de apresentação (自己紹介 + 志望動機) em voz alta. Descanso após.",
        },
      ],
      qui: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 60,
          what: "🇯🇵 Japonês — Manutenção pré-prova: Anki rápido (15 min). Escuta passiva: 10 min. Ler folha de kana e gramática. ⚠️ Nada de novo.",
        },
        {
          id: "descanso",
          subj: "math",
          type: "self",
          slot: "10:00",
          estMin: 60,
          what: "🌟 Descanso estratégico — rever logística da prova: local, horário, documentos necessários, material permitido. Preparar o material na mochila hoje. Comer bem. Dormir cedo.",
        },
      ],
      sex: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Revisão MUITO leve: Anki (10 min). Escuta passiva (10 min). Ler 5 flashcards de gramática. Descanso total após.",
        },
        {
          id: "descanso2",
          subj: "math",
          type: "self",
          slot: "10:00",
          estMin: 40,
          what: "🌟 Véspera de prova — comer carboidratos complexos (energia estável). Não estudar nada novo. Revisar mentalmente a lógica da prova (começar pelo que sei, gerir tempo). Dormir cedo. A preparação está feita.",
        },
      ],
      sab: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "06:10",
          estMin: 40,
          what: "🇯🇵 Japonês — Revisão muito leve: Anki (10 min). Escuta passiva (10 min). ⚠️ Dia de prova ou véspera. Conservar energia.",
        },
        {
          id: "prova",
          subj: "math",
          type: "simulado",
          slot: "08:00",
          estMin: 300,
          what: "🎯 PROVA MEXT — Dar o seu melhor com tudo que preparou ao longo de 13 meses. Gestão de tempo: começar pelo que domina. Se travar, pular e voltar. Confiar no processo.",
        },
      ],
      dom: [
        {
          id: "jpn",
          subj: "japanese",
          type: "self",
          slot: "08:00",
          estMin: 60,
          what: "🇯🇵 Japonês — Pós-prova: praticar apresentação para entrevista (se aprovado na prova escrita). 自己紹介 e 志望動機 em japonês e inglês. Anki: revisão leve.",
        },
        {
          id: "rev",
          subj: "japanese",
          type: "self",
          slot: "10:00",
          estMin: 45,
          what: "📋 Reflexão pós-prova — anotar tudo que lembra das questões (para análise). Identificar frentes que foram bem e frentes onde teve dificuldade. Preparar para entrevista se aprovado.",
        },
      ],
    },
  },
};

/* ──────────────────────────────────────────────────
   ROADMAP DATA
──────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────
   ROADMAP DATA
   Reestruturado com base no currículo do cursinho,
   alinhado ao que cai em cada prova:
   EFOMM (Jun/Jul 26) · ENEM (Nov 26) · MEXT (Jun 27)
──────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────
   ROADMAP DATA — baseado no cronograma do cursinho
   Cronograma oficial:
   Jun–Jul/26  → Fase 1: Fundamentos + EFOMM diagnóstico
   Ago–Out/26  → Fase 2: Consolidação foco ENEM
   Nov/26      → ENEM real (8–15/nov) + recuperação
   Dez/26      → Fase 3: Transição pós-ENEM
   Jan–Mar/27  → Fase 4: Aprofundamento MEXT + EFOMM
   Abr–Jun/27  → Fase 5: Intensivão simulados
   Jul/27      → Fase 6: Reta final EFOMM + MEXT
──────────────────────────────────────────────────── */
const R = {
  /* ══════════════════════════
     FASE 1 — FUNDAMENTOS
     Jun/26 a Jul/26
  ══════════════════════════ */
  "Jun/26": {
    phase: "efomm",
    milestones: [
      "📋 Verificar prazo de inscrição ENEM",
      "📊 Simulado diagnóstico MAT1+FIS1+QUI1 — semana 4",
      "⚠️ EFOMM em ~60 dias — usar como treino diagnóstico",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Tofugu", "Anki"],
        notes:
          "06:10 todo dia. Sábado é o dia principal de Japonês. EFOMM não avalia japonês, mas a prova MEXT sim — não pular nenhum dia.",
        topics: [
          "Sem 1 — Hiragana completo (50 caracteres)",
          "Sem 2 — Katakana completo",
          "Sem 3 — Introdução ao Kanji: 50 kanjis N5 mais frequentes",
          "Sem 4 — Kanji N5: continuação (50 novos kanjis)",
          "Anki diário: revisar todos os kana e kanji aprendidos",
          "Escuta passiva: 10 min de áudio simples/dia",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Iezzi Vol.1", "Iezzi Vol.2"],
        notes:
          "Progresso em 4 semanas: MAT1 Conjuntos → Funções → Logaritmos → Matrizes. Antes de cada fórmula, escreva o que ela representa fisicamente.",
        topics: [
          "Sem 1 — MAT1: Conjuntos e Noções de Funções",
          "Sem 1 — MAT1: Funções de 1º e 2º Grau",
          "Sem 2 — MAT1: Função Modular",
          "Sem 2 — MAT1: Logaritmos e Função Logarítmica",
          "Sem 3 — MAT1: Exponenciais",
          "Sem 3 — MAT2: Álgebra Básica e Números Complexos (introdução)",
          "Sem 4 — MAT1: Matrizes, Determinantes e Sistemas Lineares",
          "Sem 4 — MAT2: Polinômios",
          "Simulado diagnóstico MAT1 — semana 4",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Tópicos de Física Vol.1", "Guisolli"],
        notes:
          "Progresso em 4 semanas: FIS1 do início ao fim. Assista Guisolli ANTES dos exercícios. Entenda o fenômeno antes da fórmula.",
        topics: [
          "Sem 1 — FIS1: Cinemática Escalar (MRU, MRUV, gráficos)",
          "Sem 1 — FIS1: Cinemática Vetorial e Vetores",
          "Sem 2 — FIS1: Dinâmica Retilínea — Leis de Newton",
          "Sem 2 — FIS1: Dinâmica Curvilínea",
          "Sem 3 — FIS1: Estática e Treliças",
          "Sem 3 — FIS1: Hidrostática",
          "Sem 4 — FIS1: Energia Mecânica",
          "Sem 4 — FIS1: Hidrodinâmica (fechamento FIS1)",
          "Simulado diagnóstico FIS1 — semana 4",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Feltre Vol.1"],
        notes:
          "Progresso em 4 semanas: QUI1 completa + início QUI2. Leia o texto antes de qualquer exercício.",
        topics: [
          "Sem 1 — QUI1: Estrutura Atômica e Teoria Quântica",
          "Sem 1 — QUI1: Átomos Polieletrônicos e Propriedades Periódicas",
          "Sem 2 — QUI1: Ligação Iônica e Covalente",
          "Sem 2 — QUI1: Estrutura Molecular e Forças Intermoleculares",
          "Sem 3 — QUI1: Sólidos, Ácidos e Bases Inorgânicos",
          "Sem 3 — QUI1: Sais, Óxidos e Reações Inorgânicas",
          "Sem 4 — QUI2: Substâncias e Estequiometria",
          "Sem 4 — QUI2: Gases e Misturas/Soluções",
          "Simulado diagnóstico QUI1 — semana 4",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas EFOMM", "Provas MEXT"],
        notes:
          "EFOMM exige gramática explícita + leitura técnica. MEXT exige leitura científica.",
        topics: [
          "Sem 1 — Gramática base nível B (tempos verbais, voz passiva)",
          "Sem 2 — Vocabulário científico e técnico",
          "Sem 3 — Reading comprehension intermediário",
          "Sem 4 — Leitura de texto científico e vocabulário técnico-científico",
        ],
      },
      portuguese: {
        priority: "média",
        resources: ["Cursinho", "Provas EFOMM"],
        notes:
          "EFOMM cobra interpretação de texto e gramática formal. Redação é cobrada no ENEM.",
        topics: [
          "Sem 1 — Tipos de texto e leitura (estilo EFOMM)",
          "Sem 2 — Dissertação argumentativa: estrutura básica",
          "Sem 3 — Coesão e coerência textual",
          "Sem 4 — Redação: introdução e conclusão",
        ],
      },
    },
  },

  "Jul/26": {
    phase: "efomm",
    milestones: [
      "⚠️ EFOMM 2026 — 25 e 26 de julho (prova-treino diagnóstica)",
      "📊 Anotar todos os erros por matéria e frente após a prova",
      "📋 O resultado indicará os pontos fracos a priorizar em Ago/26",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Tofugu", "Anki"],
        notes:
          "EFOMM não avalia japonês. Semana da prova: manter rotina matinal normalmente, sem pressão extra.",
        topics: [
          "Sem 5 — Gramática N5: partículas は、が、を、に、で",
          "Sem 6 — Verbos básicos: conjugação afirmativa e negativa N5",
          "Sem 7 — Exercícios integrados N5 (hiragana, katakana, kanji, gramática)",
          "Sem 8 (semana da EFOMM) — Manutenção: Anki diário + escuta passiva",
        ],
      },
      math: {
        priority: "crítica",
        resources: ["Iezzi", "Provas EFOMM"],
        notes:
          "Semana 8: revisão leve apenas — fórmulas e macetes, sem conteúdo novo.",
        topics: [
          "Sem 5 — MAT2: Números Inteiros e revisão MAT2",
          "Sem 6 — MAT3: Combinatória — Princípio Fundamental e Arranjos",
          "Sem 6 — MAT3: Combinações e Binômio de Newton",
          "Sem 7 — MAT3: Probabilidade",
          "Sem 7 — MAT4: Trigonometria — razões e funções trigonométricas",
          "Sem 8 — Revisão leve MAT1 a MAT3 (apenas fórmulas e macetes)",
          "Sem 8 — EFOMM 2026 — prova treino",
        ],
      },
      physics: {
        priority: "crítica",
        resources: ["Tópicos de Física Vol.1", "Provas EFOMM"],
        notes: "Conteúdo avança para FIS2. Sem 8: revisão leve apenas.",
        topics: [
          "Sem 5 — FIS2: Termometria e Dilatação",
          "Sem 5 — FIS2: Calorimetria",
          "Sem 6 — FIS2: Termodinâmica",
          "Sem 6 — FIS2: Máquinas Térmicas",
          "Sem 7 — FIS2: MHS",
          "Sem 7 — FIS2: Ondas I e II",
          "Sem 8 — Revisão leve FIS1 + FIS2 (sem conteúdo novo)",
          "Sem 8 — EFOMM 2026 — prova treino",
        ],
      },
      chemistry: {
        priority: "crítica",
        resources: ["Feltre Vol.2", "Provas EFOMM"],
        notes: "Sem 8: revisão leve apenas.",
        topics: [
          "Sem 5 — QUI2: Precipitação e Neutralização",
          "Sem 5 — QUI2: Oxidação e Redução",
          "Sem 6 — QUI2: Leis de Velocidade e Mecanismos de Reação",
          "Sem 6 — QUI2: Energia de Ativação e Reações Nucleares/Radioatividade",
          "Sem 7 — QUI3: Calor, Trabalho, Energia e Termoquímica",
          "Sem 7 — QUI3: Entropia e Energia Livre",
          "Sem 8 — Revisão leve (sem conteúdo novo)",
          "Sem 8 — EFOMM 2026 — prova treino",
        ],
      },
      english: {
        priority: "alta",
        resources: ["Provas EFOMM", "Provas MEXT"],
        notes:
          "Sem 6: resolver 1 prova MEXT anterior de inglês para ver o formato.",
        topics: [
          "Sem 5 — Gramática avançada: tempos verbais e conditionals",
          "Sem 6 — Prova MEXT anterior resolvida (vocabulário e estrutura)",
          "Sem 7 — Essay writing introdução (estilo MEXT)",
          "Sem 8 — Revisão leve ING (gramática e leitura rápida)",
        ],
      },
      portuguese: {
        priority: "média",
        resources: ["Cursinho", "Provas EFOMM"],
        notes: "",
        topics: [
          "Sem 5 — Figuras de linguagem e semântica",
          "Sem 6 — Morfologia e análise sintática",
          "Sem 7 — Pontuação e concordância nominal e verbal",
          "Sem 8 — Revisão leve POR: tipos de texto e redação",
          "Sem 7 — Redação dissertativa completa (1 texto com correção)",
        ],
      },
    },
  },

  /* ══════════════════════════
     FASE 2 — FOCO ENEM
     Ago/26 a Out/26
  ══════════════════════════ */
  "Ago/26": {
    phase: "enem",
    milestones: [
      "📊 Análise detalhada da EFOMM 2026: mapear tópicos fracos em Mat, Fís, Qui",
      "📊 Simulado 1 — estilo MEXT (MAT+FIS+QUI+ING, 3h) — semana 14",
      "📋 Conferir resultado EFOMM 2026",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "Tofugu N4"],
        notes: "Transição N5 → N4. Sábado é o dia principal de Japonês.",
        topics: [
          "Sem 9 — N5 → N4: novos kanjis e vocabulário intermediário",
          "Sem 10 — N4: て形 (forma te) e ている",
          "Sem 11 — N4: vocabulário — 200 palavras mais frequentes",
          "Sem 12 — N4: conjugações verbais intermediárias (ます形、ない形、た形)",
          "Anki diário: revisar N5 completo + novos N4",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Iezzi Vol.3", "Iezzi Vol.4", "Provas ENEM"],
        notes:
          "Avança para MAT4 e MAT5. Pós-EFOMM: revisar tópicos com mais erros na prova antes de avançar.",
        topics: [
          "Sem 9 — Revisão MAT (erros EFOMM) + MAT4: Trigonometria avançada",
          "Sem 10 — MAT4: Geometria Analítica — Ponto e Reta",
          "Sem 10 — MAT4: Circunferências no Plano",
          "Sem 11 — MAT4: Cônicas — Elipse, Hipérbole e Parábola",
          "Sem 12 — MAT5: Conceitos Básicos — Triângulos e Quadriláteros",
          "Sem 13 — MAT5: Relações Métricas, Ceva/Menelaus e Métrica no Círculo",
          "Sem 13 — MAT5: Geometria Espacial — Prisma, Pirâmide, Cone, Cilindro, Esfera",
          "Sem 14 — MAT5: Poliedros Regulares (fechamento MAT5)",
          "Simulado 1 estilo MEXT — semana 14",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Tópicos de Física Vol.2", "Provas ENEM"],
        notes:
          "Avança para FIS3 e FIS4. Sem 9: revisão dos erros FIS da EFOMM.",
        topics: [
          "Sem 9 — Revisão FIS (erros EFOMM) + FIS3: Eletrização e Campo Elétrico",
          "Sem 10 — FIS3: Potencial Elétrico",
          "Sem 11 — FIS3: Eletrodinâmica e Associação de Resistores",
          "Sem 11 — FIS3: Geradores e Receptores",
          "Sem 12 — FIS3: Circuitos com Capacitores (fechamento FIS3)",
          "Sem 12 — FIS4: Óptica Geométrica I",
          "Sem 13 — FIS4: Óptica Geométrica II e Lentes",
          "Sem 13 — FIS4: Relatividade Restrita",
          "Sem 14 — FIS4: Física Quântica + Gravitação Universal (fechamento FIS4)",
          "Simulado 1 estilo MEXT — semana 14",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Feltre Vol.2", "Feltre Vol.3", "Provas ENEM"],
        notes:
          "Avança para QUI3 e QUI4. Fechamento de todas as 4 frentes até semana 15.",
        topics: [
          "Sem 9 — QUI3: Pressão de Vapor e Propriedades das Soluções",
          "Sem 10 — QUI3: Equilíbrio Químico",
          "Sem 10 — QUI3: Equilíbrio Ácido-Base e Tampão",
          "Sem 11 — QUI3: Equilíbrio de Solubilidade (fechamento QUI3)",
          "Sem 11 — QUI3: Células Eletroquímicas e Potenciais de Eletrodo",
          "Sem 12 — QUI4: Introdução à Química Orgânica e Ácidos/Bases Orgânicos",
          "Sem 12 — QUI4: Isomeria",
          "Sem 13 — QUI4: Alcanos, Cicloalcanos, Halogeno-alcanos",
          "Sem 13 — QUI4: Substituição, Eliminação e Alcenos",
          "Sem 14 — QUI4: Alcinos e Aromáticos",
          "Simulado 1 estilo MEXT — semana 14",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas ENEM", "Provas MEXT"],
        notes: "",
        topics: [
          "Sem 9 — Revisão pós-EFOMM + leitura científica",
          "Sem 10 — Reading ENEM + leitura científica",
          "Sem 11 — Gramática B avançado",
          "Sem 12 — Prova MEXT anterior resolvida — Inglês B completo",
          "Sem 13 — Writing científico intermediário",
          "Sem 14 — Vocabulário MEXT ciências naturais",
        ],
      },
      portuguese: {
        priority: "alta",
        resources: ["Cursinho", "Provas ENEM"],
        notes:
          "Redação é a maior alavanca de nota no ENEM. Treinar 1 texto por semana.",
        topics: [
          "Sem 9–11 — Interpretação de texto estilo ENEM",
          "Sem 11 — Redação: competências 1 e 2",
          "Sem 12 — Redação: competências 3 e 4",
          "Sem 13 — Redação: competência 5 (proposta de intervenção completa)",
          "Sem 14 — Análise de redações nota mil",
          "1 redação completa por semana com análise de competências",
        ],
      },
    },
  },

  "Set/26": {
    phase: "enem",
    milestones: [
      "📊 Simulado 2 — estilo ENEM Matemática (45 questões) — semana 15",
      "📊 Simulado 3 — estilo ENEM Ciências da Natureza (45 questões) — semana 16",
      "📊 Simulado 4 — estilo MEXT completo — semana 17",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "NHK Web Easy"],
        notes: "N4 consolidação. Sábado principal + prática diária.",
        topics: [
          "Sem 15 — N4: exercícios integrados",
          "Sem 16 — N4: avançado — leitura e gramática",
          "Sem 17 — N4: simulado nível",
          "Sem 18 — N4/N3 transição",
          "Anki diário: revisar N5 + consolidar N4",
          "NHK Web Easy: 1 artigo/semana",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Iezzi", "Provas ENEM"],
        notes:
          "Modo revisão: MAT1 a MAT5 com foco nos tópicos mais cobrados no ENEM. Resolver provas anteriores do ENEM.",
        topics: [
          "Sem 15 — QUI4: Aldeídos, Cetonas e Ácidos Carboxílicos (fechamento QUI4)",
          "Sem 15 — Revisão MAT completo (MAT1–MAT5) com mapa mental",
          "Sem 16 — Revisão tópicos mais errados — Matemática (Simulado 2)",
          "Sem 17 — Revisão MAT1: Funções, Logaritmos e Exponenciais — estilo ENEM",
          "Sem 17 — Revisão MAT2+MAT3: Complexos, Polinômios, Combinatória",
          "Sem 18 — Revisão MAT4: Trigonometria e Geometria Analítica — ENEM e MEXT",
          "Sem 18 — Revisão MAT5: Geometria Plana e Espacial — ENEM",
          "Resolver provas ENEM de Matemática (3 anos anteriores)",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes: "Modo revisão FIS1 a FIS4 com foco ENEM.",
        topics: [
          "Sem 15 — Revisão FIS completo (FIS1–FIS4) com mapa mental",
          "Sem 16 — Revisão tópicos mais errados — Física (Simulado 3)",
          "Sem 17 — Revisão FIS1: Mecânica completa — estilo ENEM",
          "Sem 17 — Revisão FIS2: Termologia e Ondas — ENEM",
          "Sem 18 — Revisão FIS3: Eletricidade e Magnetismo — ENEM",
          "Sem 18 — Revisão FIS4: Óptica, Quântica e Gravitação — ENEM",
          "Resolver provas ENEM de Física (3 anos anteriores)",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes: "Modo revisão QUI1 a QUI4 com foco ENEM contextualizado.",
        topics: [
          "Sem 15 — Revisão QUI completo (QUI1–QUI4) com mapa mental",
          "Sem 16 — Revisão tópicos mais errados — Química (Simulado 3)",
          "Sem 17 — Tópicos de maior incidência ENEM: Física, Química",
          "Sem 18 — QUI4: Álcoois, Éteres, Fenóis — revisão contextualizada ENEM",
          "Resolver provas ENEM de Química (3 anos anteriores)",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas ENEM", "Provas MEXT"],
        notes: "",
        topics: [
          "Sem 15 — Simulado inglês completo nível B",
          "Sem 16 — Revisão tópicos mais errados — Inglês",
          "Sem 17 — Reading e interpretation ENEM",
          "Sem 18 — Gramática avançada",
        ],
      },
      portuguese: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes: "1 redação completa por semana neste mês.",
        topics: [
          "Sem 15 — Prova ENEM anterior (Linguagens e Códigos)",
          "Sem 15 — Redação: análise de redações nota mil",
          "Sem 16 — Tópicos mais incidentes ENEM: Linguagens",
          "Sem 17 — Redação (tema social ou ambiental)",
          "Sem 18 — Redação + análise de competências",
        ],
      },
    },
  },

  "Out/26": {
    phase: "enem",
    milestones: [
      "📊 Simulado 5 — ENEM Dia 1 completo (Linguagens + Matemática) — sem 18",
      "📊 Simulado 6 — ENEM Dia 2 completo (Ciências da Natureza + RED) — sem 19",
      "📊 Simulado 7 — ENEM completo Dias 1 e 2 em sequência (10h) — sem 20",
      "📋 ENEM em ~30 dias — reta final",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "NHK Web Easy"],
        notes: "N3 introdução. Não sacrificar japonês pela reta final do ENEM.",
        topics: [
          "Sem 19 — N3 introdução: novos kanjis e gramática",
          "Sem 20 — N3: vocabulário",
          "Sem 20 — N3: gramática",
          "Anki diário: manter N5 + consolidar N4 + iniciar N3",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes:
          "Foco total em provas anteriores ENEM. Não aprender tópico novo — consolidar o que já sabe.",
        topics: [
          "Sem 19 — Tópicos maior incidência ENEM: funções, geometria, probabilidade",
          "Sem 20 — Simulado 7: ENEM completo (Dias 1+2 em sequência, 10h)",
          "Sem 21 — Revisão dos 5 maiores erros — Matemática",
          "Sem 22 — Revisão leve: apenas fórmulas e macetes (sem exercícios longos)",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes: "",
        topics: [
          "Sem 19 — Tópicos maior incidência ENEM: mecânica, eletricidade, óptica",
          "Sem 21 — Revisão dos 5 maiores erros — Física",
          "Sem 22 — Revisão leve: esquemas e mapas mentais",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes: "",
        topics: [
          "Sem 19 — QUI4: Aldeídos, Cetonas e Ácidos Carboxílicos + Derivados + Aminas",
          "Sem 19 — Tópicos maior incidência ENEM: orgânica, estequiometria, equilíbrio",
          "Sem 21 — Revisão dos 5 maiores erros — Química",
          "Sem 22 — Revisão leve: esquemas e mapas mentais",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas ENEM"],
        notes: "",
        topics: [
          "Sem 19 — Tópicos maior incidência ENEM: Linguagens e Inglês",
          "Sem 21 — Revisão dos 5 maiores erros — Inglês",
          "Sem 22 — Revisão leve POR e ING",
        ],
      },
      portuguese: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes: "Última rodada de treino de redação — semana 21.",
        topics: [
          "Sem 19 — Simulado 6 Dia 2: Ciências da Natureza + RED",
          "Sem 20 — Tópicos maior incidência ENEM: Linguagens",
          "Sem 21 — Última rodada de treino: 1 redação completa",
          "Sem 22 — Revisão estrutura + proposta de intervenção (30 min apenas)",
        ],
      },
    },
  },

  /* ══════════════════════════
     ENEM — NOVEMBRO 2026
  ══════════════════════════ */
  "Nov/26": {
    phase: "enem",
    milestones: [
      "🎯 ENEM Dia 1 — 8 de novembro (Linguagens, Humanas, Redação)",
      "🎯 ENEM Dia 2 — 15 de novembro (Ciências da Natureza, Matemática)",
      "📊 Simulado 8 — ENEM completo com cronômetro — semana 21",
      "📋 Pós-ENEM: análise de desempenho + planejamento para 2027",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "NHK Web Easy"],
        notes:
          "Sem 23–24: manter rotina matinal sem pressão. Pós-ENEM (16/nov): N3 com intensidade moderada.",
        topics: [
          "Sem 21 — N3: manutenção leve durante reta final",
          "Sem 22–24 — Manutenção: Anki diário apenas",
          "Sem 25 (pós-ENEM) — N3: reinício com intensidade moderada",
          "Sem 26 — N3: retomada gradual",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Provas ENEM"],
        notes:
          "Sem 22: revisão mínima 30 min/dia. Sem 23: logística da prova. Sem 24: só descanso.",
        topics: [
          "Sem 21 — Simulado 8 (condições reais) + revisão de erros",
          "Sem 22 — Revisão mínima: fórmulas essenciais, 30 min/dia",
          "Sem 23 — Confirmar local, horário, documentos — descanso",
          "Sem 24 — ENEM DIA 2 (Matemática e Ciências da Natureza)",
          "Sem 25 (pós-ENEM) — Análise: erros em Matemática",
          "Sem 26–28 — Retomada gradual: revisão temática MAT1–MAT5",
        ],
      },
      physics: {
        priority: "alta",
        resources: [],
        notes: "",
        topics: [
          "Sem 22 — Revisão mínima: fórmulas essenciais",
          "Sem 24 — ENEM DIA 2 (Ciências da Natureza)",
          "Sem 25 (pós-ENEM) — Análise: erros em Física",
          "Sem 26–28 — Retomada gradual: revisão temática FIS1–FIS4",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: [],
        notes: "",
        topics: [
          "Sem 22 — Revisão mínima: fórmulas e macetes",
          "Sem 24 — ENEM DIA 2 (Ciências da Natureza)",
          "Sem 25 (pós-ENEM) — Análise: erros em Química",
          "Sem 26–28 — Retomada gradual: revisão temática QUI1–QUI4",
        ],
      },
      english: {
        priority: "baixa",
        resources: [],
        notes: "Pós-ENEM: manutenção via leitura científica diária.",
        topics: [
          "Sem 22–24 — Manutenção leve",
          "Sem 25–28 — Leitura científica diária (30 min)",
        ],
      },
      portuguese: {
        priority: "alta",
        resources: [],
        notes: "Pós-ENEM: análise da redação para feedback pessoal.",
        topics: [
          "Sem 22 — Revisão estrutura e proposta de intervenção (30 min)",
          "Sem 23 — ENEM DIA 1 (Linguagens, Humanas e Redação)",
          "Sem 25 (pós-ENEM) — Análise: feedback da Redação e Linguagens",
        ],
      },
    },
  },

  /* ══════════════════════════
     FASE 3 — TRANSIÇÃO
     Dez/26
  ══════════════════════════ */
  "Dez/26": {
    phase: "base",
    milestones: [
      "📋 Resultado ENEM (divulgação ~dezembro)",
      "📊 Simulado diagnóstico pós-ENEM (MAT+FIS+QUI estilo MEXT) — sem 27/28",
      "📋 SISU — verificar datas de inscrição (~janeiro/27)",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "NHK Web Easy"],
        notes:
          "Japonês é a única matéria que não reduz no recesso. 1h diária mínima.",
        topics: [
          "Sem 27–28 — N3: estudo regular (1h diária)",
          "Sem 29–30 — N3: 1h diária (não parar — é a que mais demanda tempo contínuo)",
          "Anki diário: manter N5 + N4 + consolidar N3",
        ],
      },
      math: {
        priority: "média",
        resources: ["Iezzi"],
        notes:
          "Ritmo reduzido no recesso. Simulado diagnóstico nas semanas 27–28 para mapear pontos fracos pré-MEXT.",
        topics: [
          "Sem 27–28 — Revisão temática MAT1–MAT5 (1 bloco por dia)",
          "Sem 27–28 — Simulado diagnóstico estilo MEXT",
          "Sem 29–30 — Revisão leve: 30 min/dia, dias alternados",
        ],
      },
      physics: {
        priority: "média",
        resources: [],
        notes: "",
        topics: [
          "Sem 27–28 — Revisão temática FIS1–FIS4 (1 bloco por dia)",
          "Sem 27–28 — Simulado diagnóstico estilo MEXT",
          "Sem 29–30 — Revisão leve: 30 min/dia, dias alternados",
        ],
      },
      chemistry: {
        priority: "média",
        resources: [],
        notes: "",
        topics: [
          "Sem 27–28 — Revisão temática QUI1–QUI4 (1 bloco por dia)",
          "Sem 27–28 — Simulado diagnóstico estilo MEXT",
          "Sem 29–30 — Revisão leve: 30 min/dia, dias alternados",
        ],
      },
      english: {
        priority: "baixa",
        resources: [],
        notes: "",
        topics: ["Sem 27–30 — Leitura científica diária (30 min)"],
      },
    },
  },

  /* ══════════════════════════
     FASE 4 — MEXT + EFOMM
     Jan/27 a Mar/27
  ══════════════════════════ */
  "Jan/27": {
    phase: "base",
    milestones: [
      "📋 SISU — inscrições e resultado",
      "📊 Simulado MEXT parcial (MAT+FIS) — semana 31",
      "📊 Simulado MEXT parcial (QUI+ING) — semana 32",
      "📊 Simulado MEXT completo 1 (MAT+FIS+QUI+ING) — semana 33",
      "📊 Simulado EFOMM 1 — semana 34",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "NHK Web Easy"],
        notes:
          "Tema do mês: Mecânica, Álgebra e Química Inorgânica — nível MEXT. Sábado: N3 estudo principal.",
        topics: [
          "Sem 31 — N3: gramática",
          "Sem 32 — N3: kanji (50 novos)",
          "Sem 33 — N3: listening e conversação básica",
          "Sem 34 — N3: consolidação",
          "Anki diário: N5+N4+N3",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Iezzi", "Provas MEXT"],
        notes:
          "Tema do mês: Mecânica e Álgebra nível MEXT. Resolver provas MEXT anteriores de Matemática.",
        topics: [
          "Sem 31 — MAT1: Funções e Logaritmos — exercícios nível MEXT",
          "Sem 32 — MAT2+MAT3: Combinatória, Probabilidade e Polinômios — MEXT",
          "Sem 33 — MAT4: Trigonometria completa — exercícios nível MEXT (alta incidência)",
          "Sem 34 — MAT5: Geometria Plana e Espacial — exercícios nível MEXT",
          "Simulado MEXT completo 1 — semana 33",
          "Simulado EFOMM 1 — semana 34",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Tópicos de Física Vol.1", "Provas MEXT"],
        notes: "",
        topics: [
          "Sem 31 — FIS1: Cinemática e Dinâmica — exercícios nível MEXT",
          "Sem 32 — FIS1: Estática, Hidrostática e Energia — MEXT",
          "Sem 33 — FIS2: Termologia completa — MEXT",
          "Sem 34 — FIS2: Ondas, MHS e Acústica — MEXT",
          "Simulado MEXT completo 1 — semana 33",
          "Simulado EFOMM 1 — semana 34",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Feltre", "Provas MEXT"],
        notes: "Tema do mês: Química Inorgânica nível MEXT.",
        topics: [
          "Sem 31 — QUI1+QUI2: Estequiometria e Gases — exercícios nível MEXT",
          "Sem 32 — QUI3: Equilíbrio Químico e Termodinâmica Química — MEXT",
          "Sem 33 — QUI4: Orgânica completa — MEXT (reações, isomeria, funções)",
          "Sem 34 — QUI3: Eletroquímica — MEXT (alta incidência)",
          "Simulado MEXT completo 1 — semana 33",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas MEXT"],
        notes: "Resolver provas MEXT anteriores de inglês.",
        topics: [
          "Sem 31 — Prova MEXT anterior — Inglês B completo (resolução + análise)",
          "Sem 32 — Writing científico intermediário + leitura acadêmica",
          "Sem 33 — Prova MEXT anterior — resolução e análise",
          "Sem 34 — Leitura de artigos científicos em inglês (exatas)",
        ],
      },
      portuguese: {
        priority: "baixa",
        resources: ["Provas EFOMM"],
        notes: "Apenas para EFOMM 2027.",
        topics: [
          "Sem 34 — Redação dissertativa EFOMM (1 texto)",
          "Sem 34 — Revisão para Simulado EFOMM 1",
        ],
      },
    },
  },

  "Fev/27": {
    phase: "base",
    milestones: [
      "📊 Simulado MEXT completo 2 — semana 35/36",
      "📊 Simulado EFOMM 2 — semana 37",
      "📊 Simulado MEXT completo 3 — semana 38",
      "📋 Tema do mês: Eletricidade, Óptica e Química Orgânica",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "NHK Web Easy"],
        notes: "Sábado: dia principal de Japonês. Não reduzir.",
        topics: [
          "Sem 35 — N3: gramática avançada",
          "Sem 36 — N3: leitura de textos intermediários",
          "Sem 37 — N3: simulado parcial nível N3",
          "Sem 38 — N3: consolidação e revisão de erros",
          "Anki diário: N5+N4+N3",
          "NHK Web Easy: 1 artigo/semana",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Iezzi", "Provas MEXT", "Provas EFOMM"],
        notes:
          "Foco em MAT4 (Geometria Analítica avançada) e integração com Física para MEXT.",
        topics: [
          "Sem 35 — MAT4: GA avançada (circunferências, cônicas) — MEXT",
          "Sem 36 — MAT4: Trigonometria avançada — identidades e equações",
          "Sem 37 — MAT1–MAT5: revisão integrada — EFOMM",
          "Sem 38 — MAT: revisão dos erros dos simulados",
          "Simulado MEXT completo 2 — sem 35/36",
          "Simulado EFOMM 2 — semana 37",
          "Simulado MEXT completo 3 — semana 38",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Tópicos de Física Vol.2", "Provas MEXT", "Provas EFOMM"],
        notes: "Tema do mês: Eletricidade e Óptica.",
        topics: [
          "Sem 35 — FIS3: Eletrização, Campo Elétrico e Potencial — MEXT",
          "Sem 36 — FIS3: Eletrodinâmica, Resistores e Circuitos — MEXT",
          "Sem 37 — FIS4: Óptica Geométrica I e II + Lentes — MEXT",
          "Sem 37 — FIS1–FIS4: revisão integrada — EFOMM",
          "Sem 38 — FIS: revisão dos erros dos simulados",
          "Simulado EFOMM 2 — semana 37",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Feltre", "Provas MEXT", "Provas EFOMM"],
        notes: "Tema do mês: Química Orgânica avançada.",
        topics: [
          "Sem 35 — QUI4: Álcoois, Éteres, Fenóis, Aldeídos e Cetonas — MEXT",
          "Sem 36 — QUI4: Ácidos Carboxílicos, Derivados e Aminas — MEXT",
          "Sem 37 — QUI1–QUI4: revisão integrada — EFOMM",
          "Sem 38 — QUI3: Eletroquímica aprofundada — MEXT",
          "Simulado EFOMM 2 — semana 37",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "",
        topics: [
          "Sem 35 — Writing científico: estrutura de artigo acadêmico",
          "Sem 36 — Leitura de artigos científicos em inglês",
          "Sem 37 — Simulado inglês EFOMM",
          "Sem 38 — Simulado inglês MEXT",
        ],
      },
      portuguese: {
        priority: "baixa",
        resources: ["Provas EFOMM"],
        notes: "Apenas para EFOMM 2027.",
        topics: [
          "Sem 37 — Revisão POR para Simulado EFOMM 2",
          "Sem 38 — Redação dissertativa EFOMM (1 texto)",
        ],
      },
    },
  },

  "Mar/27": {
    phase: "base",
    milestones: [
      "📊 Simulado MEXT completo semanal — a partir desta semana",
      "📊 Simulado EFOMM semanal — a partir desta semana",
      "📋 Tema do mês: Física Moderna, Termodinâmica e consolidação geral",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Anki", "NHK Web Easy", "Provas MEXT japonês"],
        notes:
          "Sábado: simulado parcial estilo MEXT de japonês. Começar a praticar redação em japonês.",
        topics: [
          "N3: gramática avançada — semanas 39–42",
          "Simulado parcial de japonês estilo MEXT — sábados",
          "Praticar redação em japonês: 自己紹介 (apresentação)",
          "N3: vocabulário e leitura",
          "Anki diário",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "Simulados semanais. Revisão dirigida pelos erros.",
        topics: [
          "Simulados MEXT semanais: MAT (todos os blocos MAT1–MAT5)",
          "Simulados EFOMM semanais: MAT",
          "Revisão dirigida pelos erros identificados nos simulados",
          "MAT2: Números Complexos e Polinômios — aprofundamento MEXT",
          "MAT4: Cônicas e Geometria Analítica — aprofundamento MEXT",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "Tema do mês: Física Moderna e Termodinâmica.",
        topics: [
          "FIS4: Física Quântica — efeito fotoelétrico, Bohr, dualidade onda-partícula",
          "FIS4: Relatividade Restrita — dilatação do tempo, contração do espaço",
          "FIS2: MHS aprofundado + Ondas estacionárias",
          "FIS1: Treliças e Hidrodinâmica (alta incidência MEXT)",
          "Simulados MEXT e EFOMM semanais: FIS",
          "Revisão dirigida pelos erros",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "",
        topics: [
          "QUI3: Equilíbrio Ácido-Base aprofundado (Ka, Kb, pH, pOH)",
          "QUI3: Eletrólise — ígnea e aquosa, lei de Faraday",
          "QUI3: Termodinâmica Química (ΔG, ΔH, ΔS, espontaneidade)",
          "QUI4: Isomeria Espacial (enantiômeros, diastereômeros)",
          "Simulados MEXT e EFOMM semanais: QUI",
          "Revisão dirigida pelos erros",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "",
        topics: [
          "Simulados MEXT semanais: Inglês",
          "Simulados EFOMM semanais: Inglês",
          "Leitura de artigos científicos em inglês (área de exatas)",
          "Revisão de vocabulário técnico MEXT",
        ],
      },
      portuguese: {
        priority: "baixa",
        resources: ["Provas EFOMM"],
        notes: "Apenas para EFOMM 2027.",
        topics: ["Simulados EFOMM semanais: POR", "1 redação EFOMM por mês"],
      },
    },
  },

  /* ══════════════════════════
     FASE 5 — INTENSIVÃO
     Abr/27 a Jun/27
  ══════════════════════════ */
  "Abr/27": {
    phase: "prep",
    milestones: [
      "⚠️ Verificar abertura de inscrições MEXT 2027 (Embaixada do Japão)",
      "📊 Simulado MEXT completo — 1 por semana",
      "📊 Simulado EFOMM completo — 1 por semana",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Provas MEXT japonês", "Anki"],
        notes:
          "⚠️ Inscrições MEXT costumam abrir em abril/maio. Verificar Embaixada do Japão.",
        topics: [
          "Simulados semanais cronometrados de japonês estilo MEXT",
          "Revisão e análise de cada erro sistematicamente",
          "Redação em japonês: 志望動機 (motivação) e 自己紹介 (apresentação)",
          "Frases para entrevista — praticar em voz alta",
          "N3: consolidação de gramática e vocabulário",
          "Anki diário: N5+N4+N3",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "Nenhum tópico novo. Apenas consolidação e simulados semanais.",
        topics: [
          "Simulados semanais MEXT: MAT (cronometrado)",
          "Simulados semanais EFOMM: MAT (cronometrado)",
          "Revisão focada nos tipos de questão que mais erra",
          "Verificar edital MEXT: confirmar tópicos para área de interesse",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "",
        topics: [
          "Simulados semanais MEXT: FIS (cronometrado)",
          "Simulados semanais EFOMM: FIS (cronometrado)",
          "FIS4: Física Quântica — princípio da incerteza (conceitual)",
          "Revisão de FIS1–FIS4: lista de fórmulas e constantes essenciais",
          "Identificar e reforçar tópicos com mais erros nos simulados",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "",
        topics: [
          "Simulados semanais MEXT: QUI (cronometrado)",
          "Simulados semanais EFOMM: QUI (cronometrado)",
          "QUI3: Termodinâmica Química — revisão consolidação",
          "QUI3: Entropia e Energia Livre de Gibbs",
          "Consolidação final QUI1–QUI4: revisão por frente",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "",
        topics: [
          "Simulados semanais MEXT: Inglês (cronometrado)",
          "Simulados semanais EFOMM: Inglês (cronometrado)",
          "Vocabulário científico avançado para MEXT e EFOMM",
          "Interpretação de gráficos e tabelas em inglês",
        ],
      },
      portuguese: {
        priority: "baixa",
        resources: ["Provas EFOMM"],
        notes: "Apenas para EFOMM 2027.",
        topics: [
          "Simulados semanais EFOMM: POR (cronometrado)",
          "1 redação EFOMM por mês",
        ],
      },
    },
  },

  "Mai/27": {
    phase: "prep",
    milestones: [
      "📋 Prazo final de inscrição MEXT (confirmar na Embaixada)",
      "📊 Simulado MEXT completo — 1 por semana",
      "📊 Simulado EFOMM completo — 1 por semana",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Todas as provas MEXT disponíveis", "Anki"],
        notes: "Sprint final de japonês. Nada de novo — consolide o que sabe.",
        topics: [
          "Intensificação: resolver TODAS as provas MEXT de japonês disponíveis",
          "Revisão intensiva de gramática N3/N4 — erros recorrentes",
          "2 artigos NHK Web Easy por dia + revisão de kanji",
          "Lista pessoal de erros: revisar diariamente",
          "Praticar 志望動機 e 自己紹介 em voz alta",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM", "Suas anotações"],
        notes: "Não tente aprender nada novo. Consolide.",
        topics: [
          "Resolver + revisar TODAS as provas MEXT de Matemática disponíveis",
          "Criar folha de referência pessoal por frente (MAT1–MAT5)",
          "Focar no que você erra, não no que já domina",
          "Simulados semanais MEXT e EFOMM: MAT",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM", "Suas anotações"],
        notes: "",
        topics: [
          "Resolver + revisar TODAS as provas MEXT de Física disponíveis",
          "Folha de referência: fórmulas e constantes (FIS1–FIS4)",
          "Revisão expressa: Hidrodinâmica e Treliças (costumam ser eliminatórias)",
          "Simulados semanais MEXT e EFOMM: FIS",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Provas MEXT", "Provas EFOMM", "Suas anotações"],
        notes: "",
        topics: [
          "Resolver + revisar TODAS as provas MEXT de Química disponíveis",
          "Folha de referência por frente: QUI1–QUI4",
          "Reações orgânicas principais: resumo em 1 página",
          "Simulados semanais MEXT e EFOMM: QUI",
        ],
      },
      english: {
        priority: "média",
        resources: ["Provas MEXT", "Provas EFOMM"],
        notes: "",
        topics: [
          "Simulados semanais MEXT e EFOMM: Inglês",
          "Folha de vocabulário técnico: termos mais difíceis",
        ],
      },
      portuguese: {
        priority: "baixa",
        resources: ["Provas EFOMM"],
        notes: "",
        topics: ["Simulados semanais EFOMM: POR", "1 redação EFOMM por mês"],
      },
    },
  },

  "Jun/27": {
    phase: "sprint",
    milestones: [
      "🎯 MEXT — prova escrita (data a confirmar, costuma ser junho/julho)",
      "🎯 EFOMM 2027 — data a confirmar (~julho/2027)",
      "⚠️ Semana da prova: descanso estratégico — nada de novo",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Suas anotações"],
        notes: "Semana da prova MEXT: descanso é tão importante quanto estudo.",
        topics: [
          "Revisão leve: 1h matinal (reduzir da intensificação)",
          "Escuta passiva para manter ritmo auditivo",
          "Reler resumos pessoais de gramática N3/N4",
          "Semana da prova MEXT: apenas flashcards e escuta passiva",
          "Preparar discurso de entrevista: 自己紹介 e 志望動機",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Suas anotações"],
        notes: "Descanso completo nos 2 dias anteriores à prova.",
        topics: [
          "Revisão leve: 1 exercício/dia por frente até 3 dias antes",
          "Ler folha de referência pessoal — MAT1–MAT5",
          "Descanso completo nos 2 dias anteriores à prova MEXT",
          "Simulados EFOMM: continuar 1 por semana (EFOMM ainda virá)",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Suas anotações"],
        notes: "",
        topics: [
          "Revisão leve: FIS1–FIS4 — conceitos e fórmulas essenciais",
          "Folha de referência: constantes físicas (g, c, h, e)",
          "Descanso antes da prova MEXT",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Suas anotações"],
        notes: "",
        topics: [
          "Revisão leve: QUI1–QUI4 — tabela periódica e reações essenciais",
          "Folha de referência: fórmulas de equilíbrio, pH, potencial",
          "Descanso antes da prova MEXT",
        ],
      },
      english: {
        priority: "média",
        resources: ["Suas anotações"],
        notes: "A entrevista MEXT pode ser em inglês.",
        topics: [
          "Preparar respostas de entrevista em inglês: Why Japan?, What will you research?",
          "Vocabulário: field of study, research focus, career goals",
          "Manutenção leve: leitura científica",
        ],
      },
      portuguese: {
        priority: "baixa",
        resources: ["Provas EFOMM"],
        notes: "",
        topics: ["Simulados EFOMM: POR (manutenção)"],
      },
    },
  },

  /* ══════════════════════════
     FASE 6 — RETA FINAL
     Jul/27
  ══════════════════════════ */
  "Jul/27": {
    phase: "sprint",
    milestones: [
      "🎯 EFOMM 2027 — data a confirmar (~julho)",
      "🎯 Entrevista MEXT (se aprovado na prova escrita)",
      "🎉 Resultado final MEXT 2027",
    ],
    subjects: {
      japanese: {
        priority: "crítica",
        resources: ["Suas anotações"],
        notes:
          "Entrevista MEXT pode ser em japonês e/ou inglês. Prepare os dois.",
        topics: [
          "志望動機 e 自己紹介 em voz alta diariamente",
          "Vocabulário técnico da área de interesse em japonês",
          "Apresentação pessoal formal: praticar até fluir naturalmente",
          "Simulação de entrevista: respostas para perguntas típicas",
          "Anki: manutenção diária",
        ],
      },
      math: {
        priority: "alta",
        resources: ["Suas anotações"],
        notes: "Semana da EFOMM: descanso estratégico. Nada de novo.",
        topics: [
          "Revisão muito leve: reler folha de referência MAT1–MAT5",
          "Resolver 3 questões fáceis de cada frente para manter confiança",
          "Descanso 2 dias antes da EFOMM 2027",
        ],
      },
      physics: {
        priority: "alta",
        resources: ["Suas anotações"],
        notes: "",
        topics: [
          "Revisão muito leve: reler folha de referência FIS1–FIS4",
          "Descanso antes da EFOMM 2027",
        ],
      },
      chemistry: {
        priority: "alta",
        resources: ["Suas anotações"],
        notes: "",
        topics: [
          "Revisão muito leve: reler folha de referência QUI1–QUI4",
          "Descanso antes da EFOMM 2027",
        ],
      },
      english: {
        priority: "média",
        resources: [],
        notes: "Entrevista MEXT pode ser em inglês.",
        topics: [
          "Respostas de entrevista em inglês: motivação, objetivos, área de estudo",
          "Statement of purpose: objetivos acadêmicos no Japão",
          "Praticar pronúncia e fluência em frases curtas e diretas",
        ],
      },
      portuguese: {
        priority: "baixa",
        resources: ["Provas EFOMM"],
        notes: "",
        topics: [
          "Revisão leve POR para EFOMM 2027",
          "1 redação EFOMM final (revisão de estrutura)",
        ],
      },
    },
  },
};

/* ──────────────────────────────────────────────────
   ROOT APP
──────────────────────────────────────────────────── */
export default function App() {
  const [month, setMonth] = useState("Jun/26");
  const [tab, setTab] = useState("roteiro");
  const [data, setData] = useState({});
  const [allData, setAllData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef(null);

  const phase = phaseOf(month);
  const monthRaw = R[month] || {};
  const subjects = Object.keys(monthRaw.subjects || {});

  useEffect(() => {
    setLoaded(false);
    Db.get("month:" + month).then((d) => {
      setData(d);
      setLoaded(true);
    });
  }, [month]);

  const persist = (next) => {
    setData(next);
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await Db.set("month:" + month, next);
      setSaving(false);
    }, 700);
  };

  const toggleTopic = (s, i) => {
    const c = data?.topics?.[`${s}-${i}`] || {};
    persist({
      ...data,
      topics: {
        ...data.topics,
        [`${s}-${i}`]: { ...c, completed: !c.completed },
      },
    });
  };
  const setConf = (s, i, l) => {
    const c = data?.topics?.[`${s}-${i}`] || {};
    const nxt = c.confidence === l ? "none" : l;
    persist({
      ...data,
      topics: { ...data.topics, [`${s}-${i}`]: { ...c, confidence: nxt } },
    });
  };
  const setNote = (s, v) =>
    persist({ ...data, notes: { ...data.notes, [s]: v } });
  const setMNote = (v) => persist({ ...data, monthNote: v });

  const subjProg = (s, d2 = data, m2 = monthRaw) => {
    const ts = m2?.subjects?.[s]?.topics || [];
    const done = ts.filter(
      (_, i) => d2?.topics?.[`${s}-${i}`]?.completed
    ).length;
    return {
      done,
      total: ts.length,
      pct: ts.length ? Math.round((done / ts.length) * 100) : 0,
    };
  };

  useEffect(() => {
    if (tab === "progresso") {
      Db.getAll(ALL_MONTHS.map((m) => "month:" + m)).then((raw) => {
        const out = {};
        ALL_MONTHS.forEach((m) => {
          out[m] = raw["month:" + m] || {};
        });
        setAllData(out);
      });
    }
  }, [tab]);

  const F = (color, bg) => ({ color, bg });
  const pc = phase.color;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        fontFamily: "'Georgia',serif",
      }}
    >
      {/* HEADER */}
      <div style={{ background: "#0c1220", padding: "20px 16px 16px" }}>
        <div
          style={{
            fontSize: 9,
            color: "#475569",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 3,
            fontFamily: "system-ui,sans-serif",
          }}
        >
          Plano de Estudos Integrado
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
          }}
        >
          MEXT · EFOMM · ENEM
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            marginTop: 2,
            marginBottom: 14,
            fontFamily: "system-ui,sans-serif",
          }}
        >
          Jun 2026 → Jul 2027 · {ALL_MONTHS.length} meses · Acordar 06:10 | Sair
          06:55
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EXAMS.map((e) => {
            const d = daysUntil(e.date);
            return (
              <div
                key={e.name}
                style={{
                  background: "#171f2e",
                  border: `1px solid ${d < 90 ? e.color + "55" : "#1e293b"}`,
                  borderRadius: 10,
                  padding: "8px 11px",
                  minWidth: 90,
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: "#64748b",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  {e.name}
                  {e.approx ? " (prev.)" : ""}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: d < 60 ? "#f87171" : d < 120 ? "#fbbf24" : "#86efac",
                    lineHeight: 1.1,
                    marginTop: 2,
                    fontFamily: "Georgia,serif",
                  }}
                >
                  {d > 0 ? `${d}d` : "HOJE"}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    color: "#475569",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  {new Date(e.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE NAV */}
      <div style={{ background: "#131c2e", overflowX: "auto" }}>
        <div style={{ display: "flex" }}>
          {PHASES.map((p) => {
            const a = p.months.includes(month);
            return (
              <button
                key={p.id}
                onClick={() => setMonth(p.months[0])}
                style={{
                  flex: "none",
                  padding: "8px 12px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: a ? p.color : "#334155",
                  borderBottom: `2px solid ${a ? p.color : "transparent"}`,
                  whiteSpace: "nowrap",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MONTH TABS */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          overflowX: "auto",
        }}
      >
        <div style={{ display: "flex" }}>
          {ALL_MONTHS.map((m) => {
            const p = phaseOf(m),
              sel = m === month;
            return (
              <button
                key={m}
                onClick={() => setMonth(m)}
                style={{
                  flex: "none",
                  padding: "9px 11px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: sel ? 800 : 500,
                  color: sel ? p.color : "#6b7280",
                  borderBottom: `2.5px solid ${sel ? p.color : "transparent"}`,
                  whiteSpace: "nowrap",
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB BAR */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
        }}
      >
        {[
          ["roteiro", "📋 Roteiro"],
          ["semana", "📅 Semana"],
          ["progresso", "📊 Progresso"],
        ].map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: tab === t ? 800 : 500,
              color: tab === t ? pc : "#6b7280",
              borderBottom: `2.5px solid ${tab === t ? pc : "transparent"}`,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            {l}
          </button>
        ))}
        {saving && (
          <div
            style={{
              padding: "0 10px",
              fontSize: 10,
              color: "#94a3b8",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            💾
          </div>
        )}
      </div>

      <div style={{ padding: "14px 12px 40px" }}>
        {/* Phase badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: phase.bg,
            border: `1.5px solid ${pc}44`,
            borderRadius: 8,
            padding: "4px 10px",
            marginBottom: 10,
          }}
        >
          <div
            style={{ width: 6, height: 6, borderRadius: "50%", background: pc }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: pc,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            {phase.label}
          </span>
        </div>

        {/* Milestones */}
        {monthRaw.milestones?.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #fbbf24",
              borderRadius: 10,
              padding: "10px 13px",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#92400e",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 6,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              Marcos do Mês
            </div>
            {monthRaw.milestones.map((ms, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: "#1f2937",
                  padding: "4px 0",
                  borderBottom:
                    i < monthRaw.milestones.length - 1
                      ? "1px solid #fef3c7"
                      : "none",
                  fontWeight: 600,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                {ms}
              </div>
            ))}
          </div>
        )}

        {tab === "roteiro" && loaded && (
          <>
            <textarea
              value={data.monthNote || ""}
              onChange={(e) => setMNote(e.target.value)}
              placeholder="📝 Anotação geral do mês — como está indo? O que está difícil? Insights?"
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 10,
                border: "1.5px solid #e2e8f0",
                padding: "10px 12px",
                fontSize: 12,
                color: "#374151",
                resize: "vertical",
                minHeight: 58,
                fontFamily: "system-ui,sans-serif",
                outline: "none",
                background: "#fff",
                marginBottom: 12,
              }}
            />
            {subjects.map((s) => (
              <SubjectCard
                key={s}
                subj={s}
                mdata={monthRaw.subjects[s]}
                states={data.topics || {}}
                note={data.notes?.[s] || ""}
                onToggle={(i) => toggleTopic(s, i)}
                onConf={(i, l) => setConf(s, i, l)}
                onNote={(v) => setNote(s, v)}
                prog={subjProg(s)}
                phaseColor={pc}
              />
            ))}
          </>
        )}

        {tab === "semana" && loaded && (
          <WeeklyView
            month={month}
            phase={phase}
            data={data}
            persist={persist}
          />
        )}

        {tab === "progresso" && (
          <ProgressView
            allData={allData}
            currentMonth={month}
            currentMonthRaw={monthRaw}
            subjects={subjects}
            subjProg={subjProg}
            currentData={data}
            phase={phase}
          />
        )}

        {(tab === "roteiro" || tab === "semana") && !loaded && (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              padding: 40,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            Carregando…
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   WEEKLY VIEW
──────────────────────────────────────────────────── */
function WeeklyView({ month, phase, data, persist }) {
  const [activeDay, setActiveDay] = useState("seg");
  const [weekNum, setWeekNum] = useState(1);

  const phaseId = phase.id;
  const schedule = WS[phaseId] || WS.efomm;
  const semKey = `sem${weekNum}`;
  const semSchedule = schedule[semKey] || schedule["sem1"] || {};
  const dayBlocks = semSchedule[activeDay] || [];
  const wKey = (day, bid) => `w${weekNum}_${day}_${bid}`;
  const getBlock = (day, bid) => data?.weekly?.[wKey(day, bid)] || {};
  const setBlock = (day, bid, patch) => {
    const cur = getBlock(day, bid);
    persist({
      ...data,
      weekly: { ...data.weekly, [wKey(day, bid)]: { ...cur, ...patch } },
    });
  };

  const daySummary = (day) => {
    const blks = semSchedule[day] || [];
    const planned = blks.reduce((a, b) => a + b.estMin, 0);
    const actual = blks.reduce((a, b) => {
      const v = parseInt(getBlock(day, b.id).actualMin || "0", 10) || 0;
      return a + v;
    }, 0);
    const done = blks.filter((b) => getBlock(day, b.id).done).length;
    return { planned, actual, done, total: blks.length };
  };

  const weekTotal = DAYS.reduce(
    (acc, d) => {
      const s = daySummary(d);
      return {
        planned: acc.planned + s.planned,
        actual: acc.actual + s.actual,
      };
    },
    { planned: 0, actual: 0 }
  );
  const pc = phase.color;
  const ds = daySummary(activeDay);

  return (
    <div>
      {/* Week selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#6b7280",
            fontFamily: "system-ui,sans-serif",
            fontWeight: 600,
          }}
        >
          Semana:
        </span>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setWeekNum(n)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: `1.5px solid ${weekNum === n ? pc : "#e2e8f0"}`,
              background: weekNum === n ? pc : "#fff",
              color: weekNum === n ? "#fff" : "#6b7280",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "system-ui,sans-serif",
            }}
          >
            {n}
          </button>
        ))}
        <div
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "#6b7280",
            fontFamily: "system-ui,sans-serif",
            textAlign: "right",
          }}
        >
          <div>
            📅 <b style={{ color: pc }}>{fmt(weekTotal.planned)}</b> planejado
          </div>
          <div>
            ⏱ <b style={{ color: "#16a34a" }}>{fmt(weekTotal.actual)}</b>{" "}
            realizado
          </div>
        </div>
      </div>

      {/* Day tabs */}
      <div
        style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}
      >
        {DAYS.map((d) => {
          const s = daySummary(d),
            sel = d === activeDay,
            allDone = s.total > 0 && s.done === s.total;
          return (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              style={{
                flex: "none",
                padding: "6px 10px",
                borderRadius: 10,
                border: `1.5px solid ${
                  sel ? pc : allDone ? "#86efac" : "#e2e8f0"
                }`,
                background: sel ? pc : allDone ? "#f0fdf4" : "#fff",
                color: sel ? "#fff" : allDone ? "#16a34a" : "#374151",
                fontWeight: sel ? 800 : 600,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "system-ui,sans-serif",
                textAlign: "center",
              }}
            >
              <div>{DAY_SHORT[d]}</div>
              <div style={{ fontSize: 8, marginTop: 1, opacity: 0.8 }}>
                {s.done}/{s.total}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#111",
              fontFamily: "Georgia,serif",
            }}
          >
            {DAY_LABELS[activeDay]}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#6b7280",
              fontFamily: "system-ui,sans-serif",
              marginTop: 2,
            }}
          >
            Sem. {weekNum} · {fmt(ds.planned)} planejado · {fmt(ds.actual)}{" "}
            realizado
            {activeDay === "seg" && (
              <span style={{ color: "#94a3b8", marginLeft: 6 }}>
                · Acordar 06:10 · Sair 06:55
              </span>
            )}
            {activeDay !== "sab" &&
              activeDay !== "dom" &&
              activeDay !== "seg" && (
                <span style={{ color: "#94a3b8", marginLeft: 6 }}>
                  · Acordar 06:10 · Sair 06:55
                </span>
              )}
          </div>
        </div>
        {ds.planned > 0 && (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: `3px solid ${pc}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: pc,
                lineHeight: 1,
              }}
            >
              {ds.done}
            </div>
            <div style={{ fontSize: 8, color: "#9ca3af", lineHeight: 1 }}>
              /{ds.total}
            </div>
          </div>
        )}
      </div>

      {/* Day note */}
      <textarea
        value={data?.weekly?.[`w${weekNum}_note_${activeDay}`] || ""}
        onChange={(e) =>
          persist({
            ...data,
            weekly: {
              ...data.weekly,
              [`w${weekNum}_note_${activeDay}`]: e.target.value,
            },
          })
        }
        placeholder="📝 Nota do dia — como foi? O que ficou pendente? Dificuldades?"
        style={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: 10,
          border: "1.5px solid #e2e8f0",
          padding: "9px 11px",
          fontSize: 12,
          color: "#374151",
          resize: "vertical",
          minHeight: 50,
          fontFamily: "system-ui,sans-serif",
          outline: "none",
          background: "#fff",
          marginBottom: 12,
        }}
      />

      {/* Blocks */}
      {dayBlocks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 30,
            color: "#94a3b8",
            fontSize: 13,
            fontFamily: "system-ui,sans-serif",
          }}
        >
          Nenhum bloco definido para este dia nesta fase.
        </div>
      ) : (
        dayBlocks.map((blk) => (
          <BlockCard
            key={blk.id}
            blk={blk}
            state={getBlock(activeDay, blk.id)}
            phaseColor={pc}
            onChange={(patch) => setBlock(activeDay, blk.id, patch)}
          />
        ))
      )}

      {/* Legend */}
      <div
        style={{
          marginTop: 10,
          padding: "10px 12px",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#6b7280",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: "system-ui,sans-serif",
          }}
        >
          Tipo de Bloco
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.entries(BTYPE).map(([k, v]) => (
            <span
              key={k}
              style={{
                fontSize: 10,
                background: "#f8fafc",
                border: `1px solid ${v.color}44`,
                borderRadius: 6,
                padding: "2px 7px",
                color: v.color,
                fontWeight: 700,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              ● {v.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   BLOCK CARD
──────────────────────────────────────────────────── */
function BlockCard({ blk, state, phaseColor, onChange }) {
  const [open, setOpen] = useState(false);
  const subj = SUBJ[blk.subj] || {};
  const btype = BTYPE[blk.type] || BTYPE.self;
  const done = !!state.done;
  const actualMin = state.actualMin || "";
  const note = state.note || "";
  const efficiency =
    actualMin && blk.estMin
      ? Math.round((parseInt(actualMin, 10) / blk.estMin) * 100)
      : null;

  return (
    <div
      style={{
        border: `1.5px solid ${done ? "#86efac" : subj.accent || "#e2e8f0"}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
        background: "#fff",
        boxShadow: open
          ? "0 4px 16px rgba(0,0,0,0.09)"
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: done ? "#f0fdf4" : open ? subj.light : "#fff",
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onChange({ done: !done })}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `2px solid ${done ? subj.color : "#d1d5db"}`,
            background: done ? subj.color : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {done && (
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>
              ✓
            </span>
          )}
        </button>
        {/* Icon */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: subj.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontFamily: "Georgia,serif",
            flexShrink: 0,
          }}
        >
          {subj.icon}
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setOpen(!open)}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#111",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {blk.slot}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: 20,
                background: "#f1f5f9",
                color: btype.color,
                border: `1px solid ${btype.color}33`,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {btype.label}
            </span>
            <span
              style={{
                fontSize: 9,
                color: "#94a3b8",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {fmt(blk.estMin)}
            </span>
            {state.rating !== undefined && state.rating !== null && (
              <span style={{ fontSize: 14 }}>
                {"😣😐🙂😄".charAt(state.rating * 2) || ""}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: done ? "#9ca3af" : "#374151",
              marginTop: 2,
              lineHeight: 1.5,
              fontFamily: "system-ui,sans-serif",
              textDecoration: done ? "line-through" : "none",
            }}
          >
            {blk.what}
          </div>
        </div>
        <span
          onClick={() => setOpen(!open)}
          style={{
            color: subj.color,
            fontSize: 12,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          ▾
        </span>
      </div>

      {open && (
        <div
          style={{
            padding: "12px",
            background: subj.light,
            borderTop: `1px solid ${subj.accent}`,
          }}
        >
          {/* Time tracking */}
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 10,
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#475569",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              ⏱ Controle de Tempo
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 80 }}>
                <label
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 3,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Estimado
                </label>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#6b7280",
                    fontFamily: "Georgia,serif",
                  }}
                >
                  {fmt(blk.estMin)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 80 }}>
                <label
                  style={{
                    fontSize: 10,
                    color: "#16a34a",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: 3,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  Realizado (min)
                </label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  placeholder="0"
                  value={actualMin}
                  onChange={(e) => onChange({ actualMin: e.target.value })}
                  style={{
                    width: "100%",
                    fontSize: 18,
                    fontWeight: 800,
                    color: phaseColor,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontFamily: "Georgia,serif",
                    padding: 0,
                  }}
                />
              </div>
              {efficiency !== null && (
                <div style={{ flex: 1, minWidth: 70 }}>
                  <label
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 3,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    Eficiência
                  </label>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color:
                        efficiency >= 90
                          ? "#16a34a"
                          : efficiency >= 60
                          ? "#d97706"
                          : "#dc2626",
                      fontFamily: "Georgia,serif",
                    }}
                  >
                    {efficiency}%
                  </div>
                </div>
              )}
            </div>
            {efficiency !== null && (
              <div
                style={{
                  marginTop: 8,
                  height: 5,
                  background: "#f1f5f9",
                  borderRadius: 3,
                }}
              >
                <div
                  style={{
                    width: `${Math.min(efficiency, 120)}%`,
                    maxWidth: "100%",
                    height: 5,
                    borderRadius: 3,
                    background:
                      efficiency >= 90
                        ? "#22c55e"
                        : efficiency >= 60
                        ? "#f59e0b"
                        : "#ef4444",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <textarea
            value={note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="📝 Anotações — o que foi estudado, dificuldades, próximos passos, links…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              padding: "8px 10px",
              fontSize: 11,
              color: "#374151",
              resize: "vertical",
              minHeight: 60,
              fontFamily: "system-ui,sans-serif",
              outline: "none",
              background: "#fff",
            }}
          />

          {/* Rating */}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#6b7280",
                fontFamily: "system-ui,sans-serif",
                fontWeight: 600,
              }}
            >
              Desempenho:
            </span>
            {["😣", "😐", "🙂", "😄"].map((em, i) => (
              <button
                key={i}
                onClick={() =>
                  onChange({ rating: state.rating === i ? null : i })
                }
                style={{
                  fontSize: 18,
                  border: `2px solid ${
                    state.rating === i ? subj.color : "transparent"
                  }`,
                  borderRadius: 8,
                  padding: "2px 4px",
                  cursor: "pointer",
                  background: state.rating === i ? subj.light : "transparent",
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   SUBJECT CARD (Roteiro)
──────────────────────────────────────────────────── */
function SubjectCard({
  subj,
  mdata,
  states,
  note,
  onToggle,
  onConf,
  onNote,
  prog,
  phaseColor,
}) {
  const [open, setOpen] = useState(subj === "japanese");
  const [topicsOpen, setTopicsOpen] = useState(false);
  const cfg = SUBJ[subj] || {};
  const pr = PRIO[mdata?.priority] || PRIO.baixa;
  const { done, total, pct } = prog;
  const complete = pct === 100;

  return (
    <div
      style={{
        border: `1.5px solid ${complete ? "#86efac" : cfg.accent || "#e2e8f0"}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
        background: "#fff",
        boxShadow: open
          ? "0 4px 20px rgba(0,0,0,0.09)"
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* ── Header row ── */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 13px",
          background: complete ? "#f0fdf4" : open ? cfg.light : "#fff",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: cfg.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
            fontFamily: "Georgia,serif",
            flexShrink: 0,
          }}
        >
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "#111",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                background: pr.bg,
                color: pr.color,
                padding: "2px 6px",
                borderRadius: 20,
                border: `1px solid ${pr.color}33`,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {pr.label}
            </span>
            <span
              style={{
                fontSize: 8,
                color: "#9ca3af",
                background: "#f3f4f6",
                padding: "2px 5px",
                borderRadius: 6,
                fontFamily: "monospace",
              }}
            >
              {cfg.exam}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginTop: 5,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 4,
                background: "#f1f5f9",
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: 4,
                  background: complete ? "#22c55e" : cfg.color,
                  borderRadius: 3,
                  transition: "width 0.35s",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color: complete ? "#16a34a" : "#6b7280",
                fontWeight: 700,
                flexShrink: 0,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {done}/{total}
            </span>
          </div>
        </div>
        <span
          style={{
            color: cfg.color,
            fontSize: 14,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div
          style={{
            padding: "12px 13px 14px",
            background: cfg.light,
            borderTop: `1px solid ${cfg.accent}`,
          }}
        >
          {/* Note/dica */}
          {mdata.notes && (
            <div
              style={{
                marginBottom: 10,
                padding: "7px 10px",
                background: "#fff",
                borderLeft: `3px solid ${cfg.color}`,
                borderRadius: "0 7px 7px 0",
                fontSize: 11,
                color: "#4b5563",
                fontStyle: "italic",
                lineHeight: 1.55,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              💡 {mdata.notes}
            </div>
          )}

          {/* Resources */}
          {mdata.resources?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: cfg.color,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  marginBottom: 5,
                  fontFamily: "system-ui,sans-serif",
                }}
              >
                Materiais
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {mdata.resources.map((r, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      background: "#fff",
                      border: `1px solid ${cfg.accent}`,
                      borderRadius: 6,
                      padding: "3px 7px",
                      color: "#374151",
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    📚 {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Topics sub-dropdown ── */}
          {(mdata.topics || []).length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={() => setTopicsOpen(!topicsOpen)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 11px",
                  background: topicsOpen ? cfg.color : "#fff",
                  border: `1.5px solid ${cfg.color}`,
                  borderRadius: topicsOpen ? "8px 8px 0 0" : 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: topicsOpen ? "#fff" : cfg.color,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    📋 Tópicos do mês
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: topicsOpen
                        ? "rgba(255,255,255,0.25)"
                        : cfg.light,
                      color: topicsOpen ? "#fff" : cfg.color,
                      padding: "1px 7px",
                      borderRadius: 20,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {done}/{total}
                  </span>
                </div>
                <span
                  style={{
                    color: topicsOpen ? "#fff" : cfg.color,
                    fontSize: 12,
                    transform: topicsOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                >
                  ▾
                </span>
              </button>

              {topicsOpen && (
                <div
                  style={{
                    border: `1.5px solid ${cfg.color}`,
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                    background: "#fff",
                    padding: "8px 8px 6px",
                  }}
                >
                  {(mdata.topics || []).map((topic, i) => {
                    const st = states[`${subj}-${i}`] || {};
                    const conf = st.confidence || "none";
                    const isDone = !!st.completed;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          marginBottom: 5,
                          padding: "7px 9px",
                          background: isDone ? "#f0fdf4" : "#fafafa",
                          borderRadius: 7,
                          border: `1px solid ${isDone ? "#bbf7d0" : "#e5e7eb"}`,
                          opacity: isDone ? 0.8 : 1,
                        }}
                      >
                        <button
                          onClick={() => onToggle(i)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 5,
                            flexShrink: 0,
                            cursor: "pointer",
                            border: `2px solid ${
                              isDone ? cfg.color : "#d1d5db"
                            }`,
                            background: isDone ? cfg.color : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 1,
                          }}
                        >
                          {isDone && (
                            <span
                              style={{
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 12,
                            lineHeight: 1.5,
                            fontFamily: "system-ui,sans-serif",
                            color: isDone ? "#9ca3af" : "#1f2937",
                            textDecoration: isDone ? "line-through" : "none",
                          }}
                        >
                          {topic}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            flexShrink: 0,
                          }}
                        >
                          {["fraco", "ok", "dominei"].map((lvl) => {
                            const c = CONF[lvl];
                            const active = conf === lvl;
                            return (
                              <button
                                key={lvl}
                                onClick={() => onConf(i, lvl)}
                                style={{
                                  fontSize: 8,
                                  fontWeight: 700,
                                  padding: "2px 5px",
                                  borderRadius: 12,
                                  cursor: "pointer",
                                  border: `1px solid ${
                                    active ? c.color : "#e5e7eb"
                                  }`,
                                  background: active ? c.bg : "#fff",
                                  color: active ? c.color : "#d1d5db",
                                  fontFamily: "system-ui,sans-serif",
                                }}
                              >
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Weekly schedule sub-dropdown */}
          {mdata.weekly && (
            <div style={{ marginBottom: 10 }}>
              <button
                onClick={() => {}}
                style={{
                  width: "100%",
                  padding: "7px 11px",
                  background: "#fff",
                  border: `1.5px solid ${cfg.accent}`,
                  borderRadius: 8,
                  cursor: "default",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: cfg.color,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  📅 Cronograma semanal
                </div>
                <div style={{ marginTop: 6 }}>
                  {Object.entries(mdata.weekly).map(([sem, days]) => (
                    <div key={sem} style={{ marginBottom: 6 }}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: 3,
                          fontFamily: "system-ui,sans-serif",
                        }}
                      >
                        {sem === "sem1"
                          ? "Semana 1"
                          : sem === "sem2"
                          ? "Semana 2"
                          : sem === "sem3"
                          ? "Semana 3"
                          : "Semana 4"}
                      </div>
                      {Object.entries(days).map(([day, content]) => (
                        <div
                          key={day}
                          style={{
                            display: "flex",
                            gap: 6,
                            marginBottom: 2,
                            fontSize: 11,
                            fontFamily: "system-ui,sans-serif",
                          }}
                        >
                          <span
                            style={{
                              color: cfg.color,
                              fontWeight: 700,
                              minWidth: 28,
                              textTransform: "capitalize",
                            }}
                          >
                            {day}
                          </span>
                          <span style={{ color: "#374151", lineHeight: 1.4 }}>
                            {content}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </button>
            </div>
          )}

          {/* Personal notes textarea */}
          <textarea
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Anotações pessoais — dificuldades, insights, links úteis…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 8,
              border: "1.5px solid #e5e7eb",
              padding: "8px 10px",
              fontSize: 11,
              color: "#374151",
              resize: "vertical",
              minHeight: 48,
              fontFamily: "system-ui,sans-serif",
              outline: "none",
              background: "#fff",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   PROGRESS VIEW
──────────────────────────────────────────────────── */
function ProgressView({
  allData,
  currentMonth,
  currentMonthRaw,
  subjects,
  subjProg,
  currentData,
  phase,
}) {
  const cur = subjects.reduce(
    (a, s) => {
      const p = subjProg(s);
      return { done: a.done + p.done, total: a.total + p.total };
    },
    { done: 0, total: 0 }
  );
  const curPct = cur.total ? Math.round((cur.done / cur.total) * 100) : 0;
  let gDone = 0,
    gTotal = 0;
  if (allData) {
    ALL_MONTHS.forEach((m) => {
      const mraw = R[m];
      if (!mraw) return;
      Object.keys(mraw.subjects || {}).forEach((s) => {
        const ts = mraw.subjects[s].topics || [];
        gTotal += ts.length;
        ts.forEach((_, i) => {
          if (allData["month:" + m]?.topics?.[`${s}-${i}`]?.completed) gDone++;
        });
      });
    });
  }
  const gPct = gTotal ? Math.round((gDone / gTotal) * 100) : 0;

  const subjGlobal = Object.keys(SUBJ)
    .map((s) => {
      let done = 0,
        total = 0;
      ALL_MONTHS.forEach((m) => {
        const ts = R[m]?.subjects?.[s]?.topics || [];
        total += ts.length;
        ts.forEach((_, i) => {
          if (allData?.["month:" + m]?.topics?.[`${s}-${i}`]?.completed) done++;
        });
      });
      return {
        key: s,
        done,
        total,
        pct: total ? Math.round((done / total) * 100) : 0,
      };
    })
    .filter((x) => x.total > 0);

  const phaseProgress = PHASES.map((p) => {
    let done = 0,
      total = 0;
    p.months.forEach((m) => {
      Object.keys(R[m]?.subjects || {}).forEach((s) => {
        const ts = R[m].subjects[s].topics || [];
        total += ts.length;
        ts.forEach((_, i) => {
          if (allData?.["month:" + m]?.topics?.[`${s}-${i}`]?.completed) done++;
        });
      });
    });
    return {
      ...p,
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const weekStats = allData
    ? [1, 2, 3, 4].map((wn) => {
        let planned = 0,
          actual = 0;
        const phId = phaseOf(currentMonth).id,
          sched = WS[phId] || WS.efomm;
        const semSched = sched[`sem${wn}`] || sched["sem1"] || {};
        DAYS.forEach((d) => {
          (semSched[d] || []).forEach((blk) => {
            planned += blk.estMin;
            const v =
              parseInt(
                allData["month:" + currentMonth]?.weekly?.[
                  `w${wn}_${d}_${blk.id}`
                ]?.actualMin || "0",
                10
              ) || 0;
            actual += v;
          });
        });
        return { wn, planned, actual };
      })
    : [];

  const PBar = ({ pct, color, height = 8 }) => (
    <div
      style={{
        flex: 1,
        height,
        background: "#f1f5f9",
        borderRadius: height / 2,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height,
          background: pct === 100 ? "#22c55e" : color,
          borderRadius: height / 2,
          transition: "width 0.4s",
        }}
      />
    </div>
  );

  return (
    <div>
      {/* Current month */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "14px",
          marginBottom: 10,
          border: `1.5px solid ${phase.color}33`,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: phase.color,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontFamily: "system-ui,sans-serif",
          }}
        >
          {currentMonth} — tópicos do mês
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <PBar pct={curPct} color={phase.color} height={12} />
          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: curPct === 100 ? "#22c55e" : phase.color,
              flexShrink: 0,
              fontFamily: "Georgia,serif",
            }}
          >
            {curPct}%
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            fontFamily: "system-ui,sans-serif",
          }}
        >
          {cur.done} de {cur.total} tópicos concluídos este mês
        </div>
        {subjects.map((s) => {
          const p = subjProg(s);
          const cfg = SUBJ[s] || {};
          return (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: cfg.color,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  flexShrink: 0,
                  fontFamily: "Georgia,serif",
                }}
              >
                {cfg.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 3,
                    fontFamily: "system-ui,sans-serif",
                  }}
                >
                  {cfg.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <PBar pct={p.pct} color={cfg.color} height={5} />
                  <span
                    style={{
                      fontSize: 10,
                      color: p.pct === 100 ? "#16a34a" : "#6b7280",
                      fontWeight: 700,
                      flexShrink: 0,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {p.done}/{p.total}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly time stats */}
      {weekStats.length > 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "14px",
            marginBottom: 10,
            border: "1.5px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "#475569",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              marginBottom: 10,
              fontFamily: "system-ui,sans-serif",
            }}
          >
            ⏱ Tempo Registrado — {currentMonth}
          </div>
          {weekStats.map(({ wn, planned, actual }) => {
            const pct = planned
              ? Math.min(Math.round((actual / planned) * 100), 120)
              : 0;
            return (
              <div key={wn} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#374151",
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    Semana {wn}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {fmt(actual)} / {fmt(planned)}
                  </span>
                </div>
                <PBar pct={pct} color={phase.color} height={6} />
              </div>
            );
          })}
        </div>
      )}

      {/* Global */}
      {allData ? (
        <>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "14px",
              marginBottom: 10,
              border: "1.5px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#475569",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              Progresso Geral — Todo o Plano
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <PBar pct={gPct} color="#0f172a" height={14} />
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#0f172a",
                  flexShrink: 0,
                  fontFamily: "Georgia,serif",
                }}
              >
                {gPct}%
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                fontFamily: "system-ui,sans-serif",
              }}
            >
              {gDone} de {gTotal} tópicos no plano completo
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "14px",
              marginBottom: 10,
              border: "1.5px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#475569",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 10,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              Por Fase
            </div>
            {phaseProgress.map((p) => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: p.color,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {p.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: p.pct === 100 ? "#16a34a" : "#6b7280",
                      fontWeight: 700,
                      fontFamily: "system-ui,sans-serif",
                    }}
                  >
                    {p.done}/{p.total}
                  </span>
                </div>
                <PBar pct={p.pct} color={p.color} height={6} />
              </div>
            ))}
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "14px",
              border: "1.5px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#475569",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                marginBottom: 10,
                fontFamily: "system-ui,sans-serif",
              }}
            >
              Por Matéria (todo o plano)
            </div>
            {subjGlobal.map(({ key, done, total, pct }) => {
              const cfg = SUBJ[key] || {};
              return (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 9,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: cfg.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      flexShrink: 0,
                      fontFamily: "Georgia,serif",
                    }}
                  >
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1f2937",
                          fontFamily: "system-ui,sans-serif",
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: pct === 100 ? "#16a34a" : cfg.color,
                          fontWeight: 700,
                          fontFamily: "system-ui,sans-serif",
                        }}
                      >
                        {done}/{total} · {pct}%
                      </span>
                    </div>
                    <PBar pct={pct} color={cfg.color} height={5} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "#94a3b8",
            padding: 32,
            fontFamily: "system-ui,sans-serif",
          }}
        >
          Carregando dados…
        </div>
      )}
    </div>
  );
}
