import firebase from "firebase";


export default class NotificationsHandler {
    constructor(api) {
        this.config = {
            apiKey: "AIzaSyABdJadhMc50fIn1E64unc9CutJ9Ca0PpY",
            authDomain: "slackbotpushn.firebaseapp.com",
            databaseURL: "https://slackbotpushn.firebaseio.com",
            projectId: "slackbotpushn",
            storageBucket: "slackbotpushn.appspot.com",
            messagingSenderId: "1072432918695"
        };

        this.tokenStatusListeners = [];
        this.incomingNotificationListener = [];
        this.api = api;
    }

    init() {
        firebase.initializeApp(this.config);
        this.messaging = firebase.messaging();
        // [END get_messaging_object]
        // [START set_public_vapid_key]
        // Add the public key generated from the console here.
        this.messaging.usePublicVapidKey('BLsWHvyhf0uTWHVkdAWryKf9fRvAGyyL_3vZFMNGXIRQ_wVwv0ciDkxNTBNkD4BqCPgI0FV9jNJ4IcZ2EhJR1Y8');
        // [END set_public_vapid_key]

        // [START refresh_token]
        // Callback fired if Instance ID token is updated.
        this.messaging.onTokenRefresh(() => {
            this.messaging.getToken().then((refreshedToken) => {
                console.log('Token refreshed.');
                // Indicate that the new Instance ID token has not yet been sent to the
                // app server.
                this.setTokenSentToServer(false);
                // Send Instance ID token to app server.
                this.sendTokenToServer(refreshedToken);
                // [START_EXCLUDE]
                // Display new Instance ID token and clear UI of all previous messages.
                this.resetUI();
                // [END_EXCLUDE]
            }).catch(function(err) {
                console.log('Unable to retrieve refreshed token ', err);
                this.showToken('Unable to retrieve refreshed token ', err);
                this.notifyTokenStatusListeners({success: false, alreadySent: false}, new Error("Permission denied"));
            });
        });
        // [END refresh_token]

        // [START receive_message]
        // Handle incoming messages. Called when:
        // - a message is received while the app has focus
        // - the user clicks on an app notification created by a service worker
        //   `messaging.setBackgroundMessageHandler` handler.
        this.messaging.onMessage((payload) => {
            console.log('Message received. ', payload);
            this.notifyIncomingNotificationListeners(payload);
        });
        // [END receive_message]
        this.resetUI();
    }

    addTokenStatusListener(listener) {
        this.tokenStatusListeners.push(listener);
    }


    notifyTokenStatusListeners(result, error) {
        this.tokenStatusListeners.forEach((listener) => {
            listener(result, error);
        });
    }

    addIncomingNotificationListener(listener) {
        this.incomingNotificationListener.push(listener);
    }


    notifyIncomingNotificationListeners(notification) {
        this.incomingNotificationListener.forEach((listener) => {
            listener(notification);
        });
    }

    resetUI() {
        this.showToken('loading...');
        // [START get_token]
        // Get Instance ID token. Initially this makes a network call, once retrieved
        // subsequent calls to getToken will return from cache.
        this.messaging.getToken().then((currentToken) => {
            if (currentToken) {
                this.sendTokenToServer(currentToken);
                //updateUIForPushEnabled(currentToken);
            } else {
                // Show permission request.
                console.log('No Instance ID token available. Request permission to generate one.');
                // Show permission UI.
                //updateUIForPushPermissionRequired();
                this.setTokenSentToServer(false);
            }
        }).catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
            this.showToken('Error retrieving Instance ID token. ', err);
            this.setTokenSentToServer(false);
            this.notifyTokenStatusListeners({success: false, alreadySent: false}, new Error("Permission denied"));
        });
        // [END get_token]
    }

    updateUserData(userId, email, secretCode) {
       this.userId = userId;
       this.email = email;
       this.secretCode = secretCode;
    }

    showToken(currentToken) {
        // Show token in console and UI.
        /*var tokenElement = document.querySelector('#token');
        tokenElement.textContent = currentToken;*/
        console.log(currentToken);
    }


    // Send the Instance ID token your application server, so that it can:
    // - send messages back to this app
    // - subscribe/unsubscribe the token from topics
    sendTokenToServer(currentToken) {
        if (!this.isTokenSentToServer()) {
            console.log('Sending token to server...');
            // TODO(developer): Send the current token to your server.
            this.api.sendTokenToServer(this.userId, this.email, this.secretCode, currentToken).then((response) => {
                console.log("response--")
                console.log(response)
                this.setTokenSentToServer(true);
                this.notifyTokenStatusListeners({success: true, alreadySent: false}, null);
            }).catch((error) => {
                console.log("error--")
                console.log(error)
                this.notifyTokenStatusListeners({success: false, alreadySent: false}, error);
            });
        } else {
            console.log('Token already sent to server so won\'t send it again ' +
                'unless it changes');
            this.notifyTokenStatusListeners({success: true, alreadySent: true}, null);
        }
    }

    isTokenSentToServer() {
        return window.localStorage.getItem('sentToServer') === '1';
    }

    setTokenSentToServer(sent) {
        window.localStorage.setItem('sentToServer', sent ? '1' : '0');
    }

    requestPermission() {
        console.log('Requesting permission...');
        // [START request_permission]
        return this.messaging.requestPermission().then(() => {
            console.log('Notification permission granted.');
            // TODO(developer): Retrieve an Instance ID token for use with FCM.
            // [START_EXCLUDE]
            // In many cases once an app has been granted notification permission, it
            // should update its UI reflecting this.
            this.resetUI();
            // [END_EXCLUDE]
        }).catch(function(err) {
            console.log('Unable to get permission to notify.', err);
            this.notifyTokenStatusListeners({success: false, alreadySent: false}, new Error("Permission denied"));
        });
        // [END request_permission]
    }

    deleteToken() {
        // Delete Instance ID token.
        // [START delete_token]
        this.messaging.getToken().then((currentToken) => {
            this.messaging.deleteToken(currentToken).then(() => {
                console.log('Token deleted.');
                this.setTokenSentToServer(false);
                // [START_EXCLUDE]
                // Once token is deleted update UI.
                this.resetUI();
                // [END_EXCLUDE]
            }).catch((err) => {
                console.log('Unable to delete token. ', err);
            });
            // [END delete_token]
        }).catch(function(err) {
            console.log('Error retrieving Instance ID token. ', err);
            this.showToken('Error retrieving Instance ID token. ', err);
        });

    }
}