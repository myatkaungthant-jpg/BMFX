const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-zinc-950': 'bg-white dark:bg-zinc-950',
  'bg-zinc-900': 'bg-zinc-50 dark:bg-zinc-900',
  'bg-zinc-800': 'bg-zinc-100 dark:bg-zinc-800',
  'border-zinc-900': 'border-zinc-200 dark:border-zinc-900',
  'border-zinc-800': 'border-zinc-200 dark:border-zinc-800',
  'border-zinc-700': 'border-zinc-300 dark:border-zinc-700',
  'text-zinc-100': 'text-zinc-900 dark:text-zinc-100',
  'text-zinc-200': 'text-zinc-800 dark:text-zinc-200',
  'text-zinc-300': 'text-zinc-700 dark:text-zinc-300',
  'text-zinc-400': 'text-zinc-600 dark:text-zinc-400',
  'text-zinc-500': 'text-zinc-500 dark:text-zinc-500',
  'bg-emerald-600': 'bg-[#7AB8E5] dark:bg-emerald-600',
  'hover:bg-emerald-500': 'hover:bg-[#9CD5FF] dark:hover:bg-emerald-500',
  'text-emerald-500': 'text-[#9CD5FF] dark:text-emerald-500',
  'text-emerald-400': 'text-[#7AB8E5] dark:text-emerald-400',
  'border-emerald-500/50': 'border-[#9CD5FF]/50 dark:border-emerald-500/50',
  'bg-emerald-500/10': 'bg-[#9CD5FF]/10 dark:bg-emerald-500/10',
  'bg-emerald-900/20': 'bg-[#9CD5FF]/20 dark:bg-emerald-900/20',
  'border-emerald-500/30': 'border-[#9CD5FF]/30 dark:border-emerald-500/30',
  'border-t-emerald-500': 'border-t-[#9CD5FF] dark:border-t-emerald-500',
  'peer-checked:bg-emerald-500': 'peer-checked:bg-[#9CD5FF] dark:peer-checked:bg-emerald-500',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Sort keys by length descending to avoid partial replacements
      const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
      
      for (const key of keys) {
        // Use regex with word boundaries to avoid replacing parts of other classes
        // Note: Tailwind classes might have special characters like /
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(?<!dark:)\\b${escapedKey}\\b`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replacements[key]);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
console.log('Done');
