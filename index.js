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
const jwtmiddleware = (req,res,next) => {
    const bearerHeader = req.headers["authorization"]
    if(typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(" ")
    const bearerToken = bearer[1]
    jwt.verify(bearerToken, 'secretkey', (err, result) => {
        if(err) { res.send({
            ok: false,
            message: "Bad Auth"
           }) }
        else{ next() }
        })
    } else {
    res.send({
        ok: false,
        message: "Bad Auth"
       })
    }
} 
app.get('/check', jwtmiddleware, (req,res) => {
    res.send({ok: true,message: "Success token"})
})
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

app.get('/test',jwtmiddleware, async (req,res) => {
    const date = new Date(2021,3,1 ,0,0,0,0)
    const timestamp = date.getTime()
    const date2 = new Date()
    const timestamp2 = date2.getTime()
    const btccandles = await binanceRest.klines({symbol:'BTCUSDT', interval:'1d', startTime:timestamp, endTime:timestamp2})
    // const btcvalue = await binanceRest.tickerPrice({symbol:'BTCUSDT'})
    console.log(btccandles)
    binanceRest.accountSnapshot({type:'SPOT',limit:30, startTime:timestamp, endTime:timestamp2})
    .then(data => {
        // data.snapshotVos = data.snapshotVos.map(element => element.updateTime = element.updateTime + 1000)
        data.snapshotVos.forEach((element,index) => {
            data.snapshotVos[index].updateTime = data.snapshotVos[index].updateTime + 1000
            data.snapshotVos[index].total = parseFloat(btccandles[btccandles.findIndex((e) => e.openTime == element.updateTime)].open) * element.data.totalAssetOfBtc
        });
        console.log(data)
        res.send(data)
        
    })
    .catch(err => {
        console.error(err);
        res.send(err)
    });
})
