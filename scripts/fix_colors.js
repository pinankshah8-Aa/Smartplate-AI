const fs = require('fs');
const path = require('path');

const files = [
  'app/page.tsx',
  'app/student/page.tsx',
  'app/admin/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace text-white with text-gray-900 dark:text-white EXCEPT where it's part of a solid colored button or icon container.
  // We'll do a basic replace of text-white first, then fix specific known colored backgrounds.
  content = content.replace(/\btext-white\b(?!(\/|\w))/g, 'text-gray-900 dark:text-white');
  
  // Revert for specific known safe bg-primary/bg-danger/bg-gradient cases
  // Examples: bg-primary text-gray-900 dark:text-white -> bg-primary text-white
  // bg-danger text-gray-900 dark:text-white -> bg-danger text-white
  content = content.replace(/(bg-primary(?:-dark|-light)?(?:\/[0-9]+)?|bg-danger(?:\/[0-9]+)?|bg-gradient-to-[\w]+ from-primary[^"']*?|from-primary[^"']*?)(\s+[^"']*?)*text-gray-900 dark:text-white/g, '$1$2text-white');

  // Specific revert for Sparkles icon container (p-3 rounded-full transition-colors duration-300 bg-primary text-gray-900 dark:text-white)
  // Actually the regex above covers it if bg-primary comes before. If text-gray-900 comes before bg-primary, we need to handle it.
  content = content.replace(/text-gray-900 dark:text-white(.*?\bbg-primary\b)/g, 'text-white$1');
  content = content.replace(/text-gray-900 dark:text-white(.*?\bbg-danger\b)/g, 'text-white$1');
  
  // Also hover:text-white
  content = content.replace(/\bhover:text-white\b/g, 'hover:text-gray-900 dark:hover:text-white');

  // text-white/90, text-white/50, etc.
  content = content.replace(/\btext-white\/90\b/g, 'text-gray-800 dark:text-gray-200');
  content = content.replace(/\btext-white\/70\b/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/\btext-white\/50\b/g, 'text-gray-500 dark:text-gray-400');
  content = content.replace(/\btext-white\/10\b/g, 'text-gray-200 dark:text-white/10');

  // Other text classes requested
  content = content.replace(/\btext-gray-300\b/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/\btext-gray-400\b/g, 'text-gray-500 dark:text-gray-400');
  content = content.replace(/\btext-slate-300\b/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/\btext-slate-400\b/g, 'text-gray-500 dark:text-gray-400');

  // text-muted -> text-gray-500 dark:text-gray-400
  content = content.replace(/\btext-muted\b/g, 'text-gray-500 dark:text-gray-400');

  // bg-background -> bg-gray-50 dark:bg-gray-950
  content = content.replace(/\bbg-background\b/g, 'bg-gray-50 dark:bg-gray-950');

  // bg-card -> bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800
  // Note: we might already have borders. Let's just do the bg replacement and border replacement.
  content = content.replace(/\bbg-card\b/g, 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800');

  // Inputs: glass-input -> bg-white dark:bg-gray-950 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700
  // Wait, if it has border-gray-300, it needs the border class too.
  content = content.replace(/\bglass-input\b/g, 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700');
  // Handle placeholder
  content = content.replace(/\bplaceholder:text-gray-500 dark:text-gray-400\/60\b/g, 'placeholder:text-gray-500 dark:placeholder:text-gray-400');

  // In page.tsx: text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60
  content = content.replace(/from-white via-white to-white\/60/g, 'from-gray-900 via-gray-800 to-gray-500 dark:from-white dark:via-white dark:to-gray-300');
  content = content.replace(/from-white to-white\/70/g, 'from-gray-900 to-gray-500 dark:from-white dark:to-gray-300');

  fs.writeFileSync(file, content);
  console.log('Processed', file);
});
