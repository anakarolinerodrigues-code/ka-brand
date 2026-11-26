import {Nota, Manuscrito, Titulo, Gancho, Frase, Episodio, Lente} from './Vlog';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, Easing} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

// ---------- câmera: zoom, tremor (explosão/tremor) e transições "chicote" ----------
export const camera = (p, t, W, H) => {
  const c = {scale: 1, tx: 0, ty: 0, rot: 0, blur: 0, ox: 0.5, oy: 0.4};
  for (const e of p.efeitos || []) {
    const dt = t - e.t, dur = e.dur || 1;
    if (e.tipo === 'lente' && dt >= 0 && dt <= dur) {
      c.scale *= 1.18 + 0.04 * Math.sin(dt * 2);
    }
    if (e.tipo === 'zoom' && dt >= 0 && dt <= dur + (e.segurar || 0)) {
      const k = interpolate(dt, [0, dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
      c.scale *= (e.de || 1) + ((e.para || 1.35) - (e.de || 1)) * k;
      c.ox = e.x ?? 0.5; c.oy = e.y ?? 0.35;
    }
    if ((e.tipo === 'explosao' || e.tipo === 'tremor') && dt >= 0 && dt <= Math.min(dur, e.tipo === 'explosao' ? 0.6 : dur)) {
      const amp = (e.intensidade || (e.tipo === 'explosao' ? 40 : 14)) * (1 - dt / Math.min(dur, e.tipo === 'explosao' ? 0.6 : dur));
      c.tx += Math.sin(t * 90) * amp; c.ty += Math.cos(t * 73) * amp; c.rot += Math.sin(t * 50) * amp * 0.04;
    }
    if (e.tipo === 'transicao') {
      const meia = (e.dur || 0.4) / 2, u = (t - e.t) / meia; // u em [-1, 1]
      if (u >= -1 && u <= 1) {
        const dist = e.direcao === 'cima' ? H : W;
        // desliza pouco e amplia o bastante para nunca mostrar fundo preto
        const pico = 1 - Math.abs(u);
        const off = (u < 0 ? -1 : 1) * dist * 0.12 * pico;
        if (e.direcao === 'cima') c.ty += off; else c.tx += (e.direcao === 'direita' ? -off : off);
        c.blur += 26 * pico;
        c.scale *= 1 + 0.32 * pico;
      }
    }
  }
  const fz = p.final_congelado;
  if (fz && t >= fz.t && fz.zoom !== false) {
    c.scale *= interpolate(t - fz.t, [0, fz.dur || 4], [1, 1.12], {...clamp, easing: Easing.out(Easing.quad)});
  }
  return c;
};

// ---------- super-herói genérico (não é nenhum personagem de marca) ----------
const Heroi = ({size}) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 200 100">
    <path d="M70 40 Q30 20 5 35 Q25 50 8 70 Q40 62 72 60 Z" fill="#D7263D"/>
    <rect x="62" y="38" width="80" height="26" rx="13" fill="#1B4DB1"/>
    <rect x="62" y="50" width="34" height="8" rx="3" fill="#F2C14E"/>
    <rect x="28" y="44" width="40" height="14" rx="7" fill="#1B4DB1"/>
    <rect x="136" y="38" width="44" height="11" rx="5.5" fill="#1B4DB1"/>
    <circle cx="183" cy="43" r="8" fill="#F1C7A5"/>
    <circle cx="152" cy="40" r="15" fill="#F1C7A5"/>
    <path d="M138 35 Q150 18 166 34 Q156 28 140 40 Z" fill="#2B1B12"/>
    <circle cx="158" cy="38" r="2" fill="#222"/>
  </svg>
);

const Sprite = ({e, size}) => {
  if (!e.sprite || e.sprite === 'heroi') return <Heroi size={size}/>;
  if (/\.(png|webp|svg|gif|jpg)$/i.test(e.sprite)) return <Img src={staticFile(e.sprite)} style={{width: size}}/>;
  return <div style={{fontSize: size * 0.6, fontFamily: 'Noto Color Emoji'}}>{e.sprite}</div>;
};

const Voo = ({e}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const k = interpolate(frame, [0, durationInFrames - 1], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const [x1, y1] = e.de || [-0.2, 0.3], [x2, y2] = e.para || [1.2, 0.2];
  const x = (x1 + (x2 - x1) * k) * width, y = (y1 + (y2 - y1) * k) * height + Math.sin(k * Math.PI * 3) * 12;
  const ang = Math.atan2((y2 - y1) * height, (x2 - x1) * width) * 180 / Math.PI;
  const flip = x2 < x1; const size = (e.tamanho || 0.32) * width;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${flip ? ang + 180 : ang}deg) scaleX(${flip ? -1 : 1})`}}>
      <div style={{position: 'absolute', right: size * 0.85, top: size * 0.12, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end'}}>
        {[0.9, 0.6, 0.8].map((l, i) => <div key={i} style={{width: size * 0.5 * l, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.85)', opacity: 0.4 + 0.5 * Math.abs(Math.sin(frame / 3 + i))}}/>)}
      </div>
      <Sprite e={e} size={size}/>
    </div>
  );
};

const Emoji = ({e}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 8}});
  const sai = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);
  const tremer = e.anim === 'tremer' ? Math.sin(frame * 1.9) * 14 : 0;
  const pulsar = e.anim === 'pulsar' ? 1 + 0.08 * Math.sin(frame / 3) : 1;
  return (
    <div style={{position: 'absolute', left: (e.x ?? 0.5) * width, top: (e.y ?? 0.15) * height,
      transform: `translate(-50%,-50%) scale(${s * sai * pulsar}) rotate(${tremer}deg)`,
      fontSize: (e.tamanho || 0.16) * width, fontFamily: 'Noto Color Emoji', lineHeight: 1}}>
      {/\.(png|webp|svg|gif|jpg)$/i.test(e.emoji) ? <Img src={staticFile(e.emoji)} style={{width: (e.tamanho || 0.16) * width}}/> : e.emoji}
    </div>
  );
};

const Texto = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 6, stiffness: 260}});
  const sai = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], clamp);
  const sh = frame < 10 ? Math.sin(frame * 2.5) * (10 - frame) : 0;
  return (
    <div style={{position: 'absolute', left: (e.x ?? 0.5) * width, top: (e.y ?? 0.5) * height,
      transform: `translate(-50%,-50%) translate(${sh}px,0) scale(${s * sai}) rotate(${e.rotacao ?? -6}deg)`,
      fontFamily: `${(marca.fontes || {}).forte || 'DejaVu Sans'}, sans-serif`, fontWeight: 900, fontSize: (e.tamanho || 0.17) * width,
      color: e.cor || '#fff', whiteSpace: 'nowrap', letterSpacing: 2,
      WebkitTextStroke: `${width * 0.006}px ${e.contorno || (marca.cores || {}).primaria || '#6E1E2B'}`,
      textShadow: `0 ${width * 0.012}px 0 ${e.contorno || (marca.cores || {}).primaria || '#6E1E2B'}, 0 10px 30px rgba(0,0,0,0.5)`}}>
      {String(e.texto).split(/(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/u).map((parte, i) =>
        /\p{Extended_Pictographic}/u.test(parte)
          ? <span key={i} style={{WebkitTextStroke: 0, textShadow: 'none', fontFamily: 'Noto Color Emoji'}}>{parte}</span>
          : <span key={i}>{parte}</span>)}
    </div>
  );
};

const Explosao = ({e}) => {
  const frame = useCurrentFrame(); const {width, height} = useVideoConfig();
  const x = (e.x ?? 0.5) * width, y = (e.y ?? 0.4) * height;
  const flash = interpolate(frame, [0, 2, 8], [0, 0.9, 0], clamp);
  const r = interpolate(frame, [0, 18], [0, width * 1.1], {...clamp, easing: Easing.out(Easing.cubic)});
  const op = interpolate(frame, [0, 18], [1, 0], clamp);
  const fogo = interpolate(frame, [0, 4, 16], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,240,200,${fogo}) 0%, rgba(255,140,40,${fogo * 0.8}) 18%, rgba(220,40,20,${fogo * 0.4}) 35%, transparent 55%)`}}/>
      {[1, 0.7].map((m, i) => <div key={i} style={{position: 'absolute', left: x - r * m, top: y - r * m, width: r * 2 * m, height: r * 2 * m, borderRadius: '50%', border: `${14 * op}px solid rgba(255,${200 - i * 60},120,${op})`}}/>)}
      <AbsoluteFill style={{background: '#fff', opacity: flash}}/>
    </AbsoluteFill>
  );
};

const Lista = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const cores = marca.cores || {}; const fontes = marca.fontes || {};
  const s = spring({frame, fps, config: {damping: 14}});
  const sai = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], clamp);
  const iv = (e.intervalo || 0.35) * fps;
  return (
    <div style={{position: 'absolute', left: width * 0.07, right: width * 0.07, top: (e.y ?? 0.42) * height,
      transform: `translateY(${(1 - s) * 80}px)`, opacity: s * sai,
      background: e.fundo || cores.primaria || '#6E1E2B', borderRadius: 26, padding: '36px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'}}>
      <div style={{color: '#fff', fontSize: width * 0.044, marginBottom: 22, whiteSpace: 'nowrap', fontFamily: `${fontes.forte || 'DejaVu Sans'}`, fontWeight: 800}}>
        {e.titulo}{e.titulo_destaque && <span style={{fontFamily: `${fontes.elegante || 'DejaVu Serif'}`, fontStyle: 'italic', fontWeight: 400, color: cores.destaque || '#F2C4C8'}}> {e.titulo_destaque}</span>}
      </div>
      {(e.itens || []).map((it, i) => {
        const a = spring({frame: frame - 8 - i * iv, fps, config: {damping: 12}});
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12, opacity: a, transform: `translateX(${(1 - a) * -40}px)`}}>
            <div style={{width: width * 0.04, height: width * 0.04, borderRadius: '50%', background: '#fff', color: e.fundo || cores.primaria || '#6E1E2B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: width * 0.028, fontWeight: 900, flexShrink: 0}}>✓</div>
            <div style={{color: '#fff', fontSize: width * 0.036, fontFamily: `${fontes.forte || 'DejaVu Sans'}`}}>{it}</div>
          </div>
        );
      })}
      {e.rodape && <div style={{color: 'rgba(255,255,255,0.7)', fontSize: width * 0.026, fontStyle: 'italic', marginTop: 10, fontFamily: `${fontes.elegante || 'DejaVu Serif'}`}}>{e.rodape}</div>}
    </div>
  );
};

const Imagem = ({e}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12}});
  const sai = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);
  return <Img src={staticFile(e.arquivo)} style={{position: 'absolute', left: (e.x ?? 0.5) * width, top: (e.y ?? 0.5) * height, width: (e.tamanho || 0.4) * width, transform: `translate(-50%,-50%) scale(${s * sai})`}}/>;
};

export const Efeito = ({e, marca}) => {
  switch (e.tipo) {
    case 'voo': return <Voo e={e}/>;
    case 'emoji': return <Emoji e={e}/>;
    case 'texto': return <Texto e={e} marca={marca}/>;
    case 'explosao': return <Explosao e={e}/>;
    case 'lista': return <Lista e={e} marca={marca}/>;
    case 'imagem': return <Imagem e={e}/>;
    case 'nota': return <Nota e={e} marca={marca}/>;
    case 'manuscrito': return <Manuscrito e={e} marca={marca}/>;
    case 'titulo': return <Titulo e={e} marca={marca}/>;
    case 'gancho': return <Gancho e={e} marca={marca}/>;
    case 'frase': return <Frase e={e} marca={marca}/>;
    case 'episodio': return <Episodio e={e} marca={marca}/>;
    case 'lente': return <Lente e={e}/>;
    default: return null; // zoom, tremor e transicao agem na câmera
  }
};
