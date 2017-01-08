var http = require('http');
var socket = require('socket.io');
var express = require('express');

var app = express();
var server = http.createServer(app);
var io = socket(server);
var bodyParser = require('body-parser');
		


function User(ID, login, color) {
    this.ID = ID;
    this.login = login;
    this.color = color;
}
//User.prototype.newParam = "param";

function hsh(x, y)
{
    //weryfikacja czy ktoś nie podał nam niecałkowitych wartości?
    if(x > 8 || x < 0 || y > 8 || y < 0 || (Math.abs(x - y) > 4))
        return -1;
    return x + 9 * y;
}

var loginDict = []; // socket.id - key | login - value
var toLogin;

var N = 80; // coord = x + 9 * y 
var gamestate = {
    board : Array.apply(0, {length: N}).map(_ => -1, Number),
    whoseTurn : 0,
    user0 : undefined,
    user1 : undefined//,
    //user0col : "blue",//(0, 0, 255),
    //user1col : "red"//(255, 0, 0)
};

function verify()
{
    return -1;
}

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
        if(gamestate.user0 == undefined)
            gamestate.user0 = User(toLogin, username, "blue");
        else if(gamestate.user1 == undefined)
            gamestate.user1 = User(toLogin, username, "red");
        // else wypierdalaj
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
    socket.on('move',function(data){
        console.log(data.username);
        console.log(data.hex.coordinates.x, data.hex.coordinates.y);
        var x = data.hex.coordinates.x; 
        var y = data.hex.coordinates.y;
        var username = data.username;
        var userNo;
        if(username == gamestate.user1)
            userNo = 1;
        else if(username == gamestate.user0)
            userNo = 0;
        userNo = 0; //temporary fix
        //else nie masz prawa wykonywać ruchów bo nie grasz (spectator mode???)
        var i = hsh(x, y);
        console.log(i);
        if(i >= 0 && gamestate.board[hsh(x,y)] == -1)
        {
            gamestate.board[hsh(x,y)] = userNo;
            var isEnded = verify(); // -1 gramy dalej | 0 - user0 win | 1 - u1 w
            //var currColor = 
            console.log(isEnded);
            gamestate.whoseTurn = (gamestate.whoseTurn ^ 1);
            if(isEnded == -1)
                if(gamestate.whoseTurn == 0)
                    socket.emit('response', {isValid : true, hex: data.hex, color : gamestate.user0.color});//"blue"});//
                if(gamestate.whoseTurn == 0)
                    socket.emit('response', {isValid : true, hex: data.hex, color : gamestate.user1.color});//"blue"});//
            if(isEnded == 0)
                socket.emit('endGame', {winner : gamestate.user0.login, looser : gamestate.user1.login});
            if(isEnded == 1)
                socket.emit('endGame', {winner : gamestate.user1.login, looser : gamestate.user0.login});
            // przypadek kiedy wypełni się całą planszę a nikt nie wygrał
        }
        else{
            socket.emit('response', {isValid : false});
        }
        //tutaj sprawdzasz stan gry i odsylasz mi odpowiedz
        //costam costam
        //socket.emit('response', {isValid : isValid, hex: data.hex, color : color}) na razie dla testow:
        //socket.emit('response', {isValid : true, hex: data.hex, color : "blue"})
        //ewentualnie jak koniec gry socket.emit('endGame', {winner : user1, looser : user2})
    })
    //socket.on('chat message', function(data) {
    //    io.emit('chat message', data); // do wszystkich
        //socket.emit('chat message', data); tylko do połączonego
    //})
});

console.log( 'server listens' );
