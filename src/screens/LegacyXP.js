import React, { Component } from 'react';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Input from 'material-ui/Input/Input';
import Paper from 'material-ui/Paper';
import classNames from 'classnames';
import Grid from 'material-ui/Grid';
import Typography from 'material-ui/Typography';
import { withStyles, createStyleSheet } from 'material-ui/styles';
import * as Colors from 'material-ui/colors';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';

const { dialog } = require('electron').remote;
const settings = require('electron-settings');
const path = require('path');

// Import functionality
import { updateGame } from '../functionality/updateGame';
import { removeGame } from '../functionality/removeGame';
import { checkGameUpdate } from '../functionality/checkGameUpdate';

// Constants
const { Constants } = require('./js/Constants');

// Animations
import FadeIn from 'react-fade-in';

const { GameManager, GameInfo } = require('./js/GameManager');
const { DownloadManager } = require('./js/DownloadManager')
const { getLocationManager } = require('./js/LocationManager.js');

const Id = Constants.Game.GAME_SHORT.XP;


const styleSheet = createStyleSheet(theme => ({
  content: {
    flex: 1,
    overflowY: "scroll"
  },
  webview: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: "32px",
    color: Colors.grey[900],
    background: Colors.grey[50],
    fontFamily: "'Roboto', sans-serif",
    height: "100%"
  },
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


var website_content;

class LegacyXP extends Component {
  constructor(props) {
    super(props);

    this.state = {
      InstallationFolder: GameInfo.get(Id).InstallationFolder,
      content_loaded: false,
      dialog_open_update: false,
      dialog_open_update_result: false,
      version_latest: false,
      version_installed: false,
      dialog_update_result_title: "Update failed",
      dialog_update_result_body: "Unexpected error"
    };
  }


  componentDidMount() {
    this.checkInstalled(function (err, installed) {
      if (installed) {
        this.checkUpdate();
      }
    });
  }


  closeUpdateDialog = () => {
    this.setState({
      dialog_open_update: false
    });
  };

  closeUpdateResultDialog = () => {
    this.setState({
      dialog_open_update_result: false
    });
  };

  checkInstalled = (cb) => {
    var gm = new GameManager();
    gm.isInstalled(Id, function (err, installed) {
      console.log("Version installed: ", installed.VersionString);
      if (installed) {
        this.setState({
          version_installed: installed.VersionString
        });
      }
      if (cb) { cb(installed) }
    }.bind(this));
  }

  checkUpdate = () => {
    checkGameUpdate(Id, function (err, result) {
      if (result) {
        this.setState({
          dialog_open_update: true,
          version_latest: result.VersionString
        });
      }
    }.bind(this));
  }

  play = () => {
    var lm = getLocationManager();
    var dolphinExecutable = lm.get.DolphinExecutable(Id);
    var dolphinExecutable2 = lm.get.WitLocation(Id);
    console.log("Dolphin executable: ", dolphinExecutable);

    var execFile = require('child_process').execFile;
    var child3 = execFile(dolphinExecutable, [''], { cwd: path.dirname(dolphinExecutable) });
  }

  update = () => {
    updateGame(Id, this.props.Progress, function (err, success) {
      // Update the installed version state and the buttons
      this.checkInstalled();
    }.bind(this));
  }

  remove = () => {
    removeGame(Constants.Game.GAME_SHORT.XP, this.props.Progress);
    // Update the installed version state and the buttons
    this.checkInstalled();
  }

  selectInstallationFolder = () => {
    var result = dialog.showOpenDialog({ properties: ['openDirectory'] })[0];
    console.log("Current path:", this.state.InstallationFolder);
    console.log("Path:", result);
    this.setState({
      InstallationFolder: result
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
      <div className="page_root">
        <div className={classes.content + " hide-scrollbars"} >
          <Grid container>
            <Grid item>
              <Typography type="display1" gutterBottom>
                Legacy XP
              </Typography>
            </Grid>
            {this.state.version_installed && (
              <Grid item xs>
                <Typography type="subheading" gutterBottom style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                  {this.state.version_installed.toString()}
                </Typography>
              </Grid>
            )}
          </Grid>



          <Typography type="subheading" >
            Choose the installation location
            </Typography>
          <Grid container gutter={24} style={{ marginBottom: "32px" }}>
            <Grid item xs>
              <TextField value={this.state.InstallationFolder.toString()} placeholder="Path/to/an/empty/folder" fullWidth />
            </Grid>
            <Grid item>
              <Button onClick={this.selectInstallationFolder.bind(this)}>
                Select Folder
              </Button>
            </Grid>
          </Grid>

          {/* Update dialog */}
          <Dialog className="clipRoundedCorners" open={this.state.dialog_open_update} >
            <DialogTitle>
              {"Update now?"}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                A new version of Legacy XP is available ({this.state.version_latest.toString()}). Update now to get the latest features.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.closeUpdateDialog} color="primary">
                Skip this time
              </Button>
              <Button onClick={this.update} color="primary">
                Update now
              </Button>
            </DialogActions>
          </Dialog>

          {/* Update result dialog TODO: Remove this, it causes visual bugs if closed after cancelling the update */}
          <Dialog className="clipRoundedCorners" open={this.state.dialog_open_update_result} >
            <DialogTitle>
              {this.state.dialog_update_result_title}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {this.state.dialog_update_result_body}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.update} color="primary">
                Try again
              </Button>
              <Button onClick={this.closeUpdateResultDialog} color="primary">
                Ok
              </Button>
            </DialogActions>
          </Dialog>

          {/* This is the base for a newsfeed, but it's not implemented yet 
          {this.state.content_loaded && (
            <FadeIn>
              <Paper className={classes.webview} elevation={4}>
                <div ref="website" id="blogposts"><div style={{ height: "2000px" }}></div></div>
              </Paper>
            </FadeIn>
          )}*/}
        </div>

        <div className={classes.bottom_buttons_wrapper}>
          <FadeIn>
            <Grid container gutter={24} className={classNames(classes.bottom_buttons, {
              [classes.flyout]: this.props.ProgressHolder.Visible
            })}>
              {this.state.version_installed && (
                <Grid item xs>
                  <Button onClick={this.remove}>
                    Remove
                  </Button>
                </Grid>
              )}
              {!this.state.version_installed && (
                <Grid item xs>
                  <Button onClick={this.update}>
                    {this.state.version_latest && this.state.version_installed && (
                      "Update"
                    ) || "Install"}
                  </Button>
                </Grid>
              )}
              {this.state.version_installed && (
                <Grid item xs>
                  <Button onClick={this.play}>
                    Play
                  </Button>
                </Grid>
              )}
            </Grid>
          </FadeIn>
        </div>
      </div>
    );
  }
}

export default withStyles(styleSheet)(LegacyXP);