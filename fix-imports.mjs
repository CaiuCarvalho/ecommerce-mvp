import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'src', 'features')

function fixFeatureImports(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      fixFeatureImports(filePath)
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf-8')
      
      // All files were in src/pages or src/components (depth 1 from src)
      // Now they are in src/features/xxx/pages or src/features/xxx/components (depth 3 from src)
      // So what was `../foo` (reaching src/foo) must become `../../../foo`
      // What was `../../foo` (reaching outside src) must become `../../../../foo`
      // Actually, if it imported `../contexts`, it meant src/contexts.
      // But my previous script might have messed them up. Let's see what the current imports are.
      // Wait, my previous script resolved them as relative to the NEW location, so it left them as `../contexts` because they weren't in mappings!
      // So they are still `../contexts`. 
      
      content = content.replace(/from\s+['"]\.\.\/contexts([^'"]*)['"]/g, "from '../../../contexts$1'")
      content = content.replace(/from\s+['"]\.\.\/lib([^'"]*)['"]/g, "from '../../../lib$1'")
      content = content.replace(/from\s+['"]\.\.\/stores([^'"]*)['"]/g, "from '../../../stores$1'")
      content = content.replace(/from\s+['"]\.\.\/test([^'"]*)['"]/g, "from '../../../test$1'")
      content = content.replace(/from\s+['"]\.\.\/components([^'"]*)['"]/g, "from '../../../components$1'")
      
      // Also for dynamic imports or direct imports
      content = content.replace(/import\s+['"]\.\.\/components([^'"]*)['"]/g, "import '../../../components$1'")

      fs.writeFileSync(filePath, content)
    }
  }
}

fixFeatureImports(srcDir)
console.log('Fixed imports in features!')
