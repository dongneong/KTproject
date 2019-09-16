var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var bodyParser = require("body-parser");
var db = require("./back/database/database");
var session = require('express-session');
var passport = require("passport");
var passportConfig = require("./back/passport");
var line = require("./back/lineClient.js");
var flash = require("connect-flash");

app.use(session({
    secret: 'ackjacoq211j12je1jnokm9d(UDWHDIUH@djojj',
    resave: true,
    saveUninitializaed: false,
    cookie: { maxAge: 3600000, httpOnly: true },
    rolling: true
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.set('views', __dirname + '/front/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/front'));
app.engine('html', require('ejs').renderFile);

app.get("/test", (req, res) => {
    res.render("test");
});

app.get("/", (req, res) => {
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    if (!(req.user)) res.render("login");
    else res.redirect("/chatList");
});

app.get("/signup", (req, res) => {
    if (!(req.user)) res.render("signup");
    else res.redirect("/chatList");
})

app.get("/chatList", (req, res) => { // 현재 채팅방 목록 리스트
    if (!(req.user)) res.redirect("/login");
    else {
        new Promise((resolve, reject) => {
            var data = [];
            if (req.user[0].customers.length == 0) resolve(data);
            for (var i = 0; i < req.user[0].customers.length; i++) { // req.user[0] : 로그인한 상담사
                db.getCustomer(req.user[0].customers[i], (customer) => {
                    data.push(customer[0]);
                    if (data.length === i) resolve(data);
                })
            }
        })
            .then((data) => {
                res.render('chatList', {
                    title: "채팅 관리 페이지",
                    arr: data,
                    date: db.getDate(),
                    nickname: req.user[0].nickname,
                    category: req.user[0].channelId
                });
            })
    }
});

app.post("/login", passport.authenticate('local', {
    successRedirect: "/chatList",
    failureRedirect: "/login",
    failureFlash: true
}));

app.post("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
})

app.post("/signup", (req, res) => {
    var channelId = req.body.channelId, customers = [];
    db.getCustomersOfCategory(channelId, (result) => {
        if (result.length !== 0)
            customers = result[0].customers;

        db.getCounselor(req.body.id, (err, doc) => {
            if (doc.length === 0) {
                var data = {
                    id: req.body.id,
                    password: req.body.password,
                    nickname: req.body.nickname,
                    channelSecret: req.body.channelSecret,
                    channelAccessToken: req.body.channelAccessToken,
                    channelId: req.body.channelId,
                    customers: customers,
                    lastConn: ""
                };
                db.insertCounselor(data);
                res.redirect("/login");
            } else {
                console.log("이미 존재하는 아이디입니다!");
                res.redirect("/signup");
            }
        })
    });
});


app.post("/webhook/:id", line.getLineMiddleware(), (req, res) => { // 고객 -> 상담사
    db.getCounselorWithChannelId(req.params.id, (doc) => {
        Promise
            .all([line.webhook(req.params.id, req.body.events)]) // channelId : 카테고리별 등록용
            .catch((err) => { console.log("error in line.webhook!"); throw err; })
            .then(
                io.of("/" + req.body.events[0].source.userId + req.params.id).emit("message", { // 실시간 통신 (웹소켓)
                    isUser: true,
                    text: req.body.events[0].message.text,
                    time: db.getTime()
                })
            )
            .catch((err) => { console.log("socket emit error in /webhook!"); throw err; })
            .then(res.status(200).send());
    })
});

app.post("/replyhook", (req, res) => { // 상담사 -> 고객
    Promise
        .all([line.replyhook(req.user[0].channelId, req.user[0].id, req.body)])
        .catch((err) => { console.log("socket emit error1 in /replyhook!"); throw err; })
        .then(
            io.of("/" + req.body.userid + req.user[0].channelId).emit("message", { // 실시간 통신 (웹소켓)
                isUser: false,
                text: req.body.text,
                time: db.getTime()
            }))
        .then(res.status(200).send());
});

app.post("/chatListOnDate", (req, res) => {
    if (!(req.user)) res.redirect("/login");
    else {
        db.getDateCustomerArr(req.body.date, (customers, date) => {
            new Promise((resolve, reject) => {
                var result = [], i;
                if (customers.length === 0) resolve(result);
                for (i = 0; i < customers[0].users.length; i++) {
                    if (req.user[0].customers.includes(customers[0].users[i].userid)
                        && customers[0].users[i].channelId === req.user[0].channelId) {
                        result.push(customers[0].users[i]);
                    }
                }
                resolve(result);
            })
                .then((result) => {
                    console.log(result);
                    res.render("chatListOnDate", {
                        title: "날짜로 검색한 채팅 내역",
                        arr: result,
                        date: date,
                        nickname: req.user[0].nickname
                    })
                })
        });
    }
});

app.post("/checkID", (req, res) => {
    res.statusCode(200)
})

app.post("/chatRoom", (req, res) => {
    db.getMessageArr(req.user[0].channelId, req.body.userid, (data) => {
        db.getCustomer(req.body.userid, (usr) => {
            io.of("/" + req.body.userid + req.user[0].channelId).on("connect", (socket) => {
                console.log(req.body.userid, "사용자 접속!");
                socket.on('forceDisconnect', () => {
                    socket.disconnect();
                    console.log("user disconnected forced : " + socket.name);
                })
                socket.on('disconnect', () => {
                    console.log("user disconnected : " + socket.name);
                })
            });
            res.render("chatRoom", {
                title: '답변 보내보자!',
                arr: data,
                userid: req.body.userid,
                channelId: req.user[0].channelId,
                nickname: usr[0].displayName
            })
        })
    })
})

app.post("/chatRoomOnDate", (req, res) => {
    var userid = req.body.userid;
    var date = req.body.date;
    var result = [];
    db.getDateMessageArr(req.user[0].channelId, date, (doc) => {
        db.getCustomer(userid, (usr) => {
            var i, j, data, len;
            for (j = 0; j < doc.length; j++) {
                data = doc[j].body, len = doc[j].body.length;
                for (i = 0; i < len; i++) {
                    if (data[i].userid === userid) {
                        result = data[i].messages;
                        break;
                    }
                }
                if (i !== len) {
                    res.render("chatRoomOnDate", {
                        title: "날짜에 따른 조회 페이지",
                        arr: result,
                        userid: userid,
                        nickname: usr[0].displayName,
                        date: date
                    });
                }
            }
        })
    })
})

app.post("/finishCounsel", (req, res) => {
    line.finishMessage(req.user[0].channelId, req.user[0].id, req.user[0].nickname, req.body.userid);
})

server.listen(process.env.PORT || 8080, function () {
    db.connection();
    passportConfig();
    console.log("waiting to connection on 8080 port...");
});