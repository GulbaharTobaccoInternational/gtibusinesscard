import Image from 'next/image';

/** Supplied UI branding only. Never used by the business-card renderer. */
export function MrGhashiBrand() {
  return <span className="mr-ghashi-brand"><Image priority src="/brand/mr-ghashi-v3-logo.webp" alt="Mr Ghashi — Your Biz Card Genius" width={1600} height={709} sizes="(max-width: 680px) 240px, (max-width:1100px) 340px, 460px"/></span>;
}
export function GtiLogo({ className }: { className: string }) {
  return <Image unoptimized className={className} src="/brand/gti-logo-black.svg" alt="Gulbahar Tobacco International" width={224} height={152} />;
}

export type ReactionArtId = 'applause' | 'great-job' | 'coffee-treat' | 'hats-off';
export function ReactionArt({ id }: { id: ReactionArtId }) {
  const origins: Record<ReactionArtId, [number,number]> = { applause:[0,0], 'great-job':[512,0], 'coffee-treat':[0,512], 'hats-off':[512,512] };
  const [x,y] = origins[id];
  return <svg className="reaction-art" viewBox={`${x} ${y} 512 512`} aria-hidden="true"><image href="/brand/appreciation-reactions.png" width="1024" height="1024"/></svg>;
}
