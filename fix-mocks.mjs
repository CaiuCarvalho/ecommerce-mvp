import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src', 'features')

function fixMockImports(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      fixMockImports(filePath)
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf-8')
      
      // Fix vi.mock('../lib/...') to vi.mock('../../../lib/...')
      content = content.replace(/vi\.mock\(['"]\.\.\/([^'"]+)['"]/g, "vi.mock('../../../$1'")

      fs.writeFileSync(filePath, content)
    }
  }
}

fixMockImports(srcDir)
console.log('Fixed vi.mock imports in features!')
