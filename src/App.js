import React, { PureComponent } from "react";
import RegisterPopup from './RegisterPopup';
import NotificationsHandler from './notification/NotificationsHandler';
import RegisterAPI from './api/RegisterAPI';


/* 
 * Class to initialize widget and all other components.
 */
class App extends PureComponent {
  constructor(props) {
    super(props);
    this.api = new RegisterAPI();
    this.notificationsHandler = new NotificationsHandler(this.api);
  }


  render() {
    return (
      <div>
        <RegisterPopup api={this.api} notificationsHandler={this.notificationsHandler} />
      </div>
    );
  }
}
export default App;
