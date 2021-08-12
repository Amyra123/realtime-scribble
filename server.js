var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require("path");

const static_path = path.join(__dirname);

app.set('views', static_path);

app.use(express.static(static_path));

app.get('/', function (req, res) {
    res.sendfile(static_path + "index.html");
});
var users = {};
var words = ["word", "letter", "number", "person", "man", "people", "sound", "apple",
    "men", "woman", "women", "boy", "seagull", "hotdog", "hamburger", "Earth",
    "girl", "week", "month", "name", "elephant", "feather", "sled", "keyboard",
    "land", "home", "hand", "house", "picture", "animal", "mother", "father", "air",
    "sandwich", "moon", "world", "head", "page", "country", "question", "pigeon",
    "school", "plant", "food", "sun", "state", "eye", "city", "tree", "Trump", "puppy",
    "farm", "story", "egg", "night", "day", "life", "north", "south", "east", "man",
    "west", "child", "children", "paper", "music", "river", "car", "Superman",
    "beetle", "feet", "book", "duck", "friend", "fish", "mouse", "owl", "soda",
    "mountain", "horse", "watch", "color", "face", "wood", "Mars", "bird", "water",
    "body", "family", "song", "door", "forest", "wind", "ship", "area", "hat",
    "rock", "fire", "problem", "airplane", "top", "bottom", "king", "breakfast",
    "space", "whale", "unicorn", "sunset", "sunburn", "whale", "coffee", "butterfly"];
var wordcount;

function newWord() {
    wordcount = Math.floor(Math.random() * (words.length));
    return words[wordcount];
};

var word = {};
var drawers = {};
var current = {};

io.on('connection', function (socket) {
    socket.on('subscribe', (data) => {
        //subscribe/join a room
        socket.join(data.socketId);
        socket.join(data.room);
        var c = 0;
        for (var key in users) {
            if (key.split(',')[0] === data.room) {
                c++;
                break;
            }
        }
        if(c == 0){
            drawers[data.room] = {};
        }
        drawers[data.room][data.username] = {
            socketId: data.socketId,
            isAvailable: 1
        }
        users[[data.room, data.username]] = {
            socketId: data.socketId,
            score: 0
        };

        io.in(data.room).emit('showUsers', {
            userList: users,
            room: data.room
        });
        io.in(data.room).emit('newUser', {
            user: data.username
        });
        
        if(c==0) {
            word[data.room] = {word:newWord(), user:data.username};
            io.in(data.socketId).emit('draw-word', {
                word: word[data.room].word
            });
            drawers[data.room][data.username].isAvailable = 0;
            
        }
        else {

        }

    });

    socket.on('message1', function (data) {
        for (var key in users) {
            if (socket.id === users[key].socketId) {
                io.in(key.split(',')[0]).emit('message', {
                    users: users,
                    user: key.split(',')[1],
                    word: word[key.split(',')[0]].word,
                    guessedWord: data.guessedWord,
                    room: key.split(',')[0]
                });
                console.log(word)
                break;
            }
        }
    });

    // add handler for message type "draw_line".
    socket.on('draw_line', function (data) {
        for (var key in users) {
            if (socket.id === users[key].socketId) {
                io.in(key.split(',')[0]).emit('draw_line', { line: data.line });
                break;
            }
        }
    });

    socket.on('wordGuessed', function (data) {
        current[data.room] = 0;
        users[[data.room, data.user]].score += 5;
        users[[data.room, word[data.room].user]].score += 5;
        io.in(data.room).emit('showUsers', {
            userList: users,
            room: data.room
        });
        io.in(data.room).emit('wordGuessed', data)
    });

    socket.on('newDrawer', function (data) {
        if(current[data.room]==0){
        current[data.room] = 1;
        word[data.room] = {word:newWord(), user:data.user};
        console.log(word[data.room].word)
        io.in(drawers[data.room][data.user].socketId).emit('draw-word', {
            word: word[data.room].word
        });}
    });


});
server.listen(process.env.PORT || 5000);