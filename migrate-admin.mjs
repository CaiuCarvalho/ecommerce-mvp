import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src')

const mappings = [
  // Admin
  { src: 'components/admin/AdminSidebar.jsx', dest: 'features/admin/components/AdminSidebar.jsx' },
  { src: 'pages/admin/Dashboard.jsx', dest: 'features/admin/pages/Dashboard.jsx' },
  { src: 'pages/admin/Dashboard.test.jsx', dest: 'features/admin/pages/Dashboard.test.jsx' },
  { src: 'pages/admin/Categories.jsx', dest: 'features/admin/pages/Categories.jsx' },
  { src: 'pages/admin/Orders.jsx', dest: 'features/admin/pages/Orders.jsx' },
  { src: 'pages/admin/Orders.test.jsx', dest: 'features/admin/pages/Orders.test.jsx' },
  { src: 'pages/admin/Products.jsx', dest: 'features/admin/pages/Products.jsx' },
  { src: 'pages/admin/OrderDetail.jsx', dest: 'features/admin/pages/OrderDetail.jsx' },
  { src: 'pages/admin/OrderDetail.test.jsx', dest: 'features/admin/pages/OrderDetail.test.jsx' },
  { src: 'pages/admin/ProductEdit.jsx', dest: 'features/admin/pages/ProductEdit.jsx' },
  { src: 'pages/admin/ProductNew.jsx', dest: 'features/admin/pages/ProductNew.jsx' },
]

// Create directories
for (const mapping of mappings) {
  const destDir = path.dirname(path.join(srcDir, mapping.dest))
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
}

// Move files
for (const mapping of mappings) {
  const srcFile = path.join(srcDir, mapping.src)
  const destFile = path.join(srcDir, mapping.dest)
  if (fs.existsSync(srcFile)) {
    fs.renameSync(srcFile, destFile)
    console.log(`Moved: ${mapping.src} -> ${mapping.dest}`)
  }
}

// Helper to fix imports in a string
function fixImports(content, fileDir) {
  const depth = fileDir.replace(srcDir, '').split(path.sep).filter(Boolean).length
  const rootRelative = depth === 0 ? './' : '../'.repeat(depth)

  return content.replace(/from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
    if (!importPath.startsWith('.')) return match // skip external

    const absoluteImportPath = path.resolve(fileDir, importPath)

    // Check if the imported file was moved
    const relativeToSrc = path.relative(srcDir, absoluteImportPath).replace(/\\/g, '/')
    
    // We need to match with or without extensions, usually .jsx or .js
    let newImportPath = null

    for (const mapping of mappings) {
      const srcWithoutExt = mapping.src.replace(/\.jsx?$/, '')
      if (relativeToSrc === srcWithoutExt || relativeToSrc === mapping.src) {
        newImportPath = mapping.dest.replace(/\.jsx?$/, '')
        break
      }
    }

    if (newImportPath) {
      // It was moved, calculate new relative path
      let relativeResult = path.relative(fileDir, path.join(srcDir, newImportPath)).replace(/\\/g, '/')
      if (!relativeResult.startsWith('.')) relativeResult = './' + relativeResult
      return `from '${relativeResult}'`
    } else {
      // It wasn't moved, but our file might have been moved!
      // We calculate the new path to the old absolute target
      let relativeResult = path.relative(fileDir, absoluteImportPath).replace(/\\/g, '/')
      if (!relativeResult.startsWith('.')) relativeResult = './' + relativeResult
      return `from '${relativeResult}'`
    }
  })
}

// Process all files in src
function processDirectory(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath)
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const fixedContent = fixImports(content, path.dirname(filePath))
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent)
        console.log(`Fixed imports in: ${path.relative(srcDir, filePath)}`)
      }
    }
  }
}

processDirectory(srcDir)
console.log('Done!')
