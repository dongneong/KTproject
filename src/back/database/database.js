var mongoose = require("mongoose");
var msg = require("./schemas.js").messageSchema;
var cus = require("./schemas.js").customerSchema;
var dateMsg = require("./schemas.js").dateMessageSchema;
var dateCus = require("./schemas.js").dateCustomerSchema;
var counsel = require("./schemas.js").counselorSchema;
var moment = require("moment");
var line = require("../lineClient");
var bcrypt = require("bcrypt-nodejs");
var DB;
var Customer, Message, DateMessage, DateCustomer, Counselor;

function connection() {
    var url = 'mongodb://34.85.69.104:27017/chatDB';
    var options = {
        user: "master",
        pass: "1234",
        useCreateIndex: true,
        useNewUrlParser: true
    };
    mongoose.connect(url, options, (err) => {
        if (err) { console.log("연결부탁해용"); throw err; }
    });
    DB = mongoose.connection;
    DB.on('error', function () {
        console.log('database connection error');
    });
    DB.once('open', function () {
        Message = mongoose.model("Message", msg, "Message");
        Customer = mongoose.model("Customer", cus, "Customer");
        DateMessage = mongoose.model("DateMessage", dateMsg, "DateMessage");
        DateCustomer = mongoose.model("DateCustomer", dateCus, "DateCustomer");
        Counselor = mongoose.model("Counselor", counsel, "Counselor");
        console.log("database connected!");
    });
}

// 고객의 마지막 접속정보 및 dates 정보를 업데이트하자!
function updateCustomerLastConn(channelId, userid, message, isUser) {  //Customer 업데이트 및 삽입
    console.log("updateCustomerLastConn에 잘 넘어왔나?", channelId, userid, message, isUser)
    var client = line.getClient();
    getCustomer(userid, (doc) => {
        if (doc.length === 0) {
            client.getProfile(userid) // profile 정보를 라인 API로 가져와서
                .then((result) => {
                    new Customer({
                        userid: userid, // 사용자의 userId
                        displayName: result.displayName, // 사용자의 닉네임
                        dates: [getDate()],
                        lastConn: getDate() + " " + getTime(),
                        category: [{
                            channelId: channelId,
                            lastText: message.text,
                            finished: false
                        }]
                    }).save()
                        .then(() => {
                            console.log("successed to insert a Customer!")// insert 성공
                        })
                        .catch(() => console.log("failed to insert a Customer!")) // insert 실패
                })
                .catch((err) => {
                    console.log("There is no that user in LINE messanger..."); // 라인에 없는 고객이면...
                    throw err;
                })
        } else {
            Customer.find({ "userid": userid, "category.channelId": channelId }, (err, doc) => {
                if (doc.length === 0) { // 해당 카테고리 등록이 안되어있으면...
                    DB.collection("Customer").updateOne({ "userid": userid }, { $push: { "category": { "channelId": channelId, "lastText": message.text, "finished": false } } })
                } else { // 카테고리가 있으면 lastText랑 finished만 업데이트
                    DB.collection("Customer").updateOne({ "userid": userid, "category.channelId": channelId }, { $set: { "category.$.lastText": message.text, "category.$.finished": false } })
                }
            })
            DB.collection("Customer").updateOne({ "userid": userid, "category.channelId": channelId }, { $set: { lastConn: getDate() + " " + getTime() } });// 마지막 상담시간 업데이트
            Customer.find({ userid: userid, dates: getDate() }, (err, doc) => { // 이 고객의 dates에 상담한 일자가 들어있나?
                if (doc.length === 0) { // 해당 날짜의 채팅이 처음이라면 날짜를 dates에 append!
                    DB.collection("Customer").updateOne({ userid: userid }, { $push: { dates: getDate() } })
                }
            })
        }
        insertMessage(channelId, userid, message.text, isUser);
        insertDateMessage(channelId, userid, message.text, isUser);
        updateDateCustomer(channelId, userid, message.text);
        insertCustomerInCounselor(channelId, userid);
    })
}

function updateDateCustomer(channelId, userid, text) { // DateCustomer 업데이트 및 삽입
    console.log("updateDateCustomer에 잘 넘어왔나?", channelId, userid, text)
    var client = line.getClient();
    client.getProfile(userid)
        .then((user) => { // displayName용 DB 쿼리
            DateCustomer.find({ date: getDate() }, (err, doc) => {
                if (doc.length === 0) { // 오늘 날짜의 문서가 아예 없으면....!
                    new DateCustomer({ // 새로 넣어주지용
                        "date": getDate(),
                        "users": [{
                            "userid": userid,
                            "displayName": user.displayName,
                            "channelId": channelId,
                            "lastText": text
                        }]
                    }).save()
                        .then(() => console.log("success to insert DateCustoer data!"))
                        .catch((err) => { console.log("fail to insert DateCustome data!"); throw err; })
                } else {
                    DateCustomer.find({ "date": getDate(), "users": { $elemMatch: { "userid": userid, "channelId": channelId } } }, (err, doc) => {
                        if (doc.length === 0) {
                            //console.log("channelID 값 머야....1111", channelId, userid);
                            DB.collection("DateCustomer").updateOne({ "date": getDate() }, { $push: { "users": { "userid": userid, "displayName": user.displayName, "channelId": channelId, "lastText": text } } });
                        }
                        else {
                            //console.log("channelID 값 머야....2222", channelId, userid);
                            DB.collection("DateCustomer").updateOne({ "date": getDate(), "users": { $elemMatch: { "userid": userid, "channelId": channelId } } }, { $set: { "users.$.lastText": text } })
                        }
                    });
                }
            })
        })
}

function insertMessage(channelId, userid, messageText, isUser) { // Message에 삽입
    /**
     * 1. userId가 이미 존재하는가
     * 2. 존재한다면, 오늘 날짜 message가 이미 존재하는가
     */
    console.log("insertMessage에 잘 넘어왓나?", channelId, userid, messageText, isUser)
    Message.find({ channelId: channelId, userid: userid }, (err, doc) => {
        var data = {
            time: getTime(),
            isUser: isUser,
            text: messageText
        };
        if (doc.length !== 0) { // 2번 체크
            Message.find({ "channelId": channelId, "userid": userid, "body.date": getDate() }, (err, doc) => {
                if (doc.length !== 0) { // 이미 document가 있는 사용자이고, 오늘 첫 메시지가 아닐 때
                    console.log("11111111111111", typeof (doc), doc);
                    DB.collection("Message").updateOne(
                        { 'channelId': channelId, 'userid': userid, "body.date": getDate() },
                        { "$push": { "body.$.messages": data } }
                    );
                } else { // 이미 document가 있는 사용자이지만, 오늘 첫 메시지 일때
                    console.log("2222222222222", typeof (doc), doc);
                    data = {
                        date: getDate(),
                        messages: [
                            data
                        ]
                    };
                    DB.collection("Message").updateOne(
                        { 'channelId': channelId, 'userid': userid },
                        { "$push": { "body": data } }
                    );
                }
            })
        } else { // 메시지 자체가 처음인 사용자일 때
            console.log("333333333333", typeof (doc), doc);
            new Message({
                'userid': userid,
                'channelId': channelId,
                'body': [{
                    'date': getDate(),
                    'messages': [
                        data
                    ]
                }]
            }).save()
                .then(console.log("success to insert Message!"))
                .catch((err) => { console.log("err to insert Message!"); throw err; })
        }
    });
}

function insertDateMessage(channelId, userid, messageText, isUser) { // DateMessage에 삽입
    /**
     * 1. 해당 date의 document가 이미 존재하는가?
     * 2. 존재한다면, 그 날 해당 userid의 고객이 메시지를 한 통이라도 보냈나?
     */
    console.log("insertDateMessage에 잘 넘어왔나?", channelId, userid, messageText, isUser)
    DateMessage.find({ channelId: channelId, date: getDate() }, (err, doc) => {
        var data = {
            time: getTime(),
            isUser: isUser,
            text: messageText
        };
        if (doc.length !== 0) { // 2번 체크
            DateMessage.find({ "channelId": channelId, "date": getDate(), 'body.userid': userid }, (err, doc) => {
                if (doc.length !== 0) { // 이미 document가 있는 date이고, 해당 userid의 고객의 메시지가 처음이 아닐때
                    console.log("ㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱㄱ");
                    DB.collection("DateMessage").updateOne(
                        { "channelId": channelId, "date": getDate(), "body.userid": userid },
                        { "$push": { "body.$.messages": data } }
                    );
                } else {
                    console.log("ㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴㄴ");
                    data = {
                        "userid": userid,
                        "messages": [
                            data
                        ]
                    };
                    DB.collection("DateMessage").updateOne(
                        { "channelId": channelId, "date": getDate() },
                        { "$push": { "body": data } }
                    );
                }
            })
        } else { // 해당 date의 document가 없는 경우. 즉 처음인경우
            console.log("ㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷㄷ");
            new DateMessage({
                "date": getDate(),
                "channelId": channelId,
                "body": [{
                    "userid": userid,
                    "messages": [
                        data
                    ]
                }]
            }).save()
                .then(console.log("success to insert DateMessage!"))
                .catch((err) => { console.log("err to insert DateMessage!"); throw err; })
        }
    })
}

function insertCounselor(obj) {
    obj.password = bcrypt.hashSync(obj.password);
    new Counselor(obj).save();
}

function insertCustomerInCounselor(channelId, userid) {
    Counselor.find({ "channelId": channelId, customers: userid }, (err, doc) => {
        if (doc.length === 0) {
            DB.collection("Counselor").updateMany({ "channelId": channelId }, { $push: { "customers": userid } });
        }
    })
}

function updateCustomerFinished(channelId, userid) {
    DB.collection("Customer").updateOne({ userid: userid, "category.channelId": channelId }, { $set: { "category.$.finished": true } })
}

function getMessageArr(channelId, userid, callback) {
    Message.find({ "channelId": channelId, userid: userid }, { "_id": false, "body.date": true, "body.messages": true }, (err, doc) => {
        console.log("getMessageArr", typeof (doc), doc);
        callback(doc);
    })
}

function getDateMessageArr(channelId, date, callback) {
    DateMessage.find({ "channelId": channelId, date: date }, (err, doc) => {
        console.log("getDateMessageArr", typeof (doc), doc);
        callback(doc);
    })
}

function getCustomerArr(callback) {
    Customer.find({}, (err, doc) => {
        console.log("getCustomerArr", typeof (doc), doc);
        callback(doc);
    })
}

function getCustomer(userid, callback) {
    Customer.find({ "userid": userid }, (err, doc) => {
        console.log("getCustomer", typeof (doc), doc);
        callback(doc);
    })
}

function getCustomerForCheckFinished(channelId, userid, callback) {
    Customer.find({ "userid": userid, "category.channelId": channelId }, { "category.$": true }, (err, doc) => {
        console.log("getCustomerForCheckFinished", doc);
        callback(doc);
    })
}

function getCustomersOfCategory(channelId, callback) {
    Counselor.find({ "channelId": channelId }, { "customers": true }, (err, doc) => {
        console.log("getCustomerOfCategory", typeof (doc), doc);
        callback(doc);
    })
}

function getDateCustomerArr(date, callback) {
    DateCustomer.find({ "date": date }, { _id: false, users: true, date: true }, (err, doc) => {
        console.log("getDateCustomerArr", typeof (doc), doc);
        callback(doc, date);
    })
}

function getCounselor(id, callback) {
    Counselor.find({ "id": id }, (err, doc) => {
        callback(err, doc);
    })
}

function getCounselorWithChannelId(channelId, callback) {
    Counselor.find({ "channelId": channelId }, (err, doc) => {
        callback(doc);
    })
}

function getDate() {
    var date = new Date();
    return moment(date).format("YYYY-MM-DD");
}

function getTime() {
    var date = new Date();
    return moment(date).format("HH:mm");
}

function authenticate(id, password, callback) {
    Counselor.find({ id: id }, (err, doc) => {
        if (bcrypt.compareSync(password, doc[0].password)) callback(err, doc);
        else callback(err, []);
    })
}

exports.connection = connection;
exports.insertMessage = insertMessage;
exports.insertDateMessage = insertDateMessage;
exports.updateCustomerLastConn = updateCustomerLastConn;
exports.updateCustomerFinished = updateCustomerFinished;
exports.getMessageArr = getMessageArr;
exports.getCustomerArr = getCustomerArr;
exports.getDateMessageArr = getDateMessageArr;
exports.getCustomer = getCustomer;
exports.getDateCustomerArr = getDateCustomerArr;
exports.getCounselor = getCounselor;
exports.getTime = getTime;
exports.getDate = getDate;
exports.authenticate = authenticate;
exports.insertCounselor = insertCounselor;
exports.getCounselorWithChannelId = getCounselorWithChannelId;
exports.getCustomersOfCategory = getCustomersOfCategory;
exports.getCustomerForCheckFinished = getCustomerForCheckFinished;