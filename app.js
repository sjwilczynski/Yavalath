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
    user1 : undefined
};

function fullBoard()
{
    for(var i = 0; i <= 8; i++)
        for(var j = 0; j <= 8; j++)
            if(hsh(i , j) != -1 && gamestate.board[hsh(i, j)] == -1)
                return false;
    return true;
}

function verify(x, y)
{
    //↔↔↔↔↔↔↔ ustalone y, przejdź po x range(max(0, y - 4), min(8, y + 4))
    var cnt = 0;
    var color = -2;
    var threeInRow = false;
    var fourInRow = false;
    var tst = {
        x : x,
        y : y
    };
    console.log(tst);
    for(var i = Math.max(0, y - 4); i <= Math.min(8, y + 4); i++)
    {
        if(gamestate.board[hsh(i, y)] >= 0 && gamestate.board[hsh(i, y)] == color)
            cnt++;
        else
        {
            color = gamestate.board[hsh(i, y)];
            cnt = 1;
        }
        if(cnt == 3)
            threeInRow = true;
        if(cnt == 4)
            fourInRow = true;

        var info = {
            threeInRow : threeInRow,
            fourInRow : fourInRow,
            cnt : cnt,
            color : color,
            test : "fst",
            i : i
        };
        console.log(info);
    }
    
    color = -2;
    //↗↗↗↗↗ ustalone x, przejdź po y range(max(0, y - 4), min(8, y + 4))
    for(var i = Math.max(0, x - 4); i <= Math.min(8, x + 4); i++)
    {
        if(gamestate.board[hsh(x, i)] >= 0 && gamestate.board[hsh(x, i)] == color)
            cnt++;
        else
        {
            color = gamestate.board[hsh(x, i)];
            cnt = 1;
        }
        if(cnt == 3)
            threeInRow = true;
        if(cnt == 4)
            fourInRow = true;

        var info = {
            threeInRow : threeInRow,
            fourInRow : fourInRow,
            cnt : cnt,
            color : color,
            test : "nd",
            i : i
        };
        console.log(info);
    }
    color = -2;
    //↘↘↘↘↘ x++, y++ range(-min(x,y), 8 - max(x,y))
    for(var i = -Math.min(x, y); i <= 8 - Math.max(x,y); i++)
    {
        if(gamestate.board[hsh(x + i, y + i)] >= 0 && gamestate.board[hsh(x + i, y + i)] == color)
            cnt++;
        else
        {
            color = gamestate.board[hsh(x + i, y + i)];
            cnt = 1;
        }
        if(cnt == 3)
            threeInRow = true;
        if(cnt == 4)
            fourInRow = true;

        var info = {
            threeInRow : threeInRow,
            fourInRow : fourInRow,
            cnt : cnt,
            color : color,
            test : "rd",
            i : i
        };
        console.log(info);
    }
    if((threeInRow && fourInRow) || fullBoard())
        return 2;//remis (chyba że chcemy inaczej)
    if(threeInRow)
        return (gamestate.whoseTurn ^ 1);//remis
    if(fourInRow)
        return gamestate.whoseTurn;//remis
    return -1; // gramy dalej
}

app.use( bodyParser.urlencoded({extended:true}) ) ;
app.use( express.static('./static'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', function(req, res) {
    res.redirect('login');
});

app.get('/login', (req,res) =>{
    console.log('logging in\n');
    res.render('login');
})
app.post('/login',(req,res)=>{
    var username = req.body.username;
    var passwd = req.body.pwd;
    console.log(username, passwd, toLogin);
    
    if(username != ''){ // TODO baza danych
        loginDict.push({key:toLogin, value:username})
        console.log(loginDict);
        console.log('już się nie pierdoli\n');
        if(gamestate.user0 == undefined){
            gamestate.user0 = new User(toLogin, username, "blue");
        }
        else if(gamestate.user1 == undefined)
            gamestate.user1 = new User(toLogin, username, "red");
        // else wypierdalaj
        console.log(gamestate.user0.ID);
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
    if(socket.id in loginDict){
        console.log('bug?');
    }
    else
    {
        toLogin = socket.id;
        console.log('wzor?' , socket.id in loginDict);
    }
    socket.on('move',function(data){
        console.log('in move');
        console.log(data.username);
        console.log(data.hex.coordinates.x, data.hex.coordinates.y);
        var x = data.hex.coordinates.x; 
        var y = data.hex.coordinates.y;
        var username = data.username;
        var userNo;
        //if(username == gamestate.user1.login) żeby tego używać musimy być pewni że mamy 2 połączonych graczy
        //    userNo = 1;
        //else if(username == gamestate.user0.login)
        //    userNo = 0;
        userNo = 0; //temporary fix
        //else nie masz prawa wykonywać ruchów bo nie grasz (spectator mode???)
        var i = hsh(x, y);
        console.log(i);
        if(i >= 0 && gamestate.board[i] == -1)
        {
            gamestate.board[i] = userNo;
            console.log('przed verify');
            var isEnded = verify(x, y); // -1 gramy dalej | 0 - user0 win | 1 - u1 w | 2 - remis
            console.log('po verify');
            //gamestate.whoseTurn = (gamestate.whoseTurn ^ 1);
            if(isEnded == -1)
            {
                if(gamestate.whoseTurn == 0) // wcześniej zamieniliśmy już
                    socket.emit('response', {isValid : true, hex: data.hex, color : gamestate.user0.color});//"blue"});//
                if(gamestate.whoseTurn == 1)
                    socket.emit('response', {isValid : true, hex: data.hex, color : gamestate.user1.color});//"blue"});//
            }
            if(isEnded == 0)
                socket.emit('endGame', {winner : gamestate.user0.login, looser : gamestate.user1.login});
            if(isEnded == 1)
                socket.emit('endGame', {winner : gamestate.user1.login, looser : gamestate.user0.login});
            //if(isEnded == 2)
            // socket.emit(remis) przypadek kiedy wypełni się całą planszę a nikt nie wygrał lub ktoś zrobił 3 + 4
        }
        else{
            socket.emit('response', {isValid : false});
        }
    })
    //socket.on('chat message', function(data) {
    //    io.emit('chat message', data); // do wszystkich
        //socket.emit('chat message', data); tylko do połączonego
    //})
});

console.log( 'server listens' );
