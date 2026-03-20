const MilkRecord = require('../models/MilkRecord');
const MilkPurchase = require('../models/MilkPurchase');
const OrganizationSale = require('../models/OrganizationSale');

/**
 * Dynamically calculates the available milk for a given shift today.
 * Enforces the strict rule that milk expires after 24 hours.
 * @param {string} shift - 'Morning' | 'Evening'
 * @returns {number} Available liters
 */
const getAvailableMilkForShift = async (shift) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchQuery = {
        shift,
        $or: [
            { date: { $gte: today } },
            { createdAt: { $gte: today } }
        ]
    };

    // 1. Total Collected Today for this shift
    const records = await MilkRecord.find(matchQuery);
    const totalCollected = records.reduce((sum, rec) => sum + (rec.quantity || 0), 0);

    // 2. Total Sold to Users Today for this shift (not cancelled)
    const purchases = await MilkPurchase.find({
        ...matchQuery,
        status: { $ne: 'cancelled' }
    });
    const totalSoldUsers = purchases.reduce((sum, pur) => sum + (pur.quantity || 0), 0);

    // 3. Total Sold to Organizations Today for this shift
    const orgSales = await OrganizationSale.find(matchQuery);
    const totalSoldOrgs = orgSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

    const available = totalCollected - totalSoldUsers - totalSoldOrgs;
    return Math.max(available, 0); // prevent negative in case of edge issues
};

module.exports = {
    getAvailableMilkForShift
};
