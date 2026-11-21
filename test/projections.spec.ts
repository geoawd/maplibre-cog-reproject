import {describe, expect, test} from 'vitest';

import {getProjection, registerProjection} from '../src/projections';
import {reproject} from '../src/reproject';

const EXTENT: [number, number, number, number] = [300000, 330000, 351200, 381200];

describe('EPSG:29902 (TM65 / Irish Grid)', () => {
  const irishGrid = getProjection(29902)!;

  // Reference values from PROJ (pyproj 3, Transformer.from_crs(29902, 4326/3857)), which for this CRS
  // uses the same "TM65 to WGS 84 (2)" Helmert transformation, 1 m accurate according to EPSG.
  test.each([
    [333000, 334000, -5.960858218956, 54.237627507313, -663559.7016, 7215289.1697],
    [315904.18, 234671.07, -6.260245791219, 53.349796595334, -696887.3737, 7047964.7566],
    [200000, 250000, -8.000738627847, 53.500211608855, -890638.15, 7076064.8783],
  ])('(%d, %d) is at longitude %d, latitude %d, and x %d, y %d in Web Mercator', (e, n, lon, lat, x, y) => {
    const [actualLon, actualLat] = irishGrid.toLonLat(e, n);
    expect(actualLon).toBeCloseTo(lon, 8);
    expect(actualLat).toBeCloseTo(lat, 8);

    const [actualX, actualY] = irishGrid.toWebMercator(e, n);
    expect(actualX).toBeCloseTo(x, 3);
    expect(actualY).toBeCloseTo(y, 3);
  });

  test('applies the datum shift: TM65 is tens of metres away from WGS84', () => {
    // Without the Helmert shift the same Irish Grid point would land ~70 m away (checked on proj4's
    // own datum-less result), so this guards against an EPSG definition that lacks +towgs84.
    const [lon, lat] = irishGrid.toLonLat(200000, 250000);
    expect(lon).toBeCloseTo(-8.0007386, 6); // not -8.0000: the false origin is on the TM65 datum
    expect(lat).toBeCloseTo(53.5002116, 6); // not 53.5000
  });

  test('inverse is the exact opposite of forward', () => {
    const [x, y] = irishGrid.toWebMercator(325000, 355000);
    const [e, n] = irishGrid.fromWebMercator(x, y);
    expect(e).toBeCloseTo(325000, 2); // proj4's iterative inverse is good to about a millimetre
    expect(n).toBeCloseTo(355000, 2);
  });
});

describe('reproject', () => {
  const reprojectCog = (epsg: number, extent = EXTENT) => reproject({url: 'a.tif', epsg, extent});

  test('knows EPSG:29902, EPSG:2157 and EPSG:4326', () => {
    expect(reprojectCog(29902).crs).toBe('EPSG:29902');
    expect(reprojectCog(2157).crs).toBe('EPSG:2157');
    expect(reprojectCog(4326, [-7, 54, -6, 55]).crs).toBe('EPSG:4326');
  });

  test('computes the geographic bounding box of the extent', () => {
    const {geographicBbox} = reprojectCog(29902);
    // From PROJ, over the corners of the extent
    expect(geographicBbox[0]).toBeCloseTo(-6.4681, 3);
    expect(geographicBbox[1]).toBeCloseTo(54.1967, 3);
    expect(geographicBbox[2]).toBeCloseTo(-5.6579, 3);
    expect(geographicBbox[3]).toBeCloseTo(54.669, 3);
  });

  test('gives the Web Mercator resolution of an image of the extent', () => {
    // 1024 pixels of 50 m, at 54.4ºN, where Web Mercator stretches by 1 / cos(latitude)
    const resolution = reprojectCog(29902).resolution(1024, 1024);
    expect(resolution).toBeCloseTo(50 / Math.cos((54.43 * Math.PI) / 180), 0);
  });

  test('explains how to register a CRS it does not know', () => {
    expect(() => reprojectCog(27700)).toThrow(
      /EPSG:27700 in a\.tif is not known\. Register it with registerProjection\(27700/,
    );
  });

  test('registerProjection teaches it a new CRS', () => {
    expect(() => reprojectCog(3035)).toThrow(/not known/);

    registerProjection(
      3035,
      '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    );

    expect(reprojectCog(3035, [3200000, 3000000, 3300000, 3100000]).crs).toBe('EPSG:3035');
    const [lon, lat] = getProjection(3035)!.toLonLat(4321000, 3210000);
    expect(lon).toBeCloseTo(10, 6);
    expect(lat).toBeCloseTo(52, 6);
  });
});
