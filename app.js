var http = require('http');

http.createServer(function(request, response){
    response.writeHead(200, {"contentType" : "text/plain"})
    response.end("hello\n")


}).listen(process.env.PORT)