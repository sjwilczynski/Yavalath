var http = require('http');
var express = require('express');
var ejs = require('ejs');

var app = express();

app.set('views', './views');
app.set('view engine', 'html');

app.engine('html', ejs.renderFile );

app.get('/ajax', (req, res) => {
    res.end('<div>zawartość z serwera</div>');
});

app.get('/', (req, res) => {

    res.render('app', { message : 'dynamiczne dane 2'} );

});

http.createServer(app).listen(process.env.PORT || 3000);