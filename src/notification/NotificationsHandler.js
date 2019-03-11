import firebase from "firebase";

/* 
 * Class to call messaging API of firebase.
 */
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

    /* 
     * Initialize the firebase app and add listener onTokenRefresh and onMessage.
     */
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
                this.getToken();
                // [END_EXCLUDE]
            }).catch(function(err) {
                console.log('Unable to retrieve refreshed token ', err);
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
            this.notifyIncomingNotificationListeners(payload);
        });
        // [END receive_message]
        this.getToken();
    }

    /* 
     * It accept the callback function that will be executed whenever new token is retrieved or retrieve fails.
     */
    addTokenStatusListener(listener) {
        this.tokenStatusListeners.push(listener);
    }

    /* 
     * It execute the all callback functions whenever new token is retrieved or retrieve fails.
     */
    notifyTokenStatusListeners(result, error) {
        this.tokenStatusListeners.forEach((listener) => {
            listener(result, error);
        });
    }

    /* 
     * It accept the callback function that will be executed whenever new message is received when the browser window is in focus.
     */
    addIncomingNotificationListener(listener) {
        this.incomingNotificationListener.push(listener);
    }

    /* 
     * It executes all callback functions whenever new message is received when the browser window is in focus.
     */
    notifyIncomingNotificationListeners(notification) {
        this.incomingNotificationListener.forEach((listener) => {
            listener(notification);
        });
    }

    /* 
     * It fetch the new token from browser after permission for notification is granted.
     */
    getToken() {
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
            this.setTokenSentToServer(false);
            this.notifyTokenStatusListeners({success: false, alreadySent: false}, new Error("Permission denied"));
        });
        // [END get_token]
    }
    /* 
     * It accept the user data that will be used for sending token to bot webhook.
     */
    updateUserData(userId, email, secretCode) {
       this.userId = userId;
       this.email = email;
       this.secretCode = secretCode;
    }

    // Send the Instance ID token your application server, so that it can:
    // - send messages back to this app
    // - subscribe/unsubscribe the token from topics
    sendTokenToServer(currentToken) {
        if (!this.isTokenSentToServer()) {
            console.log('Sending token to server...');
            // TODO(developer): Send the current token to your server.
            this.api.sendTokenToServer(this.userId, this.email, this.secretCode, currentToken).then((response) => {
                this.setTokenSentToServer(true);
                this.notifyTokenStatusListeners({success: true, alreadySent: false}, null);
            }).catch((error) => {
                this.notifyTokenStatusListeners({success: false, alreadySent: false}, error);
            });
        } else {
            console.log('Token already sent to server so won\'t send it again ' +
                'unless it changes');
            this.notifyTokenStatusListeners({success: true, alreadySent: true}, null);
        }
    }

    /* 
     * It check the flag sentToServer stored in localstore of browser.
     */
    isTokenSentToServer() {
        return window.localStorage.getItem('sentToServer') === '1';
    }

    /* 
     * It store the flag sentToServer in localstore of browser.
     */
    setTokenSentToServer(sent) {
        window.localStorage.setItem('sentToServer', sent ? '1' : '0');
    }

    /* 
     * It request the user for notification permission. One execution browser shows popup with option to allow or block notifications.
     */
    requestPermission() {
        console.log('Requesting permission...');
        // [START request_permission]
        return this.messaging.requestPermission().then(() => {
            console.log('Notification permission granted.');
            // TODO(developer): Retrieve an Instance ID token for use with FCM.
            // [START_EXCLUDE]
            // In many cases once an app has been granted notification permission, it
            // should update its UI reflecting this.
            this.getToken();
            // [END_EXCLUDE]
        }).catch(function(err) {
            console.log('Unable to get permission to notify.', err);
            this.notifyTokenStatusListeners({success: false, alreadySent: false}, new Error("Permission denied"));
        });
        // [END request_permission]
    }
}