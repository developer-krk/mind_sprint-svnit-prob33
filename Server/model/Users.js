const mongoose = require('mongoose')

const Userschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique:true  
    } ,
    password: {
        type: String,
        required: true
    },
    subs : {
        type: [ mongoose.Schema.Types.ObjectId ],
        ref : 'subscription',
        default:[]
    }
},{timestamps:true})

const user = mongoose.model('user', Userschema)

module.exports = user;