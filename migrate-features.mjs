import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src')

const mappings = [
  // Products
  { src: 'components/ProductCard.jsx', dest: 'features/products/components/ProductCard.jsx' },
  { src: 'components/ProductCard.test.jsx', dest: 'features/products/components/ProductCard.test.jsx' },
  { src: 'pages/Home.jsx', dest: 'features/products/pages/Home.jsx' },
  { src: 'pages/Home.test.jsx', dest: 'features/products/pages/Home.test.jsx' },
  { src: 'pages/Category.jsx', dest: 'features/products/pages/Category.jsx' },
  { src: 'pages/Category.test.jsx', dest: 'features/products/pages/Category.test.jsx' },
  { src: 'pages/ProductDetail.jsx', dest: 'features/products/pages/ProductDetail.jsx' },
  { src: 'pages/ProductDetail.test.jsx', dest: 'features/products/pages/ProductDetail.test.jsx' },

  // Checkout
  { src: 'pages/Checkout.jsx', dest: 'features/checkout/pages/Checkout.jsx' },
  { src: 'pages/Checkout.test.jsx', dest: 'features/checkout/pages/Checkout.test.jsx' },
  { src: 'pages/Sacola.jsx', dest: 'features/checkout/pages/Sacola.jsx' },
  { src: 'pages/Sacola.test.jsx', dest: 'features/checkout/pages/Sacola.test.jsx' },
  { src: 'pages/OrderConfirmation.jsx', dest: 'features/checkout/pages/OrderConfirmation.jsx' },
  { src: 'pages/OrderConfirmation.test.jsx', dest: 'features/checkout/pages/OrderConfirmation.test.jsx' },

  // Auth
  { src: 'pages/Login.jsx', dest: 'features/auth/pages/Login.jsx' },
  { src: 'pages/Login.test.jsx', dest: 'features/auth/pages/Login.test.jsx' },
  { src: 'pages/Register.jsx', dest: 'features/auth/pages/Register.jsx' },
  { src: 'pages/Register.test.jsx', dest: 'features/auth/pages/Register.test.jsx' },
  { src: 'pages/MinhaConta.jsx', dest: 'features/auth/pages/MinhaConta.jsx' },
  { src: 'pages/MinhaConta.test.jsx', dest: 'features/auth/pages/MinhaConta.test.jsx' },
  { src: 'components/ProtectedRoute.jsx', dest: 'features/auth/components/ProtectedRoute.jsx' },
  { src: 'components/ProtectedRoute.test.jsx', dest: 'features/auth/components/ProtectedRoute.test.jsx' },

  // Admin
  { src: 'components/AdminSidebar.jsx', dest: 'features/admin/components/AdminSidebar.jsx' },
  { src: 'components/AdminSidebar.test.jsx', dest: 'features/admin/components/AdminSidebar.test.jsx' },
  { src: 'pages/Dashboard.jsx', dest: 'features/admin/pages/Dashboard.jsx' },
  { src: 'pages/Dashboard.test.jsx', dest: 'features/admin/pages/Dashboard.test.jsx' },
  { src: 'pages/AdminCategories.jsx', dest: 'features/admin/pages/AdminCategories.jsx' },
  { src: 'pages/AdminCategories.test.jsx', dest: 'features/admin/pages/AdminCategories.test.jsx' },
  { src: 'pages/AdminOrders.jsx', dest: 'features/admin/pages/AdminOrders.jsx' },
  { src: 'pages/AdminOrders.test.jsx', dest: 'features/admin/pages/AdminOrders.test.jsx' },
  { src: 'pages/AdminProducts.jsx', dest: 'features/admin/pages/AdminProducts.jsx' },
  { src: 'pages/AdminProducts.test.jsx', dest: 'features/admin/pages/AdminProducts.test.jsx' },
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
