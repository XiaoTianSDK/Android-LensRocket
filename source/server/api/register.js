var jwthelper = require('../shared/jwthelper.js');
var aud = "Custom";
var masterKey = "<YOUR-MOBILE-SERVICE-MASTER-KEY>";
var currentRequest;



exports.post = function(request, response) {
    currentRequest = request;    
    var accounts = currentRequest.service.tables.getTable('AccountData');	
    var item = {
                 password : currentRequest.body.members.password,
                 email : currentRequest.body.members.email,
                 dob : currentRequest.body.members.dob,
                 username : '',
                 privacyReceive: 'Just Friends',
                 privacyShare: 'Just Friends'
                };    
    if (item.password.length < 7) {
        response.send(200, { Status : 'FAIL', Error: 'Invalid password (at least 7 chars required)'});
        return;
    }
	accounts.where({ email : item.email}).read({
		success: function(results) {
			if (results.length > 0) {
                response.send(200, { Status : 'FAIL', Error: 'This email already exists'});
				return;
			}
			else {
                console.log("Creating account data");
				item.salt = jwthelper.createSalt();
				jwthelper.hash(item.password, item.salt, function(err, h) {
					item.password = h;                        
                    item.status = 'NewAccount';
                    item.createDate = new Date();
                    item.updateDate = new Date();

                    accounts.insert(item, {
						success: function () {
                            var userId = aud + ":" + item.id;
                                                        
                            //update our record with the user id                            
                            item.userId = userId;
                            accounts.update(item);
                            
							// We don't want the salt or the password going back to the client
							delete item.password;
							delete item.salt;
                            delete item.status;                              

                            item.token = jwthelper.zumoJwt(aud, userId, masterKey);
                            item.Status = 'User registered';
                            response.send(201, item);
						}
					});
				});
			}
		}
	});
};