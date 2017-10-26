import React from 'react';
import { Link } from 'react-router';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';


class NotificationList extends React.Component {
    render() {
      return (
        <div className="main-wrap">
          <Header/>
          <Leftmenu/>
          <section id="container" className="container-wrap">
            <ol className="breadcrumb breadcrumb-simple">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li className="active">Notification List</li>
            </ol>
            <section className="container-fluid">
              <div id="toolbar">
                <h3 className="pull-left">Notification</h3>
              </div>
              <section className="card">
                <div className="card-block">
                  <div className="at-panel-list">
                    <div className="at-panel">
                      <div className="at-panel-body">
                        <div className="notification-title">Hey John you missed to take the Morning dose on 10/06/2017.</div>
                        <div className="ending-on">
                          <span>27 February, 2017</span>
                        </div>
                      </div>
                    </div>
                    <div className="at-panel">
                      <div className="at-panel-body">
                        <div className="notification-title">Hey John you missed to take the Afternoon dose on 10/06/2017.</div>
                        <div className="ending-on">
                          <span>27 February, 2017</span>
                        </div>
                      </div>
                    </div>
                    <div className="at-panel">
                      <div className="at-panel-body">
                        <div className="notification-title">Hey John you missed to take the Night dose on 10/06/2017.</div>
                        <div className="ending-on">
                          <span>27 February, 2017</span>
                        </div>
                      </div>
                    </div>
                    <div className="at-panel">
                      <div className="at-panel-body">
                        <div className="notification-title">Hey John you missed to take the Afternoon dose on 11/06/2017.</div>
                        <div className="ending-on">
                          <span>27 February, 2017</span>
                        </div>
                      </div>
                    </div>
                    <div className="at-panel">
                      <div className="at-panel-body">
                        <div className="notification-title">Hey John you missed to take the Night dose on 101/06/2017.</div>
                        <div className="ending-on">
                          <span>27 February, 2017</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>                 
            </section>
          </section>
          <Footer/>
        </div>
      );
    }
}

export default NotificationList;
