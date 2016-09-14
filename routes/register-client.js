module.exports = function (serverUrl, appId, masterKey) {
    var express = require('express');

    var router = express.Router();

    router.post('/', onRegisterClient);

    return router;

    function onRegisterClient(req, res) {
        var Parse = require('parse/node');
        Parse.initialize(appId, null, masterKey);
        Parse.Cloud.useMasterKey();
        Parse.serverURL = serverUrl;
        var SegguClient = Parse.Object.extend('SegguClient');
        var Client = Parse.Object.extend('Client');
        new Parse.Query(SegguClient)
            .get(req.body.segguClient.objectId, {
                success: onGetSegguClientSuccess,
                error: throwError
            });

        function onGetSegguClientSuccess(segguClient) {
            new Parse.Query(Client)
                .equalTo('mail', req.body.email)
                .find({
                    success: onGetClientSuccess,
                    error: throwError
                });

            function onGetClientSuccess(client) {
                if (client.length > 0) {
                    new Parse.Query(Parse.Role)
                        .equalTo('name', segguClient.get('name') + 'Clients')
                        .find({
                            success: onGetRolesSuccess,
                            error: throwError
                        });
                } else {
                    throwNewError('No existe un asegurado con su email registrado en ' + segguClient.get('name'));
                }

                function onGetRolesSuccess(roles) {
                    if (roles.length > 0) {
                        var user = new Parse.User();
                        user.set('username', req.body.username);
                        user.set('password', req.body.password);
                        user.set('email', req.body.email);
                        user.set('segguClient', segguClient);
                        user.set('client', getClientBySegguClient(client, segguClient));
                        user.save({
                            success: onSaveUserSuccess,
                            error: throwError
                        });
                    } else {
                        throwError();
                    }

                    function onSaveUserSuccess(user) {
                        roles[0].getUsers().add(user).save({
                            success: onAddRoleSuccess,
                            error: throwError
                        });

                        function onAddRoleSuccess() {
                            res.send(JSON.stringify(user));
                        }
                    }

                    function getClientBySegguClient(clients, segguClient) {
                        var segguClientName = segguClient.get('name');
                        for (var i = 0; i < client.length; i++) {
                            var acl = client[i].getACL();
                            if (acl.getRoleReadAccess(segguClientName) || acl.getRoleReadAccess(segguClientName + 'Clients')) {
                                return client[i];
                            }
                        }

                        return null;
                    }
                }
            }
        }

        function throwError() {
            res.status(500).send('El usuario no se pudo crear.');
        }

        function throwNewError(message) {
            res.status(500).send(message);
        }


    }
};
