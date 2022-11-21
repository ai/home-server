import { readFileSync, rmSync, readdirSync, writeFileSync } from 'node:fs'
import { parse, stringify } from 'yaml'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')

function merge(base, add, path) {
  for (let key in add) {
    if (!(key in base)) {
      base[key] = add[key]
    } else if (Array.isArray(base[key]) && Array.isArray(base[key])) {
      base[key] = base[key].concat(add[key])
    } else if (typeof base[key] === 'object' && typeof add[key] === 'object') {
      merge(base[key], add[key], `${path}.${key}`)
    } else {
      process.stderr.write(`Do not know how to merge key ${path}\n`)
      process.exit(1)
    }
  }
}

function processFile(path) {
  let parsed = parse(readFileSync(path).toString())
  if (parsed.disabled) return
  if (parsed.systemd && parsed.systemd.units) {
    for (let unit of parsed.systemd.units) {
      unit.contents = readFileSync(join(path, '..', unit.name)).toString()
    }
  }
  merge(config, parsed, relative(ROOT, path))
}

let config = {}

rmSync(join(ROOT, 'config.bu'), { force: true })

readdirSync(join(ROOT, 'settings')).forEach(file => {
  processFile(join(ROOT, 'settings', file))
})
readdirSync(join(ROOT, 'units')).forEach(dir => {
  processFile(join(ROOT, 'units', dir, `${dir}.bu`))
})

writeFileSync(join(ROOT, 'config.bu'), stringify(config, { lineWidth: 0 }))
