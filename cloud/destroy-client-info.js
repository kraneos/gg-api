module.exports = destroyClientInfo;

function destroyClientInfo(Parse) {
    var allClasses = [
        'Address',
        'Asset',
        'Accessory',
        'AccessoryType',
        'Bank',
        'Bodywork',
        'Brand',
        'CashAccount',
        'Casualty',
        'CasualtyType',
        'Cheque',
        'Client',
        'Company',
        'Contact',
        'Coverage',
        'CoveragesPack',
        'CreditCard',
        'Employee',
        'Endorse',
        'Fee',
        'FeeSelection',
        'Integral',
        'LedgerAccount',
        'Liquidation',
        'Policy',
        'Producer',
        'Risk',
        'SegguClient',
        'Use',
        'Vehicle',
        // 'District',
        // 'Locality',
        // 'Province',
        // 'VehicleModel',
        // 'VehicleType',
    ];

    function onDestroyClientInfoRequest(req, res) {
        var userId = req.params.id;
        if (userId) {
            new Parse.Query(Parse.User).get(userId, {
                success: function (user) {
                    new Parse.Query(Parse.Role)
                        .containedIn('users', [user])
                        .find({
                            success: function (roles) {
                                if (roles.length > 0) {
                                    queryDestroy();
                                }

                                function queryDestroy() {
                                    allClasses.forEach(function (className) {
                                        destroyObjects(className, 0);
                                    });

                                    function destroyObjects(className, page) {
                                        var count = 100;
                                        new Parse.Query(className).limit(count).skip(page * count).find({
                                            success: function (objs) {
                                                var objsByRole = objs.filter(function (obj) {
                                                    return obj.getACL().getRoleWriteAccess(roles[0]);
                                                });

                                                if (objsByRole.length > 0) {
                                                    Parse.Object.destroyAll(objsByRole);
                                                }

                                                if (objs.length === count) {
                                                    destroyObjects(className, page + 1, count);
                                                }
                                            },
                                            error: console.log
                                        });
                                    }
                                }
                            },
                            error: console.log
                        });
                },
                error: onError
            });
        }

        function onError(error) {
            if (error) {
                res.error(error);
            } else {
                res.error('Hubo un error al realizar la accion.');
            }
        }
    }
}
