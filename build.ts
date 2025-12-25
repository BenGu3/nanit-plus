import tailwindPlugin from 'bun-plugin-tailwind';

await Bun.build({
  entrypoints: ['./src/index.html'],
  outdir: './dist',
  target: 'browser',
  minify: true,
  sourcemap: 'external',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [tailwindPlugin],
});

console.log('✅ Build completed');
