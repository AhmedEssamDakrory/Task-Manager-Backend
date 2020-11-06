const request = require('supertest')
const app = require('../app.js')
const User = require('../models/User')
const Task = require('../models/Task')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { findOne } = require('../models/Task')

const userId = mongoose.Types.ObjectId()
const user = {
    _id : userId,
    name : "ahmed2",
    email : "ahmed2@gmail.com",
    age : 22,
    password : "123456789",
    tokens: [{
        token : jwt.sign({ _id : userId},  process.env.JWT_SECRET)
    }]
}

let task = {
    description : "playing valorant",
    completed : true
} 

beforeEach(async () => {
    await User.deleteMany()
    await Task.deleteMany()
})

test('add task, authorized', async ()=>{
    await new User(user).save()
    const res = await request(app)
        .post('/tasks')
        .set('authorization', `Bearer ${user.tokens[0].token}`)
        .send(task)
        .expect(201)
    const task_ = await Task.findOne({owner : user._id})
    expect(task_.description).toBe(task.description)
    expect(task_.completed).toBe(task.completed)
    // test sending bad request
    await request(app)
        .post('/tasks')
        .set('authorization', `Bearer ${user.tokens[0].token}`)
        .send({
            description : task.description
        })
        .expect(400)


})

test('add task, unauthorized', async ()=>{
    const res = await request(app)
        .post('/tasks')
        .send(task)
        .expect(401)
})


test('delete task' ,async ()=>{
    await new User(user).save()
    task.owner = user._id
    const id = mongoose.Types.ObjectId()
    await new Task({
        ...task,
        _id : id
    }).save()
    await request(app)
        .delete(`/tasks/${id}`)
        .set('authorization', `Bearer ${user.tokens[0].token}`)
        .expect(200)
    const task_ = await Task.findById(id)
    expect(task_).toBeNull()
})

