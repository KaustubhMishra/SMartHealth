import React from 'react';
import { Link } from 'react-router';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';


class TrialData extends React.Component {
    render() {
        return (
      <div>
            <Header/>
            <section id="container" className="container-wrap">
                <Leftmenu/>
                <section className="container-fluid">
                  <section className="page-title">
                    <div className="pull-left">
                      <h1>Home</h1>
                      <div className="breadcrumbs">
                       <span>Home</span><a>Trial List </a>
                      </div>
                    </div>
                    <div className="pull-right right-head">
                      <Link to="manageTrial" className="btn btn-border pull-left">Add Trial</Link>
                    </div>
                  </section>
                  <div className="db-search-wrap">
                    <div className="db-search-form">
                      <ul className="at-list">
                        <li>
                          <select className="select-drop" id="sponsor">
                            <option>Select Sponsor</option>
                            <option>Cipla</option>
                            <option>Cadila HealthCare</option>
                            <option>Biocon</option>
                          </select>
                        </li>
                        <li>
                          <select className="select-drop" id="trial">
                            <option>Select Trial</option>
                            <option>Trial 14</option>
                            <option>Trial 15</option>
                            <option>Trial 16</option>
                          </select>
                        </li>
                        <li>
                          <select className="select-drop" id="phase">
                            <option>Select Phase</option>
                            <option>Phase 1</option>
                            <option>Phase 2</option>
                            <option>Phase 3</option>
                            <option>Phase 4</option>
                          </select>
                        </li>
                        <li>
                          <select className="select-drop" id="status">
                            <option>Select Status</option>
                            <option>Active </option>
                            <option>Completed</option>
                          </select>
                        </li>
                        <li>
                        <input className="btn blue set-width" id="search" type="submit" value="Reset"/>
                          <input className="btn blue set-width" id="search" type="submit" value="Search"/>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <section className="box-trials">
                    <div className="head">
                      <h2>Active Trials</h2>
                    </div>
                    <div className="at-panel">
                      <div className="head">
                        <h2>Trial 14</h2>
                        <ul className="panel-action">
                          <li><a href="javascript:void(0)"><img src={require('../../assets/images/icon-logout.png')} alt=""/></a></li>
                          <li><a href="javascript:void(0)"><img src={require('../../assets/images/icon-edit-green.png')} alt=""/></a></li>
                          <li><a href="javascript:void(0)"><img src={require('../../assets/images/icon-view.png')}  alt=""/></a></li>
                        </ul>
                      </div>
                      <div className="at-panel-body">
                        <p>This is Photoshop's version  of Lorem Ipsum. Proin gravida nibh vel velit auctor aliquet. Aenean sollicitudin, lorem quis bibendum auctor, nisi elit consequat ipsum, nec sagittis sem nibh id elit. Duis sed odio sit amet nibh vulputate cursus a sit amet mauris. </p>
                        <div className="ending-on">
                          <label>Ending On:</label> <span>27 February, 2017</span>
                        </div>
                        <ul className="trial-status">
                          <li>Status</li>
                          <li><div className="status"><b style={{width:50 +'%'}} className="green"></b></div></li>
                          <li><span>50%</span> Completed</li>
                        </ul>
                      </div>
                    </div>
                    <div className="at-panel">
                      <div className="head"><h2>Trial 15</h2>
                        <ul className="panel-action">
                          <li><a href="javascript:void(0)"><img src={require('../../assets/images/icon-logout.png')} alt=""/></a></li>
                          <li><a href="javascript:void(0)"><img src={require('../../assets/images/icon-edit-green.png')} alt=""/></a></li>
                          <li><a href="javascript:void(0)"><img src={require('../../assets/images/icon-view.png')} alt=""/></a></li>
                        </ul>
                      </div>
                      <div className="at-panel-body">
                        <p>This is Photoshop's version  of Lorem Ipsum. Proin gravida nibh vel velit auctor aliquet. Aenean sollicitudin, lorem quis bibendum auctor, nisi elit consequat ipsum, nec sagittis sem nibh id elit. Duis sed odio sit amet nibh vulputate cursus a sit amet mauris. </p>
                        <div className="ending-on"><label>Ending On:</label> <span>28 February, 2017</span></div>
                        <ul className="trial-status">
                          <li>Status</li>
                          <li><div className="status"><b style={{width:75 +'%'}} className="green"></b></div></li>
                          <li><span>75%</span> Completed</li>
                        </ul>
                      </div>
                    </div>
                  </section>  
                  
                </section>
                <Footer/>
              </section>
            </div>
        );
    }
}

export default TrialData;
