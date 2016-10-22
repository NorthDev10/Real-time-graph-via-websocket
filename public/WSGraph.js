var Graph = (function() {
    var ws;
    var graph;
    var ctx;
    var arrayPoints = [];
    var T = 0;
    var T1 = 0;
    //var hInterval;
    
    function getRandomArbitary(min, max) {
      return Math.random() * (max - min) + min;
    }
    
    function getTime() {
        T1 = (T1 + Date.now()-T)/2;
        T = Date.now();
        return T1;
    }
    
    function initGraph(shiftX, shiftY) {
        ctx.clearRect(0, 0, graph.width, graph.height);
        ctx.strokeStyle = '#607D8B';
        ctx.strokeRect(0, 0, graph.width, graph.height);
        ctx.beginPath();
        ctx.moveTo(shiftX, shiftY);
        ctx.lineTo(shiftX, graph.height-shiftY); // OY
        ctx.lineTo(graph.width-shiftX, graph.height-shiftY); //OX
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        var h = 0.1*(graph.height-2*shiftY);
        ctx.font = 'italic 14pt Calibri';
        for(var y = graph.height-shiftY-h, textY = 0; y > 0; y-=h, textY += 0.1) {
            ctx.fillText(textY.toFixed(1), shiftX-30, y+h);
            ctx.moveTo(shiftX, y);
            ctx.lineTo(graph.width-shiftX, y);
        }
        ctx.fillText("1.0 V", shiftX-30, y+h-5);
        ctx.strokeStyle = '#000';
        for(var x = 0; x < graph.width-2*shiftX; x+=(graph.width-2*shiftX)/10) {
            ctx.moveTo(shiftX+x, graph.height-shiftY);
            ctx.lineTo(shiftX+x, graph.height-shiftY-5);
        }
        var t = Math.round((graph.width-2*shiftX) * getTime() / 10);
        if(t >= 1000) {
            t = Math.round(t/1000) + "s";
        } else {
            t = Math.round(t) + "ms";
        }
        ctx.fillText(t, graph.width-70, graph.height-7);
        ctx.stroke();
    }
    
    function addPoint(y, shiftX, shiftY) {
        if(arrayPoints.length > ((graph.width-shiftX)*T1/(T1*10))-3) {
            arrayPoints.pop();
        }
        arrayPoints.unshift(y);
        var h = 10;
        if(arrayPoints[0]) {
            ctx.moveTo(shiftX, arrayPoints[0]+shiftY);
        } else {
            ctx.moveTo(shiftX, shiftY);
        }
        ctx.beginPath();
        ctx.strokeStyle = '#F44336';
        for(var i = 1; i < arrayPoints.length; i++) {
            ctx.lineTo(((shiftX)+h*i),
            map(arrayPoints[i], 0, 1, (graph.height-shiftY), shiftY));
        }
        ctx.stroke();
    }
    
    function map(x, in_min, in_max, out_min, out_max) {
      return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
    
    return {
        init: function() {
            graph = document.getElementById('graph');
            graph.setAttribute("width", document.documentElement.clientWidth-100);
            graph.setAttribute("height", document.documentElement.clientHeight-100);
            if (graph.getContext) {
                ctx = graph.getContext('2d');
                T = Date.now();
                initGraph(35, 30);
            }
        },
        analogRead: function() {
            if (graph.getContext) {
                T = Date.now();
                /*hInterval = setInterval(function(){
                    initGraph(35, 30);
                    addPoint(getRandomArbitary(0, 1), 35, 30);
                }, 100);*/
                var host = window.document.location.host.replace(/:.*/, '');
                if(ws == undefined) ws = new WebSocket('wss://' + host + ':8081', "protocolOne");
                ws.onopen = function() {
				  console.log("The connection is established.");
                    ws.onmessage = function(event) {
                      var adc = JSON.parse(event.data);
                      if(adc.PIO != undefined) {
                        document.getElementById("PIO").innerHTML = JSON.stringify(adc.PIO);
                      }
                      if(adc.ADS != undefined) {
                        initGraph(35, 30);
                        document.getElementById("ADCData").innerHTML = JSON.stringify(adc.ADS);
                        addPoint(adc.ADS[document.getElementsByTagName("select")[0].selectedIndex], 35, 30);
                      }
    				};
				};
				ws.onerror = function(error) {
				  document.getElementById('btnRun').textContent = "Start";
				  console.log("Error " + error.message);
				};
				ws.onclose = function(event) {
				  if (event.wasClean) {
					console.log('Connection closed cleanly');
				  } else {
					console.log('Broken connections');
				  }
				  document.getElementById('btnRun').textContent = "Start";
				  console.log('Code: ' + event.code + ' cause: ' + event.reason);
				};
            }
        },
        stopRead: function() {
            //clearInterval(hInterval);
            ws.close();
            ws = undefined;
        }
    }
}());

window.onload = function() {
    var request = {leds:{}};
    
    function getStatusLED() {
        var xhr = new XMLHttpRequest();
		xhr.open('POST', window.location.href+"ledStatus");
		xhr.onload = function() {
		    if(this.status == 200) {
		        request = JSON.parse(this.response);
		        for(var led in request.leds) {
		            console.log(request.leds[led]);
		            var element = document.getElementById(led);
		            switch(led) {
                        case "led12":
                            changeStatusBtnLED(element, "led12", "#F44336", "red");
                        break;
                        case "led5":
                            changeStatusBtnLED(element, "led5", "#4CAF50", "green");
                        break;
                        case "led14":
                            changeStatusBtnLED(element, "led14", "#FFEB3B", "yellow");
                        break;
                        case "led4":
                            changeStatusBtnLED(element, "led4", "#ECEFF1", "white");
                        break;
                    }
		        }
		    }
		}
		xhr.send();
    }
    
    function changeStatusBtnLED(e, pin, color, colorName) {
        if(request.leds[pin]) {
            e.textContent = "Turn off the "+colorName+" light";
            e.style.background = color;
            e.classList.add("whiteText");
        } else {
            e.textContent = "Turn on the "+colorName+" light";
            e.style.background = "";
            e.classList.remove("whiteText");
        }
    }
    
    function setStatusLED(e, pin, color, colorName) {
        request.leds[pin] =  0 || !request.leds[pin];
        e.disabled = true;
        var xhr = new XMLHttpRequest();
		xhr.open('POST', window.location.href);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.onloadstart = function() {
		    console.log("Запрос начат");
		}
		xhr.onprogress = function() {
		    console.log("Браузер получил очередной пакет данных");
		}
		xhr.onabort = function() {
		    console.log("Запрос был отменён вызовом xhr.abort().");
		}
		xhr.onerror = function() {
		    console.log("Произошла ошибка", "Status: ", this.status);
		}
		xhr.onload = function() {
		    if(this.status == 200) {
		        changeStatusBtnLED(e, pin, color, colorName);
		    } else {
		        alert("Запрос завершен с кодом: " + this.status);
		        request.leds[pin] =  0 || !request.leds[pin];
		    }
		    console.log("Запрос был успешно завершён", "Status: ", this.status);
		}
		xhr.ontimeout = function() {
		    console.log("Запрос был прекращён по таймауту");
		}
		xhr.onloadend = function() {
		    console.log("Запрос был завершён (успешно или неуспешно)", "Status: ", this.status);
		    e.disabled = false;
		}
        xhr.send(JSON.stringify({[pin]:request.leds[pin]}));
    }
    document.getElementById('ledBtns').addEventListener('click', function(e) {
        switch(e.target.id) {
            case "led12":
                setStatusLED(e.target, "led12", "#F44336", "red");
            break;
            case "led5":
                setStatusLED(e.target, "led5", "#4CAF50", "green");
            break;
            case "led14":
                setStatusLED(e.target, "led14", "#FFEB3B", "yellow");
            break;
            case "led4":
                setStatusLED(e.target, "led4", "#ECEFF1", "white");
            break;
        }
    });
    //getStatusLED();
    Graph.init();
    document.getElementById('btnRun').addEventListener('click', function(e) {
        if(e.target.textContent == "Start") {
            Graph.analogRead();
            e.target.textContent = "Stop";
        } else {
            Graph.stopRead();
            e.target.textContent = "Start";
        }
    });
};