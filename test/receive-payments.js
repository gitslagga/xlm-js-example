const logger = require('../lib/logger')
const StellarSdk = require('stellar-sdk')

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const accountId = 'GC2BKLYOOYPDEFJKLKY6FNNRQMGFLVHJKQRGNSSRRGSMPGF32LHCQVGF'

// Create an API call to query payments involving the account.
const payments = server.payments().forAccount(accountId)

// If some payments have already been handled, start the results from the
// last seen payment. (See below in `handlePayment` where it gets saved.)
const lastToken = loadLastPagingToken()
if (lastToken) {
    payments.cursor(lastToken)
}
logger.info('last token: ', lastToken)

// `stream` will send each recorded payment, one by one, then keep the
// connection open and continue to send you new payments as they occur.
payments.stream({
    onmessage: function (payment) {
        logger.info('payment paging_token: ', payment.paging_token)
        // Record the paging token so we can start from here next time.
        savePagingToken(payment.paging_token)

        // The payments stream includes both sent and received payments. We only
        // want to process received payments here.
        if (payment.to !== accountId) {
            return
        }

        // In Stellar’s API, Lumens are referred to as the “native” type. Other
        // asset types have more detailed information.
        let asset
        if (payment.asset_type === 'native') {
            asset = 'lumens'
        }
        else {
            asset = payment.asset_code + ':' + payment.asset_issuer
        }

        logger.info(payment.amount + ' ' + asset + ' from ' + payment.from)
    },

    onerror: function (error) {
        logger.info('Error in payment stream', error)
    }
})

function savePagingToken(token) {
    // In most cases, you should save this to a local database or file so that
    // you can load it next time you stream new payments.
}

function loadLastPagingToken() {
    // Get the last paging token from a local database or file
}


//  if a error happen like MessageEvent is undefined
//  modify error instanceof MessageEvent to error instanceof String