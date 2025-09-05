const subscription = require('../model/subscription'); 

function addTimeToDate(date, cycle, customCycle = 1, customUnit = 'months') {
    const newDate = new Date(date);

    switch (cycle) {
        case 'daily':
            newDate.setDate(newDate.getDate() + 1);
            break;
        case 'weekly':
            newDate.setDate(newDate.getDate() + 7);
            break;
        case 'monthly':
            newDate.setMonth(newDate.getMonth() + 1);
            break;
        case 'yearly':
            newDate.setFullYear(newDate.getFullYear() + 1);
            break;
        case 'custom':
            switch(customUnit) {
                case 'days':
                    newDate.setDate(newDate.getDate() + customCycle);
                    break;
                case 'weeks':
                    newDate.setDate(newDate.getDate() + customCycle * 7);
                    break;
                case 'months':
                    newDate.setMonth(newDate.getMonth() + customCycle);
                    break;
                case 'years':
                    newDate.setFullYear(newDate.getFullYear() + customCycle);
                    break;
            }
            break;
        default:
            throw new Error('Invalid billing cycle');
    }

    return newDate;
}

const getUpcomingRenewal = async (req, res) => {
    try {
        const { id } = req.params;

        const subscription = await Subscription.findById(id);
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const nextRenewal = addTimeToDate(
            subscription.renewalDate,
            subscription.billingCycle,
            subscription.customCycle,
            subscription.customUnit
        );

        res.status(200).json({
            subscriptionId: subscription._id,
            name: subscription.name,
            nextRenewalDate: nextRenewal
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUpcomingRenewal
};
