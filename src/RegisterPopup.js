import React, { Component } from 'react';
import Modal from 'react-awesome-modal';
import "./RegisterPopup.css";
import "github-fork-ribbon-css/gh-fork-ribbon.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const STEPS = {
    AUTHENTICATE: 'AUTHENTICATE',
    VALIDATE_PIN: 'VALIDATE_PIN',
    ALLOW_CONFIRMATION: 'ALLOW_CONFIRMATION',
    BLOCK_CONFIRMATION: 'BLOCK_CONFIRMATION',
    COMPLETION: 'COMPLETION',
    ALREADY_SUBSCRIBED: 'ALREADY_SUBSCRIBED'
}


/* 
 * Class to that shows the notification badge on top right, notifications and notification registration popup.
 */
export default class RegisterPopup extends Component {
    constructor(props) {
        super(props);
        this.api = props.api;
        this.notificationsHandler = props.notificationsHandler;
        this.state = this.getEmptyState();
        this.handleUserIdChange = this.handleUserIdChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handleAuthenticate = this.handleAuthenticate.bind(this);
        this.handleSecretCodeChange = this.handleSecretCodeChange.bind(this);
        this.handleCodeVerification = this.handleCodeVerification.bind(this);
        this.handleTokenSentToServer = this.handleTokenSentToServer.bind(this);
        this.handleIncomingNotification = this.handleIncomingNotification.bind(this);
        this.notificationsHandler.addIncomingNotificationListener(this.handleIncomingNotification);
        this.notificationsHandler.addTokenStatusListener(this.handleTokenSentToServer);
    }

    /* 
     * notificationsHandler is initialized after mount so that the registered listeners will be executed.
     */
    componentDidMount() {
        this.notificationsHandler.init();
    }

    /* 
     * Initial state.
     */
    getEmptyState() {
        return {
            visible : false,
            userId: '',
            email: '',
            secretCode: '',
            currentStep: STEPS.AUTHENTICATE,
            message: '',
            limitExceed: false,
            permissionGranted: false
        };
    }

    /* 
     * to set popup visible.
     */
    openModal() {
        this.setState({
            visible : true
        });
    }

    /* 
     * to set popup hidden.
     */
    hideModal() {
        this.setState({
            visible : false
        });
    }

    /* 
     * to reset widget state. it also close the popup
     */
    closeModal() {
        this.setState(this.getEmptyState());
    }

    /* 
     * to close the popup and mark flow as complete.
     */
    closeModalAndCompleteFlow() {
        this.setState({visible : false, currentStep: STEPS.ALREADY_SUBSCRIBED});
    }


    /* 
     * listener for userId change
     */
    handleUserIdChange(event) {
        event.preventDefault();
        this.setState({userId: event.target.value});
    }

    /* 
     * listener for email change
     */
    handleEmailChange(event) {
        event.preventDefault();
        this.setState({email: event.target.value});
    }

    /* 
     * it calls the authenticate API. If successful then change state to show validate pin form
     */
    handleAuthenticate(event) {
        event.preventDefault();
        this.api.authenticate(this.state.userId, this.state.email).then((response) => {
            if(response.success) {
                this.setState({currentStep: STEPS.VALIDATE_PIN, message: ''});
            } else {
                this.setState({message: response.message});
            }
        }).catch((error) => {
            console.log("error", error);
            this.setState({message: error.message});
        });
    }

    /* 
     * listener for secretCode change
     */
    handleSecretCodeChange(event) {
        event.preventDefault();
        this.setState({secretCode: event.target.value});
    }

    /* 
     * it calls the validate secret code API. If successful then change state to sallow confirmation form
     */
    handleCodeVerification(event) {
        event.preventDefault();
        this.api.validateSecretCode(this.state.userId, this.state.email, this.state.secretCode).then((response) => {
            if(response.success) {
                this.setState({currentStep: STEPS.ALLOW_CONFIRMATION});
                this.notificationsHandler.updateUserData(this.state.userId, this.state.email, this.state.secretCode);
                this.notificationsHandler.requestPermission().then((response) => {
                    this.setState({permissionGranted: true, message: ''});
                }).catch((error) => {
                    console.log("error", error);
                    this.setState({permissionGranted: false, currentStep: STEPS.BLOCK_CONFIRMATION, message: ''});
                });
            } else {
                this.setState({message: response.message, secretCode: '', limitExceed: response.limitExceed});
            }
        }).catch((error) => {
            console.log("error", error);
            this.setState({message: error.message});
        });
    }

    /* 
     * it handles the response from server for update token.
     */
    handleTokenSentToServer(response, error) {
        if(response && response.success && response.alreadySent) {
            this.setState({currentStep: STEPS.ALREADY_SUBSCRIBED});
        } else if(response && response.success && !response.alreadySent) {
            this.setState({currentStep: STEPS.COMPLETION});
        } else {
            this.setState({currentStep: STEPS.BLOCK_CONFIRMATION});
        }
    }

    /* 
     * First form to show user name and email inout fields 
     */
    authenticationForm() {
        return (
             <div>
                <div class="container1">
                    <h3>Enter slack user or email id to continue</h3>
                </div>
                <form onSubmit={this.handleAuthenticate} class="container2" >
                    <label htmlFor="userId">Username:</label> 
                    <input type="text" name="userId" id="userId" placeholder="User name" value={this.state.userId} onChange={this.handleUserIdChange}/>
                    <label htmlFor="email">Email:</label> 
                    <input type="text" name="email" id="email"  placeholder="Email" value={this.state.email} onChange={this.handleEmailChange}/>
                    <button type="submit" class="submit-button" name="submit">Continue</button>
                </form>
                <h3 class="error-message">{this.state.message}</h3>
                <div class="container3">
                    <button type="button" class="submit-button cancelbtn"  onClick={() => this.closeModal()}>Cancel</button>
                </div>
            </div>
        );
    }

    /* 
     * Second form to show secret code inout fields 
     */
    secretPinVerificationForm() {
        return (
             <div>
                <div class="container1">
                    <h3>Plese enter 4 digit code sent to your slack user</h3>
                </div>
                <form id="codeVerification"  onSubmit={this.handleCodeVerification} class="container2" >
                    <label htmlFor="code">Code:</label> 
                    <input disabled={this.state.limitExceed} type="password" size="4" name="code" id="code" placeholder="Code" value={this.state.secretCode} onChange={this.handleSecretCodeChange}/>
                    <button disabled={this.state.limitExceed} type="submit" class="submit-button" name="submit">Continue</button>
                </form>
                <h3 class="error-message">{this.state.message}</h3>
                <div class="container3">
                    <button type="button" class="submit-button cancelbtn"  onClick={() => this.closeModal()}>{this.state.limitExceed ? "Close" : "Cancel"}</button>
                </div>
            </div>
        );
    }

    /* 
     * Third form to ask user to allow notification permission
     */
    allowConfirmationForm() {
        return (
            <div>
                <div class="container1">
                    <h3>Please select allow for "Show notifications".</h3>
                </div>
                <form id="codeVerification" class="container2" >
                    <button type="button"   class="submit-button"  onClick={() => this.hideModal()}>Close</button>
                </form>
            </div>
        );
    }

    /* 
     * Fourth form to ask notification permission denied message.
     */
    blockConfirmationForm() {
        return (
            <div>
                <div class="container1">
                    <h3>Access for notifications denied.</h3>
                </div>
                <form id="codeVerification" class="container2" >
                    <button type="button"   class="submit-button"  onClick={() => this.hideModal()}>Close</button>
                </form>
            </div>
        );
    }


    /* 
     * Fifth form to show completion message.
     */
    completionForm() {
        return (
            <div>
                <div class="container1">
                    <h3>Registration successful.</h3>
                </div>
                <form id="codeVerification" class="container2" >
                    <button type="button"   class="submit-button"  onClick={() => this.closeModalAndCompleteFlow()}>Done</button>
                </form>
            </div>
        );
    }

    /* 
     * Fifth form to show completion message.
     */
    alreadySubscribedForm() {
        return (
            <div>
                <div class="container1">
                    <h3>You are already subscribed to slack mention events.</h3>
                </div>
                <form id="codeVerification" class="container2" >
                    <button type="button"   class="submit-button"  onClick={() => this.hideModal()}>Done</button>
                </form>
            </div>
        );
    }

    /* 
     * Handler for showing notification when current window is active
     */
    handleIncomingNotification(message) {
        return toast(message.notification.body);
    }


    /* 
     * Render the form based on value of currentStep.
     */
    render() {
        let currentForm;
        switch(this.state.currentStep) {
            case STEPS.VALIDATE_PIN:
                currentForm = this.secretPinVerificationForm();
            break;

            case STEPS.ALLOW_CONFIRMATION:
                currentForm = this.allowConfirmationForm();
            break;

            case STEPS.BLOCK_CONFIRMATION:
                currentForm = this.blockConfirmationForm();
            break;

            case STEPS.COMPLETION:
                currentForm = this.completionForm();
            break;

            case STEPS.ALREADY_SUBSCRIBED:
                currentForm = this.alreadySubscribedForm();
            break;

            case STEPS.AUTHENTICATE:
            default:
                currentForm = this.authenticationForm();

        }
        return (
            <section>
                <a onClick={() => this.openModal()} class="github-fork-ribbon mainbtn" title="Register for Notifications">Register for Notifications</a>
                <ToastContainer autoClose={8000}/>
                <Modal visible={this.state.visible} width="400" height="350" effect="fadeInUp" onClickAway={() => this.hideModal()}>
                    <div>
                        {currentForm}
                    </div>
                </Modal>
            </section>
        );
    }
}