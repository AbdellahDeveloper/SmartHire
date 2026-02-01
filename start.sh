#!/bin/bash
set -e

MONGO_CONTAINER="mongodb"
REPLICA_NAME="rs0"
MONGO_HOST="mongodb"
MONGO_PORT=27017

echo "Starting MongoDB only..."
docker compose up -d $MONGO_CONTAINER

sleep 5
# Wait for MongoDB to be up and accepting connections
echo "Waiting for MongoDB to be ready..."
until docker exec -i $MONGO_CONTAINER mongo --quiet --eval "db.adminCommand('ping').ok" | grep -q 1; do
  echo -n "."
  sleep 3  # <-- delay between retries
done
echo "MongoDB is up!"

# Add a small delay to avoid connection refused during rs.initiate
sleep 5

# Check if replica set is already initialized
RS_STATUS=$(docker exec -i $MONGO_CONTAINER mongo --quiet --eval "rs.status().ok" || echo "0")

if [ "$RS_STATUS" != "1" ]; then
  echo "Replica set not initialized. Initializing..."

  # Retry loop for rs.initiate in case Mongo is still warming up
  until docker exec -i $MONGO_CONTAINER mongo --quiet --eval "rs.initiate({_id: '$REPLICA_NAME', members:[{_id:0, host: '$MONGO_HOST:$MONGO_PORT'}]})"; do
    echo "Waiting for Mongo to accept connections for rs.initiate..."
    sleep 3
  done

  echo "Waiting for PRIMARY..."
  # Wait until Mongo elects itself as PRIMARY (state=1)
  until docker exec -i $MONGO_CONTAINER mongo --quiet --eval "rs.status().myState" | grep -q 1; do
    echo -n "."
    sleep 2
  done
  echo "Replica set is PRIMARY!"
else
  echo "Replica set already initialized."
fi

echo "MongoDB replica set ready. Starting all other services..."
docker compose up -d
