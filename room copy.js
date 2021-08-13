
import h from './helper.js';

window.addEventListener('load', () => {

    const chatRoom = document.getElementsByClassName("guess")[0];
    let socket = io();
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');
    console.log(room, username);
    if (!room) {
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
        document.querySelector('#room-create').style.display = 'flex';
        document.querySelector('#username-set').style.display = 'none';
        let commElem = document.getElementsByClassName("entered");
        for (let i = 0; i < commElem.length; i++) {
          commElem[i].style.display = 'none';
        }
    }

    else if (!username) {
        document.querySelector("#room-create").style.display = "none";
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
         let commElem = document.getElementsByClassName("entered");
         for (let i = 0; i < commElem.length; i++) {
           commElem[i].style.display = "none";
        }
        document.querySelector("#username-set").style.display = "flex";
    }

    else {
        document.querySelector("#username-set").style.display = "none";
        document.querySelector("#room-create").style.display = 'none';
        let commElem = document.getElementsByClassName('entered');

        for (let i = 0; i < commElem.length; i++) {
            commElem[i].attributes.removeNamedItem('hidden');
            commElem[i].style.display = 'flex';
        }


        var socketId = '';

        socket.on('connect', () => {
            //set socketId
            socketId = socket.id;

            socket.emit('subscribe', {
                room: room,
                socketId: socketId,
                username: username

            });

        });

        socket.on('showUsers', (data) => {
            var users = data.userList;
            var room = data.room;
            h.users(users, room);
        })
        socket.on('newUser', (data) => {
            document.querySelector('.message').innerHTML += "<div class='boxer'>" + data.user + " has joined</div>";
            chatRoom.scrollTop = chatRoom.scrollHeight;
        })

        socket.on('draw-word', function (data) {
            document.querySelector('.message').innerHTML += "<div class='boxer'> You have to draw " + data.word + "</div>";
            chatRoom.scrollTop = chatRoom.scrollHeight;
        });

    }

    var mouse = {
        click: false,
        move: false,
        pos: { x: 0, y: 0 },
        pos_prev: false
    };
    // get canvas element and create context
    var canvas = document.getElementById('drawing');
    var context = canvas.getContext('2d');
    var width = window.innerWidth;
    var height = window.innerHeight;

    // var width = canvas.width;
    // var height = canvas.height;

    // set canvas to full browser width/height


     canvas.width = width;
     canvas.height = height;

    // canvas.width = width / 2;
    // canvas.height = height*0.75 ;

    // register mouse event handlers
    canvas.onmousedown = function (e) { mouse.click = true; };
    canvas.onmouseup = function (e) { mouse.click = false; };

    canvas.onmousemove = function (e) {
        // normalize mouse position to range 0.0 - 1.0
        mouse.pos.x = (e.clientX / width);
        mouse.pos.y = (e.clientY / height);
        mouse.move = true;
    };

    // draw line received from server
    socket.on('draw_line', function (data) {
        console.log("draw")
        var line = data.line;
        context.beginPath();
        context.moveTo(line[0].x * width, line[0].y * height);
        context.lineTo(line[1].x * width, line[1].y * height);
        context.stroke();
    });

    // main loop, running every 25ms
    function mainLoop() {
        // check if the user is drawing
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // send line to to the server
            socket.emit('draw_line', { line: [mouse.pos, mouse.pos_prev] });
            mouse.move = false;
        }
        mouse.pos_prev = { x: mouse.pos.x, y: mouse.pos.y };
        setTimeout(mainLoop, 25);
    }
    mainLoop();
    var form = document.querySelector('.submit')

    form.addEventListener('click', function (e) {
        console.log("1");
        socket.emit('message1', {
            socketId: socketId,
            guessedWord: document.querySelector('.input').value,
        });
        
    });
    socket.on('message', function (data) {
        console.log("word")
        document.querySelector('.message').innerHTML += "<div class='boxer'>" + data.user + "  " + "    :    " + "  " + data.guessedWord + "</div>";
        if (document.querySelector('.input').value === data.word) {
            
            socket.emit('wordGuessed', { user: data.user, word: data.word, room: data.room })
        }
        chatRoom.scrollTop = chatRoom.scrollHeight;
    });

    socket.on('wordGuessed', function (data) {
        document.querySelector('.message').innerHTML += "<div class='boxer'>" + data.user + " has guessed the word. Word is " + data.word + "</div>";
        socket.emit('newDrawer', data);
        chatRoom.scrollTop = chatRoom.scrollHeight;
    });

});
