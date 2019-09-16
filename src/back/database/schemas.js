var mongoose = require("mongoose");

exports.messageSchema = new mongoose.Schema({
    userid: { type: String, required: true },
    channelId: { type: String, required: true },
    body: {
        type:
            [{
                date: { type: String, required: true },
                messages: [{
                    time: { type: String, required: true },
                    isUser: { type: Boolean, required: true },
                    text: { type: String, required: true }
                }]
            }], required: true
    }
});

exports.dateMessageSchema = new mongoose.Schema({
    date: { type: String, required: true },
    channelId: { type: String, required: true },
    body: {
        type:
            [{
                userid: { type: String, required: true },
                messages: [{
                    time: { type: String, required: true },
                    isUser: { type: Boolean, required: true },
                    text: { type: String, required: true }
                }]
            }], required: true
    }
})

exports.customerSchema = new mongoose.Schema({
    userid: { type: String, required: true, unique: true }, // 고객의 라인계정 userid
    displayName: { type: String },
    dates: [{ type: String, required: true }],
    lastConn: { type: String },
    category: {
        type: [{
            channelId: { type: String, required: true },
            lastText: { type: String, required: true },
            finished: { type: Boolean, required: true }
        }]
    }
});

exports.dateCustomerSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    users: {
        type: [{
            userid: { type: String, required: true },
            displayName: { type: String, required: true },
            channelId: { type: String, required: true },
            lastText: { type: String, required: true }
        }]
    }
})

exports.counselorSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nickname: { type: String, required: true },
    channelSecret: { type: String, required: true },
    channelAccessToken: { type: String, required: true },
    channelId: { type: String, required: true },
    customers: [{ type: String }],
    lastConn: { type: String }
})