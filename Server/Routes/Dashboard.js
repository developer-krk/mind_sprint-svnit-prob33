const express = require('express');
const users = require("../model/Users");
const subscription = require("../model/subscription");

const SubscriptionHandler = express.Router();

SubscriptionHandler.get("/", async (req, res) => {
    try {
        const user = await users.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const subs = await Promise.all(user.subs.map(id => subscription.findById(id)));

        res.json(subs.filter(sub => sub)); 
    } catch (err) {
        console.error("Error fetching subscriptions:", err);
        res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
});

SubscriptionHandler.post("/addSub", async (req, res) => {
    try {
        const body = req.body;

        const sub = await subscription.create({
            name: body.name,
            price: body.price,
            renewalDate: body.renewalDate,
            currency: body.currency,
            paymentMethod: body.paymentMethod,
            userId: req.user.id,
            category: body.category,
            status: body.status,
            accentColor: body.accentColor,
            Notes: body.Notes,
            billingCycle: body.billingCycle || "monthly",
            customCycle: body.customCycle,
            customUnit: body.customUnit
        });

        await users.findByIdAndUpdate(req.user.id, { $push: { subs: sub._id } });

        res.status(201).json({ message: "Subscription added successfully", sub });
    } catch (err) {
        console.error("Error adding subscription:", err);
        res.status(500).json({ message: "Failed to add subscription" });
    }
});
SubscriptionHandler.delete("/:id", async (req, res) => {
    try {
        const subId = req.params.id;

        const deletedSub = await subscription.findByIdAndDelete(subId);
        if (!deletedSub) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        await users.findByIdAndUpdate(req.user.id, { $pull: { subs: subId } });

        res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (err) {
        console.error("Error deleting subscription:", err);
        res.status(500).json({ message: "Failed to delete subscription" });
    }
});

module.exports = SubscriptionHandler;
