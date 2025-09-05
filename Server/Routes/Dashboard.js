const express = require('express')
const users  =require("../model/Users")
const subscription =require("../model/Subscription")
const user = require('../model/Users')

const SubscriptionHandler = express.Router()

SubscriptionHandler
.get("/",(req,res)=>{
        const user = users.findOne({_id : req.user.id})
        let subsid = user.subs;
        let subs = []
        subsid.forEach(id => {
            subs.push(subscription.findById(id));
            
        });
        res.json(subs);
    }
)
.post("/addSub",(req,res)=>{
        const body = req.body;
        subscription.create({
            name :body.name,
            price:body.price,
            renewalDate:body.renewalDate,
            currency:body.currency,
            paymentMethod:body.paymentMethod,
            userId:req.user.id,
            category : body.category,
            status:body.status,
            accentColor:body.accentColor,
            Notes:body.Notes,
            customCycle:body.customCycle,
            customUnit:body.customUnit
        })
    }
)