const mongoose = require('mongoose');


const IoTCheckSchema = new mongoose.Schema({

    data: { type: [String], default: [] } // Array of strings
});

const IoTData = mongoose.model('IoTCheck', IoTCheckSchema);
module.exports = IoTData;
