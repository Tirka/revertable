export $(egrep -v '^#' .env | xargs)

echo RPC_URL=$RPC_URL

# velas program deploy dist/program/revertable.so
