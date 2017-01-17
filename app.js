var http = require('http');
var socket = require('socket.io');
var express = require('express');
var cookieParser = require('cookie-parser');

var app = express();
var server = http.createServer(app);
var io = socket(server);
var bodyParser = require('body-parser');
var path = require('path');
app.use(cookieParser('sgs90890s8g90as8rg90as8g9r8a0srg8'));
app.use( bodyParser.urlencoded({extended:true}) ) ;
//app.use( express.static('./static'));
//zobacz co probuje otworzyc (jaki url)
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'ejs');
app.set('views', './views');
		


function User(login, color, socket) {
    this.login = login;
    this.color = color;
    this.socket = socket;
}

function hsh(x, y)
{
    //weryfikacja czy ktoś nie podał nam niecałkowitych wartości?
    if(x > 8 || x < 0 || y > 8 || y < 0 || (Math.abs(x - y) > 4))
        return -1;
    return x + 9 * y;
}

var socketList = []; // socket.id - key | login - value
//var toLogin;

var N = 80; // coord = x + 9 * y 

var AllGameStates = [];
for(var i = 0; i < 5; i++){
    AllGameStates.push(new Gamestate(i));
}

function Gamestate(id){
    this.id = id
    this.board = Array.apply(0, {length: N}).map(_ => -1, Number);
    this.whoseTurn = 0;
    this.user0 = undefined;
    this.user1 = undefined;
    this.isOver = 0;
    this.areTwoPlayers = 0;
}

function findGameNo(login)
{
    for(var i = 0; i < AllGameStates.length; i++)
        if(AllGameStates[i].areTwoPlayers && 
            (AllGameStates[i].user0.login == login || AllGameStates[i].user1.login == login))
            return i;
    return -1;
}


function resetGame(id)
{
    AllGameStates[id].board = Array.apply(0, {length: N}).map(_ => -1, Number);
    AllGameStates[id].whoseTurn = 0;
    AllGameStates[id].isOver = 0;
}

function logout(login) // po prostu znajdź pokój w którym grał i zresetuj grę???
{
    var i = findGameNo(login);
    if(i != -1)
    {
        resetGame(i);
        if(AllGameStates[i].user1.login == login)
            AllGameStates[i].user1 = undefined;
        else
            AllGameStates[i].user0 = undefined;
    }
}


function fullBoard(gamestate)
{
    for(var i = 0; i <= 8; i++)
        for(var j = 0; j <= 8; j++)
            if(hsh(i , j) != -1 && gamestate.board[hsh(i, j)] == -1)
                return false;
    return true;
}

function verify(x, y, gamestate)
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
            if(cnt == 3)
                threeInRow = true;
            color = gamestate.board[hsh(i, y)];
            cnt = 1;
        }
        
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
    if(cnt == 3)
        threeInRow = true;
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
            if(cnt == 3)
                threeInRow = true;
        }
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
    if(cnt == 3)
        threeInRow = true;
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
            if(cnt == 3)
                threeInRow = true;
        }
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
    if(cnt == 3)
        threeInRow = true;

    if((threeInRow && fourInRow) || fullBoard(gamestate))
        return 2;//remis (chyba że chcemy inaczej)
    if(threeInRow)
        return (gamestate.whoseTurn ^ 1);//przegrana
    if(fourInRow)
        return gamestate.whoseTurn;//wygrana
    return -1; // gramy dalej
}

app.get('/', function(req, res) {
    res.redirect('/rooms');
});

app.get('/login', (req,res) =>{
    //console.log('logging in\n');
    res.render('login');
})

app.post('/rooms',(req,res) =>{
    var username = req.body.username;
    var passwd = req.body.pwd;
    
    
    if(username != ''){
        //weryfikacja danych z baza
         // TODO baza danych
        res.cookie('username', req.body.username, {signed : true});
        res.render('rooms',{AllGameStates : AllGameStates, username : req.signedCookies.username})
    } 
    else{
        res.render('login',{ message : "Zły login lub hasło" })
    }
});

app.get('/rooms', authorize, (req,res) =>{
    res.render('rooms', {AllGameStates : AllGameStates, username : req.signedCookies.username});
});

//app.get('/game/:id', authorize, (req,res) =>{ dlaczego jak przesylam url w ten sposob to nie widzi mi folderu static -> traktuje hex.js jako pojscie na /game/hex.js
app.get('/game:id', authorize, (req,res) =>{
    console.log(req.url);
    var id = req.params.id;
    //sprawdzanie czy jest wolne miejsce i czy jestem pierwszy ktory wchodzi na gierke
    //czy drugi -> wtedy trzeba wyslac jakies zdarzenie do goscia !!
    // MOZE TU WYSTARCZY ZROBIC GAME RESTART -> W ZALEZNOSCI CZY JUZ KTOS JEST CZY NIE
    console.log(id, req.signedCookies.username)
    res.render('hexagon', {id:id, username : req.signedCookies.username});
});


// middleware autentykacji
function authorize(req, res, next) {
    console.log('authorize', req.signedCookies.username, req.signedCookies.username != undefined )
    if ( req.signedCookies.username != undefined ) {
        next();
    } else {
        res.redirect('/login');
    }
}

/*
app.use((req,res)=>{
    //res.cookie('foo', '', { maxAge : -1 } ); 
    res.render('404',{url : req.url})
})
*/


//"key" in obj // true, regardless of the actual value
server.listen( process.env.PORT || 3000 );

io.on('connection', function(socket) {
    console.log('client connected:' + socket.id);
    
    socket.on('MyConnection', function(data) {
        console.log('in MyConnection')
        var id = data.id;
        var username = data.username;
        socketList.push({id : socket.id, username : username});
        if(AllGameStates[id].user0 == undefined){
            AllGameStates[id].user0 = new User(username, "blue", socket);
        }
        else if(AllGameStates[id].user1 == undefined){
            AllGameStates[id].user1 = new User(username, "red", socket);
            AllGameStates[id].areTwoPlayers = 1;
        } else{
            //socket.emit('gameIsOccupied') TODO
        }
    })
    socket.on('move',function(data){
        console.log('in move');
        console.log(data.username);
        console.log(data.hex.coordinates.x, data.hex.coordinates.y);
        var x = data.hex.coordinates.x; 
        var y = data.hex.coordinates.y;
        var username = data.username;
        var userNo;
        var id = data.id
        var gamestate = AllGameStates[id];
        if(gamestate.areTwoPlayers == 1){
            if(username == gamestate.user1.login) //żeby tego używać musimy być pewni że mamy 2 połączonych graczy
                userNo = 1;
            else if(username == gamestate.user0.login)
                userNo = 0;
            var i = hsh(x, y);
            console.log(i);
            if(i >= 0 && gamestate.board[i] == -1 && gamestate.whoseTurn == userNo && !gamestate.isOver)
            {
                gamestate.board[i] = userNo;
                console.log('przed verify');
                var isEnded = verify(x, y, gamestate); // -1 gramy dalej | 0 - user0 win | 1 - u1 w | 2 - remis
                console.log('po verify');
                var opSocket = gamestate['user' + (userNo ^ 1)].socket;
                
                socket.emit('response', {isValid : true, hex: data.hex, color : gamestate['user' + userNo].color});
                opSocket.emit('response', {isValid : true, hex: data.hex, color : gamestate['user' + userNo].color});
                //pomysly: zrobic zdarzenie na sockecie move+username i tylko takie odbierac
                //wysylac do wszytskich i sprawdzac czy przyszlo od twojego przeciwnika
                //nie wiem o co chodzi z tym toLogin ale jak jakis z tych pomyslow to nie bedzie potrzebne
                //trzeba profesora zapytac
                if(isEnded == -1){
                    gamestate.whoseTurn = (gamestate.whoseTurn ^ 1);
                }
                if(isEnded == 0){
                    socket.emit('endGame', {winner : gamestate.user0.login, looser : gamestate.user1.login});
                    opSocket.emit('endGame', {winner : gamestate.user0.login, looser : gamestate.user1.login});
                    gamestate.isOver = 1;
                    //AllGameStates[id] = new Gamestate(id);
                }
                if(isEnded == 1){
                    socket.emit('endGame', {winner : gamestate.user1.login, looser : gamestate.user0.login});
                    opSocket.emit('endGame', {winner : gamestate.user1.login, looser : gamestate.user0.login});
                    gamestate.isOver = 1;
                    //AllGameStates[id] = new Gamestate(id);
                }
                if(isEnded == 2){
                    socket.emit('draw', {});
                    opSocket.emit('draw', {});
                } //przypadek kiedy wypełni się całą planszę a nikt nie wygrał lub ktoś zrobił 3 + 4
            }
            else{
                socket.emit('response', {isValid : false});
            }
        } else{
            //socket.emit('waitForSecondPlayer'); TODO
        }
    });
    socket.on('reset', function(data){
        console.log('jestem w reset')
        var it = findGameNo(data.username);
        if(it != -1)
            resetGame(it); // w data juz jest id gry wiec ta funkcja findGameNo jest tu niepotrzebna
        //else
            //socket.emit('response', nie możesz zrestartować) - nie zawsze i nie każdy może restartować grę (znowu ewentualny spectate mode)
    });
    socket.on('disconnect', function() {
        console.log('Got disconnect!');
        var i;
        for(var k = 0; k < socketList.length; k++)
            if(socketList[k].id == socket.id)
                i = k;
        //var i = socketList.id.indexOf(socket);
        logout(socketList[i].login);
        
        socketList.splice(i, 1);
        //usuwanie ciasteczek potrzebne?? NIE BO CIASTECZKA SA NA WSZYSTKIE LINKI A NIE TYLKO GRE
        //socket.emit('user disconnected'); czy to jest potrzebne do czegoś?
    });
});

console.log( 'server listens' );




//zobaczyc czy czasem sam socket nie moze miec login i passwd
//linki z gry /game1, /game2, /game3

// zaprogramowac disconnect
// zaprogramowac restart pod plansza

/*
1.mapa user pokoj sie przyda, tablica gamestate, gamestate zawiera sockety    STACHU -> DONE
2.ciasteczka jak w zad7.js z username -> pozwala to wchodzic na wszytskie linki, middleware autentykacji STACHU -> DONE
3.przerobienie flow z linka na link (gety posty po stronie serwera) STACHU -> DONE
4.przycisk logout na rooms.ejs i po stronie serwera i 404 STACHU
5.restart i quit game( musza wysylac jakies zdarzenia na socket, mysle ze restart bedzie wystarczajaco spoko 
jak bedzie go mozna zrobic tylko po zakonczeniu gry, za to quit zawsze) KUBA
6. resetowanie stanu gry po stronie serwera KUBA
7. zdarzenie disconnect KUBA
8.rooms.ejs - potrzebny szablon na gamestate( 3 wiersze - user1, user2, przycisk dolacz do gry) - musza byc inde
ksowane zeby wysylac na odpowiednie linki - KUBA
9. rejestrowanie nowych uzytkownikow - na stronie login powinien byc przycisk - zarejestruj sie:
sprawdza czy w bazie nie ma uzytkownika o tym nicku i jesli nie to aktualizuje baze i przekierowuje na ekran logowania STACHU
?10.Baza danych1 - tabelka (id,username,passwd) - oprogramowanie rejestracji i weryfikacji hasla po stronie serwera
?11.Baza danych2 - tabelka (id, Winner, Looser, Date) - na rooms pod spodem przycisk pokaz statystyki 
po kazdej zakonczonej grze zapisywanie do statystyk
?12. CSS zeby bylo pieknie
*/







/*
MOJE UWAGI:
1. Nazwa logout troche nie odpowiada temu co sie dzieje -> gosciu tylko wychodzi z danej gry wiec bardzo 
mozliwe ze po porstu wraca na strone /rooms -> jakies quitGame byloby lepsze
2. w socket.on('reset'), data zawiera id gry wiec nie musisz go wyszukiwac po username
3. Mozna chyba jako socketList po prostu zrobic slownik {socket.id : username} wtedy bedziesz mogl sie odwolywac
bez przeszukiwania calej listy( jak by bylo w pizdu uzytkownikow to wazne) ( a propo tego co sie dzieje w socket.on('disconnect'))
wtedy oczywiscie mozesz po prostu robic delete socketList[socket.id] a nie robic jakiegos splice
4. Przydaloby sie zeby reset wygladal jak button( bo inaczej nikt sie nie kapnie zeby w niego klikac )
5. reset i disconnect powinny wysylac socketowe zdarzenia do przeciwnika - zrob je po stronie serwera ja zrobie po klienta
6. Nie będzie spectate mode jak ktoś spróbuje wejść na zajeta gre wyrzucamy go

DOKONCZ KUBA TE SWOJE RZECZY ZANIM SIE ZA TORCSA CZY AJK TO SIE NAZYWA WEZMIESZ PLS, to wtedy bede mogl juz prawie cala reszte zrobic
*/