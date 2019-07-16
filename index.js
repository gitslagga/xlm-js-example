const express = require('express')
const bodyParser = require('body-parser')
const logger = require('./lib/logger')
const config = require('./lib/config')
const app = express()

const Stellar = require('stellar-sdk')
Stellar.Network.useTestNetwork()
const server = new Stellar.Server(config.node_url)

app.use(bodyParser.json())

app.use(function timeLog(req, res, next) {
    logger.info('Request Original Url: ' + req.originalUrl)
    next()
})

const createAccount = async (req, res) => {
    try {
        const pair = Stellar.Keypair.random()
        const account = {
            publicKey: pair.publicKey(),
            secret: pair.secret()
        }
        res.json({ code: 0, account })
    } catch (error) {
        logger.info("createAccount error: ", error)
        res.json({ code: 405, msg: error.toString()})
    }
}

const getBalance = async (req, res) => {
    try {
        if (!req.body || !req.body.address)
            return res.json({ code: 404, msg: 'missing params' })

        
        logger.info("request address: ", req.body.address)

        const account = await server.loadAccount(req.body.address)
        res.json({ code: 0, assets: account.balances })
    } catch (error) {
        logger.info("getBalance error: ", error)
        res.json({ code: 405, msg: error.toString()})
    }
}

const sendTransaction = async (req, res) => {
    try {
        if (!req.body || !req.body.secret || !req.body.to || !req.body.value || !req.body.memo)
            return res.json({ code: 404, msg: 'missing params' })

        logger.info("request address: ", req.body.to, req.body.value, req.body.memo)
        let sourceKeys = Stellar.Keypair.fromSecret(req.body.secret)

        server.loadAccount(sourceKeys.publicKey())
            .then(function (sourceAccount) {
                let txn = new Stellar.TransactionBuilder(sourceAccount, { fee: config.fee})
                    .addOperation(Stellar.Operation.payment({
                        destination: req.body.to,
                        asset: Stellar.Asset.native(),
                        amount: req.body.value
                    }))
                    .addMemo(Stellar.Memo.text(req.body.memo))
                    .setTimeout(config.wait_second)
                    .build()
                txn.sign(sourceKeys)
                return server.submitTransaction(txn)
            })
            .then(function (result) {
                res.json({ code: 0, data: result })
            })
    } catch (error) {
        logger.info("sendTransaction error: ", error)
        res.json({ code: 405, msg: error.toString()})
    }
}

const receivePaments = async (req, res) => {
    const accountId = config.listen_account
    const payments = server.payments().forAccount(accountId)
    let data = []

    payments.stream({
        onmessage: function (payment) {
            logger.info('payment paging_token: ', payment.paging_token)
            
            if (payment.to !== accountId) {
                return
            }

            let asset
            if (payment.asset_type === 'native') {
                asset = 'lumens'
            } else {
                asset = payment.asset_code + ':' + payment.asset_issuer
            }

            logger.info(payment.amount + ' ' + asset + ' from ' + payment.from)
            data.push({
                from: payment.from,
                amount: payment.amount,
                asset
            })
        },

        onerror: function (error) {
            logger.info('Error in payment stream', error)
        }
    })

    res.json({ code: 0, data })
}

/* API Routes */
app.post('/createAccount', createAccount)
app.post('/getBalance', getBalance)
app.post('/sendTransaction', sendTransaction)
app.post('/receivePaments', receivePaments)

app.listen(3090, () => console.log('xlm restful api listening on port 3090'))