require('./db/mongoose.js')
const express = require('express')
const app = express()

const userRouter = require('./routers/user.js')
const taskRouter = require('./routers/task.js')


app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

module.exports = app



