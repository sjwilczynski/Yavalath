var http = require('http');

http.createServer(function(request, response){
    response.writeHead(200, {"contentType" : "text/plain"})
    response.end("kuba to pala\n")


}).listen(process.env.PORT)