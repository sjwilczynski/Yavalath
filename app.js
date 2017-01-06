var http = require('http');
var socket = require('socket.io');
var express = require('express');


var app = express();
var server = http.createServer(app);
var io = socket(server);

var loginDict = []; // socket.id - key | login - value
var toLogin;

app.use( express.static('./static'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', function(req, res) {
    //w renderze wyslij mi username
    res.render('hexagon')
    res.end();
});

app.get('/login', (req,res) =>{
    res.render('login.ejs')
})
app.post('/login',(req,res)=>{
    var username = req.body.txtLogin
    var passwd = req.body.txtPassword
    
    if(username != ''){ // TODO baza danych
        loginDict.push({toLogin : username})
        res.redirect('/')
    } 
    else{
        res.render('login.ejs')
    }
})


//"key" in obj // true, regardless of the actual value
server.listen( process.env.PORT || 3000 );

io.on('connection', function(socket) {
    console.log('client connected:' + socket.id);
    if(socket.id in loginDict){}
    //socket.on('chat message', function(data) {
      //  io.emit('chat message', data); // do wszystkich
        ////socket.emit('chat message', data); tylko do połączonego
    //})
    else
    {
        toLogin = socket.id;
        res.redirect('/login')
    }
});

setInterval( function() {
    var date = new Date().toString();
    io.emit( 'message', date.toString() );
}, 1000 );

console.log( 'server listens' );
