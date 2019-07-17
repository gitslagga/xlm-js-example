
const logger = require('../lib/logger')
// code from https://www.stellar.org/developers/guides/exchange.html

// Config your server
var config = {};
config.baseAccount = "your base account address";
config.baseAccountSecret = "your base account secret key";

// You can use Stellar.org's instance of Horizon or your own
config.horizon = 'https://horizon-testnet.stellar.org';

// Include the JS Stellar SDK
// It provides a client-side interface to Horizon
var StellarSdk = require('stellar-sdk');
// uncomment for live network:
// StellarSdk.Network.usePublicNetwork();

// Initialize the Stellar SDK with the Horizon instance
// You want to connect to
var server = new StellarSdk.Server(config.horizon);

// Get the latest cursor position
var lastToken = latestFromDB("StellarCursor");

// Listen for payments from where you last stopped
// GET https://horizon-testnet.stellar.org/accounts/{config.baseAccount}/payments?cursor={last_token}
let callBuilder = server.payments().forAccount(config.baseAccount);

// If no cursor has been saved yet, don't add cursor parameter
if (lastToken) {
    callBuilder.cursor(lastToken);
}

callBuilder.stream({ onmessage: handlePaymentResponse });

// Load the account sequence number from Horizon and return the account
// GET https://horizon-testnet.stellar.org/accounts/{config.baseAccount}
server.loadAccount(config.baseAccount)
    .then(function (account) {
        submitPendingTransactions(account);
    })
logger.info(server, lastToken, callBuilder)





function handlePaymentResponse(record) {

    // GET https://horizon-testnet.stellar.org/transaction/{id of transaction this payment is part of}
    record.transaction()
        .then(function (txn) {
            var customer = txn.memo;

            // If this isn't a payment to the baseAccount, skip
            if (record.to != config.baseAccount) {
                return;
            }
            if (record.asset_type != 'native') {
                // If you are a XLM exchange and the customer sends
                // you a non-native asset, some options for handling it are
                // 1. Trade the asset to native and credit that amount
                // 2. Send it back to the customer  
            } else {
                // Credit the customer in the memo field
                if (checkExists(customer, "ExchangeUsers")) {
                    // Update in an atomic transaction
                    db.transaction(function () {
                        // Store the amount the customer has paid you in your database
                        store([record.amount, customer], "StellarDeposits");
                        // Store the cursor in your database
                        store(record.paging_token, "StellarCursor");
                    });
                } else {
                    // If customer cannot be found, you can raise an error,
                    // add them to your customers list and credit them,
                    // or do anything else appropriate to your needs
                    console.log(customer);
                }
            }
        })
        .catch(function (err) {
            // Process error
        });
}





function handleRequestWithdrawal(userID, amountLumens, destinationAddress) {
    // Update in an atomic transaction
    db.transaction(function () {
        // Read the user's balance from the exchange's database
        var userBalance = getBalance('userID');

        // Check that user has the required lumens
        if (amountLumens <= userBalance) {
            // Debit the user's internal lumen balance by the amount of lumens they are withdrawing
            store([userID, userBalance - amountLumens], "UserBalances");
            // Save the transaction information in the StellarTransactions table
            store([userID, destinationAddress, amountLumens, "pending"], "StellarTransactions");
        } else {
            // If the user doesn't have enough XLM, you can alert them
        }
    });
}





StellarSdk.Network.useTestNetwork();
// This is the function that handles submitting a single transaction

function submitTransaction(exchangeAccount, destinationAddress, amountLumens) {
    // Update transaction state to sending so it won't be
    // resubmitted in case of the failure.
    updateRecord('sending', "StellarTransactions");

    // Check to see if the destination address exists
    // GET https://horizon-testnet.stellar.org/accounts/{destinationAddress}
    server.loadAccount(destinationAddress)
        // If so, continue by submitting a transaction to the destination
        .then(function (account) {
            var transaction = new StellarSdk.TransactionBuilder(exchangeAccount)
                .addOperation(StellarSdk.Operation.payment({
                    destination: destinationAddress,
                    asset: StellarSdk.Asset.native(),
                    amount: amountLumens
                }))
                // Wait a maximum of three minutes for the transaction
                .setTimeout(180)
                // Sign the transaction
                .build();

            transaction.sign(StellarSdk.Keypair.fromSecret(config.baseAccountSecret));

            // POST https://horizon-testnet.stellar.org/transactions
            return server.submitTransaction(transaction);
        })
        //But if the destination doesn't exist...
        .catch(StellarSdk.NotFoundError, function (err) {
            // create the account and fund it
            var transaction = new StellarSdk.TransactionBuilder(exchangeAccount)
                .addOperation(StellarSdk.Operation.createAccount({
                    destination: destinationAddress,
                    // Creating an account requires funding it with XLM
                    startingBalance: amountLumens
                }))
                // Wait a maximum of three minutes for the transaction
                .setTimeout(180)
                .build();

            transaction.sign(StellarSdk.Keypair.fromSecret(config.baseAccountSecret));

            // POST https://horizon-testnet.stellar.org/transactions
            return server.submitTransaction(transaction);
        })
        // Submit the transaction created in either case
        .then(function (transactionResult) {
            updateRecord('done', "StellarTransactions");
        })
        .catch(function (err) {
            // Catch errors, most likely with the network or your transaction
            updateRecord('error', "StellarTransactions");
        });
}

// This function handles submitting all pending transactions, and calls the previous one
// This function should be run in the background continuously

function submitPendingTransactions(exchangeAccount) {
    // See what transactions in the db are still pending
    // Update in an atomic transaction
    db.transaction(function () {
        var pendingTransactions = querySQL("SELECT * FROM StellarTransactions WHERE state =`pending`");

        while (pendingTransactions.length > 0) {
            var txn = pendingTransactions.pop();

            // This function is async so it won't block. For simplicity we're using
            // ES7 `await` keyword but you should create a "promise waterfall" so
            // `setTimeout` line below is executed after all transactions are submitted.
            // If you won't do it will be possible to send a transaction twice or more.
            await submitTransaction(exchangeAccount, tx.destinationAddress, tx.amountLumens);
        }

        // Wait 30 seconds and process next batch of transactions.
        setTimeout(function () {
            submitPendingTransactions(sourceAccount);
        }, 30 * 1000);
    });
}




var someAsset = new StellarSdk.Asset('ASSET_CODE', issuingKeys.publicKey());

transaction.addOperation(StellarSdk.Operation.changeTrust({
        asset: someAsset
}))

var someAsset = new StellarSdk.Asset('ASSET_CODE', issuingKeys.publicKey());

transaction.addOperation(StellarSdk.Operation.payment({
        destination: receivingKeys.publicKey(),
        asset: someAsset,
        amount: '10'
      }))