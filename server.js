const http = require('http');
const {parse,json,text,from} = require('get-body');

const requestListener = function (req, res) {
  parse(req, req.headers)
  .then(body => console.log(body))
  .catch(err => console.log(err));
}

const server = http.createServer(requestListener);
server.listen(3333);