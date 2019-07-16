    
const https = require('https')
const os = require('os')
const config = require('./config')

const errReport = function (stack, level) {
    const token = config.ding_token
	const data = JSON.stringify({
		msgtype: 'text',
		text: {
			content: 'env: ' + (process.env.NODE_ENV) + '\n'
				+ 'pid: ' + process.pid + '\n'
				+ 'hostname: ' + os.hostname() + '\n'
				+ 'err: ' + stack
		},
		at: {
			isAtAll: level >= 1,
		}
	})
	const options = {
		hostname: 'oapi.dingtalk.com',
		port: 443,
		path: '/robot/send?access_token=' + token,
		method: 'POST',
		headers: {
			'Content-Length': data.length,
			'Content-Type': 'application/json',
		},
	}

	const req = https.request(options, (res) => {
		res.on('error', (err) => {
			console.error(err)
		})
	})
	req.on('error', (e) => {
		console.error(e)
	})
	req.write(data)
	req.end()
}

const logger = {
	info: function () {
		console.log(new Date(), ...arguments)
	},
	error: (msg, level) => {
		console.error(new Date(), msg.stack || msg)
		errReport(msg.stack || msg, level)
	},
	err: function () {
		console.error(new Date(), ...arguments)
		errReport(JSON.stringify(arguments))
	}
}

module.exports = logger