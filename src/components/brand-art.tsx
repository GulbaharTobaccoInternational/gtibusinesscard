import Image from 'next/image';

/** Supplied UI branding only. Never used by the business-card renderer. */
export function MrGhashiBrand() {
  return <span className="mr-ghashi-brand"><Image priority src="/brand/mr-ghashi-approved-logo.webp" alt="Mr Ghashi — Your Biz Card Genius" width={304} height={107} sizes="(max-width: 680px) 160px, 280px"/></span>;
}
export type ReactionArtId = 'applause' | 'great-job' | 'coffee-treat' | 'hats-off';
export function ReactionArt({ id }: { id: ReactionArtId }) {
  const origins: Record<ReactionArtId, [number,number]> = { applause:[0,0], 'great-job':[512,0], 'coffee-treat':[0,512], 'hats-off':[512,512] };
  const [x,y] = origins[id];
  return <svg className="reaction-art" viewBox={`${x} ${y} 512 512`} aria-hidden="true"><image href="/brand/appreciation-reactions.png" width="1024" height="1024"/></svg>;
}
