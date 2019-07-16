const express = require('express')
const logger = require('./lib/logger')
const config = require('./lib/config')
const app = express()

const StellarSdk = require('stellar-sdk')
const server = new StellarSdk.Server(config.node_url)

app.use(bodyParser.json())

app.use(function timeLog(req, res, next) {
    logger.info('Request Original Url: ' + req.originalUrl)
    next()
})

const createAccount = async (req, res) => {
    const pair = Stellar.Keypair.random()
    const account = {
        publicKey: pair.publicKey(),
        secret: pair.secret()
    }
    res.json({ code: 0, account })
}

const getBalance = async (req, res) => {
    const address = req.body.address;
    if (!req.body || !req.body.address)
        return res.json({ code: 404, msg: 'missing params' })

    let balance = 0;
    account = await server.loadAccount(address)
    account.balances.forEach((bal) => {
        logger.info("Type:", balance.asset_type, ", Balance:", balance.balance)
        balance = balance + bal.balance
    })
    res.send({ code: 0, assets: balance })
}



// Get 100 coins from root account
const getFromFaucet = async (req, res) => {
    try {
        const pk = req.body.pk
        if (pk) {
            // faucet is our root account. Make sure you replace this value with your key
            let sourceKeys = Stellar.Keypair.fromSecret("SDJ5AQWLIAYT22TCYSKOQALI3SNUMPAR63SEL73ASALDP6PYDN54FARM");
            // loading root account
            server.loadAccount(sourceKeys.publicKey())
                .then(function (sourceAccount) {
                    let txn = new Stellar.TransactionBuilder(sourceAccount)
                        .addOperation(
                            Stellar.Operation.createAccount({
                                destination: pk,
                                startingBalance: "100"
                            }))
                        .addMemo(Stellar.Memo.text('Test Transaction'))
                        .build();
                    txn.sign(sourceKeys);
                    return server.submitTransaction(txn);
                })
                .then(function (result) {
                    res.send({ "Msg": `SUCCESS : ${JSON.stringify(result)}` })
                })
                .catch(function (error) {
                    console.error('Something went wrong!', error);
                    res.send({ "Msg": `ERROR : ${error}` })
                });
        } else {
            res.send({ "Msg": "ERROR : please provide public key!" })
        }
    } catch (err) {
        res.send({ "Msg": `ERROR : ${error}` })
    }
}


// Do transactions
const makePayment = async (req, res) => {
    const { from, to, value } = req.body;
    //Let get the secret of the spender
    const spender = accounts.find((acc) => {
        if (acc.pk === from) return acc;
    })
    if (spender && spender != null) {
        // First, check to make sure that the destination account exists.
        // You could skip this, but if the account does not exist, you will be charged
        // the transaction fee when the transaction fails.
        server.loadAccount(to)
            .catch((err) => {
                res.send({ "Msg": `Error : receiever ${to} not found!` })
            })
            .then(() => {
                // lets load spender account
                return server.loadAccount(from);
            })
            .then((spenderAccount) => {
                // Start building the transaction.
                const transaction = new Stellar.TransactionBuilder(spenderAccount)
                    .addOperation(Stellar.Operation.payment({
                        destination: to,
                        // Because Stellar allows transaction in many currencies, you must
                        // specify the asset type. The special "native" asset represents Lumens.
                        asset: Stellar.Asset.native(),
                        amount: value
                    }))
                    // A memo allows you to add your own metadata to a transaction. It's
                    // optional and does not affect how Stellar treats the transaction.
                    .addMemo(Stellar.Memo.text('Test Transaction'))
                    .build()
                // get the key pair for signing the transaction
                const pairA = Stellar.Keypair.fromSecret(spender.sk);
                // Sign the transaction to prove you are actually the person sending it
                transaction.sign(pairA)
                return server.submitTransaction(transaction);
            })
            .then((result) => {
                res.send({ "Msg": JSON.stringify(result, null, 2) })
            })
            .catch((err) => {
                res.send({ "Msg": `Error : Somethis went wrong : ${JSON.stringify(err.response.data.extras)}` })
            })
    } else {
        res.send({ "Msg": `Error : spender  ${to} not found!` })
    }
}


/* API Routes */
app.post('/newAccount', createAccount)
app.post('/balance', getBalance)
app.post('/payment', getFromFaucet)
app.post('/recharge', makePayment)

app.listen(3090, () => console.log('xlm restful api listening on port 3090'))

process.on('uncaughtException', (err) => {
    if (err) {
        logger.error(err)
    }
})

process.on('unhandledRejection', (err, promise) => {
    if (err) {
        logger.error(err)
    }
})