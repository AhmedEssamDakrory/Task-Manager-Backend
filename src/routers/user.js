const express = require('express')
const router = new express.Router()
const User = require('../models/User.js')
const auth = require('../middleware/auth.js')
const sharp = require('sharp')

const multer = require('multer')
const upload = multer({
    //dest : 'avatars', // not specifying a dest so that can access the file in the API
    limits : {
        fileSize : 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
           return cb(new Error('pls upload an image!'))
        }
        cb(undefined, true)
    }
})

router.post('/users/signup', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateToken()
        res.status(201).send({user : user, token : token})
    } catch (e) {
        res.status(400).send(e)
    }  
})

router.post('/users/signin', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateToken()
        res.status(200).send({user : user, token : token})
    } catch (e) {
        res.status(404).send(e)
    }
  
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch(e){
        res.status(500).send(e)
    }
    
})

router.get('/users/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        if(!user){
            res.status(404).send('Not found!')
        }
        res.send(user)
    } catch (e) {
        res.status(500).send(e)
    }
    
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'age', 'password', 'email']
    const isAllowed = updates.every((update) => allowedUpdates.includes(update))
    if(!isAllowed){
        res.status(400).send({error: 'Invalid updates!!'})
    } else{
        const user = req.user
        updates.forEach((update) => {
            user[update] = req.body[update]
        })
        try{
            await user.save()
            res.send(user)
        } catch(e){
            res.status(400).send(e)
        }    
    
    }
})

router.delete('/users', auth, async(req, res) => {
    try{
        await req.user.remove()
        res.send(req.user)
    } catch(e){
        res.status(500).send()
    }
    
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    req.user.avatar = req.file.buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error : error.message})
    next()
})

router.get('/users/:id/avatar', async(req, res) => {
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e){
        res.status(404).send(e)
    }
    
})

module.exports = router