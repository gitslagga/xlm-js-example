
const logger = require('../lib/logger')
const StellarSdk = require('stellar-sdk')

const config = {};
config.baseAccount = "GBD57G76FY5PXNWL462PV5MUBUK645PQDBHUZAWOLZFCDSWRCLXNHSY4"
config.baseAccountSecret = "SDVLNWP7OGQ7O5LFT62333ZVUX63X6PMLO5NOU3O23TSQCHWZ4P2Q5RZ"
config.horizon = 'https://horizon-testnet.stellar.org'


const server = new StellarSdk.Server(config.horizon)

const lastToken = latestFromDB("StellarCursor")

const callBuilder = server.payments().forAccount(config.baseAccount)

if (lastToken) {
    callBuilder.cursor(lastToken)
}

callBuilder.stream({ onmessage: handlePaymentResponse })

server.loadAccount(config.baseAccount).then(function (account) {
    submitPendingTransactions(account)
})


logger.info(server, lastToken, callBuilder)