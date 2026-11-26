// Efeitos estilo "vlog de loja": notinha do iPhone digitando, escrita à mão com círculo/setas, título de abertura.
import {staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
export const Fontes = () => (
  <style>{`
    @font-face{font-family:'KA Mao';src:url('${staticFile('fontes/Caveat.ttf')}')}
    @font-face{font-family:'KA UI';src:url('${staticFile('fontes/Inter.ttf')}')}
    @font-face{font-family:'KA Redonda';src:url('${staticFile('fontes/Fredoka.ttf')}')}
    @font-face{font-family:'KA Serif';src:url('${staticFile('fontes/Cormorant.ttf')}')}
    @font-face{font-family:'KA Serif';font-style:italic;src:url('${staticFile('fontes/Cormorant-Italic.ttf')}')}
  `}</style>
);

const saida = (frame, total, n = 6) => interpolate(frame, [total - n, total], [1, 0], clamp);

// ---------- notinha (Notas / Lembretes do iPhone) com texto sendo digitado ----------
export const Nota = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 14}});
  const cps = e.velocidade || 22;                       // caracteres por segundo
  const itens = e.itens || [];
  let resto = Math.max(0, (frame - 8) / fps * cps);
  const lembrete = e.estilo === 'lembrete';
  const acento = e.acento || '#E2A23B';                 // amarelo do app Notas
  const W = (e.largura || 0.62) * width;
  const fs = width * 0.03;
  return (
    <div style={{position: 'absolute', left: (e.x ?? 0.5) * width, top: (e.y ?? 0.6) * height, width: W,
      transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * s})`, opacity: s * saida(frame, durationInFrames),
      background: '#FFFFFF', borderRadius: width * 0.03, padding: `${fs * 0.9}px ${fs * 1.1}px ${fs * 1.2}px`,
      boxShadow: '0 18px 50px rgba(0,0,0,0.28)', fontFamily: "'KA UI', sans-serif", color: '#1d1d1f'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: fs * 0.7}}>
        <span style={{color: acento, fontSize: fs * 0.95}}>‹ {e.titulo || (lembrete ? 'Lembretes' : 'Notas')}</span>
        <span style={{width: fs * 1.1, height: fs * 1.1, borderRadius: '50%', border: `${fs * 0.08}px solid ${acento}`, color: acento,
          fontSize: fs * 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1}}>•••</span>
      </div>
      {itens.map((it, i) => {
        const n = Math.min(it.length, Math.floor(resto)); resto -= it.length + 4;   // pausa entre itens
        if (n <= 0 && i > 0) return null;
        const digitando = n < it.length && n >= 0 && (resto < 0);
        const feito = lembrete && e.marcar && resto > cps * 0.6 && i === itens.length - 1 ? true : lembrete && e.marcar && n === it.length && resto > 0;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: fs * 0.6, fontSize: fs, lineHeight: 1.45}}>
            {lembrete
              ? <span style={{width: fs * 0.95, height: fs * 0.95, borderRadius: '50%', flexShrink: 0, border: `${fs * 0.08}px solid ${feito ? acento : '#c7c7cc'}`,
                  background: feito ? acento : 'transparent'}}/>
              : <span style={{flexShrink: 0}}>–</span>}
            <span style={{textDecoration: feito ? 'line-through' : 'none', color: feito ? '#8e8e93' : '#1d1d1f'}}>
              {it.slice(0, Math.max(0, n))}
              {digitando && <span style={{display: 'inline-block', width: fs * 0.08, height: fs * 1.1, background: acento, marginLeft: 2,
                verticalAlign: 'middle', opacity: Math.floor(frame / 8) % 2 ? 1 : 0.2}}/>}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- escrita à mão: texto que se escreve + círculo desenhado + setas ----------
export const Manuscrito = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const dEsc = (e.tempo_escrita || 0.8) * fps;
  const k = interpolate(frame, [0, dEsc], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const kc = interpolate(frame, [dEsc * 0.5, dEsc * 1.4], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const cor = e.cor || '#FFFFFF';
  const fs = (e.tamanho || 0.075) * width;
  const x = (e.x ?? 0.5) * width, y = (e.y ?? 0.2) * height;
  const op = saida(frame, durationInFrames);
  const setas = e.setas || (e.seta ? [e.seta] : []);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${e.rotacao ?? -3}deg)`,
        fontFamily: "'KA Mao', cursive", fontWeight: 600, fontSize: fs, color: cor, whiteSpace: 'pre', lineHeight: 1.05, textAlign: 'center',
        textShadow: '0 2px 10px rgba(0,0,0,0.35)', clipPath: `inset(-20% ${100 - k * 100}% -20% -5%)`}}>
        {e.texto}
      </div>
      <svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {e.circulo && (() => {
          const rx = (e.circulo_largura || 0.28) * width, ry = fs * 0.85;
          const d = `M ${x + rx * 0.95} ${y - ry * 0.35} C ${x + rx * 1.05} ${y + ry * 1.1}, ${x - rx * 1.1} ${y + ry * 1.15}, ${x - rx} ${y} C ${x - rx * 0.95} ${y - ry * 1.2}, ${x + rx * 0.9} ${y - ry * 1.25}, ${x + rx * 1.02} ${y - ry * 0.1}`;
          return <path d={d} fill="none" stroke={cor} strokeWidth={width * 0.004} strokeLinecap="round" pathLength={1}
            strokeDasharray={1} strokeDashoffset={1 - kc} style={{filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))'}}/>;
        })()}
        {setas.map((s, i) => {
          const [x1, y1] = [s.de[0] * width, s.de[1] * height], [x2, y2] = [s.para[0] * width, s.para[1] * height];
          const cx = (x1 + x2) / 2 + (y2 - y1) * (s.curva ?? 0.3), cy = (y1 + y2) / 2 - (x2 - x1) * (s.curva ?? 0.3);
          const ks = interpolate(frame, [dEsc * 0.7 + i * 5, dEsc * 1.5 + i * 5], [0, 1], clamp);
          const ang = Math.atan2(y2 - cy, x2 - cx), L = width * 0.025;
          const ponta = `M ${x2 - L * Math.cos(ang - 0.5)} ${y2 - L * Math.sin(ang - 0.5)} L ${x2} ${y2} L ${x2 - L * Math.cos(ang + 0.5)} ${y2 - L * Math.sin(ang + 0.5)}`;
          return (
            <g key={i} fill="none" stroke={cor} strokeWidth={width * 0.004} strokeLinecap="round" strokeLinejoin="round" style={{filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))'}}>
              <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ks}/>
              {ks > 0.95 && <path d={ponta}/>}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ---------- título de abertura (gancho) ----------
export const Titulo = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const linhas = String(e.texto).split('\n');
  return (
    <div style={{position: 'absolute', left: width * 0.06, right: width * 0.06, top: (e.y ?? 0.17) * height, textAlign: 'center',
      opacity: saida(frame, durationInFrames, 8)}}>
      {linhas.map((l, i) => {
        const s = spring({frame: frame - i * 4, fps, config: {damping: 15}});
        return <div key={i} style={{fontFamily: "'KA UI', sans-serif", fontWeight: 700, fontSize: (e.tamanho || 0.062) * width, lineHeight: 1.15,
          color: e.cor || '#fff', textShadow: '0 3px 14px rgba(0,0,0,0.45)', opacity: s, transform: `translateY(${(1 - s) * 25}px)`}}>{l}</div>;
      })}
    </div>
  );
};

// ---------- gancho: frase de retenção numa caixinha (marsala/rosé por padrão) ----------
export const Gancho = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const cores = marca.cores || {};
  const s = spring({frame, fps, config: {damping: 10, stiffness: 180}});
  const balanco = Math.sin(frame / 6) * 1.2;
  const linhas = String(e.texto).split('\n');
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: (e.y ?? 0.16) * height, display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: `scale(${0.6 + 0.4 * s}) rotate(${(e.rotacao ?? -2) + balanco}deg)`, opacity: Math.min(1, s * 1.5) * saida(frame, durationInFrames)}}>
      {e.sub && <div style={{fontFamily: "'KA UI', sans-serif", fontWeight: 600, fontSize: width * 0.03, letterSpacing: 4, textTransform: 'uppercase',
        color: e.cor_sub || cores.destaque || '#F2C4C8', textShadow: '0 2px 8px rgba(0,0,0,0.5)', marginBottom: width * 0.012}}>{e.sub}</div>}
      {linhas.map((l, i) => (
        <div key={i} style={{background: e.fundo || cores.primaria || '#6E1E2B', color: e.cor || '#FFFFFF', fontFamily: "'KA UI', sans-serif",
          fontWeight: 800, fontSize: (e.tamanho || 0.058) * width, lineHeight: 1.2, padding: `${width * 0.008}px ${width * 0.03}px`,
          borderRadius: width * 0.02, marginTop: i ? -width * 0.004 : 0, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', whiteSpace: 'nowrap'}}>{l}</div>
      ))}
    </div>
  );
};

// ---------- estilo "construindo a minha loja": frase rosa arredondada com brilhinhos ----------
const Brilho = ({x, y, s, f, i}) => {
  const k = 0.6 + 0.4 * Math.abs(Math.sin(f / 7 + i * 1.7));
  return <svg viewBox="-10 -10 20 20" style={{position: 'absolute', left: x, top: y, width: s, height: s, transform: `translate(-50%,-50%) scale(${k}) rotate(${f * 2 + i * 40}deg)`}}>
    <path d="M0-10 C1-2 2-1 10 0 C2 1 1 2 0 10 C-1 2 -2 1 -10 0 C-2-1 -1-2 0-10Z" fill={i % 2 ? '#FFFFFF' : '#FFD6E0'} style={{filter: 'drop-shadow(0 0 6px rgba(255,190,210,0.9))'}}/>
  </svg>;
};
export const Frase = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 11, stiffness: 170}});
  const fs = (e.tamanho || 0.11) * width;
  const linhas = String(e.texto).split('\n');
  const cx = (e.x ?? 0.5) * width, cy = (e.y ?? 0.45) * height;
  const elegante = e.estilo === 'elegante';
  const brilhos = e.brilhos === false ? [] : [[-0.42, -0.5], [0.45, -0.35], [-0.38, 0.55], [0.4, 0.6]];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, s * 1.4) * saida(frame, durationInFrames)}}>
      <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * s})`, textAlign: 'center', whiteSpace: 'nowrap'}}>
        {linhas.map((l, i) => (
          <div key={i} style={{fontFamily: elegante ? "'KA Serif', serif" : "'KA Redonda', sans-serif", fontWeight: elegante ? 500 : 700,
            fontSize: fs, lineHeight: elegante ? 0.95 : 0.92, letterSpacing: elegante ? 0 : -1, color: e.cor || (elegante ? '#FFF6F3' : '#FFC9D6'),
            textShadow: elegante ? '0 2px 14px rgba(0,0,0,0.35)' : '0 0 10px rgba(255,255,255,0.75), 0 0 26px rgba(255,150,180,0.65), 0 3px 10px rgba(0,0,0,0.25)'}}>
            {l.split(/(\*[^*]+\*)/).map((p, j) => p.startsWith('*')
              ? <span key={j} style={{fontFamily: "'KA Serif', serif", fontStyle: 'italic', fontWeight: 600, color: e.cor_destaque || '#FFB3C7'}}>{p.slice(1, -1)}</span>
              : <span key={j}>{p}</span>)}
          </div>
        ))}
        {brilhos.map(([bx, by], i) => <Brilho key={i} i={i} f={frame} s={fs * (i % 2 ? 0.45 : 0.6)} x={`${50 + bx * 100}%`} y={`${50 + by * 100}%`}/>)}
      </div>
    </div>
  );
};

// ---------- cartão de episódio ("episódio 02 de / abrindo a KA Brand") ----------
export const Episodio = ({e, marca}) => {
  const frame = useCurrentFrame(); const {fps, width, height, durationInFrames} = useVideoConfig();
  const cores = marca.cores || {};
  const s = spring({frame, fps, config: {damping: 14}});
  const s2 = spring({frame: frame - 6, fps, config: {damping: 12}});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: saida(frame, durationInFrames, 8)}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${e.fundo || 'rgba(110,30,43,0.55)'} 0%, rgba(40,10,15,0.75) 100%)`, opacity: s}}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: (e.y ?? 0.42) * height, textAlign: 'center', transform: 'translateY(-50%)'}}>
        <div style={{fontFamily: "'KA Mao', cursive", fontWeight: 600, fontSize: width * 0.065, color: cores.destaque || '#F2C4C8', opacity: s, transform: `translateY(${(1 - s) * 20}px)`}}>{e.sub || 'episódio 02 de'}</div>
        <div style={{fontFamily: "'KA Mao', cursive", fontWeight: 700, fontSize: width * 0.13, lineHeight: 0.95, color: '#FFE3EA', whiteSpace: 'pre',
          WebkitTextStroke: `${width * 0.004}px ${cores.primaria || '#6E1E2B'}`, textShadow: `0 ${width * 0.008}px 0 ${cores.primaria || '#6E1E2B'}`,
          transform: `scale(${0.6 + 0.4 * s2}) rotate(-3deg)`, opacity: s2}}>{e.texto}</div>
      </div>
    </div>
  );
};

// ---------- lente "olho mágico" para closes de detalhe ----------
export const Lente = ({e}) => {
  const frame = useCurrentFrame(); const {durationInFrames} = useVideoConfig();
  const k = interpolate(frame, [0, 5, durationInFrames - 5, durationInFrames], [0, 1, 1, 0], clamp);
  const r = e.raio || 46;
  return <div style={{position: 'absolute', inset: 0, opacity: k,
    background: `radial-gradient(circle at 50% 48%, rgba(0,0,0,0) ${r - 8}%, rgba(0,0,0,0.55) ${r - 2}%, rgba(0,0,0,0.97) ${r + 3}%, #000 ${r + 8}%)`}}/>;
};
