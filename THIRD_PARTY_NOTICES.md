# Third-party sources

## EZ-Tree

Tree generation and bundled oak foliage/bark textures are integrated via the npm package **@dgreenheck/ez-tree 1.1.0**, by Daniel Greenheck.

- Repository: https://github.com/dgreenheck/ez-tree (formerly tree-js)
- License: MIT. Full license is included with the npm package and copied into `public/licenses/ez-tree.txt` for distribution.
- Oak bark maps in the package originate from https://polyhaven.com/a/bark_brown_02, as documented by the package's `src/lib/assets/bark/README.md`.
- The package's wind shader credits https://github.com/ashima/webgl-noise.
- This project uses the Oak Large preset with adjusted geometry detail and canopy density. Wish leaves, event animation, meadow renderer and application code are implemented in this project.

## Meadow research

Reviewed https://github.com/Nitash-Biswas/grass-shader-glsl for its description of instancing, patch distribution, distance detail and GPU wind animation. No source code or assets from that repository are copied. `src/Meadow.ts` is an original implementation using Three.js materials and custom wind/color shader additions.

Other runtime libraries are recorded in package.json and package-lock.json; their respective notices remain in their distributed packages.

## Broad Bang leaves

The final canopy replaces the library's photographic oak foliage cards with original broad 3D leaf geometry and procedurally drawn vein/surface textures in src/BangFoliage.ts. Bark and the branching skeleton continue to use EZ-Tree. No additional third-party leaf image assets are used.

