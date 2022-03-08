import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import { cleandir } from 'rollup-plugin-cleandir'
import path from 'path'
// import pkg from './package.json'

const extensions = ['.js', '.ts', '.json']

const resolve = function(...args) {
  return path.resolve(__dirname, ...args)
}

export default [
  {
    input: [resolve('./src/index.ts'), resolve('./src/bin.ts')],
    output: [
      {
        dir: './dist',
        // global: 弄个全局变量来接收
        // cjs: module.exports
        // esm: export default
        // iife: ()()
        // umd: 兼容 amd + commonjs 不支持es6导入
        format: 'cjs'
        // sourcemap: true, // ts中的sourcemap也得变为true
      }
    ],
    plugins: [
      cleandir('./dist'),
      typescript({
        module: 'esnext',
        exclude: ['./node_modules/**']
      }),
      nodeResolve({
        extensions,
        modulesOnly: true,
        preferredBuiltins: false
      }),
      commonjs({ extensions })
    ],
    external: [
      'prettier',
      'typescript',
      'fs',
      'fast-glob',
      'command-line-application'
    ]
  }
]
