import test = require('blue-tape')
import nock = require('nock')
import { join, relative } from 'path'
import { EventEmitter } from 'events'
import compile from './compile'
import { DependencyTree } from '../interfaces'
import { CONFIG_FILE } from '../utils/config'
import { VERSION } from '../typings'
import { resolveTypeDependencies, resolveNpmDependencies } from './dependencies'

const FIXTURES_DIR = join(__dirname, '__test__/fixtures')

test('compile', t => {
  t.test('fixtures', t => {
    t.test('compile a normal definition', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile')

      const root: DependencyTree = {
        src: join(FIXTURE_DIR, CONFIG_FILE),
        main: 'root',
        raw: undefined,
        ambient: false,
        browser: {
          b: 'browser'
        },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const a: DependencyTree = {
        src: join(FIXTURE_DIR, `a/${CONFIG_FILE}`),
        main: undefined,
        raw: undefined,
        ambient: false,
        typings: 'typed.d.ts',
        browserTypings: 'typed.browser.d.ts',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const b: DependencyTree = {
        src: join(FIXTURE_DIR, 'bower.json'),
        main: undefined,
        raw: undefined,
        ambient: false,
        typings: 'typings/b.d.ts',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const browser: DependencyTree = {
        src: join(FIXTURE_DIR, 'package.json'),
        main: undefined,
        raw: undefined,
        ambient: false,
        typings: 'browser.d.ts',
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const dep: DependencyTree = {
        src: join(FIXTURE_DIR, `dep/${CONFIG_FILE}`),
        main: 'dep/main.d.ts',
        raw: undefined,
        ambient: false,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      ;(root as any).dependencies.a = a
      ;(root as any).dependencies.b = b
      ;(root as any).dependencies.browser = browser
      ;(a as any).dependencies.dep = dep

      const emitter = new EventEmitter()

      return compile(root, { name: 'root', cwd: __dirname, ambient: false, meta: true, emitter })
        .then((result) => {
          t.equal(result.main, [
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/dep/path.d.ts`,
            'declare module \'~root~a~dep/path\' {',
            'export const isDep: boolean',
            '}',
            '',
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/a/typed.d.ts`,
            'declare module \'~root~a\' {',
            'import { isDep } from \'~root~a~dep/path\'',
            '',
            'export interface ITest {',
            '  foo: string',
            '  bar: boolean',
            '}',
            '',
            'export default function (): ITest',
            '}',
            '',
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/typings/b.d.ts`,
            'declare module \'~root~b\' {',
            'export const foo: number',
            '}',
            '',
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/root.import.d.ts`,
            'declare module \'~root/root.import\' {',
            'export const test: string',
            '}',
            'declare module \'root/root.import\' {',
            'export * from \'~root/root.import\';',
            '}',
            '',
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/root.d.ts`,
            'declare module \'~root/root\' {',
            'import a from \'~root~a\'',
            'import b = require(\'~root~b\')',
            'export * from \'~root/root.import\'',
            'export default a',
            '}',
            'declare module \'root/root\' {',
            'export * from \'~root/root\';',
            'export { default } from \'~root/root\';',
            '}',
            'declare module \'root\' {',
            'export * from \'~root/root\';',
            'export { default } from \'~root/root\';',
            '}',
            ''
          ].join('\n'))

          t.equal(result.browser, [
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/a/typed.browser.d.ts`,
            'declare module \'~root~a\' {',
            'export function browser (): boolean',
            '}',
            '',
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/browser.d.ts`,
            'declare module \'~root~browser\' {',
            'export const bar: boolean',
            '}',
            '',
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/root.import.d.ts`,
            'declare module \'~root/root.import\' {',
            'export const test: string',
            '}',
            'declare module \'root/root.import\' {',
            'export * from \'~root/root.import\';',
            '}',
            '',
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile/root.d.ts`,
            'declare module \'~root/root\' {',
            'import a from \'~root~a\'',
            'import b = require(\'~root~browser\')',
            'export * from \'~root/root.import\'',
            'export default a',
            '}',
            'declare module \'root/root\' {',
            'export * from \'~root/root\';',
            'export { default } from \'~root/root\';',
            '}',
            'declare module \'root\' {',
            'export * from \'~root/root\';',
            'export { default } from \'~root/root\';',
            '}',
            ''
          ].join('\n'))
        })
    })

    t.test('compile export equals', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-export-equals')

      const file: DependencyTree = {
        src: join(FIXTURE_DIR, CONFIG_FILE),
        main: 'file.d.ts',
        raw: undefined,
        ambient: false,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const emitter = new EventEmitter()

      return compile(file, { name: 'foobar', cwd: __dirname, ambient: false, meta: false, emitter })
        .then(results => {
          t.equal(results.main, [
            'declare module \'~foobar/file\' {',
            'function foo (value: string): foo.Bar;',
            '',
            'module foo {',
            '  export interface Bar {',
            '    (message: any, ...args: any[]): void;',
            '    enabled: boolean;',
            '    namespace: string;',
            '  }',
            '}',
            '',
            'export = foo;',
            '}',
            'declare module \'foobar/file\' {',
            'import main = require(\'~foobar/file\');',
            'export = main;',
            '}',
            'declare module \'foobar\' {',
            'import main = require(\'~foobar/file\');',
            'export = main;',
            '}',
            ''
          ].join('\n'))
        })
    })

    t.test('compile export default', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-export-default')

      const file: DependencyTree = {
        src: join(FIXTURE_DIR, CONFIG_FILE),
        main: 'index.d.ts',
        raw: undefined,
        ambient: false,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const emitter = new EventEmitter()

      return compile(file, { name: 'test', cwd: __dirname, ambient: false, meta: false, emitter })
        .then(results => {
          t.equal(results.main, [
            'declare module \'~test/index\' {',
            'const foo: string;',
            '',
            'export default foo;',
            '}',
            'declare module \'test/index\' {',
            'export { default } from \'~test/index\';',
            '}',
            'declare module \'test\' {',
            'export { default } from \'~test/index\';',
            '}',
            ''
          ].join('\n'))
        })
    })

    t.test('compile module augmentation', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-module-augmentation')

      const file: DependencyTree = {
        src: join(FIXTURE_DIR, CONFIG_FILE),
        main: 'index.d.ts',
        raw: undefined,
        ambient: false,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const emitter = new EventEmitter()

      return compile(file, { name: 'test', cwd: __dirname, ambient: false, meta: false, emitter })
        .then(results => {
          t.equal(results.main, [
            'declare module \'~test/import\' {',
            'function main (): boolean;',
            '',
            'export { main }',
            '}',
            'declare module \'test/import\' {',
            'export * from \'~test/import\';',
            '}',
            '',
            'declare module \'~test/index\' {',
            'import * as imported from \'~test/import\'',
            '',
            'module \'~test/import\' {',
            '  namespace main {',
            '    export function augmented (): boolean;',
            '  }',
            '}',
            '',
            'export { imported }',
            '}',
            'declare module \'test/index\' {',
            'export * from \'~test/index\';',
            '}',
            'declare module \'test\' {',
            'export * from \'~test/index\';',
            '}',
            ''
          ].join('\n'))
        })
    })

    t.test('compile an ambient definition', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-ambient')

      const node: DependencyTree = {
        src: __filename,
        raw: undefined,
        ambient: true,
        typings: join(FIXTURE_DIR, 'node.d.ts'),
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const fs: DependencyTree = {
        src: join(FIXTURE_DIR, 'fs.d.ts'),
        main: undefined,
        raw: undefined,
        ambient: false,
        typings: join(FIXTURE_DIR, 'fs.d.ts'),
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      ;(node as any).dependencies.fs = fs

      const emitter = new EventEmitter()

      return compile(node, { name: 'name', cwd: __dirname, ambient: true, meta: false, emitter })
        .then(result => {
          t.equal(result.main, [
            'declare module \'fs\' {',
            'export function readFileSync (path: string, encoding: string): string',
            'export function readFileSync (path: string): Buffer',
            '}',
            '',
            'declare var __dirname: string'
          ].join('\n'))
        })
    })

    t.test('compile inline ambient definitions', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-inline-ambient')
      const typings = join(FIXTURE_DIR, 'node.d.ts')

      const node: DependencyTree = {
        src: __filename,
        raw: undefined,
        ambient: true,
        typings,
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const emitter = new EventEmitter()

      return compile(node, { name: 'name', cwd: __dirname, ambient: true, meta: true, emitter })
        .then(result => {
          const contents = [
            `// Generated by typings`,
            `// Source: __test__/fixtures/compile-inline-ambient/node.d.ts`,
            'declare const require: (module: string) => any;',
            '',
            'declare module "events" {',
            '\texport const test: boolean;',
            '}',
            '',
            'declare module "fs" {',
            '\timport * as events from "events";',
            '}'
          ].join('\n')

          t.equal(result.main, result.browser)
          t.equal(result.main, contents)
        })
    })
  })

  t.test('missing error', t => {
    const node: DependencyTree = {
      src: 'http://example.com/typings/typings.json',
      raw: undefined,
      ambient: false,
      typings: 'http://example.com/typings/index.d.ts',
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ambientDependencies: {},
      ambientDevDependencies: {}
    }

    const emitter = new EventEmitter()

    t.plan(1)

    return compile(node, { name: 'test', cwd: __dirname, ambient: false, meta: false, emitter })
      .catch(function (result) {
        t.equal(result.message, 'Unable to read typings for "test". You should check the entry paths in "typings.json" are up to date')
      })
  })

  t.test('ambient compile error', t => {
    const node: DependencyTree = {
      src: 'http://example.com/typings.json',
      raw: undefined,
      ambient: true,
      typings: 'http://example.com/index.d.ts',
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ambientDependencies: {},
      ambientDevDependencies: {}
    }

    const emitter = new EventEmitter()

    t.plan(1)

    return compile(node, { name: 'name', cwd: __dirname, ambient: false, meta: false, emitter })
      .catch(function (result) {
        t.equal(result.message, 'Unable to compile "name", the typings are meant to be installed as ambient but attempted to be compiled as an external module')
      })
  })

  t.test('no main or typings error', t => {
    const FIXTURE_DIR = join(FIXTURES_DIR, 'main-resolve-error')

    const main: DependencyTree = {
      src: join(FIXTURE_DIR, 'package.json'),
      raw: undefined,
      ambient: false,
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ambientDependencies: {},
      ambientDevDependencies: {}
    }

    const emitter = new EventEmitter()

    t.plan(1)

    return compile(main, { name: 'main', cwd: __dirname, ambient: false, meta: false, emitter })
      .catch(function (error) {
        t.ok(/^Unable to resolve entry "\.d\.ts" file for "main"/.test(error.message))
      })
  })

  t.test('no module dts file error', t => {
    const FIXTURE_DIR = join(FIXTURES_DIR, 'node-resolve-error')

    const main: DependencyTree = {
      src: join(FIXTURE_DIR, 'package.json'),
      main: 'index.js',
      raw: undefined,
      ambient: false,
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ambientDependencies: {},
      ambientDevDependencies: {}
    }

    const dependency: DependencyTree = {
      main: 'index.js',
      raw: undefined,
      ambient: false,
      src: join(FIXTURE_DIR, 'node_modules/test/package.json'),
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ambientDependencies: {},
      ambientDevDependencies: {}
    }

    const emitter = new EventEmitter()

    ;(main as any).dependencies.test = dependency

    t.plan(1)

    return compile(main, { name: 'main', cwd: __dirname, ambient: false, meta: false, emitter })
      .catch(function (error) {
        t.ok(/^Unable to read typings for "test"/.test(error.message))
      })
  })

  t.test('override dependency with local file', t => {
    const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-module-file-override')
    const emitter = new EventEmitter()

    return resolveNpmDependencies({ cwd: FIXTURE_DIR, dev: false, emitter })
      .then(x => compile(x, { name: 'main', cwd: __dirname, ambient: false, meta: false, emitter }))
      .then(result => {
        t.equal(result.browser, [
          'declare module \'~main/override\' {',
          'function test (): string;',
          '',
          'export = test;',
          '}',
          'declare module \'main/override\' {',
          'import main = require(\'~main/override\');',
          'export = main;',
          '}',
          '',
          'declare module \'~main/index\' {',
          'import * as foo from \'~main/override\'',
          '',
          'export = foo',
          '}',
          'declare module \'main/index\' {',
          'import main = require(\'~main/index\');',
          'export = main;',
          '}',
          'declare module \'main\' {',
          'import main = require(\'~main/index\');',
          'export = main;',
          '}',
          ''
        ].join('\n'))
      })
  })

  t.test('resolve and compile local file override with dependency', t => {
    const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-file-module-override')
    const emitter = new EventEmitter()

    return resolveNpmDependencies({ cwd: FIXTURE_DIR, dev: false, emitter })
      .then(x => compile(x, { name: 'main', cwd: __dirname, ambient: false, meta: false, emitter }))
      .then(result => {
        t.equal(result.main, [
          'declare module \'~main/imported\' {',
          'export function isNotDep (): boolean;',
          '}',
          'declare module \'main/imported\' {',
          'export * from \'~main/imported\';',
          '}',
          '',
          'declare module \'~main/index\' {',
          'export * from \'~main/imported\'',
          '}',
          'declare module \'main/index\' {',
          'export * from \'~main/index\';',
          '}',
          'declare module \'main\' {',
          'export * from \'~main/index\';',
          '}',
          ''
        ].join('\n'))

        t.equal(result.browser, [
          'declare module \'~main~dep/index\' {',
          'export function isDep (): boolean;',
          '}',
          'declare module \'~main~dep\' {',
          'export * from \'~main~dep/index\';',
          '}',
          '',
          'declare module \'~main/index\' {',
          'export * from \'~main~dep\'',
          '}',
          'declare module \'main/index\' {',
          'export * from \'~main/index\';',
          '}',
          'declare module \'main\' {',
          'export * from \'~main/index\';',
          '}',
          ''
        ].join('\n'))
      })
  })

  t.test('resolve over http', t => {
    const node: DependencyTree = {
      src: 'http://example.com/typings.json',
      raw: undefined,
      ambient: false,
      typings: 'http://example.com/index.d.ts',
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ambientDependencies: {},
      ambientDevDependencies: {}
    }

    const emitter = new EventEmitter()

    nock('http://example.com')
      .get('/index.d.ts')
      .matchHeader('User-Agent', /^typings\/\d+\.\d+\.\d+ node\/v\d+\.\d+\.\d+.*$/)
      .reply(200, 'export const helloWorld: string')

    return compile(node, { name: 'test', cwd: __dirname, ambient: false, meta: false, emitter })
      .then(function (result) {
        t.equal(result.main, `declare module 'test' {\nexport const helloWorld: string\n}\n`)
      })
  })

  t.test('resolve files array', t => {
    const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-files-array')

    const tree: DependencyTree = {
      src: join(FIXTURE_DIR, 'typings.json'),
      raw: undefined,
      ambient: false,
      files: ['a.d.ts', 'b.d.ts'],
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      ambientDependencies: {},
      ambientDevDependencies: {}
    }

    const emitter = new EventEmitter()

    return compile(tree, { name: 'test', cwd: __dirname, ambient: false, meta: false, emitter })
      .then(function (result) {
        t.equal(result.main, result.browser)

        t.equal(result.main, [
          'declare module \'~test/a\' {',
          'export const a: boolean;',
          '}',
          'declare module \'test/a\' {',
          'export * from \'~test/a\';',
          '}',
          '',
          'declare module \'~test/b\' {',
          'export const b: boolean;',
          '}',
          'declare module \'test/b\' {',
          'export * from \'~test/b\';',
          '}',
          ''
        ].join('\n'))
      })
  })
})
