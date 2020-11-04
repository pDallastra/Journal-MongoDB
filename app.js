const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Let's have fun in CS246.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

var connection = mongoose.connect(`mongodb+srv://paulodallastra:88125707@cluster0-jyx8b.mongodb.net/<CS246>`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    phone: String
});

const postSchema = {
    title: String,
    content: String,
    user_id: String
};

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);
const Post = new mongoose.model('Post', postSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/home');
    } else {
        res.render('login');
    }
});

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/failedLogin'
}));

app.get('/register', (req, res) => {
    res.render('register')
});

app.post('/register', (req, res) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let username = req.body.username;
    let phone = req.body.phone;

    User.register({
        firstName,
        lastName,
        username,
        phone,
    },
    req.body.password, (err, user) => {
        if(err) {
            console.log(err)
            res.redirect('/')
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/');
            });
        }
    })
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/home', (req, res) => {
        if (req.isAuthenticated()) {
            const checkId = req.user.id;
            Post.find({
                user_id: checkId
            }, function (err, posts) {
                res.render('home', {
                    posts: posts
                });
            })
        } else {
            res.redirect('/');
        }
});

app.post('/submit', function (req, res) {
    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
            res.redirect('/');
        } else {
            if (foundUser) {
                const newPost = new Post({
                    title: req.body.title,
                    content: req.body.content,
                    user_id: req.user.id
                });
                newPost.save(function () {
                    res.redirect('home');
                })
            }
        }
    })
});

app.post('/delete/:id', function (req, res) {
    const id = req.params.id;
    Post.deleteOne({
        _id: id
    }, (err) => {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/')
        }
    })
});

app.get('/edit/:id', function (req, res) {
    const id = req.params.id;
    if (req.isAuthenticated()) {
        const checkId = req.user.id;
        Post.find({
            _id: id
        }, function (err, posts) {
            res.render('edit', {
                posts: posts
            });
        })
    } else {
        res.redirect('/');
    }
});

app.post('/edit/:id', function (req, res) {
    const id = req.params.id;
    const title = req.body.title;
    const content = req.body.content;

    if (req.isAuthenticated()) {
        Post.updateOne({
            _id: id
        },{
            title: title,
            content: content
        }, function (err, posts) {
            if (err) {
                console.log(err)
                res.redirect('/')
            } else {
                res.redirect('/')
            }
        })
    } else {
        res.redirect('/');
    }
});

app.listen(process.env.PORT || 3000, function* () {
    console.log("Server started.");
});