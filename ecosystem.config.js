module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */


/* https://ygamretuta.xyz/deploy-create-react-app-with-pm2-16beb90ce52 */

   apps : [

    {
      name      : 'API',
      script    : 'dist/server.js',
      "log_date_format" : "YYYY-MM-DD HH:mm Z",
      env_production : {
        NODE_ENV: 'prod'
      },
      env_dev : {
        NODE_ENV: 'dev'
      },
      env_test : {
        NODE_ENV: 'test'
      }
    },
    /*
    // old app
    {
      name      : 'API',
      script    : 'dist/server/bin/www',
      "log_date_format" : "YYYY-MM-DD HH:mm Z",
      env_production : {
        NODE_ENV: 'prod'
      },
      env_dev : {
        NODE_ENV: 'dev'
      },
      env_test : {
        NODE_ENV: 'test'
      }
    }, */
    // worker
    {
      name      : 'WORKER',
      script    : 'scripts/worker.py',
      "exec_interpreter": "pip3",
      "log_date_format" : "YYYY-MM-DD HH:mm Z",
      env_production : {
        NODE_ENV: 'prod'
      },
      env_dev : {
        NODE_ENV: 'prod'
      },
      env_test : {
        NODE_ENV: 'test'
      }
    },
    {
      name      : 'WIN_WORKER',
      script    : 'scripts/worker.py',
      "exec_interpreter": "pip3",
      env_production : {
        NODE_ENV: 'prod'
      },
      env_dev : {
        NODE_ENV: 'prod'
      },
      env_test : {
        NODE_ENV: 'test'
      }
    },
    // Second application
    /*
    {
      name      : 'WEB',
      script    : 'web.js'
    }*/
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      key  : "~/.ssh/dev.gzone.pem",
      user : 'ubuntu',
      host : '34.242.95.85', // hum 
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production', // hum again 
      /*
      "pre-setup" : "apt-get install git",
      // Commands / path to a script on the host machine
      // This will be executed on the host after cloning the repository
      // eg: placing configurations in the shared dir etc
      "post-setup": "ls -la",
      // Commands to execute locally (on the same machine you deploy things)
      // Can be multiple commands separated by the character ";"
      "pre-deploy-local" : "echo 'This is a local executed command'"
      // Commands to be executed on the server after the repo has been cloned
      "post-deploy" : "npm install && pm2 startOrRestart ecosystem.json --env production"*/
      'post-deploy' : 'yarn install && yarn build && pm2 reload ecosystem.config.js --env production'

    },
    dev : {
      user : 'ubuntu',
      host : '34.242.95.85',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/development',
      'post-deploy' : 'npm install npm run build && pm2 reload ecosystem.config.js --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }
};
