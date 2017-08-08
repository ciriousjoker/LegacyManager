import React, { Component } from 'react';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Input from 'material-ui/Input/Input';
import Paper from 'material-ui/Paper';
import classnames from 'classnames';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import { withStyles, createStyleSheet } from 'material-ui/styles';

const { dialog } = require('electron').remote;
const settings = require('electron-settings');

// Import functionality
import { updateGame } from '../functionality/updateGame';
import { removeGame } from '../functionality/removeGame';

// Constants
const { Constants } = require('./js/Constants');

var { GameManager, GameInfo } = require('./js/GameManager');

var Id = Constants.Game.GAME_SHORT.XP;


const styleSheet = createStyleSheet(theme => ({
  bottom_buttons_wrapper: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    maxHeight: "80px",
    overflow: "hidden",
    
    /* Make the div click through */
    pointerEvents: "none"
  },
  bottom_buttons: {
    /* Position the buttons in the bottom right corner and fix a bunch of overflow glitches */
    marginBottom: "0px",
    marginRight: "0px",
    width: "auto",

    /* Make it clickable */
    pointerEvents: "auto",

    /* Slide out while StatusTray is shown */
    transform: 'translateY(0px)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.enteringScreen,
    })
  },
  flyout: {
    transform: 'translateY(80px)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.leavingScreen,
    })
  }
}));


class LegacyXP extends Component {
  constructor(props) {
    super(props);

    this.state = {
      InstallationFolder: GameInfo.get(Id).InstallationFolder
    };

    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  update = function () {
    updateGame(this.props.Progress);
  }

  remove = function () {
    //alert("Not yet implemented.");
    removeGame(Constants.Game.GAME_SHORT.XP, this.props.Progress);
  }

  selectInstallationFolder = function () {
    var result = dialog.showOpenDialog({ properties: ['openDirectory'] })[0];
    console.log("Current path:", this.state.InstallationFolder);
    console.log("Path:", result);
    this.setState({
      InstallationFolder: result,
    });

    // Save the installation folder
    var game = GameInfo.get(Id);
    game.InstallationFolder = result;
    console.log("Saved GameInfo", game);
    console.log(GameInfo.save(game));
  }


  render() {
    const classes = this.props.classes;
    return (
      <div>
        <Typography type="display1" gutterBottom>
          Legacy XP
        </Typography>

        <Typography type="subheading" >
          Choose the installation location
        </Typography>
        <Grid container gutter={24}>
          <Grid item xs>
            <TextField value={this.state.InstallationFolder.toString()} placeholder="Path/to/an/empty/folder" fullWidth />
          </Grid>
          <Grid item>
            <Button onClick={this.selectInstallationFolder.bind(this)}>
              Select Folder
            </Button>
          </Grid>
        </Grid>
        <div className={classes.bottom_buttons_wrapper}>
          <Grid container gutter={24} className={classnames(classes.bottom_buttons, {
            [classes.flyout]: this.props.ProgressHolder.Visible
          })}>
            <Grid item xs>
              <Button onClick={this.remove}>
                Remove
            </Button>
            </Grid>
            <Grid item xs>
              <Button onClick={this.update}>
                Install
            </Button>
            </Grid>
          </Grid>
        </div>
      </div>
    );
  }
}

export default withStyles(styleSheet)(LegacyXP);