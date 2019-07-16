const configs = {
    'development': {
        fee: 100,
        node_url: 'https://horizon-testnet.stellar.org',
        listen_account: 'GC2BKLYOOYPDEFJKLKY6FNNRQMGFLVHJKQRGNSSRRGSMPGF32LHCQVGF',
        ding_token: '5b2bf21e940bcc40b3a566156ab223bae0853a1a25a6bd5c871889ded5c905ba'
    },
    'production': {
        fee: 100,
        node_url: 'https://horizon.stellar.org',
        listen_account: 'GC2BKLYOOYPDEFJKLKY6FNNRQMGFLVHJKQRGNSSRRGSMPGF32LHCQVGF',
        ding_token: '5b2bf21e940bcc40b3a566156ab223bae0853a1a25a6bd5c871889ded5c905ba'
    }
}

const config = configs[process.env.NODE_ENV]
module.exports = config