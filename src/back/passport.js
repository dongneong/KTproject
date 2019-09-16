var db = require("./database/database");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;


//var MongoDBStore = require("connect-mongodb-session")(session);
//var helmet = require("helmet");

/*var store = new MongoDBStore(
    {
        uri: 'mongodb://34.85.69.104:27017/chatDB',
        collection: 'mySessions'
    }
)

store.on('error', function (err) {
    assert.ifError(err);
    assert.ok(false);
})*/

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        db.getCounselor(id, (err, user) => {
            done(err, user);
        })
    })

    passport.use(new LocalStrategy({
        usernameField : 'id',
        passwordField : 'password',
        session : true,
        passReqToCallback : true
    }, (req, id, password, done) => {
        db.getCounselor(id, (err, doc) => {
            if (err) return done(err);
            if (doc.length === 0) {return done(null, false, req.flash('message', "아이디 또는 비밀번호를 확인하세요."))}
            db.authenticate(id, password, (err, doc) => {
                if (doc.length === 0) {return done(null, false, req.flash('message', "아이디 또는 비밀번호를 확인하세요."))}
                return done(null, doc[0]);
            })
        })
    }));
}

