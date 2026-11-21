import {cpSync, mkdirSync, rmSync} from 'node:fs';

const site = '_site';
const files = [
  ['dist/index.js', `${site}/dist/index.js`],
  ['dist/index.js.map', `${site}/dist/index.js.map`],
  ['node_modules/@geomatico/maplibre-cog-protocol/dist/index.js', `${site}/core/index.js`],
  ['node_modules/@geomatico/maplibre-cog-protocol/dist/index.js.map', `${site}/core/index.js.map`],
];

rmSync(site, {recursive: true, force: true});
cpSync('examples', site, {recursive: true, filter: (src) => !src.endsWith('.DS_Store')});
for (const [from, to] of files) {
  mkdirSync(to.slice(0, to.lastIndexOf('/')), {recursive: true});
  cpSync(from, to);
}
console.log(`Site assembled in ${site}/`);
