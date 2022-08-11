'use strict';
let express = require('express');
let mongoose = require('mongoose');
let cors = require('cors');
let app = express();
const mySecret = process.env['PW']
// Basic Configuration 
let port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get("/api/hello", function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});

/* Database Connection */
const uri = `mongodb+srv://syed:${mySecret}@cluster0.uudjtax.mongodb.net/db1?retryWrites=true&w=majority`;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let urlSchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: Number
})

let Url = mongoose.model('Url', urlSchema)

let bodyParser = require('body-parser')
let responseObject = {}
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (request, response) => {
  let inputUrl = request.body['url']

  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)

  if (!inputUrl.match(urlRegex)) {
    response.json({ error: 'Invalid URL' })
    return
  }

  responseObject['original_url'] = inputUrl

  let inputShort = 1

  Url.findOne({})
    .sort({ short: 'desc' })
    .exec((error, result) => {
      if (!error && result != undefined) {
        inputShort = result.short + 1
      }
      if (!error) {
        Url.findOneAndUpdate(
          { original: inputUrl },
          { original: inputUrl, short: inputShort },
          { new: true, upsert: true },
          (error, savedUrl) => {
            if (!error) {
              responseObject['short_url'] = savedUrl.short;
              response.json(responseObject);
            }
          }
        )
      }
    })

})

app.get('/api/shorturl/:input', (request, response) => {
  let input = request.params.input;

  Url.findOne({ short: input }, (error, result) => {
    if (!error && result != undefined) {
      response.redirect(result.original);
    } else {
      response.json('URL not Found');
    }
  })
})