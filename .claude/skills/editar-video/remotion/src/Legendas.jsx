import {useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';

// Posições (fração da tela) por onde a legenda "salta", evitando o rosto (centro-alto).
const SLOTS = [
  {x: 0.06, y: 0.14, a: 'left'}, {x: 0.94, y: 0.20, a: 'right'}, {x: 0.06, y: 0.58, a: 'left'},
  {x: 0.94, y: 0.64, a: 'right'}, {x: 0.50, y: 0.72, a: 'center'}, {x: 0.50, y: 0.13, a: 'center'},
  {x: 0.06, y: 0.70, a: 'left'}, {x: 0.94, y: 0.52, a: 'right'},
];
const FIXA = {x: 0.5, y: 0.72, a: 'center'};

// Agrupa palavras em blocos de até N, quebrando em pausas e pontuação.
export const agrupar = (palavras, max = 3) => {
  const g = []; let cur = [];
  palavras.forEach((w, i) => {
    cur.push(w);
    const prox = palavras[i + 1];
    const pausa = prox && prox.s - w.e > 0.35;
    if (cur.length >= max || pausa || /[.!?,]$/.test(w.w) || w.destaque || (prox && prox.destaque)) { g.push(cur); cur = []; }
  });
  if (cur.length) g.push(cur);
  return g;
};

export const Legendas = ({palavras = [], cfg, marca}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  if (cfg.estilo === 'nenhuma' || !palavras.length) return null;
  const grupos = agrupar(palavras, cfg.max_palavras || 3);
  const gi = grupos.findIndex((g, i) => {
    const fim = grupos[i + 1] ? Math.min(grupos[i + 1][0].s, g[g.length - 1].e + 0.6) : g[g.length - 1].e + 0.6;
    return t >= g[0].s && t < fim;
  });
  if (gi < 0) return null;
  const g = grupos[gi];
  const fixa = cfg.estilo === 'fixa';
  const slot = fixa ? FIXA : SLOTS[(gi * 3 + (gi % 2)) % SLOTS.length];
  const chip = cfg.chip === true || (cfg.chip_a_partir_de != null && g[0].s >= cfg.chip_a_partir_de);
  const cores = marca.cores || {}; const fontes = marca.fontes || {};
  const base = cfg.tamanho || 64;
  let alternaElegante = gi % 2 === 0;

  return (
    <div style={{
      position: 'absolute', top: slot.y * height,
      ...(slot.a === 'left' ? {left: slot.x * width} : slot.a === 'right' ? {right: (1 - slot.x) * width} : {left: 0, right: 0}),
      display: 'flex', flexWrap: 'wrap', gap: chip ? 12 : 16, alignItems: 'baseline',
      justifyContent: slot.a === 'left' ? 'flex-start' : slot.a === 'right' ? 'flex-end' : 'center',
      maxWidth: slot.a === 'center' ? undefined : width * 0.62, transform: 'translateY(-50%)',
    }}>
      {g.filter((w) => t >= w.s - 0.05).map((w, i) => {
        const f = frame - Math.round((w.s - 0.05) * fps);
        const sp = spring({frame: f, fps, config: {damping: 9, stiffness: 220}});
        const d = !!w.destaque;
        const elegante = d && cfg.destaque_elegante !== false && (alternaElegante = !alternaElegante);
        const size = d ? base * 1.75 : base;
        return (
          <span key={i} style={{
            display: 'inline-block', transform: `scale(${interpolate(sp, [0, 1], [0.3, 1])}) translateY(${(1 - sp) * 20}px)`, opacity: Math.min(1, sp * 2),
            fontFamily: elegante ? `${fontes.elegante || 'DejaVu Serif'}, serif` : `${fontes.forte || 'DejaVu Sans'}, sans-serif`,
            fontStyle: elegante ? 'italic' : 'normal', fontWeight: elegante ? 400 : 800, fontSize: size, lineHeight: 1.05,
            textTransform: d && !elegante ? 'uppercase' : 'none',
            color: d && elegante ? (cores.destaque || '#F2C4C8') : (cores.texto || '#fff'),
            textShadow: chip ? 'none' : '0 4px 14px rgba(0,0,0,0.55), 0 0 3px rgba(0,0,0,0.8)',
            ...(chip ? {background: cores.chip || 'rgba(40,20,22,0.85)', padding: '4px 16px 8px', borderRadius: 14} : {}),
          }}>{w.w}</span>
        );
      })}
    </div>
  );
};
