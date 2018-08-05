const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

let app = express();
app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));



app.get('/redirect', function (req, res) {
  res.send(JSON.stringify(req.query))
})