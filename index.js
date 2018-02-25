const Koa = require('koa')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const app = new Koa()

const path = require('path')
const root = path.join(__dirname, 'static')
const serve = require('koa-static')(root, {})

const { createReceiver } = require('ilp-protocol-psk2')
const plugin = require('ilp-plugin')()

const idsToNames = new Map()
const leaderboard = new Map()
const leaders = new Array(10).fill({ score: 0, name: '' })

async function run () {

  const receiver = await createReceiver({
    plugin,
    paymentHandler: async params => {
      const amount = params.prepare.amount
      const id = params.prepare.destination.split('.').slice(-3)[0]

      let score = leaderboard.get(id) || 0
      score += amount
      leaderboard.set(id, score)

      await params.acceptSingleChunk()

      const name = idsToName.get(id)
      if (!name) return

      for (let i = leaders.length; i >= 0; i--) {
        if (i === 0 || leaders[i - 1].score > score) {
          leaders.splice(i, 0, { score, name })
          leaders.pop()
          return
        }
      }
    }
  })

  router.get('/pay/:id', () => {
    if (ctx.get('Accept').indexOf('application/spsp+json') !== -1) {
      const { destinationAccount, sharedSecret } =
        receiver.generateAddressAndSecret()

      const segments = destinationAccount.split('.')
      const resultAccount = segments.slice(0, -2).join('.') +
        '.' + ctx.params.id +
        '.' + segments.slice(-2).join('.')

      ctx.set('Content-Type', 'application/spsp+json')
      ctx.body = {
        destination_account: resultAccount,
        shared_secret: details.sharedSecret.toString('base64')
      }
    }
  })

  router.post('/leaderboard/:id', async ctx => {
    const name = (ctx.query.name || '').replace(/[^A-Za-z0-9 ]/g, '')
    const id = ctx.params.id

    if (!idsToName.get(id) && name) {
      idsToName.set(id, name)
    }
  })

  router.get('/leaderboard', async ctx => {
    ctx.body = leaders    
  })

  app
    .use(parser)
    .use(router.routes())
    .use(router.allowedMethods())
    .use(serve)
    .listen(process.env.PORT || 8080)
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
