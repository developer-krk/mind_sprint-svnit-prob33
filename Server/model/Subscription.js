const e = require('express');
const mongoose = require('mongoose')

const Subs = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: { 
        type: Number,
        required: true
    },
    renewalDate: {
        type: Date,
        required: true
    },
    currency: {
        type: String,
        required: true,
        enum: ["USD", "EUR", "GBP", "INR", "JPY", "CNY", "AUD", "CAD", "CHF", "NZD"],
        default: "INR"
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'user',
        required: true
    },
    paymentMethod:{
        type: String,
        default: "Not Specified"
    },
    category:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'category'
    },
    status:{
        type:String,
        enum:["active","paused","cancelled"],
        default:"active"
    },
    accentColor:{
        type:String,
        default:"#FFFFFF"
    },
    Notes:{
        type:String,
        default:""
    },
    billingCycle:{
        type:String,
        enum:["monthly","yearly","weekly","daily","custom"],
        default:"monthly"
    },
    customCycle:{
        type:Number,
        default:1
    },
    customUnit:{
        type:String,
        enum:["days","weeks","months","years"],
        default:"months"
    }
})

const subscription = mongoose.model('subscription', Subs)

module.exports = subscription;