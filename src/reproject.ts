import type {Reproject} from '@geomatico/maplibre-cog-protocol';

import {extentToGeographicBbox, getProjection} from './projections';
import {buildTileMapping} from './tileMapping';

/**
 * The `reproject` function for `setReproject()` of @geomatico/maplibre-cog-protocol: reprojects COGs
 * in any CRS registered with `registerProjection`, plus the ones built in. Throws for any other.
 */
export const reproject: Reproject = ({url, epsg, extent}) => {
  const projection = getProjection(epsg);
  if (projection === undefined) {
    throw new Error(
      `COG projection EPSG:${epsg} in ${url} is not known. Register it with registerProjection(${epsg}, '<proj4 definition>') or reproject the COG to EPSG:3857 (Web Mercator).`,
    );
  }

  const geographicBbox = extentToGeographicBbox(projection, extent);
  const [xMin, yMin, xMax, yMax] = extent;

  return {
    crs: `EPSG:${epsg}`,
    geographicBbox,
    resolution: (width, height) => {
      const pixelX = (xMax - xMin) / width;
      const pixelY = (yMax - yMin) / height;
      const x = (xMin + xMax) / 2;
      const y = (yMin + yMax) / 2;

      const [x0, y0] = projection.toWebMercator(x, y);
      const [x1, y1] = projection.toWebMercator(x + pixelX, y);
      const [x2, y2] = projection.toWebMercator(x, y + pixelY);

      return Math.sqrt(Math.hypot(x1 - x0, y1 - y0) * Math.hypot(x2 - x0, y2 - y0));
    },
    mapTile: (mercatorBbox) => buildTileMapping(mercatorBbox, {projection, extent, geographicBbox}),
  };
};
