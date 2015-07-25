del /q certs\*.pem
del /q crl\*.pem
del /q csr\*.pem
del /q newcerts\*.pem

del /q crlnumber
del /q crlnumber.old
del /q index.txt
del /q index.txt.*
del /q serial
del /q serial.old

del /q log.txt
del /q log.txt0
del /q npm-debug.log

echo 1000 > crlnumber
type NUL > index.txt
echo 1000 > serial

openssl ca -config openssl.cnf -gencrl -out crl/intermediate.crl.pem