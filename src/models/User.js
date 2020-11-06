 const mongoose = require('mongoose')
 const validator = require('validator')
 const bcrypt = require('bcryptjs')
 const jwt = require('jsonwebtoken')
 const Task = require('./Task.js')
 const sharp = require('sharp')

 const userSchema = mongoose.Schema( {
    name : {
        type : String,
        required : true,
        trim : true,
        lowercase : true
    },
    age : {
        type : Number,
        default : 0,
        validate(value){
            if(value < 0){
                throw new Error('Invalid age number!!')
            } else if(value < 4){
                throw new Error('You are too young!!')
            }
        }
    },
    email : {
        type : String,
        unique : true,
        required : true,
        trim : true,
        lowercase : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email!!')
            }
        }
    },
    password : {
        type : String,
        required : true,
        trim : true,
        validate(value){
            if(value.length < 8){
                throw new Error("Password must be at least 8 characters long!")
            }
        }
    },
    tokens : [
        {
            token : {
                type : String,
                required : true
            }
        }
    ],
    avatar : {
        type : Buffer
    }
}, {
    timestamps : true
})

//hide private data
userSchema.methods.toJSON = function(){
    const user = this.toObject()
    delete user.password
    delete user.tokens
    delete user.avatar
    return user
}

userSchema.virtual('tasks', {
   ref : 'Task',
   localField : '_id',
   foreignField : 'owner' 
})

userSchema.methods.generateToken = async function (){
    const user = this
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn : '7 days'})
    user.tokens.push({token : token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if(!user){
        throw new Error('wrong email!')
    }
    const isMatch = bcrypt.compare(password, user.password)
    if(!isMatch){
        throw new Error('Incorrect password!')
    }
    return user
}

// hashing password before saving it in database
userSchema.pre('save', async function(next) {
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    if(user.isModified('avatar')){
        user.avatar = await sharp(user.avatar).resize({width : 50 , height : 50}).png().toBuffer()
    }
    next()
})

//delete all tasks of the deleted user
userSchema.pre('remove', async function(next) {
    await Task.deleteMany({owner : this._id})
    next()
})

 const User = mongoose.model('User', userSchema)

 module.exports = User
