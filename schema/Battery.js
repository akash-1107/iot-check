const mongoose = require("mongoose");

const BatterySchema = new mongoose.Schema({
    imei: String,  // IMEI as key
    rawData:  [String] , // Raw BMS string
    inInventory: { type: Boolean, default: false } // 🚀 Track if battery is in inventory
});

const Battery = mongoose.model("Battery", BatterySchema);
module.exports = Battery;
