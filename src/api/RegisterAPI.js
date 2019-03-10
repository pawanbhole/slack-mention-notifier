import request from 'ajax-request';


export default class RegisterAPI {
    authenticate(userId, email) {
        return new Promise((resolve, reject) => {
            request({
                url: '/slackbot/authenticate',
                method: 'post',
                data: {
                    userId,
                    email
                }
            }, function(error, res, body) {
                const response = JSON.parse(body);
                console.log(body);
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }


    validateSecretCode(userId, email, secretCode) {
        return new Promise((resolve, reject) => {
            request({
                url: '/slackbot/validate-secret-code',
                method: 'post',
                data: {
                    userId,
                    email,
                    secretCode
                }
            }, function(error, res, body) {
                const response = JSON.parse(body);
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }


    sendTokenToServer(userId, email, secretCode, token) {
        return new Promise((resolve, reject) => {
            request({
                url: '/slackbot/register-token',
                method: 'post',
                data: {
                    userId,
                    email,
                    secretCode,
                    token
                }
            }, function(error, res, body) {
                const response = JSON.parse(body);
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }
}