const logger = require('../lib/logger')
const StellarSdk = require('stellar-sdk')
StellarSdk.Network.useTestNetwork()
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const sourceKeys = StellarSdk.Keypair.fromSecret('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4')
const destinationId = 'GA2C5RFPE6GCKMY3US5PAB6UZLKIGSPIUKSLRB6Q723BM2OARMDUYEJ5'
// Transaction will hold a built transaction we can resubmit if the result is unknown.
let transaction

logger.info(sourceKeys.publicKey())

// First, check to make sure that the destination account exists.
// You could skip this, but if the account does not exist, you will be charged
// the transaction fee when the transaction fails.
server.loadAccount(destinationId)
    // If the account is not found, surface a nicer error message for logging.
    .catch(StellarSdk.NotFoundError, function (error) {
        throw new Error('The destination account does not exist!')
    })
    // If there was no error, load up-to-date information on your account.
    .then(function () {
        return server.loadAccount(sourceKeys.publicKey())
    })
    .then(function (sourceAccount) {
        // Start building the transaction.
        transaction = new StellarSdk.TransactionBuilder(sourceAccount, {fee: 100})
            .addOperation(StellarSdk.Operation.payment({
                destination: destinationId,
                // Because Stellar allows transaction in many currencies, you must
                // specify the asset type. The special "native" asset represents Lumens.
                asset: StellarSdk.Asset.native(),
                amount: "10"
            }))
            // A memo allows you to add your own metadata to a transaction. It's
            // optional and does not affect how Stellar treats the transaction.
            .addMemo(StellarSdk.Memo.text('Test Transaction'))
            // Wait a maximum of three minutes for the transaction
            .setTimeout(180)
            .build()
        // Sign the transaction to prove you are actually the person sending it.
        transaction.sign(sourceKeys)
        // And finally, send it off to Stellar!
        return server.submitTransaction(transaction)
    })
    .then(function (result) {
        logger.info('Success! Results:', result)
    })
    .catch(function (error) {
        logger.info('Something went wrong!', error)
        // If the result is unknown (no response body, timeout etc.) we simply resubmit
        // already built transaction:
        // server.submitTransaction(transaction)
    })




    // GC2BKLYOOYPDEFJKLKY6FNNRQMGFLVHJKQRGNSSRRGSMPGF32LHCQVGF
    // Success! Results: { _links:
    //     { transaction:
    //        { href:
    //           'https://horizon-testnet.stellar.org/transactions/cb6ef574cc7342e18146d40b88cf46b18e43a6ab257557fb1430928292645e70' } },
    //    hash:
    //     'cb6ef574cc7342e18146d40b88cf46b18e43a6ab257557fb1430928292645e70',
    //    ledger: 1324447,
    //    envelope_xdr:
    //     'AAAAALQVLw52HjIVKlqx4rWxgwxV1OlUImbKUYmkx5i70s4oAAAAZAAAARUAAABHAAAAAQAAAAAAAAAAAAAAAF0tbogAAAABAAAAEFRlc3QgVHJhbnNhY3Rpb24AAAABAAAAAAAAAAEAAAAANC7EryeMJTMbpLrwB9TK1INJ6KKkuIfQ/rYWacCLB0wAAAAAAAAAAAX14QAAAAAAAAAAAbvSzigAAABAAt2ubG6av69dg6dRCVcZ0c8+KiR4846QN3VZH6e2KB2X+SI4O5PEPBtxKv1UgrEXf8zEwfzGzhbWotOjUB1kCw==',
    //    result_xdr: 'AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=',
    //    result_meta_xdr:
    //     'AAAAAQAAAAIAAAADABQ1nwAAAAAAAAAAtBUvDnYeMhUqWrHitbGDDFXU6VQiZspRiaTHmLvSzigAAAAH5gNs5QAAARUAAABGAAAAAAAAAAAAAAAAAAAADnlvdXJkb21haW4uY29tAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAUNZ8AAAAAAAAAALQVLw52HjIVKlqx4rWxgwxV1OlUImbKUYmkx5i70s4oAAAAB+YDbOUAAAEVAAAARwAAAAAAAAAAAAAAAAAAAA55b3VyZG9tYWluLmNvbQAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAAAAEAAAAAwAUA6oAAAAAAAAAADQuxK8njCUzG6S68AfUytSDSeiipLiH0P62FmnAiwdMAAAAF2w6JQQAEbjlAAAAFwAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAQAUNZ8AAAAAAAAAADQuxK8njCUzG6S68AfUytSDSeiipLiH0P62FmnAiwdMAAAAF3IwBgQAEbjlAAAAFwAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAwAUNZ8AAAAAAAAAALQVLw52HjIVKlqx4rWxgwxV1OlUImbKUYmkx5i70s4oAAAAB+YDbOUAAAEVAAAARwAAAAAAAAAAAAAAAAAAAA55b3VyZG9tYWluLmNvbQAAAQAAAAAAAAAAAAAAAAAAAAAAAAEAFDWfAAAAAAAAAAC0FS8Odh4yFSpaseK1sYMMVdTpVCJmylGJpMeYu9LOKAAAAAfgDYvlAAABFQAAAEcAAAAAAAAAAAAAAAAAAAAOeW91cmRvbWFpbi5jb20AAAEAAAAAAAAAAAAAAAAAAAA=',
    //    offerResults: undefined }