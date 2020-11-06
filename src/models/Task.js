const mongoose = require('mongoose')

const taskSchema = mongoose.Schema({
    description : {
        type : String,
        required : true
    },
    completed : {
        type : Boolean,
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    }
}, {
    timestamps : true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task