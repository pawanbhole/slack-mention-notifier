import request from 'ajax-request';

/* 
 * Class to call registration API of bot.
 *
 */
export default class RegisterAPI {
    
    /* 
     * It calls the /slackbot/authenticate API and return the promise.
     */
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
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }

    /* 
     * It calls the /slackbot/validate-secret-code API and return the promise.
     */
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

    /* 
     * It calls the /slackbot/register-token API and return the promise.
     */
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