"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be implemented:
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');


// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require("fs");
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

mongoose.connect('mongodb://localhost/cs142project6');
var db = mongoose.connection; // used to extract collections for find() method

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    // if no user is logged in
    if (request.session.user === undefined) {
        response.status(401).send('No user logged in');
    }
    User.find({}, function (err, info) {
        if (err) {
            console.error('Doing /user/list error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (info.length === 0) {
            response.status(500).send('Missing UserListInfo');
            return;
        }
        info = JSON.parse(JSON.stringify(info));

        var cutInfo = [];
        for (var i = 0; i < info.length; ++i) {
            var item = info[i];
            var newItem = {};
            for (var property in item) {
                if (item.hasOwnProperty(property)) {
                    if (property === 'id' || property === 'first_name' || property === 'last_name') {
                        newItem[property] = item[property];
                    }
                }
            }
            cutInfo.push(newItem);
        }
        response.json(cutInfo);
        response.end(JSON.stringify(cutInfo));
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if (request.session.user === undefined) {
        response.status(401).send('No user logged in');
    }
    var param = request.params.id || '';
    if (param === '') {
        console.error('Must specify a param!');
    }
    else {
        User.findOne({_id: param}, function (err, info) {
            if (err) {
                console.log('No /user/id exists', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info === undefined) {
                response.status(500).send('Missing UserListInfo');
                return;
            }
            info = JSON.parse(JSON.stringify(info));
            response.end(JSON.stringify(info));
        });
    }
});


/**
 * Post to user to check if it exists
 */
app.post('/checkUser/', function(request, response) {
    if (request.body['login_name'] !== undefined) {
        User.findOne({login_name:request.body['login_name']}, function(err, info) {
            if (err || info === undefined) {
                response.end("No user exist");
            }
            response.end(JSON.stringify(info));
        })
    }
    else {
        response.end("No valid request");
    }});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if (request.session.user === undefined) {
        response.status(401).send('No user logged in');
    }
    var param = request.params.id || '';
    if (param === '') {
        console.error('Must specify a param!');
    }
    else {
        Photo.find({}, function (err, info) {
            // Filter out all photos that belong to the user requested
            if (err) {
                console.error('Doing /photosOfUser/:id error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                response.status(500).send('Missing PhotoInfo');
                return;
            }
            info = JSON.parse(JSON.stringify(info)); //extract all the photos

            var photos = [];
            for (var i = 0; i < info.length; ++i) {
                if (info[i].user_id !== param) continue;
                photos.push(info[i]); //push into array all the photos that belongs to user
            }
            if (photos.length === 0) { // if this user does not have any photo yet
                response.end(JSON.stringify(photos));
            }

            // Add comment user info to photo data
            async.each(photos, function (photo, callback1) {
                async.each(photo.comments, function (comment, callback2) {
                    User.findOne({_id: comment.user_id}, function (err, info) {
                        if (err) {
                            console.error('Find commenter error', err);
                            response.status(500).send(JSON.stringify(err));
                            return;
                        }
                        if (info.length === 0) {
                            response.status(500).send('Cannot find commenter');
                            return;
                        }
                        comment['user'] = info;
                        callback2(); // IT MEANS DEALING WITH THIS OBJECT IS OVER. MUST BE IN THE RIGHT PLACE!
                    });
                }, function (err) {
                    if (err) {
                        console.log("Something went wrong with loading the user info for some comment.");
                    }
                    else {
                        callback1();
                    }
                });
            }, function (err) {
                if (err) {
                    console.log("Something went wrong with iteration of photos");
                }
                else {
                    response.end(JSON.stringify(photos));
                }
            });
        });
    }
});

/**
 * Register
 */
app.post('/user/', function(request, response) {
    if (request.body['login_name'] && request.body['password'] && request.body['first_name'] && request.body['last_name']) {
        User.create({
            login_name: request.body['login_name'],
            password: request.body['password'],
            first_name: request.body['first_name'],
            last_name: request.body['last_name'],
            location: request.body['location'] || "",
            description: request.body['description'] || "",
            occupation: request.body['occupation'] || ""
        }, function(err, newUser) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
            }
            newUser.id = newUser._id;
            newUser.save();
            response.end(JSON.stringify(newUser));
        });
    }
});

/**
 * Login
 */
app.post('/admin/login', function (request, response) {
    if (request.body['login_name'] && request.body['password']) { //If proper request is made
        request.session['user'] = {};
        User.findOne({login_name: request.body['login_name'], password: request.body['password']}, function (err, info) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            if (info === undefined) {
                response.status(400).send("user undefined.");
                return;
            }
            info = JSON.parse(JSON.stringify(info));
            request.session['user'] = info; //Put user in the session
            response.end(JSON.stringify(info));
        });
    }
});

/**
 * Logout
 */
app.post('/admin/logout', function (request, response) {
    if (request.session.user === undefined) {
        response.status(400).send("User not logged in currently.");
    }
    request.session.destroy(function () {
        response.end();
    });
});

/**
 * Photo comment addition
 */
app.post('/commentsOfPhoto/:photo_id', function (request, response) {
    var param = request.params.photo_id || '';
    Photo.findOne({'_id': param}, function (err, info) {
        if (err) {
            console.error('Doing /user/:id error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (info === undefined) {
            response.status(500).send('Missing UserListInfo');
            return;
        }

        if (request.body['new_comment'] !== '') {
            var comment = {
                comment: request.body['new_comment'],
                date_time: new Date(),
                user_id: request.session.user.id
            };

            info.comments.push(comment);
            info.save(); //save to db
            //return the user of that photo, so the page could return to the right place after submiting the comment
            User.findOne({id: info.user_id}, function (err, userFound) {
                response.end(JSON.stringify(userFound));
            });
        }
        else {
            response.status(400).send('No empty comments allowed!');
        }
    });
});

/**
 * Upload photo
 */
app.post('/photos/new', function (request, response) {
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            console.log('error in requesting');
            response.status(500).send(JSON.stringify(err));
            return;
        }

        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' + String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            if(err) {
                console.log('error in writing file');
                response.status(500).send(JSON.stringify(err));
            }
            // if writeFile successful, update db
            Photo.create({
                file_name: filename,
                date_time: timestamp,
                user_id: request.session.user.id,
                comments: []
            }, function (err, newPhoto) {
                if (err) {
                    console.log('error in creating file');
                    response.status(500).send(JSON.stringify(err));
                }
                // create id field
                newPhoto.id = newPhoto._id;
                newPhoto.save();
                response.end(JSON.stringify(newPhoto));
            });
        });
    });
});

/**
 * Full Text Search
 */
app.get('/textSearch/:query', function(request, response) {
    var query = request.params.query;
    db.collections.photos.createIndex({'comments.comment': 'text'});
    db.collections.photos.find({$text:{$search:query}}, function(err, cursor){ // returned DBCursor
        cursor.toArray(function(err, items) { // returned an array incorporating the founded objects
            if (err) {
                response.status(400).send('search error.');
            }
            response.json(items);
            response.end(JSON.stringify(items));
            var index = db.collections.photos.getIndexes();
            db.collections.photos.dropIndex("index");
        });
    });
});

/**
 * Update User model when a new photo is liked
 */
app.post('/likedPhoto/', function(request, response) {
    var photo = request.body['photo'];
    var user = request.session.user;
    User.findOne({_id: user.id}, function (err, info) {
        if (err) {
            console.log('No /user/id exists', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (info === undefined) {
            response.status(500).send('Missing UserListInfo');
            return;
        }

        for (var i = 0; i < info.favorite_photos.length; ++i) {
            if (photo.id === info.favorite_photos[i].id) {
                response.status(500).send('Already liked this photo! Error.');
                return;
            }
        }

        info.favorite_photos.push(photo);
        info.save();
        response.end(JSON.stringify(photo));
    });
});

app.post('/deletePhoto/', function(request, response) {
    var photo = request.body['photo'];
    var user = request.session.user;
    User.findOne({_id: user.id}, function (err, info) {
        if (err) {
            console.log('No /user/id exists', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (info === undefined) {
            response.status(500).send('Missing UserListInfo');
            return;
        }

        for (var i = 0; i < info.favorite_photos.length; ++i) {
            if (photo.id === info.favorite_photos[i].id) {
                info.favorite_photos.splice(i, 1);
                info.save();
                response.end(JSON.stringify(photo));
                return;
            }
        }
        response.status(500).send('Cannot find photo error');
    });
});

app.get('/favorites/', function(request, response) {
    User.findOne({_id: request.session.user.id}, function (err, user) {
        if (err) {
            console.error("cannot find user!");
            response.status(500).send("user spotting error!");
            return;
        }
        response.end(JSON.stringify(user.favorite_photos));
    });
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});



