import {AbsoluteFill, OffthreadVideo, Audio, Sequence, Freeze, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Legendas} from './Legendas';
import {Efeito, camera} from './Efeitos';
import {Fontes} from './Vlog';

const Som = ({s, fps}) => {
  const ini = Math.round(s.t * fps);
  const dur = s.dur ? Math.round(s.dur * fps) : undefined;
  const fadeIn = (s.fade_in || 0) * fps, fadeOut = (s.fade_out || 0) * fps, vol = s.volume ?? 0.35;
  return (
    <Sequence from={ini} durationInFrames={dur}>
      <Audio src={staticFile(s.arquivo)} loop={!!s.loop} volume={(f) => {
        let v = vol;
        if (fadeIn) v *= Math.min(1, f / fadeIn);
        if (fadeOut && dur) v *= Math.min(1, Math.max(0, (dur - f) / fadeOut));
        return v;
      }}/>
    </Sequence>
  );
};

export const Edicao = (p) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const fz = p.final_congelado;
  const fzF = fz ? Math.round(fz.t * fps) : null;
  const congelado = fz && frame >= fzF;
  const cam = camera(p, t, width, height);
  const src = staticFile(p.video);

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Fontes/>
      <AbsoluteFill style={{
        transformOrigin: `${cam.ox * 100}% ${cam.oy * 100}%`,
        transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale}) rotate(${cam.rot}deg)`,
        filter: `blur(${cam.blur}px)${congelado && fz.pb !== false ? ' grayscale(1) contrast(1.15)' : ''}`,
      }}>
        {congelado
          ? <Freeze frame={fzF - 1}><OffthreadVideo src={src} muted/></Freeze>
          : <OffthreadVideo src={src} volume={p.volume_original ?? 1}/>}
      </AbsoluteFill>
      {congelado && fz.vinheta !== false && (
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)',
          opacity: interpolate(frame - fzF, [0, 15], [0, 1], {extrapolateRight: 'clamp'})}}/>
      )}
      {!congelado && <Legendas palavras={p.palavras} cfg={p.legenda || {}} marca={p.marca || {}}/>}
      {(p.efeitos || []).map((e, i) => (
        <Sequence key={i} from={Math.round(e.t * fps)} durationInFrames={Math.max(1, Math.round((e.dur || 1) * fps))}>
          <Efeito e={e} marca={p.marca || {}}/>
        </Sequence>
      ))}
      {(p.sons || []).map((s, i) => <Som key={i} s={s} fps={fps}/>)}
    </AbsoluteFill>
  );
};
