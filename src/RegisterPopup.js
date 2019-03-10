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

    componentDidMount() {
        this.notificationsHandler.init();
    }

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

    openModal() {
        this.setState({
            visible : true
        });
    }

    hideModal() {
        this.setState({
            visible : false
        });
    }

    closeModal() {
        this.setState(this.getEmptyState());
    }

    closeModalAndCompleteFlow() {
        this.setState({visible : false, currentStep: STEPS.ALREADY_SUBSCRIBED});
    }

    handleUserIdChange(event) {
        event.preventDefault();
        this.setState({userId: event.target.value});
    }

    handleEmailChange(event) {
        event.preventDefault();
        this.setState({email: event.target.value});
    }

    handleAuthenticate(event) {
        event.preventDefault();
        console.log(this.state.email);
        this.api.authenticate(this.state.userId, this.state.email).then((response) => {
            console.log("response--")
            console.log(response)
            if(response.success) {
                this.setState({currentStep: STEPS.VALIDATE_PIN, message: ''});
            } else {
                this.setState({message: response.message});
            }
        }).catch((error) => {
            console.log("error--")
            console.log(error)
            this.setState({message: error.message});
        });
    }

    handleSecretCodeChange(event) {
        event.preventDefault();
        this.setState({secretCode: event.target.value});
    }

    handleCodeVerification(event) {
        event.preventDefault();
        this.api.validateSecretCode(this.state.userId, this.state.email, this.state.secretCode).then((response) => {
            console.log("response--")
            console.log(response)
            if(response.success) {
                this.setState({currentStep: STEPS.ALLOW_CONFIRMATION});
                this.notificationsHandler.updateUserData(this.state.userId, this.state.email, this.state.secretCode);
                this.notificationsHandler.requestPermission().then((response) => {
                    console.log("response--")
                    console.log(response)
                    this.setState({permissionGranted: true, message: ''});
                }).catch((error) => {
                    console.log("error--")
                    console.log(error)
                    this.setState({permissionGranted: false, currentStep: STEPS.BLOCK_CONFIRMATION, message: ''});
                });
            } else {
                this.setState({message: response.message, secretCode: '', limitExceed: response.limitExceed});
            }
        }).catch((error) => {
            console.log("error--")
            console.log(error)
            this.setState({message: error.message});
        });
    }

    handleTokenSentToServer(response, error) {
        console.log("handleTokenSentToServer response")
        console.log(response)
        if(response && response.success && response.alreadySent) {
            this.setState({currentStep: STEPS.ALREADY_SUBSCRIBED});
        } else if(response && response.success && !response.alreadySent) {
            this.setState({currentStep: STEPS.COMPLETION});
        } else {
            this.setState({currentStep: STEPS.BLOCK_CONFIRMATION});
        }
    }


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

    handleIncomingNotification(message) {
        return toast(message.notification.body);
    }

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