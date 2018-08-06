const express = require('express');
const path = require('path');
const axios = require('axios');
const PORT = process.env.PORT || 5000;
const opn = require('opn');
let qs = require('qs');

let code = "";
let access_token = "";
let old_volume = null;

let client_id = process.env.CLIENT_ID;
let client_secret = process.env.CLIENT_SECRET;

let app = express();
app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => {
    console.log(`Listening on ${ PORT }`);
    opn('http://localhost:5000/login');
  });

app.get('/login', (req, res) => {
  var scopes = 'user-read-private user-read-currently-playing user-follow-modify user-read-email user-modify-playback-state';
  res.redirect('https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + client_id +
    (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
    '&redirect_uri=' + encodeURIComponent("http://localhost:5000/redirect"));
});

app.get('/redirect', (req, res) => {
  code = req.query.code;
  getToken(code, res);
});

app.get('/code', function (req, res) {
  res.send(code)
});

app.get('/current', function (req, res) {

});

function checkCurrentSong(){
  let config = {
    headers: {
      "Authorization": "Bearer " + access_token,
      'Content-Type': 'application/json',
    }
  };
  axios.get('https://api.spotify.com/v1/me/player/currently-playing', config)
    .then(function (response) {
      if (response.data.item == null) {
        let exec = require('child_process').exec;
        if (old_volume == null) {
          exec('osascript -e \'get volume settings\'', (error, stdout, stderr) => {
            old_volume = stdout.split(',')[0].split(':')[1];
          });
          exec('osascript -e \'set volume 0\'', function callback(e, o, er){});
        }
        //Waiting for spotify to release websockets
        setTimeout(function() {
          checkCurrentSong();
        }, 1000);
      }
      else{
        let exec = require('child_process').exec;
        exec('osascript -e \'set volume '+old_volume+'\'', function callback(e, o, er){});
        old_volume = null;
        //Waiting for spotify to release websockets
        setTimeout(function() {
          checkCurrentSong();
        }, 2000);
      }

    })
    .catch(function (error) {
      console.log(error);
    });
}

function getToken(code, res) {
  let data = {
    "code": code,
    "grant_type": "authorization_code",
    "redirect_uri": "http://localhost:5000/redirect"
  };
  var payload = client_id + ":" + client_secret;
  var encodedPayload = new Buffer(payload).toString("base64");
  let config = {
    headers: {
      "Authorization": "Basic " + encodedPayload,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };
  axios.post('https://accounts.spotify.com/api/token', qs.stringify(data), config)
    .then(function (response) {
      access_token = response.data.access_token;
      res.send("Initialized");
      checkCurrentSong();
    })
    .catch(function (error) {
      console.log(error);
      res.send(error.data)
    });
}