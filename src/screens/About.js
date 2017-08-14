// Import React and Material UI components
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Typography from 'material-ui/Typography';
import Grid from 'material-ui/Grid';
import Avatar from 'material-ui/Avatar';
import { withStyles, createStyleSheet } from 'material-ui/styles';
import classNames from 'classnames';
import Button from 'material-ui/Button';

const path = require('path');
const { shell } = require('electron')

// Import functionality modules
var { GameManager, GameInfo } = require('./js/GameManager');

const styleSheet = createStyleSheet(theme => ({
  avatar: {
    margin: 10,
    width: 100,
    height: 100
  }
}));


class About extends Component {

  openUrl = (url) => {
    shell.openExternal(url);
  }

  render() {
    const classes = this.props.classes;
    return (
      <div className="page_root">
        <Grid container>
          <Grid item xs>
            <Typography type="display1" gutterBottom>
              About
            </Typography>
          </Grid>
          <Grid item>
            <Avatar
              alt="CiriousJoker"
              className={classNames(classes.avatar, classes.bigAvatar, "avatar")}
            />
          </Grid>
        </Grid>
        <Typography type="body2">
          Here are just a bunch of links:
        </Typography>
        <Grid container>
          <Grid item>
            <Button raised color="primary" onClick={() => this.openUrl("http://www.smashbroslegacy.com/")}>
              Smash Bros. Legacy Website
          </Button>
          </Grid>
          <Grid item>
            <Button raised color="primary" onClick={() => this.openUrl("https://github.com/CiriousJoker/LegacyManager")}>
              Github
            </Button>
          </Grid>
        </Grid>
      </div>
    );
  }
}

About.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styleSheet)(About);