import { assetUrl } from './assetUrl';

/** Fundo fixo B4: estádio Chunin + vinheta + meios-tons nos cantos + cunhas azuis (gen_b4.board4). */
export function ArenaBackground() {
  const half = 'radial-gradient(#F97316 26%, transparent 29%) 0 0 / 7px 7px';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute"
        style={{
          inset: -10,
          backgroundImage: `url(${assetUrl('art/arena-chunin-1.jpg')})`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 60%',
          filter: 'brightness(0.5) saturate(1) blur(3px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.66) 100%)',
        }}
      />
      {/* Meios-tons laranja nos cantos */}
      <div
        className="absolute bottom-0 left-0 opacity-[0.85]"
        style={{
          width: 520,
          height: 340,
          background: half,
          WebkitMaskImage: 'radial-gradient(ellipse at 0% 100%, #000 10%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at 0% 100%, #000 10%, transparent 70%)',
        }}
      />
      <div
        className="absolute right-0 top-0 opacity-80"
        style={{
          width: 460,
          height: 300,
          background: half,
          WebkitMaskImage: 'radial-gradient(ellipse at 100% 0%, #000 10%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse at 100% 0%, #000 10%, transparent 70%)',
        }}
      />
      {/* Cunhas azuis */}
      <div
        className="absolute left-0 top-0"
        style={{
          width: 0,
          height: 0,
          borderTop: '150px solid #1E90FFcc',
          borderRight: '110px solid transparent',
        }}
      />
      <div
        className="absolute bottom-0 right-0"
        style={{
          width: 0,
          height: 0,
          borderBottom: '130px solid #1E90FFcc',
          borderLeft: '130px solid transparent',
        }}
      />
    </div>
  );
}
