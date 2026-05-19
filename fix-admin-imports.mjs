import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src', 'features', 'admin')

function fixAdminImports(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      fixAdminImports(filePath)
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf-8')
      
      // Fix ../../ to ../../../ since it moved from src/pages/admin/ to src/features/admin/pages/
      content = content.replace(/from\s+['"]\.\.\/\.\.\/contexts([^'"]*)['"]/g, "from '../../../contexts$1'")
      content = content.replace(/from\s+['"]\.\.\/\.\.\/lib([^'"]*)['"]/g, "from '../../../lib$1'")
      content = content.replace(/from\s+['"]\.\.\/\.\.\/stores([^'"]*)['"]/g, "from '../../../stores$1'")
      content = content.replace(/from\s+['"]\.\.\/\.\.\/test([^'"]*)['"]/g, "from '../../../test$1'")
      content = content.replace(/from\s+['"]\.\.\/\.\.\/components([^'"]*)['"]/g, "from '../../../components$1'")
      
      content = content.replace(/vi\.mock\(['"]\.\.\/\.\.\/lib([^'"]+)['"]/g, "vi.mock('../../../lib$1'")

      fs.writeFileSync(filePath, content)
    }
  }
}

fixAdminImports(srcDir)
console.log('Fixed imports in features/admin!')
