import resolve from 'rollup-plugin-node-resolve'
import minify from 'rollup-plugin-minify-es'

const banner = '/**\n * Store\n *\n * Copyright 2018 Dmitry Dudin <dima@nuware.ru>\n */'

export default [{
  input: 'src/index.js',
  output: {
    file: 'dist/store.esm.js',
    format: 'esm',
    banner
  },
  external: ['@nuware/functions', '@nuware/lenses', '@nuware/emitter']
}, {
  input: 'src/index.js',
  output: {
    file: 'dist/store.umd.js',
    format: 'umd',
    name: 'nuware.Store',
    banner
  },
  plugins: [
    resolve()
  ]
}, {
  input: 'src/index.js',
  output: {
    file: 'dist/store.min.js',
    format: 'umd',
    name: 'nuware.Store'
  },
  plugins: [
    resolve(),
    minify()
  ]
}]
