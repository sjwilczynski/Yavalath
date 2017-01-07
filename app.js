var http = require('http');
var socket = require('socket.io');
var express = require('express');

var app = express();
var server = http.createServer(app);
var io = socket(server);
var bodyParser = require('body-parser');
		


/*function User(ID, login, color) {
    this.ID = ID;
    this.login = login;
    this.color = color;
}*/
//User.prototype.newParam = "param";
	
var loginDict = []; // socket.id - key | login - value
var toLogin;

app.use( bodyParser.urlencoded({extended:true}) ) ;
app.use( express.static('./static'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', function(req, res) {
    res.redirect('login');
});

app.get('/login', (req,res) =>{
    //res.toLogin = req.toLogin;
    console.log('logging in\n');
    res.render('login')
})
app.post('/login',(req,res)=>{
    //console.log(req.body.username);
    var username = req.body.username
    var passwd = req.body.pwd
    console.log(username, passwd, toLogin);
    
    if(username != ''){ // TODO baza danych
        loginDict.push({key:toLogin, value:username})
        console.log(loginDict);
        console.log('już się nie pierdoli\n');
        res.render('hexagon',{ username : username });
    } 
    else{
        res.render('login')
    }
})


//"key" in obj // true, regardless of the actual value
server.listen( process.env.PORT || 3000 );

io.on('connection', function(socket) {
    console.log('client connected:' + socket.id);
    console.log(socket.id in loginDict);
    if(socket.id in loginDict){}
    else
    {
        toLogin = socket.id;
        console.log(socket.id in loginDict);
    }
    //socket.on('chat message', function(data) {
    //    io.emit('chat message', data); // do wszystkich
        //socket.emit('chat message', data); tylko do połączonego
    //})
});

/*io.on('connection', function(socket) {
    socket.on('join', function(data){
        console.log(data);
    });
    console.log('client connected:' + socket.id);
    if(socket.id in loginDict){}
    //socket.on('chat message', function(data) {
      //  io.emit('chat message', data); // do wszystkich
        ////socket.emit('chat message', data); tylko do połączonego
    //})
    else
    {
        console.log(socket.id);
        toLogin = socket.id;
        //res.toLogin = socket.id;
        res.redirect('/login')
    }
});*/

setInterval( function() {
    var date = new Date().toString();
    io.emit( 'message', date.toString() );
}, 1000 );

console.log( 'server listens' );
