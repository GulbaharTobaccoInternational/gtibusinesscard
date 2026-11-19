import Image from 'next/image';

/** Reference-derived UI branding only. Never used by the business-card renderer. */
export function MrGhashiBrand() {
  // Image preparation preserves the supplied mascot/wordmark composition.
  return <span className="mr-ghashi-brand"><Image priority src="/brand/mr-ghashi-logo.png" alt="Mr Ghashi — Your Biz Card Genius" width={300} height={100} sizes="(max-width: 600px) 180px, 240px"/></span>;
}
export type ReactionArtId = 'applause' | 'great-job' | 'coffee-treat' | 'hats-off';
export function ReactionArt({ id }: { id: ReactionArtId }) {
  const origins: Record<ReactionArtId, [number,number]> = { applause:[0,0], 'great-job':[512,0], 'coffee-treat':[0,512], 'hats-off':[512,512] };
  const [x,y] = origins[id];
  return <svg className="reaction-art" viewBox={`${x} ${y} 512 512`} aria-hidden="true"><image href="/brand/appreciation-reactions.png" width="1024" height="1024"/></svg>;
}
