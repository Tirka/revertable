export $(egrep -v '^#' .env | xargs)

echo RPC_URL=$RPC_URL

# ./velas-test-validator
# velas deploy -u http://127.0.0.1:8899 ./dist/programs/revertable.so

# $ velas deploy -u http://127.0.0.1:8899 ./dist/programs/revertable.so
# Program Id: 2APmPdu1LQsDejoUGfWoTQD9Lo4JUqBG49ss4G3eeGcB

# $ velas deploy -u http://127.0.0.1:8899 ./dist/programs/invoker.so
# Program Id: 9uuXdAMtBGhr1wsmDt8ZS2Gs1LGLgLYJWEjzSMZYv4Dk
