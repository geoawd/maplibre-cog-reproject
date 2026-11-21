# @geomatico/maplibre-cog-reproject

Reprojection of Cloud Optimized GeoTIFFs that are not in EPSG:3857 (Web Mercator), for
[`@geomatico/maplibre-cog-protocol`](https://github.com/geoawd/maplibre-cog-protocol#reprojection). It is kept apart so that the
core library does not carry [proj4](https://github.com/proj4js/proj4js) and
[`@developmentseed/raster-reproject`](https://github.com/developmentseed/deck.gl-raster/tree/main/packages/raster-reproject)
for those who only read Web Mercator COGs.

[Live examples](https://geoawd.github.io/maplibre-cog-reproject/)

```
npm install @geomatico/maplibre-cog-reproject
```

```
import {cogProtocol, setReproject} from '@geomatico/maplibre-cog-protocol';
import {reproject} from '@geomatico/maplibre-cog-reproject';

setReproject(reproject);
maplibregl.addProtocol('cog', cogProtocol);
```

In a `<script>` page, the package is `MaplibreCOGReproject`:
`MaplibreCOGProtocol.setReproject(MaplibreCOGReproject.reproject)`.

## CRSs

Built in: EPSG:29902 (TM65 / Irish Grid), EPSG:2157 (Irish Transverse Mercator) and EPSG:4326 (WGS84 longitude/latitude).

`registerProjection(epsgCode, definition)` teaches it any other CRS, with a proj4 or WKT definition, **before** the
COG is first requested. Include the datum shift (`+towgs84`) the CRS needs, or the result will be misplaced by the
difference between the datums:

```
import {registerProjection} from '@geomatico/maplibre-cog-reproject';

registerProjection(27700, '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs');
```

A COG in a CRS that is not known throws an error saying so.

## Accuracy

- The mapping from tile pixels to the COG's pixels is accurate to a fraction of a tile pixel.
- Accuracy is limited by the datum transformation. For the Irish Grid this is the 7-parameter Helmert
  transformation EPSG recommends, accurate to about 1 m. Grid-based transformations are not supported.

## Development

```bash
npm install
npm test            # biome + vitest (unit and end-to-end tests on a real COG, in test/data) + coverage
npm run build       # UMD, ESM and .d.ts into dist/
npm run watch       # rebuild dist/ and serve examples/ with live reload
```

The core library is a dev dependency, installed from its `hook-build` git branch, which has the reprojection hook (its `prepare`
script builds it). The end-to-end tests drive its internals through its ESM build (`@core/...` in
[vitest.config.ts](vitest.config.ts)). The examples load its UMD build from `node_modules`, and this package's from `dist/`.
