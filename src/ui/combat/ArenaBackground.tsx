import { assetUrl } from './assetUrl';

/** Fundo fixo: estádio do Exame Chunin (sem painel de nome de arena). */
export function ArenaBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${assetUrl('art/arena-chunin-1.jpg')})`,
          filter: 'brightness(0.5) saturate(1) blur(3px)',
          transform: 'scale(1.04)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.66) 100%)',
        }}
      />
    </div>
  );
}
