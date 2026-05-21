import { useState, useEffect, useRef } from "react";

/* ── STORAGE ── */
const sk = k => k.replace(/[/\s'"\\]/g, "_");
const Db = {
  async get(k)      { try { const r = await window.storage.get(sk(k)); return r ? JSON.parse(r.value) : {}; } catch { return {}; } },
  async set(k, v)   { try { await window.storage.set(sk(k), JSON.stringify(v)); } catch(e){ console.error(e); } },
  async getAll(ks)  { const o={}; for(const k of ks){ o[k]=await Db.get(k); } return o; },
};

/* ── TOKENS ── */
const SUBJ = {
  japanese:  {label:"Japonês",   icon:"語",color:"#be123c",light:"#fff1f2",accent:"#fb7185",exam:"MEXT"},
  math:      {label:"Matemática",icon:"∑", color:"#1d4ed8",light:"#eff6ff",accent:"#93c5fd",exam:"Todos"},
  physics:   {label:"Física",    icon:"⚛", color:"#7c3aed",light:"#f5f3ff",accent:"#c4b5fd",exam:"Todos"},
  chemistry: {label:"Química",   icon:"⚗", color:"#065f46",light:"#ecfdf5",accent:"#6ee7b7",exam:"Todos"},
  biology:   {label:"Biologia",  icon:"🧬",color:"#0369a1",light:"#f0f9ff",accent:"#7dd3fc",exam:"ENEM"},
  portuguese:{label:"Português", icon:"✍", color:"#92400e",light:"#fffbeb",accent:"#fcd34d",exam:"ENEM/EFOMM"},
  english:   {label:"Inglês",    icon:"E", color:"#1e3a5f",light:"#f0f4ff",accent:"#a5b4fc",exam:"EFOMM/MEXT"},
  humanities:{label:"Humanas",   icon:"🌐",color:"#4a1d96",light:"#f5f3ff",accent:"#ddd6fe",exam:"ENEM"},
};
const PRIO = {
  crítica:{label:"Crítica",color:"#dc2626",bg:"#fef2f2"},
  alta:   {label:"Alta",   color:"#d97706",bg:"#fffbeb"},
  média:  {label:"Média",  color:"#2563eb",bg:"#eff6ff"},
  baixa:  {label:"Baixa",  color:"#6b7280",bg:"#f9fafb"},
};
const CONF = {
  none:   {label:"—",      color:"#9ca3af",bg:"#f9fafb"},
  fraco:  {label:"Fraco",  color:"#dc2626",bg:"#fef2f2"},
  ok:     {label:"Ok",     color:"#d97706",bg:"#fffbeb"},
  dominei:{label:"Dominei",color:"#16a34a",bg:"#f0fdf4"},
};
const BTYPE = {
  self:    {label:"Autoestudo",color:"#0369a1"},
  cursinho:{label:"Cursinho",  color:"#6b7280"},
  simulado:{label:"Simulado",  color:"#7c3aed"},
};

/* ── PHASES + EXAMS ── */
const PHASES = [
  {id:"efomm", label:"SPRINT EFOMM",    months:["Jun/26","Jul/26"],                   color:"#ea580c",bg:"#fff7ed"},
  {id:"enem",  label:"BASE + ENEM",     months:["Ago/26","Set/26","Out/26","Nov/26"], color:"#dc2626",bg:"#fff1f2"},
  {id:"base",  label:"FUNDAÇÃO MEXT",   months:["Dez/26","Jan/27","Fev/27"],          color:"#0f766e",bg:"#f0fdfa"},
  {id:"prep",  label:"PREPARAÇÃO MEXT", months:["Mar/27","Abr/27","Mai/27"],          color:"#7c3aed",bg:"#f5f3ff"},
  {id:"sprint",label:"SPRINT MEXT",     months:["Jun/27","Jul/27"],                   color:"#1d4ed8",bg:"#eff6ff"},
];
const EXAMS=[
  {name:"EFOMM",date:"2026-07-25",color:"#ea580c",approx:false},
  {name:"ENEM", date:"2026-11-08",color:"#dc2626",approx:false},
  {name:"MEXT", date:"2027-06-20",color:"#7c3aed",approx:true},
];
const ALL_MONTHS=PHASES.flatMap(p=>p.months);
const phaseOf=m=>PHASES.find(p=>p.months.includes(m))||PHASES[0];
const daysUntil=d=>{const n=new Date();n.setHours(0,0,0,0);const t=new Date(d);t.setHours(0,0,0,0);return Math.ceil((t-n)/86400000);};
const DAYS=["seg","ter","qua","qui","sex","sab","dom"];
const DAY_LABELS={seg:"Segunda",ter:"Terça",qua:"Quarta",qui:"Quinta",sex:"Sexta",sab:"Sábado",dom:"Domingo"};
const DAY_SHORT={seg:"Seg",ter:"Ter",qua:"Qua",qui:"Qui",sex:"Sex",sab:"Sáb",dom:"Dom"};
const fmt=min=>{if(!min&&min!==0)return"";const h=Math.floor(min/60),m=min%60;return h>0?`${h}h${m>0?m+"min":""}`:`${m}min`;};

/* ──────────────────────────────────────────────────
   WEEKLY SCHEDULES
   Acordar: 06:10 | Sair de casa: 06:55
   Japonês: bloco matinal 06:10–06:50 (40-60 min)
   Sábado: sem aulas de cursinho após o simulado
──────────────────────────────────────────────────── */
const WS = {

/* ─── SPRINT EFOMM ─── */
efomm:{
 seg:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês | Hiragana — Tofugu: colunas Ra, Wa, N + revisar sons combinados (きゃ, しゅ, ちょ…) · Anki: repetição espaçada de todas as colunas aprendidas"},
  {id:"red",subj:"portuguese",type:"cursinho",slot:"13:40",estMin:100,
   what:"✍ Redação (RED) — ANA BEATRIZ COSTA · Estrutura dissertativa-argumentativa: introdução com tese definida · Argumentação: como introduzir repertório sociocultural (filósofos, dados, leis) · Proposta de intervenção: agente, ação, modo, finalidade, efeito"},
  {id:"mat4",subj:"math",    type:"cursinho",slot:"15:20",estMin:160,
   what:"∑ Mat IV — JORGE CRAVEIRO · Trigonometria: seno, cosseno, tangente no triângulo retângulo · Relações métricas no triângulo retângulo (catetos, hipotenusa) · Tabela de valores especiais (30°, 45°, 60°) e círculo trigonométrico"},
  {id:"qui4",subj:"chemistry",type:"cursinho",slot:"16:10",estMin:100,
   what:"⚗ Qui IV — VICTOR SOUZA · Química Orgânica: carbono e suas propriedades · Cadeias carbônicas: abertas (normais, ramificadas) e fechadas (cíclicas, aromáticas); saturadas e insaturadas · Nomenclatura IUPAC de alcanos, alcenos e alquinos"},
 ],
 ter:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês | Hiragana — Tofugu: colunas Ha, Ma, Ya · Sons combinados com Ha (ひゃ, ひゅ, ひょ…) · Anki: revisar todas as colunas anteriores"},
  {id:"por1",subj:"portuguese",type:"cursinho",slot:"14:30",estMin:100,
   what:"✍ Português (POR1) — LUANA SCIAMMARELLA · Interpretação de texto: gêneros discursivos e tipologia textual (narração, descrição, dissertação) · Coesão referencial e sequencial; conectivos argumentativos · 1 texto de leitura + questões de interpretação"},
  {id:"fis1",subj:"physics",  type:"cursinho",slot:"17:30",estMin:100,
   what:"⚛ Fís I — ARMANDO NABUCO · Cinemática Escalar: MRU — equação horária s=s₀+vt · Gráficos s×t (reta) e v×t (horizontal): sentido físico de cada coeficiente · ⚠️ Antes de aplicar: escreva o que cada variável representa fisicamente"},
  {id:"fis1b",subj:"physics", type:"cursinho",slot:"19:10",estMin:100,
   what:"⚛ Fís I — LUCAS ECCARD · Cinemática Escalar: MRUV — equação horária v=v₀+at e s=s₀+v₀t+½at² · Equação de Torricelli (v²=v₀²+2aΔs) · Queda livre: g=10 m/s² como aceleração constante para baixo · Gráficos a×t, v×t e s×t do MRUV"},
 ],
 qua:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês | Hiragana — Tofugu: finalizar Hiragana completo (Ra, Wa, N + todos os sons combinados) · Katakana: iniciar colunas A, Ka, Sa · Anki: deck Hiragana completo em revisão diária"},
  {id:"qui2",subj:"chemistry",type:"cursinho",slot:"14:30",estMin:50,
   what:"⚗ Qui II — DAYANA SIQUEIRA · Estequiometria: conceito de mol e número de Avogadro (6,02×10²³) · Massa molar: cálculo a partir da tabela periódica · Equações estequiométricas: relações molares e mássicas entre reagentes e produtos"},
  {id:"mat1",subj:"math",    type:"cursinho",slot:"15:20",estMin:100,
   what:"∑ Mat I — ARTHUR AMAT · Conjuntos: operações — união (A∪B), interseção (A∩B), diferença (A-B), complementar (Aᶜ) · Lei de Morgan: (A∪B)ᶜ=Aᶜ∩Bᶜ e (A∩B)ᶜ=Aᶜ∪Bᶜ · Diagramas de Venn com 2 e 3 conjuntos: problemas contagem"},
  {id:"fis3",subj:"physics",  type:"cursinho",slot:"18:20",estMin:150,
   what:"⚛ Fís III — JOÃO PEDRO BEZERRA · Eletrostática: cargas elétricas positivas e negativas; conservação e quantização (q=n·e) · Condutores e isolantes: eletrização por atrito, contato e indução · Lei de Coulomb: F=k·q₁·q₂/d² — comparação com lei gravitacional"},
 ],
 qui:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês | Katakana — Tofugu: colunas Ta, Na, Ha · Anki: Hiragana (revisão) + Katakana (novo) · Escuta passiva: 10 min de áudio japonês simples (NHK for School ou Tofugu)"},
  {id:"ing",subj:"english",  type:"cursinho",slot:"13:40",estMin:50,
   what:"E Inglês (ING) — RENATO CORRÊA · Formato EFOMM: questões de leitura (reading comprehension) + gramática explícita · Passive voice: formação e uso · Conditionals (0, 1ª, 2ª) e modal verbs (can, must, should, might)"},
  {id:"fis2",subj:"physics",  type:"cursinho",slot:"14:30",estMin:150,
   what:"⚛ Fís II — IGOR BRITO · Termometria: escalas Celsius (°C), Fahrenheit (°F), Kelvin (K) — fórmulas de conversão · Dilatação térmica: linear (ΔL=L₀·α·ΔT), superficial (ΔA=A₀·β·ΔT), volumétrica (ΔV=V₀·γ·ΔT) · Calorimetria: calor sensível Q=m·c·ΔT e calor latente Q=m·L"},
  {id:"mat2",subj:"math",    type:"cursinho",slot:"17:30",estMin:150,
   what:"∑ Mat II — VICTOR BITARÃES · Álgebra básica: produtos notáveis (quadrado da soma, diferença, produto da soma pela diferença) · Fatoração: fator comum, agrupamento, trinômio quadrado perfeito, diferença de quadrados · Equação do 2º grau: discriminante (Δ), fórmula de Bhaskara, soma e produto das raízes"},
 ],
 sex:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês | Katakana — Tofugu: colunas Ma, Ya, Ra, Wa, N · Ler estrangeirismos em Katakana: テレビ、コーヒー、パソコン… · Anki: Hiragana + Katakana completo em revisão dupla"},
  {id:"qui-s",subj:"chemistry",type:"self",  slot:"15:30",estMin:90,
   what:"⚗ Autoestudo Qui I — Feltre Vol.1 · ⚠️ Compensa QUI1 que conflita com escola até 14:40 · Atomística: estrutura do átomo (prótons, nêutrons, elétrons) e suas cargas · Modelos atômicos: Dalton (bola maciça), Thomson (pudim), Rutherford (núcleo), Bohr (níveis de energia) · Números: atômico (Z), mássico (A), carga (Z-e); isótopos, isóbaros, isótonos"},
  {id:"qui2r",subj:"chemistry",type:"cursinho",slot:"17:00",estMin:80,
   what:"⚗ Qui II — RENAN ORIOLI · Estequiometria: cálculos de rendimento (% rendimento) e pureza (%pureza) · Mistura de reagentes com quantidades diferentes: identificar limitante e em excesso · Tentar comparecer — verificar saída da escola"},
 ],
 sab:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês | Revisão semanal — Anki: todos os kana da semana · Ler 10 palavras em Hiragana e 10 em Katakana sem consultar tabela · Escuta passiva: 10 min"},
  {id:"sim",subj:"math",     type:"simulado",slot:"08:00",estMin:300,
   what:"📝 Simulado completo (todas as matérias) — condições reais de prova · Após: refazer TODAS as questões erradas SEM ver gabarito primeiro · Registrar cada erro: matéria | frente | tipo (conceito faltando / erro de cálculo / distração)"},
  {id:"sim-r",subj:"math",   type:"self",    slot:"13:30",estMin:120,
   what:"📊 Análise do simulado — sem aulas após o simulado · Mat IV (Trigonometria): revisar definições erradas com Iezzi · Fís I (Cinemática): rever o conceito de cada questão errada com Guisolli · Qui I (Atomística): consolidar modelos atômicos e tabela periódica"},
  {id:"rev-s",subj:"japanese",type:"self",   slot:"16:00",estMin:60,
   what:"🇯🇵 Japonês | Consolidação — rever flashcards com mais erros da semana · Escrever manualmente 5x os kana com mais falhas · Listar pontos fracos para foco na semana seguinte"},
 ],
 dom:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"08:00",estMin:60,
   what:"🇯🇵 Japonês | Consolidação semanal — exercício de leitura de sílabas combinadas sem consulta · Escrever Hiragana completo e Katakana completo de memória (teste pessoal)"},
  {id:"mat-d",subj:"math",   type:"self",    slot:"09:30",estMin:120,
   what:"∑ Mat IV (Trigonometria) — Iezzi Vol.3 + Japa Math · Lei dos Senos: a/sinA = b/sinB = c/sinC · Lei dos Cossenos: a²=b²+c²-2bc·cosA · Resolver provas EFOMM de Matemática (seção trigonometria); anotar cada erro com o tipo"},
  {id:"fis-d",subj:"physics", type:"self",   slot:"12:00",estMin:60,
   what:"⚛ Fís I (Cinemática Vetorial) — Tópicos de Física Vol.1 + Guisolli · Vetores: soma (regra do paralelogramo/polígono), subtração, produto por escalar · Composição de movimentos: horizontal (MRU) + vertical (MRUV) = lançamento oblíquo · Ângulo de lançamento, tempo de voo, alcance e altura máxima"},
  {id:"qui-d",subj:"chemistry",type:"self",  slot:"13:30",estMin:60,
   what:"⚗ Qui I (Atomística) — Feltre Vol.1 · Tabela Periódica: grupos (famílias) IA-VIIA + 0 e metais de transição · Propriedades periódicas: raio atômico (↑ → ↓, ↓ → ↑), eletronegatividade (↑ → ↑) · Ligações químicas: iônica (metal+não-metal), covalente (não+não), metálica (metal+metal)"},
  {id:"ing-d",subj:"english", type:"self",   slot:"15:00",estMin:50,
   what:"E Inglês — Resolver seção inglês de 1 prova EFOMM (cronometrado, ~40 min) · Revisar erros: gramática explícita (modals, passive voice) + vocabulário técnico (science, physics, chemistry)"},
  {id:"por-d",subj:"portuguese",type:"self", slot:"16:00",estMin:50,
   what:"✍ Português — 1 texto argumentativo + questões de interpretação EFOMM · Identificar: tese central, argumentos de apoio, contra-argumentos, conclusão"},
  {id:"rev",subj:"math",      type:"self",   slot:"17:30",estMin:40,
   what:"📋 Revisão semanal — atualizar lista pessoal de erros por frente · Definir 1 ponto fraco prioritário por matéria para a semana seguinte"},
 ],
},

/* ─── BASE + ENEM ─── */
enem:{
 seg:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês — Genki I: partículas は (tema) vs が (sujeito enfático) · を (objeto direto), に (direção/tempo/localização) e で (local de ação/meio) — diferenças de uso com exemplos · Anki N5: 10 novas palavras + revisão"},
  {id:"red",subj:"portuguese",type:"cursinho",slot:"13:40",estMin:100,
   what:"✍ Redação (RED) — ANA BEATRIZ COSTA · Repertório sociocultural: filósofos (Rousseau, Kant, Foucault), dados estatísticos e fatos históricos · Como inserir repertório sem fugir da tese · Proposta de intervenção: os 5 elementos obrigatórios segundo a banca ENEM"},
  {id:"mat4",subj:"math",    type:"cursinho",slot:"15:20",estMin:160,
   what:"∑ Mat IV — JORGE CRAVEIRO · Geometria Analítica: ponto no plano (abscissa, ordenada), distância entre dois pontos, ponto médio · Equação da reta: geral (ax+by+c=0), reduzida (y=mx+b), coeficiente angular · Posições relativas: paralelas, concorrentes, perpendiculares (m₁·m₂=-1)"},
  {id:"qui4",subj:"chemistry",type:"cursinho",slot:"16:10",estMin:100,
   what:"⚗ Qui IV — VICTOR SOUZA · Funções oxigenadas: álcoois — nomenclatura IUPAC, classificação (primário, secundário, terciário), propriedades · Fenóis e éteres: diferenças, exemplos cotidianos · Aldeídos e cetonas: grupo funcional, nomenclatura"},
 ],
 ter:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês — Genki I: verbos do grupo 1 (u-verbs) e grupo 2 (ru-verbs) — forma て · Forma ている: ação em progresso (estudando) vs. estado resultante (janela aberta) · Anki N5: revisão espaçada"},
  {id:"por1",subj:"portuguese",type:"cursinho",slot:"14:30",estMin:100,
   what:"✍ Português (POR1) — LUANA SCIAMMARELLA · Literatura: Romantismo brasileiro — 1ª geração (indianismo: Gonçalves Dias) e 2ª geração (ultrarromantismo: Álvares de Azevedo) · Figuras de linguagem: metáfora, metonímia, hipérbole, antítese, paradoxo — identificação em textos"},
  {id:"fis1",subj:"physics",  type:"cursinho",slot:"17:30",estMin:200,
   what:"⚛ Fís I — ARMANDO NABUCO + LUCAS ECCARD · Cinemática Vetorial: vetores posição, velocidade média e aceleração média · Lançamento oblíquo: ângulo de lançamento θ, v₀x=v₀cosθ, v₀y=v₀sinθ · Alcance máximo (R=v₀²sin2θ/g) e altura máxima (H=v₀²sin²θ/2g) · Movimento circular: T (período), f (frequência), ω=2πf, v=ωR, acp=v²/R"},
 ],
 qua:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês — Genki I: forma negativa ない/ません, passado (た/ました), negativo-passado (なかった/ませんでした) · Escrever 3 frases conjugando um verbo em todas as 4 formas · NHK Web Easy: ler 1 manchete com dicionário"},
  {id:"qui2",subj:"chemistry",type:"cursinho",slot:"14:30",estMin:50,
   what:"⚗ Qui II — DAYANA SIQUEIRA · Soluções: concentração em g/L (C=m/V) e em mol/L — molaridade (M=n/V) · Diluição: C₁V₁=C₂V₂ · Mistura de soluções com mesmo soluto: cálculo da concentração resultante"},
  {id:"mat1",subj:"math",    type:"cursinho",slot:"15:20",estMin:100,
   what:"∑ Mat I — ARTHUR AMAT · Funções: conceito (relação, domínio, contradomínio, imagem) · Função injetora (1-1), sobrejetora (sobre) e bijetora · Função composta f∘g(x)=f(g(x)) — domínio e cálculo · Função inversa: condição de existência e como calcular"},
  {id:"fis3",subj:"physics",  type:"cursinho",slot:"18:20",estMin:150,
   what:"⚛ Fís III — JOÃO PEDRO BEZERRA · Eletrostática: campo elétrico E=F/q — definição, sentido convencional, linhas de campo · Campo elétrico uniforme (entre placas paralelas) · Potencial elétrico V=kq/r; diferença de potencial (ddp) U=W/q · Capacitores: capacitância C=Q/V; energia armazenada E=CV²/2"},
 ],
 qui:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês — Anki N5: kanji introdutórios (日,月,火,水,木,金,土,人,口,山) — leitura, escrita e significado · Escuta passiva: NHK for School 5-10 min"},
  {id:"ing",subj:"english",  type:"cursinho",slot:"13:40",estMin:50,
   what:"E Inglês (ING) — RENATO CORRÊA · Reading comprehension: textos de divulgação científica · Relative clauses: who/which/that/whose · Reported speech: say/tell + afirmações e perguntas · Vocabulário científico EFOMM"},
  {id:"fis2",subj:"physics",  type:"cursinho",slot:"14:30",estMin:150,
   what:"⚛ Fís II — IGOR BRITO · Termodinâmica: 1ª Lei — ΔU=Q-W (energia interna, calor trocado, trabalho realizado) · Trabalho de um gás: W=pΔV (processo isobárico); zero em isocórico · 2ª Lei: sentido espontâneo do calor; rendimento de máquina térmica η=1-Tc/Tq (Carnot) · Entropia: aumento em processos irreversíveis (conceitual)"},
  {id:"mat2",subj:"math",    type:"cursinho",slot:"17:30",estMin:150,
   what:"∑ Mat II — VICTOR BITARÃES · Números Complexos: forma algébrica z=a+bi; parte real e imaginária · Conjugado z̄=a-bi; módulo |z|=√(a²+b²) · Operações: soma, subtração, multiplicação, divisão (multiplicar por conjugado) · Argumento θ=arctan(b/a) e forma trigonométrica z=|z|(cosθ+isinθ)"},
 ],
 sex:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês — Consolidação semanal: rever toda a gramática N5 aprendida nesta semana · Escrever 3 frases em japonês usando os padrões novos · Anki: revisar flashcards com erro da semana"},
  {id:"qui-s",subj:"chemistry",type:"self",  slot:"15:30",estMin:90,
   what:"⚗ Autoestudo Qui I + Qui II — Feltre · ⚠️ Compensa QUI1 · Qui I: Tabela Periódica — propriedades periódicas aprofundadas (raio atômico, eletronegatividade, energia de ionização, eletropositividade) · Qui II: Reações químicas — síntese (A+B→AB), decomposição (AB→A+B), deslocamento simples (A+BC→AC+B), dupla troca (AB+CD→AD+CB) · Balanceamento: método das tentativas e algébrico"},
  {id:"bio",subj:"biology",  type:"self",    slot:"17:00",estMin:50,
   what:"🧬 Biologia — Descomplica · Rodízio semanal: Sem1: Citologia (organelas e funções) → Sem2: Divisão celular (mitose/meiose — diferenças) → Sem3: Genética mendeliana (1ª Lei) → Sem4: Ecologia (cadeias alimentares) · Resolver 5 questões ENEM do tópico"},
 ],
 sab:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:40,
   what:"🇯🇵 Japonês — Anki rápido: revisão da semana + escuta passiva NHK for School (10 min)"},
  {id:"sim",subj:"math",     type:"simulado",slot:"08:00",estMin:300,
   what:"📝 Simulado ENEM completo (todas as áreas) — condições reais · Refazer TODAS as questões erradas SEM gabarito primeiro · Anotar por matéria e frente do cursinho: Mat I-V, Fís I-IV, Qui I-IV"},
  {id:"sim-r",subj:"math",   type:"self",    slot:"13:30",estMin:120,
   what:"📊 Análise do simulado — sem aulas após o simulado · Mat I (Funções) + Mat IV (GA): revisar conceitos errados com Iezzi · Fís II (Termodinâmica) + Fís III (Eletrostática): rever com Guisolli · Qui II (Estequiometria): refazer questões de rendimento/pureza"},
  {id:"red-s",subj:"portuguese",type:"self", slot:"16:00",estMin:60,
   what:"✍ Redação ENEM — 1 tema (banco: temas cobrados nos últimos 5 anos) · Escrever em 60 min com cronômetro · Auto-corrigir pelos 5 critérios: competência I (norma culta), II (tema/gênero), III (argumentação), IV (coesão), V (proposta)"},
 ],
 dom:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"08:00",estMin:60,
   what:"🇯🇵 Japonês — Revisão completa da semana · Leitura: 1 artigo NHK Web Easy completo + anotar 5 palavras novas · Escrever 5 frases usando a gramática aprendida na semana"},
  {id:"mat-d",subj:"math",   type:"self",    slot:"09:30",estMin:120,
   what:"∑ Mat IV + Mat V — Iezzi + exercícios ENEM · Trigonometria: identidades fundamentais (sin²+cos²=1, tan=sin/cos) e equações simples · Geometria Plana (Mat V): áreas (triângulo A=bh/2, quadriláteros, círculo A=πr²) · Teorema de Tales: divisão proporcional de segmentos; problemas contextualizados ENEM"},
  {id:"fis-d",subj:"physics", type:"self",   slot:"12:00",estMin:60,
   what:"⚛ Fís II + Fís III — Guisolli + exercícios ENEM · Fís II: Termologia — dilatação (coeficientes α, β, γ) e calorimetria (calor específico) · Fís III: Eletrostática — Lei de Coulomb aplicada; campo elétrico entre placas"},
  {id:"qui-d",subj:"chemistry",type:"self",  slot:"13:30",estMin:60,
   what:"⚗ Qui II + Qui IV — Feltre + exercícios ENEM · Qui II: Soluções — concentração e diluição contextualizadas (questões ENEM) · Qui IV: Orgânica básica — classificação de cadeias; hidrocarbonetos (alcanos: metano, etano; alcenos: etileno; aromáticos: benzeno)"},
  {id:"bio-d",subj:"biology", type:"self",   slot:"15:00",estMin:60,
   what:"🧬 Biologia — 1ª Lei de Mendel (monoibridismo): quadrado de Punnett, fenótipo e genótipo · Dominância completa e incompleta · 2ª Lei (diibridismo): frequências 9:3:3:1 · Resolver 10 questões ENEM de genética"},
  {id:"hum",subj:"humanities",type:"self",   slot:"16:30",estMin:40,
   what:"🌐 Humanas — Resolver 10 questões de HU de 1 ENEM anterior · Identificar os 3 tópicos com mais erros e anotar para revisão"},
  {id:"rev",subj:"math",      type:"self",   slot:"17:30",estMin:40,
   what:"📋 Revisão semanal — atualizar lista de erros por matéria e frente · Planejar 1 ponto fraco prioritário por matéria para a próxima semana"},
 ],
},

/* ─── FUNDAÇÃO MEXT ─── */
base:{
 seg:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:50,
   what:"🇯🇵 Japonês — Genki II: gramática N4 — ている aprofundado (estado resultante vs. ação em curso) · たら (condicional — hipótese concluída): uso principal com exemplos · Anki N4: 10 novas palavras + revisão do deck N5 completo"},
  {id:"cur-m",subj:"math",   type:"cursinho",slot:"14:30",estMin:300,
   what:"∑ Mat V — cursinho · Geometria Espacial: prismas — volume (V=A_base×h) e área total (A=2A_base+A_lateral) · Pirâmides: volume (V=⅓A_base×h) e área lateral · Sólidos de revolução: cilindro (V=πr²h), cone (V=⅓πr²h) · Problemas de combinação de sólidos (estilo MEXT)"},
 ],
 ter:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:50,
   what:"🇯🇵 Japonês — Genki II: voz passiva — formação: grupo1 → ～あれる/～かれる · Uso: sujeito sofre a ação; passiva de aborrecimento (迷惑の受け身) · Anki N4: verbos irregulares + verbos de uso cotidiano"},
  {id:"cur-p",subj:"physics", type:"cursinho",slot:"14:30",estMin:200,
   what:"⚛ Fís IV — cursinho · Óptica Geométrica: reflexão — leis, espelho plano (imagem virtual, simétrica, direita) · Espelhos esféricos côncavos e convexos: fórmula de Gauss (1/f=1/p+1/p') e aumento linear (M=p'/p) · Lei de Snell-Descartes: n₁sinθ₁=n₂sinθ₂; índice de refração n=c/v"},
  {id:"por-n",subj:"portuguese",type:"self", slot:"20:00",estMin:30,
   what:"✍ Gramática formal (30 min) · Regência verbal: assistir a, aspirar a, implicar em, visar a, obedecer a, prescindir de · 5 exercícios de fixação EFOMM"},
 ],
 qua:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:50,
   what:"🇯🇵 Japonês — NHK Web Easy: 1 artigo completo (usar ふりがな) · Sublinhar: 5 palavras desconhecidas → adicionar ao Anki · Praticar leitura em voz alta com pronúncia"},
  {id:"cur-q",subj:"chemistry",type:"cursinho",slot:"14:30",estMin:200,
   what:"⚗ Qui III — cursinho · Termoquímica: entalpia de reação ΔH=H_produtos-H_reagentes; reações exo (ΔH<0) e endotérmicas (ΔH>0) · Lei de Hess: ΔH é independente do caminho · Energia de ligação: cálculo de ΔH a partir de tabelas · Espontaneidade: energia de Gibbs ΔG=ΔH-TΔS (conceitual)"},
  {id:"mat-n",subj:"math",    type:"self",    slot:"20:00",estMin:30,
   what:"∑ Mat II — Iezzi Vol.6 (30 min) · Polinômios: definição, coeficientes, grau, termos semelhantes · Adição e subtração de polinômios; multiplicação de monômio por polinômio"},
 ],
 qui:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:50,
   what:"🇯🇵 Japonês — Anki N4: 10 novas palavras + revisão espaçada N4 completo · Kanji N4: 10 kanji novos (escrever, ler on'yomi e kun'yomi, frase de exemplo)"},
  {id:"cur-i",subj:"english", type:"cursinho",slot:"13:40",estMin:50,
   what:"E Inglês (ING) — RENATO CORRÊA · Estratégias de leitura: skimming (ideia geral) e scanning (informação específica) · Textos de ciências em inglês: identificar argumento principal e dados de suporte · Vocabulário técnico de Física e Química"},
  {id:"cur-f",subj:"physics", type:"cursinho",slot:"14:30",estMin:300,
   what:"⚛ Fís IV + Fís I — cursinho · Fís IV: Física Moderna — quantização de energia (E=hf), constante de Planck h=6,63×10⁻³⁴J·s · Efeito fotoelétrico: E_cinética=hf-W (função trabalho); sem efeito se f<f₀ · Fís I: revisão de Cinemática com questões estilo MEXT (vetores, lançamento oblíquo)"},
 ],
 sex:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:50,
   what:"🇯🇵 Japonês — Consolidação semanal + simulado parcial JLPT N4 (vocabulário 15 min + gramática 20 min) · Analisar todos os erros: criar flashcard para cada gramática errada"},
  {id:"qui-s",subj:"chemistry",type:"self",  slot:"15:30",estMin:90,
   what:"⚗ Autoestudo Qui III + Qui IV — Feltre + Coiro · Qui III: Cinética química — velocidade de reação; fatores que aumentam a velocidade (concentração, temperatura, catalisador, superfície de contato) · Equilíbrio químico: constante Kc=[produtos]/[reagentes]; princípio de Le Chatelier (deslocamento de equilíbrio) · Qui IV: Reações orgânicas de adição em alcenos (H₂, HX, H₂O — regra de Markovnikov)"},
  {id:"fis-s",subj:"physics", type:"self",   slot:"17:00",estMin:60,
   what:"⚛ Fís IV (Física Moderna) — Guisolli + questões MEXT · Modelo de Bohr: estados estacionários, absorção e emissão de fótons (ΔE=hf) · Dualidade onda-partícula: comprimento de de Broglie λ=h/p (conceitual) · Resolver 5 questões MEXT de Física Moderna"},
 ],
 sab:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:50,
   what:"🇯🇵 Japonês — Simulado completo estilo JLPT N4: vocabulário (25 min) + gramática (30 min) + leitura (30 min) · Analisar erros por seção; identificar padrão"},
  {id:"sim",subj:"math",     type:"simulado",slot:"08:00",estMin:300,
   what:"📝 Simulado MEXT completo (Mat + Fís + Qui) — condições reais · Refazer questões erradas antes do gabarito · Identificar frente com maior frequência de erro"},
  {id:"sim-r",subj:"math",   type:"self",    slot:"13:30",estMin:120,
   what:"📊 Análise do simulado — sem aulas após o simulado · Mat V (Geometria Espacial): revisar fórmulas de volume com Iezzi · Fís IV (Física Moderna): releitura do tópico do erro com Guisolli · Qui III (Termoquímica): rever Lei de Hess com Feltre"},
  {id:"rev-s",subj:"japanese",type:"self",   slot:"16:00",estMin:60,
   what:"🇯🇵 Japonês — revisão dos erros do simulado matinal · Criar flashcards Anki para cada gramática errada · Escrever 3 frases corrigidas com as estruturas que você errou"},
 ],
 dom:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"08:00",estMin:90,
   what:"🇯🇵 Japonês — Revisão intensa semanal: releitura do capítulo atual do Genki II · Leitura: 1 artigo NHK Web Easy + anotar vocabulário · Escrita: 1 parágrafo de apresentação pessoal (自己紹介 informal)"},
  {id:"mat-d",subj:"math",   type:"self",    slot:"10:00",estMin:120,
   what:"∑ Mat IV + Mat II — Iezzi · Geometria Analítica: equação da circunferência (x-a)²+(y-b)²=r²; posição relativa reta-circunferência · Polinômios: divisão (Briot-Ruffini), teorema do resto (p(a)=r), fatoração por raízes racionais · Analisar estilo de questões MEXT de Matemática (as primeiras provas)"},
  {id:"fis-d",subj:"physics", type:"self",   slot:"13:00",estMin:90,
   what:"⚛ Fís IV + Fís III — Tópicos de Física · Fís IV: Relatividade restrita — dilatação do tempo (Δt'=γΔt) e contração espacial (L'=L/γ) — conceitual, sem derivações · Fís III: Eletromagnetismo — campo magnético (regra da mão direita), força sobre fio (F=BIL) · Indução eletromagnética: lei de Faraday (ε=-dΦ/dt) e lei de Lenz (sentido da corrente)"},
  {id:"qui-d",subj:"chemistry",type:"self",  slot:"15:00",estMin:90,
   what:"⚗ Qui III + Qui IV — Feltre + Coiro · Qui III: Eletroquímica — pilha galvânica: eletrodo positivo (cátodo, redução) e negativo (ânodo, oxidação), ddp; pilha de Daniell · Qui IV: Isomeria plana — de cadeia (carbono em cadeia diferente), de posição (grupo funcional em posição diferente), de função (grupos diferentes), compensação e tautomeria"},
  {id:"ing-d",subj:"english", type:"self",   slot:"17:00",estMin:60,
   what:"E Inglês — Resolver seção inglês de 1 prova MEXT anterior (cronometrado) · Vocabulário: termos de ciências + expressões acadêmicas (evidence suggests, it is widely accepted, however…)"},
  {id:"rev",subj:"japanese",  type:"self",   slot:"18:30",estMin:30,
   what:"📋 Revisão semanal — atualizar lista de erros por frente (Mat I-V, Fís I-IV, Qui I-IV) · Planejar 1 ponto fraco prioritário por matéria"},
 ],
},

/* ─── PREPARAÇÃO MEXT ─── */
prep:{
 seg:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:60,
   what:"🇯🇵 Japonês — Genki II: gramática N4 avançada — ～ても (mesmo que/mesmo se) e ～のに (embora/apesar de — concessão com lamento) · ～ために (propósito) vs ～ように (para que — objetivo de outra pessoa) · Anki N3: 10 novas + revisão N4 completo"},
  {id:"cur-m",subj:"math",   type:"cursinho",slot:"14:30",estMin:300,
   what:"∑ Mat IV + Cálculo — cursinho · Geometria Analítica: cônicas — elipse (focos F₁F₂, equação canônica x²/a²+y²/b²=1, excentricidade e=c/a<1) · Introdução a limites: noção informal de limite; limites laterais; limites no infinito · Derivada: definição como limite da taxa de variação; regras de derivação (potência d/dx(xⁿ)=nxⁿ⁻¹, soma, produto, quociente)"},
 ],
 ter:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:60,
   what:"🇯🇵 Japonês — Anki N3: revisão espaçada + 10 novas palavras · Shadowing: imitar áudio nativo (JapanesePod101 N3) — focar entonação e ritmo"},
  {id:"cur-p",subj:"physics", type:"cursinho",slot:"14:30",estMin:200,
   what:"⚛ Fís III + Fís IV — cursinho · Fís III: Eletrodinâmica — corrente elétrica I=ΔQ/Δt; resistência e lei de Ohm V=Ri · Circuitos em série (Req=R₁+R₂) e paralelo (1/Req=1/R₁+1/R₂) · Potência P=VI=RI² e efeito Joule Q=Pt · Fís IV: Semicondutores — dopagem tipo-p e tipo-n; diodo (conceitual, cai na MEXT)"},
  {id:"sim-f",subj:"physics", type:"self",   slot:"20:00",estMin:30,
   what:"⚛ Fís — 5 questões MEXT de Física (cronometradas, 30 min) · Anotar: matéria (Fís I-IV) | tipo de erro (conceito / cálculo / interpretação)"},
 ],
 qua:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:60,
   what:"🇯🇵 Japonês — NHK Web Easy: 2 artigos completos + shadowing (imitar locução do áudio) · Sublinhar: gramática N3/N4 em uso real; anotar exemplos no Anki"},
  {id:"cur-q",subj:"chemistry",type:"cursinho",slot:"14:30",estMin:200,
   what:"⚗ Qui IV — cursinho · Reações de substituição: halogenação de alcanos (Cl₂, Br₂ + luz UV) → produto principal (monossubs.) · Reações de adição: alcenos + H₂ (hidrogenação), HX (Markovnikov: H no C mais hidrogenado), H₂O (hidratação) · Polimerização: adição (polietileno, PVC) vs. condensação (Nylon, poliéster); exemplos industriais e ambientais"},
  {id:"sim-q",subj:"chemistry",type:"self",  slot:"20:00",estMin:30,
   what:"⚗ Qui — 5 questões MEXT de Química (cronometradas) · Anotar frente (Qui I-IV) e tipo de erro"},
 ],
 qui:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:60,
   what:"🇯🇵 Japonês — Anki N3/N4: kanji N4 — 10 novos (escrever, ler on/kun, frase de exemplo) · Meta acumulada: 150 kanji N4"},
  {id:"cur-i",subj:"english", type:"cursinho",slot:"13:40",estMin:50,
   what:"E Inglês (ING) — RENATO CORRÊA · Argumentação acadêmica em inglês: evidência, contra-argumento, conclusão · Expressões formais para statement of purpose (I aspire to, this research aims to, therefore…) · Praticar leitura de abstract de artigo científico"},
  {id:"cur-f",subj:"physics", type:"cursinho",slot:"14:30",estMin:300,
   what:"⚛ Fís I + Fís II — cursinho · Fís I: Cinemática Escalar e Vetorial revisão MEXT — questões com raciocínio vetorial apurado · Fís II: MHS — equação x(t)=Acos(ωt+φ), velocidade v=−Aωsin(ωt+φ), velocidade máx. vₘₐₓ=Aω · Pêndulo simples: T=2π√(L/g) · Gases ideais: lei geral (P₁V₁/T₁=P₂V₂/T₂); transformações isotérmica, isobárica e isocórica"},
 ],
 sex:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:60,
   what:"🇯🇵 Simulado semanal de japonês — vocabulário N4 (20 min) + gramática N4 (20 min) + leitura N4 (25 min) · Cronometrado, condições reais · Analisar TODOS os erros imediatamente após"},
  {id:"mat-s",subj:"math",   type:"self",    slot:"15:30",estMin:90,
   what:"∑ Mat — 1 prova MEXT completa de Matemática (cronometrada, ~90 min) · Abrange: Mat I (funções), Mat II (complexos/polinômios), Mat IV (GA/trig/cálculo), Mat V (geometria) · Anotar tipo de erro por questão antes de checar gabarito"},
  {id:"rev-e",subj:"math",   type:"self",    slot:"17:00",estMin:60,
   what:"📊 Revisão profunda dos erros da prova de hoje · Categorizar: conceito faltando / erro de cálculo / não soube por onde começar · Estudar o conceito do erro ANTES de resolver novamente · Atualizar lista pessoal de pontos fracos por frente"},
 ],
 sab:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:50,
   what:"🇯🇵 Japonês — Anki: revisão da semana + erros do simulado de ontem · Escuta passiva JapanesePod101 N3 (20 min)"},
  {id:"sim",subj:"math",     type:"simulado",slot:"08:00",estMin:300,
   what:"📝 Simulado MEXT completo — Mat + Fís + Qui + Japonês (se disponível) · Condições reais (sem pausas, sem consulta, cronômetro) · Anotar tempo gasto por seção"},
  {id:"sim-r",subj:"math",   type:"self",    slot:"13:30",estMin:120,
   what:"📊 Análise DETALHADA do simulado — sem aulas após · Cada erro é OBRIGATÓRIO entender antes de seguir · Mat: erros em derivadas (Mat IV) e cônicas · Fís: erros em MHS/Gases (Fís II) · Qui: erros em Orgânica (Qui IV)"},
  {id:"qui-s",subj:"chemistry",type:"self",  slot:"16:00",estMin:60,
   what:"⚗ Qui IV + Qui I — revisão de erros do simulado · Tabela Periódica aprofundada: tendências periódicas de raio, eletronegatividade e energia de ionização (muito cobrado na MEXT) · Resolver questões específicas de Tabela Periódica MEXT"},
 ],
 dom:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"08:00",estMin:90,
   what:"🇯🇵 Japonês — Escrita: 志望動機 (motivo de candidatura, ~150 char em japonês) · Revisar com dicionário; focar em gramática N4 correta e vocabulário formal · Anki: revisão semanal completa N5+N4+N3"},
  {id:"mat-d",subj:"math",   type:"self",    slot:"10:00",estMin:120,
   what:"∑ Mat IV + Cálculo — Iezzi + material extra · Aplicações de derivadas: f'(x)>0 crescente, f'(x)<0 decrescente; pontos críticos (f'=0); problemas de otimização · Cônicas revisão: hipérbole (x²/a²-y²/b²=1); diferença entre elipse e hipérbole · Resolver 5+ provas MEXT de Matemática acumuladas"},
  {id:"fis-d",subj:"physics", type:"self",   slot:"13:00",estMin:90,
   what:"⚛ Fís I + Fís II — provas MEXT anteriores · Fís I: questões de lançamento oblíquo com vetores (composição de movimentos) · Fís II: questões de MHS (equação do movimento, velocidade máxima) e Gases (transformações e lei geral)"},
  {id:"qui-d",subj:"chemistry",type:"self",  slot:"15:00",estMin:90,
   what:"⚗ Qui III + Qui IV — provas MEXT · Qui III: questões de cinética (velocidade, fatores) e equilíbrio (Kc, Le Chatelier) · Qui IV: questões de isomeria (plana e espacial) e mecanismos de reação (adição e substituição)"},
  {id:"ing-d",subj:"english", type:"self",   slot:"17:00",estMin:60,
   what:"E Inglês — Seção inglês de 5 provas MEXT (10 min cada, cronometrado) · Revisar erros: padrões de gramática e vocabulário técnico recorrentes"},
  {id:"rev",subj:"japanese",  type:"self",   slot:"18:30",estMin:30,
   what:"📋 Lista pessoal de erros — atualizar com erros do simulado e revisões · Planejar semana: 1 tópico prioritário por frente de cada matéria"},
 ],
},

/* ─── SPRINT FINAL MEXT ─── */
sprint:{
 seg:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:75,
   what:"🇯🇵 Japonês — Revisão focada nos erros gramaticais N4/N3 da semana anterior · Anki: deck completo N5+N4+N3 · NHK Web Easy: 1 artigo lido em voz alta"},
  {id:"cur-m",subj:"math",   type:"cursinho",slot:"14:30",estMin:300,
   what:"∑ Mat IV + Mat V — cursinho · Geometria Analítica revisão MEXT: distância ponto-reta, ângulo entre retas, condições de perpendicularidade · Geometria Espacial: esfera V=(4/3)πr³, área=4πr²; combinação de sólidos (cone+semiesfera) · Cálculo: revisão de derivadas e problemas de otimização com contexto real"},
  {id:"jpn-n",subj:"japanese",type:"self",   slot:"21:00",estMin:30,
   what:"🇯🇵 Japonês noturno — Anki rápido (10 min) + 1 artigo NHK Web Easy lido em voz alta"},
 ],
 ter:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:75,
   what:"🇯🇵 Japonês — Vocabulário N3: 10 novas palavras + revisão espaçada · Kanji N4: revisar os 10 kanji da semana anterior (teste escrito sem consulta)"},
  {id:"cur-p",subj:"physics", type:"cursinho",slot:"14:30",estMin:200,
   what:"⚛ Fís III + Fís IV — cursinho · Fís III: Eletrostática e Eletrodinâmica revisão MEXT — questões de alto nível (Lei de Coulomb com múltiplas cargas, circuitos complexos) · Fís IV: Física Moderna revisão MEXT — efeito fotoelétrico (calcular E_cinética), espectros (absorção vs. emissão), dualidade"},
  {id:"fis-r",subj:"physics", type:"self",   slot:"20:30",estMin:40,
   what:"⚛ Fís — 5 questões MEXT de Física (cronometradas) · Foco nas frentes com maior taxa de erro · Analisar cada erro antes de dormir"},
 ],
 qua:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:75,
   what:"🇯🇵 Japonês — Shadowing: 20 min imitando áudio nativo (NHK News Web ou JapanesePod101 N3) · NHK Web Easy: 2 artigos + anotar vocabulário novo · Manter ritmo auditivo"},
  {id:"cur-q",subj:"chemistry",type:"cursinho",slot:"14:30",estMin:200,
   what:"⚗ Qui III + Qui IV — cursinho · Qui III: Eletroquímica e Radioatividade revisão MEXT — questões de potencial de redução (tabela de nobreza), meia-vida, reações nucleares (α, β, γ) · Qui IV: Orgânica revisão MEXT — funções, isomeria (especialmente isomeria espacial cis/trans), reações"},
  {id:"qui-r",subj:"chemistry",type:"self",  slot:"20:30",estMin:40,
   what:"⚗ Qui — 5 questões MEXT de Química (cronometradas) · Foco nas frentes com maior taxa de erro · Analisar antes de dormir"},
 ],
 qui:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:75,
   what:"🇯🇵 Simulado parcial de japonês — gramática N3/N4 (20 min) + vocabulário N3 (20 min) · Cronometrado · Analisar erros imediatamente após"},
  {id:"cur-i",subj:"english", type:"cursinho",slot:"13:40",estMin:50,
   what:"E Inglês (ING) — RENATO CORRÊA · Preparação para entrevista MEXT em inglês · Perguntas típicas: 'Why Japan?', 'What is your field?', 'What are your goals?' · Vocabulário acadêmico formal de alto nível"},
  {id:"cur-f",subj:"physics", type:"cursinho",slot:"14:30",estMin:300,
   what:"⚛ Fís I + Fís II — cursinho · Fís I: Cinemática Escalar e Vetorial revisão MEXT — questões com composição de movimentos e análise de gráficos · Fís II: Termometria, Calorimetria, MHS, Gases — revisão integrada com questões MEXT de alto nível"},
 ],
 sex:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:75,
   what:"🇯🇵 SIMULADO JAPONÊS COMPLETO — vocabulário N3/N4 (25 min) + gramática N4 (30 min) + leitura N4 (35 min) · Condições reais de prova · Analisar erros seção por seção imediatamente após"},
  {id:"mat-r",subj:"math",   type:"self",    slot:"15:30",estMin:90,
   what:"∑ Mat — 1 prova MEXT completa de Matemática (cronometrada) · Abrange todas as frentes: Mat I (funções/conjuntos), Mat II (complexos/polinômios), Mat III (PA/PG/combinatória), Mat IV (GA/trig/cálculo), Mat V (geometria plana e espacial)"},
  {id:"rev",subj:"math",     type:"self",    slot:"17:00",estMin:90,
   what:"📊 Revisão profunda dos erros da prova de hoje · Atualizar lista pessoal de pontos fracos por frente · Estudar o conceito de CADA erro · Nenhum tópico novo — apenas consolidação"},
 ],
 sab:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"06:10",estMin:60,
   what:"🇯🇵 Japonês — Revisão dos erros do simulado de ontem · Criar Anki para cada gramática errada · Praticar 自己紹介 (apresentação pessoal) em voz alta — 3 repetições"},
  {id:"sim",subj:"math",     type:"simulado",slot:"08:00",estMin:300,
   what:"📝 SIMULADO MEXT COMPLETO — Mat + Fís + Qui + Japonês · Condições absolutamente reais (sem pausas, cronômetro, sem consulta) · Registrar hora de início e fim de cada seção para análise de gestão do tempo"},
  {id:"sim-r",subj:"math",   type:"self",    slot:"13:30",estMin:150,
   what:"📊 Análise TOTAL do simulado — sem aulas após · Cada erro é OBRIGATÓRIO entender · Mat: categorizar por frente Mat I-V · Fís: categorizar por frente Fís I-IV · Qui: categorizar por frente Qui I-IV · Japonês: erros por seção (vocabulário/gramática/leitura)"},
  {id:"qui-s",subj:"chemistry",type:"self",  slot:"16:30",estMin:60,
   what:"⚗ Qui II + Qui IV — consolidação das duas frentes mais cobradas na MEXT · Qui II: Estequiometria (reagente limitante, rendimento, pureza) · Qui IV: Orgânica (funções completas, isomeria, reações principais)"},
 ],
 dom:[
  {id:"jpn",subj:"japanese", type:"self",    slot:"08:00",estMin:90,
   what:"🇯🇵 Japonês — Praticar 志望動機 (motivo de candidatura) e 自己紹介 em voz alta (simular entrevista) · Anki: revisão completa dos decks · Escuta passiva: 20 min"},
  {id:"mat-d",subj:"math",   type:"self",    slot:"10:00",estMin:120,
   what:"∑ Mat — Folha de referência pessoal: 1 página por frente (Mat I-V) · Mat I: fórmulas de funções e conjuntos · Mat II: complexos e polinômios essenciais · Mat III: PA/PG e combinatória · Mat IV: GA, trig, derivadas · Mat V: geometria plana e espacial · Resolver questões dos pontos mais fracos · Nenhum tópico novo"},
  {id:"fis-d",subj:"physics", type:"self",   slot:"13:00",estMin:90,
   what:"⚛ Fís — Folha de referência: 1 página por frente (Fís I-IV) · Fís I: equações cinemáticas e lançamento oblíquo · Fís II: termodinâmica, MHS, gases · Fís III: eletrostática e eletrodinâmica · Fís IV: Física Moderna (constantes h, c, e) · Resolver questões dos pontos mais fracos"},
  {id:"qui-d",subj:"chemistry",type:"self",  slot:"15:00",estMin:90,
   what:"⚗ Qui — Folha de referência: 1 página por frente (Qui I-IV) · Qui I: Tabela Periódica resumida (grupos, tendências) · Qui II: fórmulas de estequiometria · Qui III: termoquímica, cinética, equilíbrio · Qui IV: funções orgânicas e reações principais"},
  {id:"ing-d",subj:"english", type:"self",   slot:"17:00",estMin:60,
   what:"E Inglês — Preparação para entrevista MEXT em inglês · Praticar respostas em voz alta: área de interesse, objetivos no Japão, planos de carreira · Vocabulário: field of study, research focus, career goals"},
  {id:"rev",subj:"japanese",  type:"self",   slot:"18:30",estMin:45,
   what:"📋 Planejamento da semana — atualizar lista pessoal de erros · Definir 1 ponto fraco prioritário por frente (Mat I-V, Fís I-IV, Qui I-IV) · Revisar folhas de referência"},
 ],
},
};

/* ──────────────────────────────────────────────────
   ROADMAP DATA
──────────────────────────────────────────────────── */
const R = {
"Jun/26":{phase:"efomm",milestones:["⚠️ EFOMM em ~66 dias — SPRINT ATIVO","📋 Resolver provas EFOMM dos últimos 3 anos","📋 Verificar prazo de inscrição ENEM"],subjects:{
  japanese:{priority:"crítica",resources:["Tofugu","Anki"],notes:"06:10 todo dia, sem exceção. Única matéria sem cobertura no cursinho.",topics:["Finalizar colunas Ra, Wa, N do Hiragana","Diacríticos e sons combinados (きゃ, しゅ…)","Katakana — colunas A, Ka, Sa, Ta, Na","Revisão Anki diária de todos os kana","Escuta passiva: 10 min de áudio simples/dia"]},
  math:{priority:"alta",resources:["Iezzi Vol.1","Japa Math","Provas EFOMM"],notes:"Antes de cada fórmula, escreva o que ela descreve. Quebre o mecanicismo.",topics:["Mat IV — Trigonometria: seno, cosseno, tangente no triângulo retângulo","Mat IV — Relações métricas e tabela de valores especiais","Mat III — Progressões Aritméticas: fórmulas e soma de termos","Mat III — Progressões Geométricas: fórmulas e soma","Mat I — Revisão de funções afim e quadrática","Resolver provas EFOMM — seção Matemática (2 anos)"]},
  physics:{priority:"alta",resources:["Tópicos de Física Vol.1","Guisolli"],notes:"Assista Guisolli ANTES dos exercícios.",topics:["Fís I — Cinemática Escalar: MRU e MRUV (reconstruir com raciocínio)","Fís I — Gráficos de movimento: leitura e construção","Fís I — Queda livre e lançamento vertical","Fís I — Cinemática Vetorial: lançamento oblíquo","Fís I — Dinâmica: Leis de Newton","Resolver provas EFOMM — seção Física (2 anos)"]},
  chemistry:{priority:"alta",resources:["Feltre Vol.1"],notes:"Do zero. Leia o texto ANTES de qualquer exercício.",topics:["Qui I — Estrutura atômica: prótons, nêutrons, elétrons","Qui I — Modelos atômicos: Dalton → Bohr","Qui I — Tabela Periódica: grupos, períodos, propriedades","Qui I — Ligações químicas: iônica, covalente, metálica"]},
  english:{priority:"média",resources:["Provas EFOMM"],notes:"",topics:["Analisar formato das questões EFOMM (leitura + gramática)","Passive voice, conditionals, modals — revisão","Vocabulário técnico científico em inglês"]},
  portuguese:{priority:"média",resources:["Cursinho","Provas EFOMM"],notes:"",topics:["1 texto/dia para interpretação (10 min)","Tipos textuais e gêneros discursivos","Resolver seção Português de 2 provas EFOMM"]},
}},
"Jul/26":{phase:"efomm",milestones:["🎯 EFOMM — 25 e 26 de julho","📊 Simulado EFOMM completo cronometrado — semana 1"],subjects:{
  japanese:{priority:"crítica",resources:["Tofugu Katakana","Anki"],notes:"EFOMM não testa japonês — mantenha o ritmo matinal, não intensifique.",topics:["Katakana: colunas Ha, Ma, Ya, Ra, Wa, N","Diacríticos e sons combinados do Katakana","Leitura de estrangeirismos em Katakana","Revisão Anki: Hiragana + Katakana completos"]},
  math:{priority:"crítica",resources:["Iezzi","Provas EFOMM"],notes:"Semana pré-prova: revisão leve. Nenhum tópico novo nos últimos 4 dias.",topics:["Mat III — Análise Combinatória: permutação, arranjo, combinação","Mat III — Probabilidade: espaço amostral, eventos","Mat V — Geometria Plana: áreas e relações métricas","Mat I — Matrizes: operações e determinante 2×2","Resolver 3 provas EFOMM de Matemática (cronometradas)"]},
  physics:{priority:"crítica",resources:["Tópicos de Física Vol.1","Provas EFOMM"],notes:"",topics:["Fís I — Trabalho, energia cinética, potencial — conservação","Fís II — Termometria: escalas e conversões","Fís IV — Óptica Geométrica: reflexão e espelhos planos","Resolver 3 provas EFOMM de Física (cronometradas)","Revisão dos pontos fracos do simulado da semana 1"]},
  chemistry:{priority:"crítica",resources:["Feltre Vol.1","Provas EFOMM"],notes:"Funções inorgânicas são muito cobradas no EFOMM.",topics:["Qui I — Funções inorgânicas: ácidos e bases","Qui I — Sais e óxidos: classificação e nomenclatura","Qui II — Estequiometria básica: mol e massa molar","Resolver provas EFOMM de Química"]},
  english:{priority:"alta",resources:["Provas EFOMM"],notes:"",topics:["Resolver seção inglês de 3 provas EFOMM (cronometradas)","Revisar erros: estruturas gramaticais específicas"]},
  portuguese:{priority:"alta",resources:["Provas EFOMM"],notes:"",topics:["Resolver seção português de 3 provas EFOMM","Ortografia e concordância — pontos que errou"]},
}},
"Ago/26":{phase:"enem",milestones:["📊 Simulado ENEM completo (diagnóstico)","📋 Conferir resultado EFOMM"],subjects:{
  japanese:{priority:"crítica",resources:["Genki I cap.1-4","Anki N5"],notes:"Com EFOMM concluído, japonês ganha mais espaço.",topics:["Consolidar Katakana: leitura fluente","Vocabulário N5: 300 palavras (números, cores, verbos)","Partículas は, が, を, に, で — diferenças de uso","Primeiras frases simples em japonês","Escuta: NHK for School (vídeos curtos)"]},
  math:{priority:"alta",resources:["Iezzi Vol.3","Dicas do Lipe"],notes:"Geometria é ponto nulo — atenção dobrada.",topics:["Mat V — Geometria Plana: áreas, semelhança, Tales","Mat V — Geometria Espacial: prismas e pirâmides","Mat I — Logaritmos: propriedades e equações","Mat IV — Trigonometria: identidades e equações simples"]},
  physics:{priority:"alta",resources:["Tópicos de Física Vol.1","Guisolli"],notes:"Eletrostática é ponto nulo — comece a construção agora.",topics:["Fís II — Termologia: dilatação, calorimetria, fases","Fís II — Termodinâmica: leis e ciclos (conceitual)","Fís IV — Óptica Geométrica completa: lentes e olho humano","Fís III — Eletrostática: cargas, Coulomb, campo elétrico"]},
  chemistry:{priority:"alta",resources:["Feltre Vol.1"],notes:"",topics:["Qui I — Reações químicas: tipos e balanceamento","Qui II — Soluções: concentração comum e molar","Qui II — Estequiometria: reagente limitante e rendimento"]},
  biology:{priority:"média",resources:["Descomplica","Khan Academy Brasil"],notes:"30-40 min nos domingos.",topics:["Citologia: estrutura e funções das organelas","Divisão celular: mitose e meiose","Genética: 1ª e 2ª Lei de Mendel"]},
  portuguese:{priority:"média",resources:["Cursinho","Redação online"],notes:"Comece a treinar redação agora. Nota 900 exige repetição.",topics:["Redação dissertativa-argumentativa: estrutura ENEM","1ª redação completa + auto-revisão pelos critérios","Variação linguística e recursos argumentativos"]},
  humanities:{priority:"baixa",resources:["Apostila"],notes:"30 min/semana.",topics:["Era Vargas e Ditadura Militar — resumo","Segunda Guerra e Guerra Fria"]},
}},
"Set/26":{phase:"enem",milestones:["📊 Simulado ENEM completo","📋 Resolver provas ENEM — 5 anos anteriores (início)"],subjects:{
  japanese:{priority:"crítica",resources:["Genki I cap.5-9","Anki N5","NHK Web Easy"],notes:"Sprint ENEM não afeta as manhãs de japonês. Sem exceção.",topics:["Vocabulário N5: completar 600 palavras","Forma て dos verbos (grupos 1, 2, 3)","Forma negativa, passado e negativo-passado","Kanji introdutório: 日月火水木金土人口","Leitura: frases simples no NHK Web Easy"]},
  math:{priority:"alta",resources:["Iezzi Vol.5","Provas ENEM"],notes:"Provas antigas são a melhor preparação. Analise CADA ERRO.",topics:["Mat V — Geometria Espacial: cilindros, cones, esferas","Mat III — Estatística: média, mediana, moda, desvio padrão","Mat III — Análise Combinatória + probabilidade condicional","Resolver provas ENEM de Matemática (3 anos)"]},
  physics:{priority:"alta",resources:["Tópicos de Física","Provas ENEM"],notes:"",topics:["Fís III — Eletrostática: potencial elétrico e energia","Fís III — Eletrodinâmica: corrente, resistência, lei de Ohm","Revisão orientada por provas: erros do simulado","Resolver provas de Física ENEM (3 anos)"]},
  chemistry:{priority:"alta",resources:["Feltre Vol.1","Provas ENEM"],notes:"",topics:["Qui I — Revisão de funções inorgânicas com questões ENEM","Qui IV — Orgânica básica: carbono, cadeias, hidrocarbonetos","Resolver provas de Química ENEM (3 anos)"]},
  biology:{priority:"média",resources:["Descomplica","Provas ENEM"],notes:"Aumentar para 1h nos domingos.",topics:["Ecologia: biomas, ciclos biogeoquímicos","Evolução: Darwin, neodarwinismo, especiação","Genética molecular: DNA, RNA, síntese proteica"]},
  portuguese:{priority:"alta",resources:["Cursinho","Provas ENEM"],notes:"Redação é a maior alavanca de nota no ENEM.",topics:["2 redações/semana com revisão pelos critérios ENEM","Literatura: romantismo, realismo, naturalismo","Interpretação: textos multimodais e infográficos","Questões de Linguagens de 3 ENEMs"]},
  humanities:{priority:"média",resources:["Apostila","Provas ENEM"],notes:"",topics:["Filosofia e Sociologia: conceitos cobrados no ENEM","Questões de HU de 3 ENEMs anteriores"]},
}},
"Out/26":{phase:"enem",milestones:["📊 Simulado ENEM completo (1 por semana)","📋 Lista pessoal de erros por matéria"],subjects:{
  japanese:{priority:"crítica",resources:["Genki I (finalizar)","Anki N5"],notes:"",topics:["Adjetivos i/na — forma predicativa e modificadora","Existência: います / あります","Expressões de tempo: 前に, 後で, とき","Vocabulário N5: completar 800 palavras","1 artigo NHK Web Easy por semana"]},
  math:{priority:"alta",resources:["Provas ENEM","Iezzi"],notes:"",topics:["Revisão total pelos erros dos simulados anteriores","Mat V — Geometria Espacial: exercícios contextualizados","Resolver 3 provas ENEM de Matemática (cronometradas)"]},
  physics:{priority:"alta",resources:["Provas ENEM"],notes:"",topics:["Fís III — Circuitos elétricos: série e paralelo, potência","Revisão via provas: focar nos erros dos simulados","Resolver 3 provas de Física ENEM (cronometradas)"]},
  chemistry:{priority:"alta",resources:["Coiro (Orgânica)","Provas ENEM"],notes:"",topics:["Qui IV — Funções orgânicas: aldeídos, cetonas, ácidos, ésteres","Qui IV — Polímeros e plásticos — contexto ENEM","Revisão geral + 3 provas de Química ENEM"]},
  biology:{priority:"média",resources:["Provas ENEM"],notes:"",topics:["Fisiologia humana: sistemas circulatório, respiratório, nervoso","Imunologia: sistema imune e vacinas","Questões de Biologia de 5 ENEMs"]},
  portuguese:{priority:"alta",resources:["Provas ENEM","Cursinho"],notes:"",topics:["2 redações/semana (manter ritmo)","Modernismo: Semana de 22 e fases","Gramática: crase, pontuação, regência","Questões de Linguagens de 5 ENEMs"]},
  humanities:{priority:"média",resources:["Provas ENEM"],notes:"",topics:["Resolver HU de 5 ENEMs — identificar tópicos frequentes","Revisar os tópicos mais errados"]},
}},
"Nov/26":{phase:"enem",milestones:["🎯 ENEM — 8 de novembro (Linguagens + Humanas + Redação)","🎯 ENEM — 15 de novembro (Ciências da Natureza + Matemática)","📋 SISU: verificar datas de inscrição"],subjects:{
  japanese:{priority:"crítica",resources:["Genki I (revisão)","Anki"],notes:"Após o ENEM (16/nov), a rotina muda radicalmente. Japonês passa a protagonista.",topics:["Pré-ENEM: manter ritmo matinal sem interrupção","Revisão de gramática N5 acumulada","Após ENEM (16/nov): aumentar para 1h30 matinal","Após ENEM: iniciar vocabulário N4 (100 palavras/semana)"]},
  math:{priority:"alta",resources:["Provas ENEM","Iezzi Vol.6"],notes:"",topics:["Pré-ENEM: revisão leve das 5 frentes com mais erros","Descanso nos 2 dias anteriores a cada dia","Após ENEM: Mat II — Polinômios (Iezzi Vol.6, ponto nulo)","Após ENEM: Mat II — Números Complexos — forma algébrica"]},
  physics:{priority:"alta",resources:["Provas ENEM","Tópicos de Física"],notes:"",topics:["Pré-ENEM: revisão leve de conceitos e fórmulas-chave","Após ENEM: Fís III — Magnetismo — campo, Lorentz, indução"]},
  chemistry:{priority:"alta",resources:["Provas ENEM","Coiro"],notes:"",topics:["Pré-ENEM: revisão leve de Qui I e Qui IV","Após ENEM: Qui IV — Orgânica aprofundada — isomeria"]},
  biology:{priority:"baixa",resources:[],notes:"Após o ENEM, Biologia sai completamente do foco.",topics:["Pré-ENEM: revisão final leve","Após ENEM: encerrar estudo de Biologia"]},
  portuguese:{priority:"alta",resources:["Provas ENEM"],notes:"",topics:["Reler 2-3 redações anteriores — identificar padrões de erro","1 redação de treino 3 dias antes de cada dia de prova","Após ENEM: Português para EFOMM (gramática formal)"]},
  humanities:{priority:"baixa",resources:[],notes:"Após o ENEM, Humanas sai completamente do foco.",topics:["Revisão leve — nada de novo","Após ENEM: encerrar estudo de Humanas"]},
}},
"Dez/26":{phase:"base",milestones:["📋 Resultado ENEM (divulgação ~dezembro)","📋 SISU — inscrições (~janeiro/27)"],subjects:{
  japanese:{priority:"crítica",resources:["Genki I finalizar","Anki N4","NHK Web Easy"],notes:"Com ENEM concluído, japonês divide protagonismo com Exatas.",topics:["Gramática N5: revisão completa de todas as estruturas","Vocabulário N4: primeiras 200 palavras","Kanji N5: completar lista de 80 (5/semana)","1 artigo NHK Web Easy por dia + anotações","Primeiro simulado JLPT N5 (diagnóstico)"]},
  math:{priority:"alta",resources:["Iezzi Vol.6","Iezzi Vol.3"],notes:"",topics:["Mat II — Polinômios: operações, divisão, teorema do resto","Mat II — Raízes, fatoração e relações de Girard","Mat II — Números Complexos: módulo, argumento, conjugado","Mat V — Geometria Espacial: sólidos de revolução"]},
  physics:{priority:"alta",resources:["Tópicos de Física Vol.1"],notes:"Magnetismo é essencial para MEXT e EFOMM.",topics:["Fís III — Magnetismo: campo, linhas de campo, força sobre corrente","Fís III — Força de Lorentz: força sobre carga em movimento","Fís III — Indução Eletromagnética: lei de Faraday e Lenz","Fís III — Geradores e motores: funcionamento básico"]},
  chemistry:{priority:"alta",resources:["Coiro (Orgânica)","Feltre"],notes:"",topics:["Qui IV — Funções orgânicas: aminas, amidas, haletos","Qui IV — Isomeria plana: cadeia, posição, função","Qui IV — Isomeria espacial: cis/trans (conceitual)","Qui IV — Polímeros: adição e condensação"]},
  english:{priority:"média",resources:["Artigos científicos em inglês"],notes:"",topics:["1 artigo de divulgação científica em inglês/semana","Vocabulário técnico para contexto MEXT"]},
}},
"Jan/27":{phase:"base",milestones:["📋 SISU — inscrições e resultado","📋 Verificar resultado EFOMM e chamadas"],subjects:{
  japanese:{priority:"crítica",resources:["Genki II início","Anki N4","NHK Web Easy"],notes:"",topics:["Gramática N4: ている — estado vs. ação em progresso","Forma condicional たら — uso principal","Vocabulário N4: completar 400 palavras","Kanji N4: iniciar (300 kanji — 10/semana)","Primeiro simulado JLPT N4 (diagnóstico)"]},
  math:{priority:"alta",resources:["Iezzi Vol.4"],notes:"Geometria Analítica é muito cobrada na MEXT.",topics:["Mat IV — Geometria Analítica: ponto, distância, ponto médio","Mat IV — Retas: equação geral, coeficiente angular, posições","Mat IV — Distância de ponto a reta","Mat I — Sistemas lineares: escalonamento e Cramer","Mat I — Matrizes: inversa, determinante 3×3"]},
  physics:{priority:"alta",resources:["Tópicos de Física Vol.1","Guisolli"],notes:"Física Moderna é negligenciada em cursinhos — aparece na MEXT.",topics:["Fís II — Ondas: classificação, comprimento, frequência","Fís II — Acústica: características do som","Fís IV — Física Moderna: quantização de energia (início)"]},
  chemistry:{priority:"alta",resources:["Feltre cinética + equilíbrio"],notes:"Cinética e equilíbrio são muito cobrados na MEXT.",topics:["Qui III — Cinética química: velocidade e fatores","Qui III — Lei da velocidade e ordem de reação (conceitual)","Qui III — Equilíbrio químico: Kc e Kp","Qui III — Princípio de Le Chatelier"]},
  english:{priority:"média",resources:["Past papers MEXT"],notes:"",topics:["Iniciar provas MEXT em inglês: analisar formato","Leitura técnica: artigos de física e química"]},
}},
"Fev/27":{phase:"base",milestones:["📊 Simulado completo MEXT (prova inteira cronometrada)"],subjects:{
  japanese:{priority:"crítica",resources:["Genki II","Anki N4","Shadowing Japanese"],notes:"",topics:["Gramática N4: formas condicionais ば e なら","Voz passiva — forma e contextos","Voz causativa básica","Vocabulário N4: completar 600 palavras","Compreensão auditiva N4: JapanesePod101","Simulado JLPT N4: identificar pontos fracos"]},
  math:{priority:"alta",resources:["Iezzi Vol.4","Provas MEXT"],notes:"O estilo MEXT é diferente do ENEM — requer adaptação.",topics:["Mat IV — GA: circunferência — equação e posição relativa","Mat IV — Cônicas: elipse (definição, focos, excentricidade)","Mat II — Números Complexos: forma trigonométrica, De Moivre","Primeiras provas MEXT de Matemática: analisar estilo"]},
  physics:{priority:"alta",resources:["Tópicos de Física Vol.1","Provas MEXT"],notes:"",topics:["Fís IV — Efeito fotoelétrico: equação de Einstein","Fís IV — Bohr: espectros atômicos e estados de energia","Fís IV — Dualidade onda-partícula (de Broglie)","Fís IV — Relatividade restrita: dilatação do tempo (conceitual)","Primeiras provas MEXT de Física: analisar formato"]},
  chemistry:{priority:"alta",resources:["Feltre","Provas MEXT"],notes:"Radioatividade é muito cobrada na MEXT.",topics:["Qui III — Eletroquímica: pilhas galvânicas, potencial de redução","Qui III — Eletrólise: ígnea e aquosa, lei de Faraday","Qui III — Radioatividade: emissão alfa, beta, gama e meia-vida","Primeiras provas MEXT de Química: analisar formato"]},
}},
"Mar/27":{phase:"prep",milestones:["📊 Simulado completo MEXT (cronometrado + análise de erros)"],subjects:{
  japanese:{priority:"crítica",resources:["Provas MEXT","Anki N4","Shadowing"],notes:"A prova tem 3 seções: vocabulário/kanji, gramática e leitura. Treine separadamente.",topics:["Gramática N4: concessão ても e のに","Gramática N4: propósito ために e ように","Vocabulário N4: completar 800 palavras","Kanji N4: 150 kanji completados","Simulados semanais estilo MEXT","Escrita: parágrafos sobre temas cotidianos"]},
  math:{priority:"alta",resources:["Provas MEXT","Material de Cálculo"],notes:"Cálculo pode aparecer dependendo da área declarada.",topics:["Mat IV — Limites: conceito informal e cálculo algébrico","Mat IV — Derivadas: definição por limite, regras básicas","Mat IV — Aplicações: máximos, mínimos, crescimento","Resolver 5+ provas MEXT de Matemática — analisar erros"]},
  physics:{priority:"alta",resources:["Provas MEXT"],notes:"",topics:["Revisão geral via provas MEXT — tópicos mais cobrados","Fís IV — Física Moderna: princípio da incerteza (conceitual)","Lista pessoal de erros nos simulados"]},
  chemistry:{priority:"alta",resources:["Feltre + Coiro","Provas MEXT"],notes:"",topics:["Revisão via provas MEXT — identificar padrões","Qui I — Tabela periódica aprofundada: raio, eletronegatividade","Qui IV — Mecanismos de reação orgânica: SN1/SN2 (conceitual)","Lista pessoal de erros nos simulados"]},
  english:{priority:"média",resources:["Provas MEXT"],notes:"",topics:["Resolver seção inglês de 5 provas MEXT anteriores","Vocabulário científico: física e química"]},
}},
"Abr/27":{phase:"prep",milestones:["⚠️ Verificar abertura de inscrições MEXT 2027 (Embaixada do Japão)","📊 Simulado completo MEXT cronometrado"],subjects:{
  japanese:{priority:"crítica",resources:["Provas MEXT","Anki","Tutor se possível"],notes:"⚠️ Inscrições MEXT costumam abrir em abril/maio. Verifique a Embaixada do Japão.",topics:["Simulados semanais cronometrados — condições reais","Revisão e análise de cada erro","Redação: 自己紹介 e 志望動機 em japonês","Frases para entrevista em japonês","Kanji N4: 250 kanji completados","Vocabulário N4: 900 palavras acumuladas"]},
  math:{priority:"alta",resources:["Provas MEXT"],notes:"",topics:["Simulados semanais MEXT de Matemática (cronometrado)","Revisão focada nos tipos de questão que você mais erra","Verificar edital: tópicos para sua área de interesse","Nenhum tópico novo — apenas consolidação"]},
  physics:{priority:"alta",resources:["Provas MEXT"],notes:"",topics:["Simulados semanais MEXT de Física (cronometrado)","Revisão direcionada pelos erros","Verificar edital: tópicos específicos"]},
  chemistry:{priority:"alta",resources:["Provas MEXT"],notes:"",topics:["Simulados semanais MEXT de Química (cronometrado)","Revisão direcionada pelos erros","Consolidação final: Qui I-IV"]},
}},
"Mai/27":{phase:"sprint",milestones:["📋 Prazo final de inscrição MEXT (confirmar)","📊 Simulado MEXT completo — 1 por semana"],subjects:{
  japanese:{priority:"crítica",resources:["Todas as provas MEXT disponíveis","Anki"],notes:"Sprint final. Nada de novo — consolide o que sabe.",topics:["Intensificação: 1h30 matinal + 30 min à noite","Resolver TODAS as provas MEXT de japonês disponíveis","Revisão intensiva de gramática N4 — erros recorrentes","2 artigos NHK Web Easy por dia","Lista pessoal de erros: revisar diariamente"]},
  math:{priority:"alta",resources:["Provas MEXT","Suas anotações"],notes:"Não tente aprender nada novo.",topics:["Resolver + revisar todas as provas MEXT de Mat disponíveis","Criar folha de referência pessoal por frente (Mat I-V)","Focar no que você erra, não no que já sabe"]},
  physics:{priority:"alta",resources:["Provas MEXT","Suas anotações"],notes:"",topics:["Resolver + revisar todas as provas MEXT de Fís disponíveis","Folha de referência: fórmulas e constantes (Fís I-IV)"]},
  chemistry:{priority:"alta",resources:["Provas MEXT","Suas anotações"],notes:"",topics:["Resolver + revisar todas as provas MEXT de Qui disponíveis","Folha de referência por frente: Qui I-IV","Reações orgânicas principais: resumo em 1 página"]},
}},
"Jun/27":{phase:"sprint",milestones:["🎯 PROVA MEXT — data a confirmar (costuma ser junho/julho)","⚠️ Semana da prova: descanso estratégico, nada novo"],subjects:{
  japanese:{priority:"crítica",resources:["Material já conhecido","Suas anotações"],notes:"Na semana da prova: descanso é tão importante quanto estudo.",topics:["Revisão leve: 1h matinal (reduzir da intensificação)","Escuta passiva para manter ritmo auditivo","Reler resumos pessoais de gramática N4","Semana da prova: apenas flashcards e escuta"]},
  math:{priority:"alta",resources:["Suas anotações"],notes:"",topics:["Revisão leve: 1 exercício/dia até 3 dias antes","Ler folha de referência pessoal por frente","Descanso completo nos 2 dias anteriores à prova"]},
  physics:{priority:"alta",resources:["Suas anotações"],notes:"",topics:["Revisão leve: Fís I-IV — conceitos e fórmulas","Descanso antes da prova"]},
  chemistry:{priority:"alta",resources:["Suas anotações"],notes:"",topics:["Revisão leve: Qui I-IV — tabela e reações essenciais","Descanso antes da prova"]},
}},
"Jul/27":{phase:"sprint",milestones:["🎯 Entrevista MEXT (se aprovado na prova escrita)","🎉 Resultado final MEXT 2027"],subjects:{
  japanese:{priority:"crítica",resources:["Suas anotações","Tutor se possível"],notes:"A entrevista pode ser em japonês e/ou inglês. Prepare os dois.",topics:["志望動機 e 自己紹介 em voz alta diariamente","Vocabulário técnico da área de interesse em japonês","Apresentação pessoal formal: praticar até fluir"]},
  english:{priority:"média",resources:[],notes:"",topics:["Respostas de entrevista em inglês","Statement of purpose: objetivos acadêmicos"]},
}},
};

/* ──────────────────────────────────────────────────
   ROOT APP
──────────────────────────────────────────────────── */
export default function App() {
  const [month,setMonth]=useState("Jun/26");
  const [tab,setTab]=useState("roteiro");
  const [data,setData]=useState({});
  const [allData,setAllData]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [saving,setSaving]=useState(false);
  const timer=useRef(null);

  const phase=phaseOf(month);
  const monthRaw=R[month]||{};
  const subjects=Object.keys(monthRaw.subjects||{});

  useEffect(()=>{ setLoaded(false); Db.get("month:"+month).then(d=>{setData(d);setLoaded(true);}); },[month]);

  const persist=next=>{
    setData(next); setSaving(true); clearTimeout(timer.current);
    timer.current=setTimeout(async()=>{ await Db.set("month:"+month,next); setSaving(false); },700);
  };

  const toggleTopic=(s,i)=>{const c=data?.topics?.[`${s}-${i}`]||{};persist({...data,topics:{...data.topics,[`${s}-${i}`]:{...c,completed:!c.completed}}});};
  const setConf=(s,i,l)=>{const c=data?.topics?.[`${s}-${i}`]||{};const nxt=c.confidence===l?"none":l;persist({...data,topics:{...data.topics,[`${s}-${i}`]:{...c,confidence:nxt}}});};
  const setNote=(s,v)=>persist({...data,notes:{...data.notes,[s]:v}});
  const setMNote=v=>persist({...data,monthNote:v});

  const subjProg=(s,d2=data,m2=monthRaw)=>{
    const ts=(m2?.subjects?.[s]?.topics||[]);
    const done=ts.filter((_,i)=>d2?.topics?.[`${s}-${i}`]?.completed).length;
    return {done,total:ts.length,pct:ts.length?Math.round(done/ts.length*100):0};
  };

  useEffect(()=>{
    if(tab==="progresso"){
      Db.getAll(ALL_MONTHS.map(m=>"month:"+m)).then(raw=>{
        const out={};ALL_MONTHS.forEach(m=>{out[m]=raw["month:"+m]||{};});setAllData(out);
      });
    }
  },[tab]);

  const F=(color,bg)=>({color,bg});
  const pc=phase.color;

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Georgia',serif"}}>
      {/* HEADER */}
      <div style={{background:"#0c1220",padding:"20px 16px 16px"}}>
        <div style={{fontSize:9,color:"#475569",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:3,fontFamily:"system-ui,sans-serif"}}>Plano de Estudos Integrado</div>
        <div style={{fontSize:22,fontWeight:900,color:"#f8fafc",letterSpacing:"-0.02em"}}>MEXT · EFOMM · ENEM</div>
        <div style={{fontSize:11,color:"#475569",marginTop:2,marginBottom:14,fontFamily:"system-ui,sans-serif"}}>Jun 2026 → Jul 2027 · {ALL_MONTHS.length} meses · Acordar 06:10 | Sair 06:55</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {EXAMS.map(e=>{const d=daysUntil(e.date);return(
            <div key={e.name} style={{background:"#171f2e",border:`1px solid ${d<90?e.color+"55":"#1e293b"}`,borderRadius:10,padding:"8px 11px",minWidth:90}}>
              <div style={{fontSize:8,color:"#64748b",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"system-ui,sans-serif"}}>{e.name}{e.approx?" (prev.)":""}</div>
              <div style={{fontSize:20,fontWeight:900,color:d<60?"#f87171":d<120?"#fbbf24":"#86efac",lineHeight:1.1,marginTop:2,fontFamily:"Georgia,serif"}}>{d>0?`${d}d`:"HOJE"}</div>
              <div style={{fontSize:8,color:"#475569",fontFamily:"system-ui,sans-serif"}}>{new Date(e.date).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"2-digit"})}</div>
            </div>
          );})}
        </div>
      </div>

      {/* PHASE NAV */}
      <div style={{background:"#131c2e",overflowX:"auto"}}>
        <div style={{display:"flex"}}>
          {PHASES.map(p=>{const a=p.months.includes(month);return(
            <button key={p.id} onClick={()=>setMonth(p.months[0])} style={{flex:"none",padding:"8px 12px",border:"none",background:"none",cursor:"pointer",fontSize:8,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:a?p.color:"#334155",borderBottom:`2px solid ${a?p.color:"transparent"}`,whiteSpace:"nowrap",fontFamily:"system-ui,sans-serif"}}>{p.label}</button>
          );})}
        </div>
      </div>

      {/* MONTH TABS */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",overflowX:"auto"}}>
        <div style={{display:"flex"}}>
          {ALL_MONTHS.map(m=>{const p=phaseOf(m),sel=m===month;return(
            <button key={m} onClick={()=>setMonth(m)} style={{flex:"none",padding:"9px 11px",border:"none",background:"none",cursor:"pointer",fontSize:11,fontWeight:sel?800:500,color:sel?p.color:"#6b7280",borderBottom:`2.5px solid ${sel?p.color:"transparent"}`,whiteSpace:"nowrap",fontFamily:"system-ui,sans-serif"}}>{m}</button>
          );})}
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center"}}>
        {[["roteiro","📋 Roteiro"],["semana","📅 Semana"],["progresso","📊 Progresso"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 0",border:"none",background:"none",cursor:"pointer",fontSize:11,fontWeight:tab===t?800:500,color:tab===t?pc:"#6b7280",borderBottom:`2.5px solid ${tab===t?pc:"transparent"}`,fontFamily:"system-ui,sans-serif"}}>{l}</button>
        ))}
        {saving&&<div style={{padding:"0 10px",fontSize:10,color:"#94a3b8",fontFamily:"system-ui,sans-serif"}}>💾</div>}
      </div>

      <div style={{padding:"14px 12px 40px"}}>
        {/* Phase badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:phase.bg,border:`1.5px solid ${pc}44`,borderRadius:8,padding:"4px 10px",marginBottom:10}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:pc}}/>
          <span style={{fontSize:10,fontWeight:800,color:pc,letterSpacing:"0.07em",textTransform:"uppercase",fontFamily:"system-ui,sans-serif"}}>{phase.label}</span>
        </div>

        {/* Milestones */}
        {monthRaw.milestones?.length>0&&(
          <div style={{background:"#fff",border:"1.5px solid #fbbf24",borderRadius:10,padding:"10px 13px",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:800,color:"#92400e",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:6,fontFamily:"system-ui,sans-serif"}}>Marcos do Mês</div>
            {monthRaw.milestones.map((ms,i)=>(
              <div key={i} style={{fontSize:12,color:"#1f2937",padding:"4px 0",borderBottom:i<monthRaw.milestones.length-1?"1px solid #fef3c7":"none",fontWeight:600,fontFamily:"system-ui,sans-serif"}}>{ms}</div>
            ))}
          </div>
        )}

        {tab==="roteiro"&&loaded&&(
          <>
            <textarea value={data.monthNote||""} onChange={e=>setMNote(e.target.value)} placeholder="📝 Anotação geral do mês — como está indo? O que está difícil? Insights?" style={{width:"100%",boxSizing:"border-box",borderRadius:10,border:"1.5px solid #e2e8f0",padding:"10px 12px",fontSize:12,color:"#374151",resize:"vertical",minHeight:58,fontFamily:"system-ui,sans-serif",outline:"none",background:"#fff",marginBottom:12}}/>
            {subjects.map(s=>(
              <SubjectCard key={s} subj={s} mdata={monthRaw.subjects[s]} states={data.topics||{}} note={data.notes?.[s]||""} onToggle={i=>toggleTopic(s,i)} onConf={(i,l)=>setConf(s,i,l)} onNote={v=>setNote(s,v)} prog={subjProg(s)} phaseColor={pc}/>
            ))}
          </>
        )}

        {tab==="semana"&&loaded&&(
          <WeeklyView month={month} phase={phase} data={data} persist={persist}/>
        )}

        {tab==="progresso"&&(
          <ProgressView allData={allData} currentMonth={month} currentMonthRaw={monthRaw} subjects={subjects} subjProg={subjProg} currentData={data} phase={phase}/>
        )}

        {(tab==="roteiro"||tab==="semana")&&!loaded&&(
          <div style={{textAlign:"center",color:"#94a3b8",padding:40,fontFamily:"system-ui,sans-serif"}}>Carregando…</div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   WEEKLY VIEW
──────────────────────────────────────────────────── */
function WeeklyView({month,phase,data,persist}){
  const [activeDay,setActiveDay]=useState("seg");
  const [weekNum,setWeekNum]=useState(1);

  const phaseId=phase.id;
  const schedule=WS[phaseId]||WS.efomm;
  const dayBlocks=schedule[activeDay]||[];
  const wKey=(day,bid)=>`w${weekNum}_${day}_${bid}`;
  const getBlock=(day,bid)=>data?.weekly?.[wKey(day,bid)]||{};
  const setBlock=(day,bid,patch)=>{
    const cur=getBlock(day,bid);
    persist({...data,weekly:{...data.weekly,[wKey(day,bid)]:{...cur,...patch}}});
  };

  const daySummary=day=>{
    const blks=schedule[day]||[];
    const planned=blks.reduce((a,b)=>a+b.estMin,0);
    const actual=blks.reduce((a,b)=>{const v=parseInt(getBlock(day,b.id).actualMin||"0",10)||0;return a+v;},0);
    const done=blks.filter(b=>getBlock(day,b.id).done).length;
    return {planned,actual,done,total:blks.length};
  };

  const weekTotal=DAYS.reduce((acc,d)=>{const s=daySummary(d);return{planned:acc.planned+s.planned,actual:acc.actual+s.actual};},{planned:0,actual:0});
  const pc=phase.color;
  const ds=daySummary(activeDay);

  return(
    <div>
      {/* Week selector */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:11,color:"#6b7280",fontFamily:"system-ui,sans-serif",fontWeight:600}}>Semana:</span>
        {[1,2,3,4].map(n=>(
          <button key={n} onClick={()=>setWeekNum(n)} style={{width:34,height:34,borderRadius:8,border:`1.5px solid ${weekNum===n?pc:"#e2e8f0"}`,background:weekNum===n?pc:"#fff",color:weekNum===n?"#fff":"#6b7280",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"system-ui,sans-serif"}}>{n}</button>
        ))}
        <div style={{marginLeft:"auto",fontSize:10,color:"#6b7280",fontFamily:"system-ui,sans-serif",textAlign:"right"}}>
          <div>📅 <b style={{color:pc}}>{fmt(weekTotal.planned)}</b> planejado</div>
          <div>⏱ <b style={{color:"#16a34a"}}>{fmt(weekTotal.actual)}</b> realizado</div>
        </div>
      </div>

      {/* Day tabs */}
      <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
        {DAYS.map(d=>{
          const s=daySummary(d),sel=d===activeDay,allDone=s.total>0&&s.done===s.total;
          return(
            <button key={d} onClick={()=>setActiveDay(d)} style={{flex:"none",padding:"6px 10px",borderRadius:10,border:`1.5px solid ${sel?pc:allDone?"#86efac":"#e2e8f0"}`,background:sel?pc:allDone?"#f0fdf4":"#fff",color:sel?"#fff":allDone?"#16a34a":"#374151",fontWeight:sel?800:600,fontSize:11,cursor:"pointer",fontFamily:"system-ui,sans-serif",textAlign:"center"}}>
              <div>{DAY_SHORT[d]}</div>
              <div style={{fontSize:8,marginTop:1,opacity:0.8}}>{s.done}/{s.total}</div>
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:"#111",fontFamily:"Georgia,serif"}}>{DAY_LABELS[activeDay]}</div>
          <div style={{fontSize:11,color:"#6b7280",fontFamily:"system-ui,sans-serif",marginTop:2}}>
            Sem. {weekNum} · {fmt(ds.planned)} planejado · {fmt(ds.actual)} realizado
            {activeDay==="seg"&&<span style={{color:"#94a3b8",marginLeft:6}}>· Acordar 06:10 · Sair 06:55</span>}
            {activeDay!=="sab"&&activeDay!=="dom"&&activeDay!=="seg"&&<span style={{color:"#94a3b8",marginLeft:6}}>· Acordar 06:10 · Sair 06:55</span>}
          </div>
        </div>
        {ds.planned>0&&(
          <div style={{width:48,height:48,borderRadius:"50%",border:`3px solid ${pc}`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
            <div style={{fontSize:12,fontWeight:900,color:pc,lineHeight:1}}>{ds.done}</div>
            <div style={{fontSize:8,color:"#9ca3af",lineHeight:1}}>/{ds.total}</div>
          </div>
        )}
      </div>

      {/* Day note */}
      <textarea
        value={data?.weekly?.[`w${weekNum}_note_${activeDay}`]||""}
        onChange={e=>persist({...data,weekly:{...data.weekly,[`w${weekNum}_note_${activeDay}`]:e.target.value}})}
        placeholder="📝 Nota do dia — como foi? O que ficou pendente? Dificuldades?"
        style={{width:"100%",boxSizing:"border-box",borderRadius:10,border:"1.5px solid #e2e8f0",padding:"9px 11px",fontSize:12,color:"#374151",resize:"vertical",minHeight:50,fontFamily:"system-ui,sans-serif",outline:"none",background:"#fff",marginBottom:12}}
      />

      {/* Blocks */}
      {dayBlocks.length===0
        ?<div style={{textAlign:"center",padding:30,color:"#94a3b8",fontSize:13,fontFamily:"system-ui,sans-serif"}}>Nenhum bloco definido para este dia nesta fase.</div>
        :dayBlocks.map(blk=>(
          <BlockCard key={blk.id} blk={blk} state={getBlock(activeDay,blk.id)} phaseColor={pc}
            onChange={patch=>setBlock(activeDay,blk.id,patch)}/>
        ))
      }

      {/* Legend */}
      <div style={{marginTop:10,padding:"10px 12px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10}}>
        <div style={{fontSize:9,fontWeight:700,color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6,fontFamily:"system-ui,sans-serif"}}>Tipo de Bloco</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {Object.entries(BTYPE).map(([k,v])=>(
            <span key={k} style={{fontSize:10,background:"#f8fafc",border:`1px solid ${v.color}44`,borderRadius:6,padding:"2px 7px",color:v.color,fontWeight:700,fontFamily:"system-ui,sans-serif"}}>● {v.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   BLOCK CARD
──────────────────────────────────────────────────── */
function BlockCard({blk,state,phaseColor,onChange}){
  const [open,setOpen]=useState(false);
  const subj=SUBJ[blk.subj]||{};
  const btype=BTYPE[blk.type]||BTYPE.self;
  const done=!!state.done;
  const actualMin=state.actualMin||"";
  const note=state.note||"";
  const efficiency=actualMin&&blk.estMin?Math.round((parseInt(actualMin,10)/blk.estMin)*100):null;

  return(
    <div style={{border:`1.5px solid ${done?"#86efac":subj.accent||"#e2e8f0"}`,borderRadius:12,overflow:"hidden",marginBottom:10,background:"#fff",boxShadow:open?"0 4px 16px rgba(0,0,0,0.09)":"0 1px 3px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:done?"#f0fdf4":open?subj.light:"#fff"}}>
        {/* Checkbox */}
        <button onClick={()=>onChange({done:!done})} style={{width:22,height:22,borderRadius:6,border:`2px solid ${done?subj.color:"#d1d5db"}`,background:done?subj.color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
          {done&&<span style={{color:"#fff",fontSize:11,fontWeight:900}}>✓</span>}
        </button>
        {/* Icon */}
        <div style={{width:34,height:34,borderRadius:8,background:subj.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontFamily:"Georgia,serif",flexShrink:0}}>{subj.icon}</div>
        {/* Info */}
        <div style={{flex:1,minWidth:0}} onClick={()=>setOpen(!open)}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:700,color:"#111",fontFamily:"system-ui,sans-serif"}}>{blk.slot}</span>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",padding:"2px 6px",borderRadius:20,background:"#f1f5f9",color:btype.color,border:`1px solid ${btype.color}33`,fontFamily:"system-ui,sans-serif"}}>{btype.label}</span>
            <span style={{fontSize:9,color:"#94a3b8",fontFamily:"system-ui,sans-serif"}}>{fmt(blk.estMin)}</span>
            {state.rating!==undefined&&state.rating!==null&&(
              <span style={{fontSize:14}}>{"😣😐🙂😄".charAt(state.rating*2)||""}</span>
            )}
          </div>
          <div style={{fontSize:11,color:done?"#9ca3af":"#374151",marginTop:2,lineHeight:1.5,fontFamily:"system-ui,sans-serif",textDecoration:done?"line-through":"none"}}>{blk.what}</div>
        </div>
        <span onClick={()=>setOpen(!open)} style={{color:subj.color,fontSize:12,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0,cursor:"pointer"}}>▾</span>
      </div>

      {open&&(
        <div style={{padding:"12px",background:subj.light,borderTop:`1px solid ${subj.accent}`}}>
          {/* Time tracking */}
          <div style={{background:"#fff",borderRadius:10,padding:"10px 12px",marginBottom:10,border:"1px solid #e5e7eb"}}>
            <div style={{fontSize:9,fontWeight:800,color:"#475569",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:8,fontFamily:"system-ui,sans-serif"}}>⏱ Controle de Tempo</div>
            <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:80}}>
                <label style={{fontSize:10,color:"#6b7280",fontWeight:600,display:"block",marginBottom:3,fontFamily:"system-ui,sans-serif"}}>Estimado</label>
                <div style={{fontSize:18,fontWeight:800,color:"#6b7280",fontFamily:"Georgia,serif"}}>{fmt(blk.estMin)}</div>
              </div>
              <div style={{flex:1,minWidth:80}}>
                <label style={{fontSize:10,color:"#16a34a",fontWeight:600,display:"block",marginBottom:3,fontFamily:"system-ui,sans-serif"}}>Realizado (min)</label>
                <input type="number" min="0" max="999" placeholder="0" value={actualMin}
                  onChange={e=>onChange({actualMin:e.target.value})}
                  style={{width:"100%",fontSize:18,fontWeight:800,color:phaseColor,border:"none",background:"transparent",outline:"none",fontFamily:"Georgia,serif",padding:0}}/>
              </div>
              {efficiency!==null&&(
                <div style={{flex:1,minWidth:70}}>
                  <label style={{fontSize:10,color:"#6b7280",fontWeight:600,display:"block",marginBottom:3,fontFamily:"system-ui,sans-serif"}}>Eficiência</label>
                  <div style={{fontSize:18,fontWeight:800,color:efficiency>=90?"#16a34a":efficiency>=60?"#d97706":"#dc2626",fontFamily:"Georgia,serif"}}>{efficiency}%</div>
                </div>
              )}
            </div>
            {efficiency!==null&&(
              <div style={{marginTop:8,height:5,background:"#f1f5f9",borderRadius:3}}>
                <div style={{width:`${Math.min(efficiency,120)}%`,maxWidth:"100%",height:5,borderRadius:3,background:efficiency>=90?"#22c55e":efficiency>=60?"#f59e0b":"#ef4444",transition:"width 0.3s"}}/>
              </div>
            )}
          </div>

          {/* Notes */}
          <textarea value={note} onChange={e=>onChange({note:e.target.value})}
            placeholder="📝 Anotações — o que foi estudado, dificuldades, próximos passos, links…"
            style={{width:"100%",boxSizing:"border-box",borderRadius:8,border:"1.5px solid #e5e7eb",padding:"8px 10px",fontSize:11,color:"#374151",resize:"vertical",minHeight:60,fontFamily:"system-ui,sans-serif",outline:"none",background:"#fff"}}/>

          {/* Rating */}
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:"#6b7280",fontFamily:"system-ui,sans-serif",fontWeight:600}}>Desempenho:</span>
            {["😣","😐","🙂","😄"].map((em,i)=>(
              <button key={i} onClick={()=>onChange({rating:state.rating===i?null:i})}
                style={{fontSize:18,border:`2px solid ${state.rating===i?subj.color:"transparent"}`,borderRadius:8,padding:"2px 4px",cursor:"pointer",background:state.rating===i?subj.light:"transparent"}}>
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
function SubjectCard({subj,mdata,states,note,onToggle,onConf,onNote,prog,phaseColor}){
  const [open,setOpen]=useState(subj==="japanese");
  const cfg=SUBJ[subj]||{};
  const pr=PRIO[mdata?.priority]||PRIO.baixa;
  const {done,total,pct}=prog;
  const complete=pct===100;

  return(
    <div style={{border:`1.5px solid ${complete?"#86efac":cfg.accent||"#e2e8f0"}`,borderRadius:12,overflow:"hidden",marginBottom:10,background:"#fff",boxShadow:open?"0 4px 20px rgba(0,0,0,0.09)":"0 1px 3px rgba(0,0,0,0.05)"}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 13px",background:complete?"#f0fdf4":open?cfg.light:"#fff",border:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{width:38,height:38,borderRadius:9,background:cfg.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,fontFamily:"Georgia,serif",flexShrink:0}}>{cfg.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:14,color:"#111",fontFamily:"system-ui,sans-serif"}}>{cfg.label}</span>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",background:pr.bg,color:pr.color,padding:"2px 6px",borderRadius:20,border:`1px solid ${pr.color}33`,fontFamily:"system-ui,sans-serif"}}>{pr.label}</span>
            <span style={{fontSize:8,color:"#9ca3af",background:"#f3f4f6",padding:"2px 5px",borderRadius:6,fontFamily:"monospace"}}>{cfg.exam}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7,marginTop:5}}>
            <div style={{flex:1,height:4,background:"#f1f5f9",borderRadius:3}}>
              <div style={{width:`${pct}%`,height:4,background:complete?"#22c55e":cfg.color,borderRadius:3,transition:"width 0.35s"}}/>
            </div>
            <span style={{fontSize:10,color:complete?"#16a34a":"#6b7280",fontWeight:700,flexShrink:0,fontFamily:"system-ui,sans-serif"}}>{done}/{total}</span>
          </div>
        </div>
        <span style={{color:cfg.color,fontSize:14,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}>▾</span>
      </button>

      {open&&(
        <div style={{padding:"12px 13px 14px",background:cfg.light,borderTop:`1px solid ${cfg.accent}`}}>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:800,color:cfg.color,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:7,fontFamily:"system-ui,sans-serif"}}>Tópicos do Mês</div>
            {(mdata.topics||[]).map((topic,i)=>{
              const st=states[`${subj}-${i}`]||{};
              const conf=st.confidence||"none";
              const isDone=!!st.completed;
              return(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6,padding:"8px 9px",background:"#fff",borderRadius:8,border:`1px solid ${isDone?"#bbf7d0":"#e5e7eb"}`,opacity:isDone?0.75:1}}>
                  <button onClick={()=>onToggle(i)} style={{width:20,height:20,borderRadius:5,flexShrink:0,cursor:"pointer",border:`2px solid ${isDone?cfg.color:"#d1d5db"}`,background:isDone?cfg.color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                    {isDone&&<span style={{color:"#fff",fontSize:10,fontWeight:900}}>✓</span>}
                  </button>
                  <span style={{flex:1,fontSize:12,lineHeight:1.5,fontFamily:"system-ui,sans-serif",color:isDone?"#9ca3af":"#1f2937",textDecoration:isDone?"line-through":"none"}}>{topic}</span>
                  <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
                    {["fraco","ok","dominei"].map(lvl=>{const c=CONF[lvl];const active=conf===lvl;return(
                      <button key={lvl} onClick={()=>onConf(i,lvl)} style={{fontSize:8,fontWeight:700,padding:"2px 5px",borderRadius:12,cursor:"pointer",border:`1px solid ${active?c.color:"#e5e7eb"}`,background:active?c.bg:"#fff",color:active?c.color:"#d1d5db",fontFamily:"system-ui,sans-serif"}}>{c.label}</button>
                    );})}
                  </div>
                </div>
              );
            })}
          </div>
          {mdata.resources?.length>0&&(
            <div style={{marginBottom:9}}>
              <div style={{fontSize:9,fontWeight:800,color:cfg.color,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:5,fontFamily:"system-ui,sans-serif"}}>Materiais</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {mdata.resources.map((r,i)=><span key={i} style={{fontSize:11,background:"#fff",border:`1px solid ${cfg.accent}`,borderRadius:6,padding:"3px 7px",color:"#374151",fontFamily:"system-ui,sans-serif"}}>📚 {r}</span>)}
              </div>
            </div>
          )}
          {mdata.notes&&<div style={{marginBottom:9,padding:"7px 10px",background:"#fff",borderLeft:`3px solid ${cfg.color}`,borderRadius:"0 7px 7px 0",fontSize:11,color:"#4b5563",fontStyle:"italic",lineHeight:1.55,fontFamily:"system-ui,sans-serif"}}>💡 {mdata.notes}</div>}
          <textarea value={note} onChange={e=>onNote(e.target.value)} placeholder="Anotações pessoais — dificuldades, insights, links úteis…" style={{width:"100%",boxSizing:"border-box",borderRadius:8,border:"1.5px solid #e5e7eb",padding:"8px 10px",fontSize:11,color:"#374151",resize:"vertical",minHeight:48,fontFamily:"system-ui,sans-serif",outline:"none",background:"#fff"}}/>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   PROGRESS VIEW
──────────────────────────────────────────────────── */
function ProgressView({allData,currentMonth,currentMonthRaw,subjects,subjProg,currentData,phase}){
  const cur=subjects.reduce((a,s)=>{const p=subjProg(s);return{done:a.done+p.done,total:a.total+p.total};},{done:0,total:0});
  const curPct=cur.total?Math.round(cur.done/cur.total*100):0;
  let gDone=0,gTotal=0;
  if(allData){ALL_MONTHS.forEach(m=>{const mraw=R[m];if(!mraw)return;Object.keys(mraw.subjects||{}).forEach(s=>{const ts=mraw.subjects[s].topics||[];gTotal+=ts.length;ts.forEach((_,i)=>{if(allData["month:"+m]?.topics?.[`${s}-${i}`]?.completed)gDone++;});});});}
  const gPct=gTotal?Math.round(gDone/gTotal*100):0;

  const subjGlobal=Object.keys(SUBJ).map(s=>{
    let done=0,total=0;
    ALL_MONTHS.forEach(m=>{const ts=R[m]?.subjects?.[s]?.topics||[];total+=ts.length;ts.forEach((_,i)=>{if(allData?.["month:"+m]?.topics?.[`${s}-${i}`]?.completed)done++;});});
    return{key:s,done,total,pct:total?Math.round(done/total*100):0};
  }).filter(x=>x.total>0);

  const phaseProgress=PHASES.map(p=>{
    let done=0,total=0;
    p.months.forEach(m=>{Object.keys(R[m]?.subjects||{}).forEach(s=>{const ts=R[m].subjects[s].topics||[];total+=ts.length;ts.forEach((_,i)=>{if(allData?.["month:"+m]?.topics?.[`${s}-${i}`]?.completed)done++;});});});
    return{...p,done,total,pct:total?Math.round(done/total*100):0};
  });

  const weekStats=allData?[1,2,3,4].map(wn=>{
    let planned=0,actual=0;
    const phId=phaseOf(currentMonth).id,sched=WS[phId]||WS.efomm;
    DAYS.forEach(d=>{(sched[d]||[]).forEach(blk=>{planned+=blk.estMin;const v=parseInt(allData["month:"+currentMonth]?.weekly?.[`w${wn}_${d}_${blk.id}`]?.actualMin||"0",10)||0;actual+=v;});});
    return{wn,planned,actual};
  }):[];

  const PBar=({pct,color,height=8})=>(
    <div style={{flex:1,height,background:"#f1f5f9",borderRadius:height/2}}>
      <div style={{width:`${pct}%`,height,background:pct===100?"#22c55e":color,borderRadius:height/2,transition:"width 0.4s"}}/>
    </div>
  );

  return(
    <div>
      {/* Current month */}
      <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:`1.5px solid ${phase.color}33`}}>
        <div style={{fontSize:9,fontWeight:800,color:phase.color,letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:8,fontFamily:"system-ui,sans-serif"}}>{currentMonth} — tópicos do mês</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><PBar pct={curPct} color={phase.color} height={12}/><span style={{fontSize:24,fontWeight:900,color:curPct===100?"#22c55e":phase.color,flexShrink:0,fontFamily:"Georgia,serif"}}>{curPct}%</span></div>
        <div style={{fontSize:11,color:"#6b7280",fontFamily:"system-ui,sans-serif"}}>{cur.done} de {cur.total} tópicos concluídos este mês</div>
        {subjects.map(s=>{const p=subjProg(s);const cfg=SUBJ[s]||{};return(
          <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
            <div style={{width:24,height:24,borderRadius:6,background:cfg.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,fontFamily:"Georgia,serif"}}>{cfg.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:"#374151",marginBottom:3,fontFamily:"system-ui,sans-serif"}}>{cfg.label}</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><PBar pct={p.pct} color={cfg.color} height={5}/><span style={{fontSize:10,color:p.pct===100?"#16a34a":"#6b7280",fontWeight:700,flexShrink:0,fontFamily:"system-ui,sans-serif"}}>{p.done}/{p.total}</span></div>
            </div>
          </div>
        );})}
      </div>

      {/* Weekly time stats */}
      {weekStats.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"1.5px solid #e2e8f0"}}>
          <div style={{fontSize:9,fontWeight:800,color:"#475569",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:10,fontFamily:"system-ui,sans-serif"}}>⏱ Tempo Registrado — {currentMonth}</div>
          {weekStats.map(({wn,planned,actual})=>{
            const pct=planned?Math.min(Math.round(actual/planned*100),120):0;
            return(
              <div key={wn} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#374151",fontFamily:"system-ui,sans-serif"}}>Semana {wn}</span>
                  <span style={{fontSize:10,color:"#6b7280",fontFamily:"system-ui,sans-serif"}}>{fmt(actual)} / {fmt(planned)}</span>
                </div>
                <PBar pct={pct} color={phase.color} height={6}/>
              </div>
            );
          })}
        </div>
      )}

      {/* Global */}
      {allData?(
        <>
          <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:9,fontWeight:800,color:"#475569",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:8,fontFamily:"system-ui,sans-serif"}}>Progresso Geral — Todo o Plano</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><PBar pct={gPct} color="#0f172a" height={14}/><span style={{fontSize:26,fontWeight:900,color:"#0f172a",flexShrink:0,fontFamily:"Georgia,serif"}}>{gPct}%</span></div>
            <div style={{fontSize:11,color:"#6b7280",fontFamily:"system-ui,sans-serif"}}>{gDone} de {gTotal} tópicos no plano completo</div>
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10,border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:9,fontWeight:800,color:"#475569",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:10,fontFamily:"system-ui,sans-serif"}}>Por Fase</div>
            {phaseProgress.map(p=>(
              <div key={p.id} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,color:p.color,fontFamily:"system-ui,sans-serif"}}>{p.label}</span>
                  <span style={{fontSize:10,color:p.pct===100?"#16a34a":"#6b7280",fontWeight:700,fontFamily:"system-ui,sans-serif"}}>{p.done}/{p.total}</span>
                </div>
                <PBar pct={p.pct} color={p.color} height={6}/>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:12,padding:"14px",border:"1.5px solid #e2e8f0"}}>
            <div style={{fontSize:9,fontWeight:800,color:"#475569",letterSpacing:"0.09em",textTransform:"uppercase",marginBottom:10,fontFamily:"system-ui,sans-serif"}}>Por Matéria (todo o plano)</div>
            {subjGlobal.map(({key,done,total,pct})=>{const cfg=SUBJ[key]||{};return(
              <div key={key} style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
                <div style={{width:28,height:28,borderRadius:7,background:cfg.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,fontFamily:"Georgia,serif"}}>{cfg.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#1f2937",fontFamily:"system-ui,sans-serif"}}>{cfg.label}</span>
                    <span style={{fontSize:10,color:pct===100?"#16a34a":cfg.color,fontWeight:700,fontFamily:"system-ui,sans-serif"}}>{done}/{total} · {pct}%</span>
                  </div>
                  <PBar pct={pct} color={cfg.color} height={5}/>
                </div>
              </div>
            );})}
          </div>
        </>
      ):(
        <div style={{textAlign:"center",color:"#94a3b8",padding:32,fontFamily:"system-ui,sans-serif"}}>Carregando dados…</div>
      )}
    </div>
  );
}
