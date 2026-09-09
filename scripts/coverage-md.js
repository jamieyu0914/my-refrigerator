import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const summaryPath = resolve('coverage/coverage-summary.json')
const testResultsPath = resolve('coverage/test-results.json')

// Running `npm run coverage` on its own (without `test` having just run)
// leaves these files missing — generate them instead of crashing.
if (!existsSync(summaryPath) || !existsSync(testResultsPath)) {
  console.log('[coverage-md] no coverage data found, running `vitest run --coverage` first...')
  const result = spawnSync('npx', ['vitest', 'run', '--coverage'], { stdio: 'inherit' })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const { total, ...files } = JSON.parse(readFileSync(summaryPath, 'utf-8'))
const root = `${process.cwd()}/`

const { testResults, numTotalTests, numFailedTests } = JSON.parse(
  readFileSync(testResultsPath, 'utf-8'),
)

const numTotalTestFiles = testResults.length
const numFailedTestFiles = testResults.filter((r) => r.status === 'failed').length

const status =
  numFailedTestFiles === 0 && numFailedTests === 0
    ? `現況：${numTotalTestFiles} 個測試檔、${numTotalTests} 筆測試全數通過`
    : `現況：${numTotalTestFiles} 個測試檔（失敗 ${numFailedTestFiles}）、${numTotalTests} 筆測試（失敗 ${numFailedTests}）`

const row = (name, s) =>
  `| ${name} | ${s.statements.pct}% | ${s.branches.pct}% | ${s.functions.pct}% | ${s.lines.pct}% |`

const lines = [
  status,
  '',
  '| File | Stmts | Branch | Funcs | Lines |',
  '|---|---|---|---|---|',
  row('**All files**', total),
  ...Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, s]) => row(path.replace(root, ''), s)),
]

const markdown = lines.join('\n')

writeFileSync(resolve('coverage/coverage-summary.md'), `${markdown}\n`)
console.log(markdown)
