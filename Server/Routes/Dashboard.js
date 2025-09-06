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

        const subs = await Promise.all(
            user.subs.map(id => 
                subscription.findById(id).populate('category', 'name')
            )
        );

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
                        currency: targetCurrency,
                        category: sub.category ? sub.category.map(cat => cat.name) : []
                    };
                } catch (error) {
                    console.error(`Error converting currency for subscription ${sub._id}:`, error);
                    return {
                        ...sub.toObject(),
                        category: sub.category ? sub.category.map(cat => cat.name) : []
                    };
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
            customUnit: body.customUnit,
            category: [] // Initialize empty array
        });

        // Always process categories (including "Uncategorized")
        const categoriesToProcess = Array.isArray(body.category) ? body.category : ["Uncategorized"];
        const uniqueCategories = [...new Set(categoriesToProcess.filter(cat => cat && cat.trim()))];
        
        for (const categoryName of uniqueCategories) {
            const trimmedName = categoryName.trim();
            let cated = await category.findOne({ name: trimmedName });
            
            if (!cated) {
                cated = await category.create({
                    name: trimmedName,
                    description: "etc",
                    subscriptions: [sub._id],
                });
            } else {
                if (!cated.subscriptions.includes(sub._id)) {
                    cated.subscriptions.push(sub._id);
                    await cated.save();
                }
            }
            sub.category.push(cated._id);
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

        const deletedSub = await subscription.findById(subId);
        if (!deletedSub) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        // Remove subscription from categories
        if (deletedSub.category && deletedSub.category.length > 0) {
            await category.updateMany(
                { _id: { $in: deletedSub.category } },
                { $pull: { subscriptions: subId } }
            );
        }

        await subscription.findByIdAndDelete(subId);
        await users.findByIdAndUpdate(req.user.id, { $pull: { subs: subId } });

        res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (err) {
        console.error("Error deleting subscription:", err);
        res.status(500).json({ message: "Failed to delete subscription" });
    }
});
// Handle category update
if (Array.isArray(body.category) || !body.category) {
    // Remove subscription from old categories
    if (sub.category && sub.category.length > 0) {
        await category.updateMany(
            { _id: { $in: sub.category } },
            { $pull: { subscriptions: sub._id } }
        );
    }

    sub.category = [];

    // Process new categories (default to "Uncategorized" if empty)
    const categoriesToProcess = Array.isArray(body.category) ? body.category : ["Uncategorized"];
    const uniqueCategories = [...new Set(categoriesToProcess.filter(cat => cat && cat.trim()))];
    
    for (const categoryName of uniqueCategories) {
        const trimmedName = categoryName.trim();
        let cated = await category.findOne({ name: trimmedName });
        
        if (!cated) {
            cated = await category.create({
                name: trimmedName,
                description: "etc",
                subscriptions: [sub._id]
            });
        } else {
            if (!cated.subscriptions.includes(sub._id)) {
                cated.subscriptions.push(sub._id);
                await cated.save();
            }
        }
        sub.category.push(cated._id);
    }
}
module.exports = SubscriptionHandler;
