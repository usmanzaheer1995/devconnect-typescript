# TODO: Do this in docker-compose
sudo docker run --name dev-mongo -v ${HOME}/mongo-data:/data/db -d -p 27017:27017 mongo