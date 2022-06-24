branch=`git branch | grep "\*" | cut -d " " -f 2-9`;

if [ "$branch" == "master" ]
then
  #git pull origin master;
  echo 'do nothing'
else
 git push g11zone g11zone-srv:master
fi
