//import './assets/css/App.css';

import React, { Component } from 'react';
import { render } from 'react-dom';

import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';

// Animations
//import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

// Components
import MenuBar from './components/MenuBar';

// Screens
import About from "./screens/About";
import LegacyXP from "./screens/LegacyXP";
import Settings from "./screens/Settings";


import StatusItem from './components/StatusItem';

// Constants
const { Constants } = require('./js/Constants');

// Helpers
import update from 'immutability-helper';

// Theming
import createMuiTheme from 'material-ui/styles/theme';
import createPalette from 'material-ui/styles/palette';
import * as Colors from 'material-ui/colors';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
const theme = createMuiTheme({
  palette: createPalette({
    primary: Colors.blue,
    accent: Colors.amber,
    type: 'dark'
  })
});




class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      ProgressHolder: {
        Visible: false,
        Status: "",
        [Constants.Progress.Total]: {
          Value: 0,
          Mode: Constants.Progress.Modes.Determinate
        },
        [Constants.Progress.Current]: {
          Value: 0,
          Mode: Constants.Progress.Modes.Determinate
        }
      }
    }
  }


  // Progress state
  Progress = {
    setProgress: function (type, progress, cb) {
      this.setState(update(this.state, {
        ProgressHolder: {
          $merge: {
            [type]: {
              Value: progress,
              Mode: Constants.Progress.Modes.Determinate
            }
          }
        }
      }), cb);
    }.bind(this),

    setMode: function (type, mode, cb) {
      this.setState(update(this.state, {
        ProgressHolder: {
          $merge: {
            [type]: { Mode: mode }
          }
        }
      }), cb);
    }.bind(this),

    setStatus: function (status, cb) {
      console.log("New status:", status);
      this.setState(update(this.state, {
        ProgressHolder: {
          $merge: {
            Status: status
          }
        }
      }), cb);
    }.bind(this),

    setStatusSuffix: function (status, cb) {
      console.log("New status suffix:", status);
      this.setState(update(this.state, {
        ProgressHolder: {
          $merge: {
            StatusSuffix: status
          }
        }
      }), cb);
    }.bind(this),

    setVisibility: function (visible, cb) {
      console.log("Hiding");
      this.setState(update(this.state, {
        ProgressHolder: {
          $merge: {
            Visible: visible
          }
        }
      }), cb);
    }.bind(this),
    
    reset: function (cb) {
      this.setState(update(this.state, {
        ProgressHolder: {
          $merge: {
            [Constants.Progress.Total]: {
              Value: 0,
              Mode: Constants.Progress.Modes.Determinate
            },
            [Constants.Progress.Current]: {
              Value: 0,
              Mode: Constants.Progress.Modes.Determinate
            }
          }
        }
      }), cb);
    }.bind(this),

    // TODO: Remove this
    cancel: function (cb) {
      this.Progress.setVisibility(false, cb);
    }.bind(this),
    
    fail: function (cb) {
      this.Progress.setStatus("Failed to update to latest version. You might want to consider reinstalling it.", cb);
    }.bind(this),

    isCancelled: function (cb) {
      if (cb != null) { cb(null, !this.state.ProgressHolder.Visible); }
      return !this.state.ProgressHolder.Visible;
    }.bind(this)
  }

  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <Router>
          <div>
            <div className="bg-wrapper"><div className="bg-image"></div></div>
            <MenuBar></MenuBar>

            <div className="content_wrapper">
              <Switch>
                <Route exact path='/about' render={(props) => (
                  <About />
                )} />

                <Route exact path='/legacyxp' render={(props) => (
                  <LegacyXP ProgressHolder={this.state.ProgressHolder} Progress={this.Progress} />
                )} />

                <Route exact path='/settings' render={(props) => (
                  <Settings />
                )} />

                {/* Default screen */}
                <Route render={(props) => (
                  <LegacyXP ProgressHolder={this.state.ProgressHolder} Progress={this.Progress} />
                )} />
              </Switch>
            </div>

            {
              /*
              <CSSTransitionGroup transitionName="example" transitionEnterTimeout={700} transitionLeaveTimeout={700}>
                <div style={{ color: "white" }}>
                  "Some test string"
                  </div>
              </CSSTransitionGroup>
              */
            }


            <StatusItem ProgressHolder={this.state.ProgressHolder} Progress={this.Progress} />
          </div>
        </Router>
      </MuiThemeProvider>
    );
  }
}

export default App;