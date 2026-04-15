#!/usr/bin/env node
/**
 * vue-accessible-color-picker (VACP) post-yarn patches for Baserow color field.
 *
 * 1. le() null guard: p.value can be null when the grid unmounts before change fires.
 * 2. mapReturn: querySelector null-safe for the same reason.
 * 3. Remove sliders-only UI: strip vacp-actions + vacp-color-inputs (copy, hex/HSL text, format switch).
 * 4. toRaw: use me(l.value).to(...) (Vue's toRaw) so Color.js conversions are not run on reactive proxies.
 *
 * Idempotent: each step checks before applying. Fails loudly if anchors change (upgrade VACP / verify dist).
 */
const fs = require('fs')
const path = require('path')

const target = path.join(
  process.cwd(),
  'node_modules/vue-accessible-color-picker/dist/ColorPicker.js'
)

if (!fs.existsSync(target)) {
  console.error('patch-vue-accessible-color-picker: file not found:', target)
  process.exit(1)
}

let s = fs.readFileSync(target, 'utf8')

// --- 1. le() null guard ---
if (!s.includes('if (p.value == null) return;')) {
  const anchor = 'function le() {\n      const e = h.value'
  if (!s.includes(anchor)) {
    console.error(
      'patch-vue-accessible-color-picker: le() anchor missing (package version changed?)'
    )
    process.exit(1)
  }
  s = s.replace(
    anchor,
    'function le() {\n      if (p.value == null) return;\n      const e = h.value'
  )
  console.log('patch-vue-accessible-color-picker: le() guard applied')
} else {
  console.log('patch-vue-accessible-color-picker: le() guard already present')
}

// --- 2. mapReturn null-safe ---
const mapReturn =
  'const m = p.value.querySelector(`input[id="${n.id}-color-${e}-${c}"]`);\n        return u(m.value);'
const mapReturnSafe =
  'const m = p.value.querySelector(`input[id="${n.id}-color-${e}-${c}"]`);\n        return m == null ? NaN : u(m.value);'

if (s.includes(mapReturn)) {
  s = s.replace(mapReturn, mapReturnSafe)
  console.log('patch-vue-accessible-color-picker: mapReturn safe applied')
} else if (s.includes(mapReturnSafe)) {
  console.log('patch-vue-accessible-color-picker: mapReturn safe already present')
}

// --- 3. Remove vacp-actions (Fe) + vacp-color-inputs (Le) render branches (VACP 6.x dist) ---
const feStart = '      a("div", Fe, ['
const leCloseTail = '\n        ])) : U("", !0)\n      ])\n'

if (s.includes(feStart)) {
  const i0 = s.indexOf(feStart)
  const i1 = s.indexOf(leCloseTail, i0)
  if (i1 === -1) {
    console.error(
      'patch-vue-accessible-color-picker: expected Le block end not found'
    )
    process.exit(1)
  }
  const i2 = i1 + leCloseTail.length
  s = s.slice(0, i0) + s.slice(i2)
  console.log('patch-vue-accessible-color-picker: removed actions + color inputs UI')
} else {
  console.log(
    'patch-vue-accessible-color-picker: actions/inputs block already removed'
  )
}

// --- 4. toRaw before .to( on reactive Color ref (import toRaw as me from vue) ---
if (s.includes('l.value.to(')) {
  s = s.replace(/l\.value\.to\(/g, 'me(l.value).to(')
  console.log('patch-vue-accessible-color-picker: applied toRaw (me) around l.value.to(')
} else {
  console.log('patch-vue-accessible-color-picker: toRaw patch already applied or no l.value.to(')
}

fs.writeFileSync(target, s)
console.log('patch-vue-accessible-color-picker: done')
