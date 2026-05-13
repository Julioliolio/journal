/* Foliage-shadow overlay for cast mode.
 *
 * Uses the photographic leaf-silhouette PNG at /cast-shadow.png as a
 * mask: black on white, multiplied over the page so the white parts pass
 * through unchanged and the leaves darken whatever sits beneath them.
 * Two layers ride at slightly different scales/positions and sway out of
 * sync so the canopy feels alive rather than tiled.
 */

export function CastOverlay() {
  return (
    <div className="cast-overlay" aria-hidden="true">
      <div className="cast-layer cast-layer-1" />
      <div className="cast-layer cast-layer-2" />
    </div>
  );
}
