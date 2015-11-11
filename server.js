var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan')
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');

var port = process.env.PORT || 8080;

mongoose.connect(config.database);
app.set('superSecret',config.secret);

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(morgan('dev'));


app.get('/',function(req,res){
	res.send('Hello! The API is at http://localhost:' + port + '/api');

});

app.listen(port);
console.log('Magic happens at http://localhost:' + port);

app.get('/setup',function(req,res){
	//create sample user
	var william = new User({
		name: 'William Muli',
		password: 'password',
		admin:true
	});

	william.save(function(error){
		if(error) throw err;

		console.log('User saved successfully');

		res.json({success:true});
	});
});

var apiRouter = express.Router();


var apiRoutes = express.Router(); 

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }

  });
});

//route middleware to verify a token
apiRoutes.use(function(req, res, next){
	var token = req.body.token || req.query.token || req.headers['x-access-token']

	if(token){
		jwt.verify(token, app.get('superSecret'),function(err,decoded){
			if(err){
				return res.json({success: false,message:'Failed authenticate token'})
			}else{
				req.decoded = decoded;
				next();
			}
		});
	} else{
		return res.status(403).send({
			success:false,
			message:'No token provided.'
		})
	}
});


apiRoutes.get('/',function(req,res){
	res.json({message:'Welcome to coolest API on earth'});
});

apiRoutes.get('/users',function(req,res){
	User.find({},function(err,users){
		res.json(users)
	});
});

app.use('/api',apiRoutes);