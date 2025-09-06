const express = require('express');
const users = require("../model/Users");
const subscription = require("../model/Subscription");
const category = require("../model/Category")
const { price } = require('../Controller/CurrencyConverter');

const SubscriptionHandler = express.Router();

SubscriptionHandler.get("/", async (req, res) => {
    try {
        const user = await users.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const subs = await Promise.all(user.subs.map(id => subscription.findById(id)));

        const targetCurrency = req.query.currency || 'USD'; 
        const convertedSubs = await Promise.all(
            subs.filter(sub => sub).map(async sub => {
            if (!sub) return null;
            try {
                const convertedPrice = await price(
                sub.price,
                sub.currency,
                targetCurrency
                );
                return {
                ...sub.toObject(),
                price: convertedPrice,
                originalCurrency: sub.currency,
                currency: targetCurrency
                };
            } catch (error) {
                console.error(`Error converting currency for subscription ${sub._id}:`, error);
                return sub;
            }
            })
        );
        
        res.json(convertedSubs.filter(sub => sub));
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
            status: body.status,
            accentColor: body.accentColor,
            Notes: body.Notes,
            billingCycle: body.billingCycle || "monthly",
            customCycle: body.customCycle,
            customUnit: body.customUnit
        });
        if (Array.isArray(body.category) && body.category.length > 0) {
    for (const element of body.category) {
        let cated = await category.findOne({ name: element });
        if (!cated) {
            let ncated = await category.create({
                name: element,
                description: "etc",
                subscriptions: [sub._id],
            });
            sub.category.push(ncated._id);
        } else {
            if (!cated.subscriptions.includes(sub._id)) {
                cated.subscriptions.push(sub._id);
                await cated.save();
            }
            sub.category.push(cated._id);
        }
    }
}

        await sub.save();
         
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
// PATCH Update Subscription
SubscriptionHandler.patch("/:id", async (req, res) => {
    try {
        const subId = req.params.id;
        const body = req.body;

        const sub = await subscription.findById(subId);
        if (!sub) return res.status(404).json({ message: "Subscription not found" });

        // --- Update basic fields dynamically ---
        const updatable = [
            "name", "price", "renewalDate", "currency", "paymentMethod",
            "status", "accentColor", "Notes", "billingCycle",
            "customCycle", "customUnit"
        ];
        updatable.forEach(field => {
            if (body[field] !== undefined) sub[field] = body[field];
        });

        // --- Update category only if provided ---
        if (Array.isArray(body.category)) {
            // Remove sub from old categories in one go
            await category.updateMany(
                { _id: { $in: sub.category } },
                { $pull: { subscriptions: sub._id } }
            );

            sub.category = [];

            // Ensure unique category names
            const uniqueCats = [...new Set(body.category)];

            // Upsert categories efficiently
            for (const name of uniqueCats) {
                let cated = await category.findOneAndUpdate(
                    { name },
                    { $addToSet: { subscriptions: sub._id } },
                    { new: true }
                );

                if (!cated) {
                    cated = await category.create({
                        name,
                        description: "etc",
                        subscriptions: [sub._id]
                    });
                }

                sub.category.push(cated._id);
            }
        }

        await sub.save();
        res.json({ message: "Subscription updated successfully", sub });
    } catch (err) {
        console.error("Error updating subscription:", err);
        res.status(500).json({ message: "Failed to update subscription" });
    }
});

module.exports = SubscriptionHandler;
