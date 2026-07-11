const fs = require('fs');

const files = [
  'app/page.tsx',
  'app/student/page.tsx',
  'app/admin/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // We will find all className="..." blocks and process them individually
  // This avoids multi-line swallowing and regex hell.
  content = content.replace(/className=(["`'])(.*?)\1/g, (match, quote, classStr) => {
    let classes = classStr;

    // Check if this container has a background that requires white text in light mode
    const hasSolidColoredBg = /\b(bg-primary(?:\/[0-9]+)?|bg-danger(?:\/[0-9]+)?|bg-info(?:\/[0-9]+)?|bg-warning(?:\/[0-9]+)?|bg-gradient-to-[\w]+|from-primary[^"']*?|from-white)\b/.test(classes);

    if (!hasSolidColoredBg) {
      // It's safe to replace text-white with adaptive text classes
      classes = classes.replace(/\btext-white\b/g, 'text-slate-900 dark:text-white');
      classes = classes.replace(/\bhover:text-white\b/g, 'hover:text-slate-900 dark:hover:text-white');
      
      // text-white transparencies
      classes = classes.replace(/\btext-white\/90\b/g, 'text-slate-800 dark:text-white/90');
      classes = classes.replace(/\btext-white\/70\b/g, 'text-slate-700 dark:text-white/70');
      classes = classes.replace(/\btext-white\/50\b/g, 'text-slate-500 dark:text-white/50');
      classes = classes.replace(/\btext-white\/10\b/g, 'text-slate-200 dark:text-white/10');
    } else if (hasSolidColoredBg && classes.includes('from-white via-white')) {
        classes = classes.replace(/from-white via-white to-white\/60/g, 'from-slate-900 via-slate-800 to-slate-500 dark:from-white dark:via-white dark:to-white/60');
    } else if (hasSolidColoredBg && classes.includes('from-white to-white/70')) {
        classes = classes.replace(/from-white to-white\/70/g, 'from-slate-900 to-slate-500 dark:from-white dark:to-white/70');
    } else {
        // Special cases where hover:text-white is used with a background, but in light mode, hovering over it should have a dark text?
        // Wait, if it has a solid background, hover:text-white is probably fine as is! (e.g. green button turning white text on hover).
    }

    // Always replace these grays
    classes = classes.replace(/\btext-gray-300\b/g, 'text-slate-700 dark:text-gray-300');
    classes = classes.replace(/\btext-gray-400\b/g, 'text-slate-500 dark:text-gray-400');
    classes = classes.replace(/\btext-slate-300\b/g, 'text-slate-700 dark:text-slate-300');
    classes = classes.replace(/\btext-slate-400\b/g, 'text-slate-500 dark:text-slate-400');

    // Return the replaced string
    return `className=${quote}${classes}${quote}`;
  });

  fs.writeFileSync(file, content);
  console.log('Processed', file);
});
