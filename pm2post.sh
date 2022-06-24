if [ -z "$SSH_AUTH_SOCK" ] ; then
  eval `ssh-agent -s`
  ssh-add ~/.ssh/ec2
fi


git pull

cd ./react

git checkout master
git pull

cd ..

yarn build

node build-client.js

mv ./react/build/ ./dist/client/

yarn stop

yarn deploy
