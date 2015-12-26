/**
 * Tutorial from:
 * https://sendgrid.com/blog/json-web-tokens-koa-js
 */

var koa = require('koa');
var bodyParser = require('koa-bodyparser');
var jwt = require('koa-jwt');

var fs = require('fs');
var publicKey = fs.readFileSync('demo.rsa.pub');
var privateKey = fs.readFileSync('demo.rsa');

var app = koa();

app.use(bodyParser());

// JWT Error Catcher
app.use(function *(next) {
    try {
        yield next; //Attempt to go through the JWT Validator
    } catch(e) {
        if (e.status == 401 ) {
            // Prepare response to user.
            this.status = e.status;
            this.body = 'You don\'t have a signed token dude :('
        } else {
            throw e; // Pass the error to the next handler since it wasn't a JWT error.
        }
    }
});

// Public endpoint to login.
app.use(function *(next) {
    if (this.url.match(/^\/login/)) {
        var claims = this.request.body;
        var token = jwt.sign(claims, privateKey, {algorithm: 'RS256'});
        this.status = 200;
        this.body = {token: token};
    } else {
        yield next;
    }
});

// Everything behind this will be protected.
app.use(jwt({
    secret: publicKey,
    algorithm: 'RS256'
}));

app.use(function *() {
    this.status = 200;
    this.body = 'You are logged in dude! Welcome!';
});

app.listen(3000);

/**
 * Try:
 *
 * 1. Default -
 * curl localhost:3000/api
 * You don't have a signed token dude :(
 *
 * 2. Set JWT
 * curl -X POST -H "Content-Type: application/json" localhost:3000/login -d '{"username": "johnsmith"}'
 * {"token": "a_very_very_long_encrypted_token_string"}
 *
 * 3. Send request with token in header
 * curl -X POST -H "Authorization: Bearer a_very_very_long_encrypted_token_string" localhost:3000/api -d '{"username": "johnsmith"}'
 * You are logged in dude! Welcome!
 *
 */

