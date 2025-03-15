export const argv = {
  get: (name: string) => {
    // First try exact match (current behavior)
    const index = process.argv.indexOf(name);
    if (index >= 0) return process.argv[index + 1];
    
    // Then try equals sign format
    const arg = process.argv.find(arg => arg.startsWith(`${name}=`));
    return arg ? arg.split('=')[1] : undefined;
  },
  has: (name: string) => {
    return process.argv.includes(name) || 
           process.argv.some(arg => arg.startsWith(`${name}=`));
  }
};