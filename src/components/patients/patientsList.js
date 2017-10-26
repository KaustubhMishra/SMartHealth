import React from 'react';
import { Link } from 'react-router';
import Header from '../common/Header';
import Leftmenu from '../common/Leftmenu';
import Footer from '../common/Footer';


class PatientList extends React.Component {
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
                       <span>Home</span><a>Patient List</a>
                      </div>
                    </div>
                  </section>
                  <section className="box-trials">
                    <div className="head">
                      <h2>Patient List</h2>
                    </div>
                    <div className="pt-data-table">
                      <table id="example" className="table table-striped table-bordered" width="100%" cellspacing="0">
                        <thead>
                          <tr>
                              <th>Name</th>
                              <th>Age</th>
                              <th>Gender</th>
                              <th>Email</th>
                              <th>Placebo</th>
                              <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                              <td>Giacomo Guilizzoni</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-01" className="css-checkbox" />
                                <label htmlFor="placebo-01" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>James Blunt</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-02" className="css-checkbox" />
                                <label htmlFor="placebo-02" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>Mariah Maclachlan</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-03" className="css-checkbox" />
                                <label htmlFor="placebo-03" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>Valerie Liberty</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-04" className="css-checkbox" />
                                <label htmlFor="placebo-04" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>Emma William</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-05" className="css-checkbox" />
                                <label htmlFor="placebo-05" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>Emily Michael</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-06" className="css-checkbox" />
                                <label htmlFor="placebo-06" className="css-label">&nbsp;</label>
                              </td><td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>Aiden Logan</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-07" className="css-checkbox" />
                                <label htmlFor="placebo-08" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>Mason Daniel</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-09" className="css-checkbox" />
                                <label htmlFor="placebo-09" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                          <tr>
                              <td>Benjamin Harper</td>
                              <td>40</td>
                              <td>Male</td>
                              <td>example@123.com</td>
                              <td>
                                <input type="checkbox" name="checkboxG1" id="placebo-10" className="css-checkbox" />
                                <label htmlFor="placebo-10" className="css-label">&nbsp;</label>
                              </td>
                              <td>
                                <i className="fa fa-pencil" aria-hidden="true"></i>
                              </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </section>
                <Footer/>
              </section>
            </div>
        );
    }
}

export default PatientList;
