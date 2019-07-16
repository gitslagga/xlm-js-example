const StellarSdk = require('stellar-sdk')
const logger = require('../lib/logger')
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org")
const pair = StellarSdk.Keypair.random()

console.log('pair', pair)
console.log('seed', pair.secret())
console.log('address', pair.publicKey())

async function getBalance (acc) {

    const account = await server.loadAccount(acc).catch((error) => {
        logger.info(error.response.status, error.response.detail)
        return null
    })

    if (account == null) {
        return 
    }

    account.balances.forEach(function (balance) {
        logger.info("Type:", balance.asset_type, ", Balance:", balance.balance)
    })
}

process.on('uncaughtException', (err) => {
    if (err) {
        logger.info(err)
    }
})

process.on('unhandledRejection', (err, promise) => {
    if (err) {
        logger.info(err)
    }
})

getBalance(pair.publicKey())
getBalance('GBD57G76FY5PXNWL462PV5MUBUK645PQDBHUZAWOLZFCDSWRCLXNHSY4')





// seed SBZTIYJUV5Z4JNUAJYQQBMFP2EQVCZZQAZADPFUZF2NY2SHYFWV3JIUP
// address GBGVW5QBM3ZJ2IW7OKS4IFQSVVHCKQOGQFISMIQKL6MCVTA3PQX73O7U
// 2019-07-16T06:27:35.138Z 'Type:' 'native' ', Balance:' '9949.9999400'
// 2019-07-16T06:27:35.142Z 404 'The resource at the url requested was not found.  This is usually occurs for one of two reasons:  The url requested is not valid, or no data in our database could be found with the parameters provided.'