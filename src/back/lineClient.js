var line = require("@line/bot-sdk");
var db = require("./database/database.js");

//기가지니
var config = {
    channelAccessToken: "okczwfu6sZFQgDdUUazjhRX908Q6liXi73PBm7/3Ci3g8zJURNo/v2jchhebxBX6gRxFkgTUTPMZzRaiD8q9MZ8ktE1fboYM0F8MxExhhNLg+hfH/bjkEo7zyyykbXrkyrX7D4WBOPrIB+60lSFMtgdB04t89/1O/w1cDnyilFU=",
    channelSecret: "afa4839987d82470003544c93dc11bd0"
};

//  //5G
//  var config = {
//     channelAccessToken : "KTgck3lLjetOOSL6wAu6tyZjlAZc7ZcBEKAV+zxvs/maMWRJ1yQFkzuZEdAQRUqzBSjrli/+wVcz9M8rjn7uWEzhnnwPYFxGzQqat7IaDz0X8wO44UwwsIMvp9SEWd9yExXU7yD//TS2umLfJfVsLQdB04t89/1O/w1cDnyilFU=",
//     channelSecret : "2284f870a58dbfbbfc0422c694a00d5b"
//  };

// // //원내비
// var config = {
//     channelAccessToken: "C547W1InsLEwtCHvgBTs84BowOhVdiLu2vRDlnGE1Ac4zofsKUlR5zpxxNIyyHByoA3WxB5eq0Ureq5VnkziFn9Vp6Fr9423iTfyVZs1+JnISDnM1bpfmydSMH6L/c0vXqE1FTS9TzyIn9mYEwnlZwdB04t89/1O/w1cDnyilFU=",
//     channelSecret: "f6224e064bc607ebcd3dd0bd29d3d7fa"
// };

function webhook(channelId, events) {
    events[0].channelId = channelId;
    Promise
        .all(events.map(fromCustomerToCounselor))
        .catch((err) => { console.log("catch the error1 in webhook function!"); throw err; })
        .then(console.log("고객의 상담접수 완료!"))
        .catch((err) => { console.log("socket emit error2 in webhook function"); throw err; })
}

function replyhook(channelId, counselorid, event) {
    var events = [{
        userid: event.userid,
        channelId: channelId,
        counselorid: counselorid,
        message: {
            type: "text",
            text: event.text
        }
    }];

    Promise
        .all(events.map(fromCounselorToCustomer))
        .catch((err) => { console.log("catch the error1 in replyhook function!"); throw err; })
        .then(() => {
            console.log("상담원의 답변 완료!");
        })
        .catch((err) => { console.log("catch the error2 in replyhook function!"); throw err; })
}

function fromCustomerToCounselor(event) { // 고객이 상담사에게 문의
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    var text;

    db.getCustomerForCheckFinished(event.channelId, event.source.userId, (doc) => {
        if (doc.length !== 0) {
            if (doc[0].category[0].finished) {
                text = "안녕하십니까 고객님. 원하시는 상담의 키워드를 입력해주시면 관련 자료를 안내해드리겠습니다. \n만약 상담원과 직접 채팅을 원하신다면 자유롭게 문의 사항을 입력해주시면 감사하겠습니다.\n1. 5G\n2. 모바일\n3. 혜택\n4. 결합상품\n5. 인터넷\n6. TV\n7. IoT\n8. Egg\n9. 와이파이";
            } else {
                switch (event.message.text) {
                    case "5G":
                    case "5g": text = "5G 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttps://5g.kt.com/learn/qna5g.do"; break;
                    case "혜택": text = "혜택 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttps://membership.kt.com/main/MainInfo.do"; break;
                    case "결합상품": text = "결합상품 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttp://www.kt-olleh.or.kr/shop/page.html?id=8"; break;
                    case "인터넷": text = "인터넷 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttp://www.kt-olleh.or.kr/shop/page.html?id=1"; break;
                    case "TV": text = "TV 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttp://www.kt-olleh.or.kr/shop/page.html?id=13"; break;
                    case "iot":
                    case "IOT":
                    case "IoT": text = "IoT 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttps://product.kt.com/wDic/index.do?CateCode=6018"; break;
                    case "Egg":
                    case "egg":
                    case "EGG": text = "EGG 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttps://shop.kt.com/display/olhsPlan.do?plnDispNo=1225&cmpid=tf_shop_wless_170925-cpc-egg_lteegg-google-kt%20egg&gclid=CjwKCAjw44jrBRAHEiwAZ9igKP8iJNw8E7p-VwypLrEE7ScjBav1V5IhamuTBuKKD7q36KvPI31brRoCtccQAvD_BwE"; break;
                    case "와이파이": text = "와이파이 관련 문의사항은 다음 링크를 통해 알아보실 수 있습니다.\nhttp://firstwifi.nespot.com/ko/index_new.html"; break;
                    default: text = "상담이 접수되었습니다 :)"; break;
                }
            }
        }
        else text = "안녕하십니까 고객님. 원하시는 상담의 키워드를 입력해주시면 관련 자료를 안내해드리겠습니다. \n만약 상담원과 직접 채팅을 원하신다면 자유롭게 문의 사항을 입력해주시면 감사하겠습니다.\n1. 5G\n2. 모바일\n3. 혜택\n4. 결합상품\n5. 인터넷\n6. TV\n7. IoT\n8. Egg\n9. 와이파이";

        db.updateCustomerLastConn(event.channelId, event.source.userId, event.message, true); // 여기서 message 삽입도 한답니다.
        getClient().replyMessage(event.replyToken, {
            type: "text",
            text: text
        })
    })
}

function fromCounselorToCustomer(event) { // 상담사가 고객에게 답변
    if (event.message.text === "") {
        return Promise.resolve(null);
    }
    db.insertMessage(event.channelId, event.userid, event.message.text, false) // DB 삽입 (상담원 -> 고객))
    db.insertDateMessage(event.channelId, event.userid, event.message.text, false);
    getClientForReply(event.counselorid, (client) => {
        client.pushMessage(event.userid, {
            type: event.message.type,
            text: event.message.text
        })
    })
}

function finishMessage(channelId, counselorid, nickname, userid) {
    getClientForReply(counselorid, (client) => {
        client.pushMessage(userid, {
            type: "text",
            text: "고객님을 위해 더욱 더 노력하는 KT가 되겠습니다. 지금까지 상담원 " + nickname + "였습니다. 감사합니다."
        });
    })
    db.updateCustomerFinished(channelId, userid);
}


function getLineMiddleware() {
    return line.middleware(config);
}

function getClient() {
    return new line.Client(config);
}

function getClientForReply(id, callback) {
    db.getCounselor(id, (err, doc) => {
        var c = {
            channelSecret: doc[0].channelSecret,
            channelAccessToken: doc[0].channelAccessToken
        }
        callback(new line.Client(c));
    })
}

exports.getClient = getClient;
exports.webhook = webhook;
exports.replyhook = replyhook;
exports.getLineMiddleware = getLineMiddleware;
exports.finishMessage = finishMessage;