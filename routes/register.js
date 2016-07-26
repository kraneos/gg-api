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
            .equalTo('name', req.body.company)
            .find({
                success: function (clients) {
                    if (clients.length > 0) {
                        throwNewError('Ya se hizo un usuario para esa empresa.');
                    } else {
                        createSegguClient(req, SegguClient);
                    }
                },
                error: throwError
            });

        function createSegguClient(req, SegguClient) {
            var segguClient = new SegguClient();
            segguClient.set('name', req.body.company);

            segguClient.save().then(function (savedClient) {
                var clientRole = getNewRole(req.body.company);
                var clientClientsRole = getNewRole(req.body.company + 'Clients');
                var roles = [clientRole, clientClientsRole];
                Parse.Object.saveAll(roles).then(function (savedRoles) {
                    var parseUser = new Parse.User();
                    parseUser.set('username', req.body.username);
                    parseUser.set('password', req.body.password);
                    parseUser.set('email', req.body.email);
                    parseUser.set('phone', req.body.phone);
                    parseUser.set('segguClient', savedClient);

                    parseUser.signUp().then(function (createdUser) {
                        var savedRole = savedRoles[0];
                        savedRole.getUsers().add(createdUser);
                        savedRole.save().then(function () {
                            console.log("Agregue los roles");
                            res.send("user created");
                        }, throwError);
                    }, throwError);
                });

                function getNewRole(roleName, segguClient) {
                    var roleACL = new Parse.ACL();
                    roleACL.setPublicReadAccess(true);
                    var role = new Parse.Role(roleName, roleACL);
                    return role;
                }
            }, throwError);
        }

        function throwError() {
            res.status(500).send('El usuario no se pudo crear.');
        }

        function throwNewError(message) {
            res.status(500).send(message);
        }
    });
    return router;
};
