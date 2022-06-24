const args = [ 'build' ];
const opts = { stdio: 'inherit', cwd: 'react', shell: true };
require('child_process').spawn('yarn', args, opts);
