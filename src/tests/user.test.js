const request = require('supertest')
const app = require('../app.js')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

let user1 = {}

beforeEach(async () => {
    await User.deleteMany()
    user1 = {
        name : "ahmed",
        email : "ahmed@gmail.com",
        age : 22,
        password : "123456789",
        tokens: []
    }
})

test('sign up', async() => {
    const res = await request(app)
        .post('/users/signup')
        .send(user1)
        .expect(201) // test status code
    const id = res.body.user._id
    const newUser = await User.findById(id)
    // test user inserted in DB sccessfully
    expect(newUser).not.toBeNull() 
} )

test('sign up bad req', async() => {
    const res = await request(app)
        .post('/users/signup')
        .send({
            name : "ahmed",
            age : 22,
            password : "123456789"
        })
        .expect(400)
})

test('sign in', async() => {
    await new User(user1).save()
    const res = await request(app)
        .post('/users/signin')
        .send({
            email : user1.email,
            password : user1.password
        })
        .expect(200)
        const user = await User.findById(res.body.user._id)
        // check generated token inserted in DB
        expect(res.body.token).toBe(user.tokens[0].token)
})

test('sign in with invalid cardentials', async() => {
    const res = await request(app)
        .post('/users/signin')
        .send({
            email : user1.email,
            password : user1.password
        })
        .expect(404)
})

test('logout', async() => {
    user1._id = mongoose.Types.ObjectId()
    user1.tokens.push({
        token : jwt.sign({_id : user1._id},  process.env.JWT_SECRET)
    })
    await new User(user1).save()
    await request(app)
        .post('/users/logout')
        .set('authorization', `Bearer ${user1.tokens[0].token}`)
        .expect(200)
    // test that the token removed from DB
    const user = await User.findById(user1._id)
    expect(user.tokens[0]).not.toBe(user1.tokens[0].token)
})

test('uploading avatar', async() => {
    user1._id = mongoose.Types.ObjectId()
    user1.tokens.push({
        token : jwt.sign({_id : user1._id},  process.env.JWT_SECRET)
    })
    await new User(user1).save()
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${user1.tokens[0].token}`)
        .attach('avatar', __dirname + '/fixtures/me.jpg')
        .expect(200)
    const user = await User.findById(user1._id)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('get me', async() => {
    user1._id = mongoose.Types.ObjectId()
    user1.tokens.push({
        token : jwt.sign({_id : user1._id},  process.env.JWT_SECRET)
    })
    await new User(user1).save()
    const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${user1.tokens[0].token}`)
        .expect(200)
    // check that the returned user is me
    expect(res.body.email).toBe(user1.email)
})

test('delete me', async ()=>{
    user1._id = mongoose.Types.ObjectId()
    user1.tokens.push({
        token : jwt.sign({_id : user1._id},  process.env.JWT_SECRET)
    })
    await new User(user1).save()
    await request(app)
        .delete('/users')
        .set('Authorization', `Bearer ${user1.tokens[0].token}`)
        .expect(200)
    const user = await User.findById(user1._id)
    expect(user).toBeNull()
})

test('update me', async ()=>{
    user1._id = mongoose.Types.ObjectId()
    user1.tokens.push({
        token : jwt.sign({_id : user1._id},  process.env.JWT_SECRET)
    })
    await new User(user1).save()
    const newUser = {
        name : "karim",
        email : "karim@gmail.com",
        age : 23,
    }
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${user1.tokens[0].token}`)
        .send(newUser)
        .expect(200)
    const user = await User.findById(user1._id)
    expect(user.name).toBe(newUser.name)
    expect(user.email).toBe(newUser.email)
    expect(user.age).toBe(newUser.age) 
})