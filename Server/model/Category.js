const mongoose = require('mongoose')
const subscription = require('./Subscription')

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    subscriptions:{
        type: [ mongoose.Schema.Types.ObjectId ],
        ref : 'subscription'
    }
})

const category = mongoose.model('category', categorySchema)

module.exports = category;