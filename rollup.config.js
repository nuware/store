import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const input = 'src/index.js'
const external = ['@nuware/functions', '@nuware/lenses', '@nuware/emitter']

const banner = `/**
 * Store - ${pkg.description}
 *
 * @version ${pkg.version}
 * @license MIT
 * @copyright Dmitry Dudin <dima@nuware.ru> 2018
 */`

export default [{
  input,
  external,
  output: {
    file: pkg.module,
    format: 'esm',
    banner
  }
}, {
  input,
  external,
  output: {
    file: pkg.main,
    format: 'cjs',
    banner
  }
}, {
  input,
  output: {
    file: pkg.browser,
    format: 'umd',
    name: 'nuware.Store',
    banner
  },
  plugins: [
    resolve(),
    commonjs()
  ]
}, {
  input,
  output: {
    file: pkg.minimized,
    format: 'umd',
    name: 'nuware.Store'
  },
  plugins: [
    resolve(),
    commonjs(),
    terser()
  ]
}]
