if [ -z "$SSH_AUTH_SOCK" ] ; then
  eval `ssh-agent -s`
  ssh-add ~/.ssh/ec2
fi


git pull
yarn install

# git submodule update
# cd ./react
#git checkout master
#git pull
#yarn install
#cd ..

yarn build

#node build-client.js

#mv ./react/build/ ./dist/client/

yarn stop

yarn devstart
