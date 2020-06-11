# This is meant to Just Work™ when you're running into build related issues and
# really just want things to run so you can get back to work.

echo '[DO] Make sure yarn dependencies are up to date'
npx lerna bootstrap
yarn install

echo '[DO] Stop running docker containers'
docker-compose stop

echo '[DO] Stop any remaining containers via direct docker command'
docker ps -q | xargs docker stop

echo '[DO] Rebuld all the docker stuff'
yarn run docker:dependencies
yarn run docker:build

echo '[DO] Start up all our docker stuff again. Run it in the background'
yarn run up:build -d

echo "[DONE] Everything rebuilt. If nothing failed yet you should be good to go."
