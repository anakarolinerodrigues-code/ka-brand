import {registerRoot, Composition} from 'remotion';
import {Edicao} from './Edicao';

const Root = () => (
  <Composition
    id="Edicao"
    component={Edicao}
    fps={30} width={1080} height={1920} durationInFrames={300}
    defaultProps={{fps: 30, largura: 1080, altura: 1920, duracao: 10, video: null, palavras: [], efeitos: [], sons: [], legenda: {}, marca: {}}}
    calculateMetadata={({props}) => ({
      fps: props.fps, width: props.largura, height: props.altura,
      durationInFrames: Math.max(1, Math.ceil(props.duracao * props.fps)),
    })}
  />
);
registerRoot(Root);
