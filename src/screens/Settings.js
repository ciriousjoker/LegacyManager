import React, { Component } from 'react';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Input from 'material-ui/Input/Input';
import Paper from 'material-ui/Paper';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';

const { dialog } = require('electron').remote;
const settings = require('electron-settings');

// Import functionality
//import { update } from '../functionality/update';

// Constants
const { Constants } = require('./js/Constants');


class LegacyXP extends Component {
  constructor(props) {
    super(props);

    this.state = {
      IsoLocation: settings.get(Constants.Settings.BrawlIsoLocation, "")
    };
  }

  selectBrawlIso = function () {
    var result = dialog.showOpenDialog({ properties: ['openFile'] })[0];
    console.log("Current path:", this.state.IsoLocation);
    console.log("Path:", result);
    this.setState({
      IsoLocation: result,
    });
    settings.set(Constants.Settings.BrawlIsoLocation, result);
  }

  render() {
    return (
      <div>
        <Typography type="display1" gutterBottom>
          Settings
        </Typography>

        <Typography type="subheading" >
          Choose your brawl .iso
        </Typography>
        <Grid container gutter={24}>
          <Grid item xs>
            <TextField value={this.state.IsoLocation.toString()} placeholder="Path/to/an/empty/folder" fullWidth />
          </Grid>
          <Grid item>
            <Button onClick={this.selectBrawlIso.bind(this)}>
              Select .iso
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default LegacyXP;