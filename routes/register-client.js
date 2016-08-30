module.exports = function (serverUrl, appId, masterKey) {
    var express = require('express');

    var router = express.Router();

    router.post('/', function (req, res) {
        var Parse = require('parse/node');
        Parse.initialize(appId, null, masterKey);
        Parse.Cloud.useMasterKey();
        Parse.serverURL = serverUrl;
        var SegguClient = Parse.Object.extend('SegguClient');

        new Parse.Query(SegguClient)
            .get(req.body.segguClient.objectId, {
                success: function (client) {
                    new Parse.Query(Parse.Role)
                        .equalsTo('name', client.name + 'Clients')
                        .find({
                            success: function (roles) {
                                if (roles.length > 0) {
                                    var user = new Parse.User();
                                    user.set('username', req.body.username);
                                    user.set('password', req.body.password);
                                    user.set('email', req.body.email);
                                    user.set('segguClient', client);
                                    user.save({
                                        success: function (user) {
                                            roles[0].getUsers().add(user).save({
                                                success: res.send,
                                                error: throwError
                                            });
                                        },
                                        error: throwError
                                    });
                                } else {
                                    throwError();
                                }
                            }
                        })
                },
                error: throwError
            });

        function throwError() {
            res.status(500).send('El usuario no se pudo crear.');
        }

        function throwNewError(message) {
            res.status(500).send(message);
        }
    });
    return router;
};
