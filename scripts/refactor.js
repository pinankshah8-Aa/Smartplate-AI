const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// 1. Refactor models to use default exports
const modelsDir = path.join(projectRoot, 'models');
if (fs.existsSync(modelsDir)) {
  const modelFiles = fs.readdirSync(modelsDir);
  for (const file of modelFiles) {
    if (file.endsWith('.ts')) {
      const filePath = path.join(modelsDir, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Match `export const ModelName = mongoose.models.ModelName || mongoose.model('ModelName', Schema);`
      const exportRegex = /export const (\w+) = (mongoose\.models\.\w+ \|\| mongoose\.model\([\s\S]*?\));/g;
      
      content = content.replace(exportRegex, (match, modelName, modelCreation) => {
        return `const ${modelName} = ${modelCreation};\nexport default ${modelName};`;
      });

      fs.writeFileSync(filePath, content, 'utf-8');
    }
  }
}

// 2. Refactor imports in all .ts and .tsx files
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        walkDir(fullPath, callback);
      }
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        callback(fullPath);
      }
    }
  }
}

walkDir(projectRoot, (filePath) => {
  if (filePath.includes('scripts/refactor.js')) return; // skip self if somehow ts
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace fragile relative paths for lib/dbConnect
  content = content.replace(/import dbConnect from ['"](\.\.\/)+lib\/dbConnect['"];/g, 'import dbConnect from "@/lib/dbConnect";');
  
  // Replace fragile relative paths for services/pushService
  content = content.replace(/import \{ sendPushNotification \} from ['"](\.\.\/)+services\/pushService['"];/g, 'import { sendPushNotification } from "@/services/pushService";');
  
  // Replace fragile relative paths for models AND convert to default imports
  // Matches: import { User } from '../../../models/User';
  // Matches: import { AIInsight } from '../../../../models/AIInsight';
  const modelImportRegex = /import\s*\{\s*(\w+)\s*\}\s*from\s*['"](\.\.\/)+models\/(\w+)['"];/g;
  content = content.replace(modelImportRegex, (match, importedName, relativePath, moduleName) => {
    return `import ${importedName} from "@/models/${moduleName}";`;
  });

  // What if it's already using named imports with alias? e.g. import { User } from '@/models/User'
  const aliasNamedModelRegex = /import\s*\{\s*(\w+)\s*\}\s*from\s*['"]@\/models\/(\w+)['"];/g;
  content = content.replace(aliasNamedModelRegex, (match, importedName, moduleName) => {
    return `import ${importedName} from "@/models/${moduleName}";`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath.replace(projectRoot, '')}`);
  }
});
