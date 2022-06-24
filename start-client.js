const args = [ 'start' ];
const opts = { stdio: 'inherit', cwd: 'react', shell: true };
require('child_process').spawn('npm', args, opts);
