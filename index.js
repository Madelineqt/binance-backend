const express = require("express")
require('dotenv').config()
const cors = require('cors')
const app = express()
const bodyParser = require("body-parser")
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const api = require('binance');
const jwt = require('jsonwebtoken')
const binanceRest = new api.BinanceRest({
    key: process.env.API_KEY, 
    secret: process.env.API_SECRET, 
    timeout: 15000,
    recvWindow: 60000,
    disableBeautification: false,
    handleDrift: true,
    baseUrl: 'https://api.binance.com/',
    requestOptions: {}
});
const corsOptions = {
    origin: '*',
  }
app.use(cors(corsOptions))
app.listen(8080, () => {
    console.log(`Listening in port 8080.`);
});
const username = process.env.USER
const password = process.env.PASSWORD
app.post('/login', (req,res) => {   
    const p_username = req.body.username
    const p_password = req.body.password
    if(p_username == username && p_password == password){
        jwt.sign(
            { username: username }, 
            'secretkey',
            (err, token) => {
              res.send({
                token: token,
                ok: true,
                message: "Login successful"
              })
            })
          } else {
           res.send({
            ok: false,
            message: "Username or password incorrect"
           })
       }
})
const jwtmiddleware = (req,res,next) => {
    const bearerHeader = req.headers["authorization"]
    if(typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(" ")
    const bearerToken = bearer[1]
    jwt.verify(bearerToken, 'secretkey', (err, result) => {
        if(err) { res.sendStatus(403) }
        else{ next() }
        })
    } else {
    res.sendStatus(403)
    }
} 
app.get('/test',jwtmiddleware, (req,res) => {
    const date = new Date(2021,3,27 ,0,0,0,0)
    const timestamp = date.getTime()
    const date2 = new Date()
    const timestamp2 = date2.getTime()
    console.log(timestamp)
    binanceRest.accountSnapshot({type:'SPOT', startTime:timestamp, endTime:timestamp2})
    .then(data => {
        console.log(data);
        res.send(data)
    })
    .catch(err => {
        console.error(err);
        res.send(err)
    });
})
