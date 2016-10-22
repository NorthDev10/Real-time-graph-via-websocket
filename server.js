var express = require('express');
var app = express();
var WebSocketServer = require('ws').Server;

app.use(express.static('public'));

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port '+process.env.PORT);
});

app.post('/ledStatus', function (req, res) {
  res.send({leds:{led4:1}});
});

var wss = new WebSocketServer({port: 8081});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client !== wss) client.send(data);
  });
};  

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
        wss.broadcast(message);
    });
    ws.send(JSON.stringify({ADC:0,leds:{}}));
});