// @flow weak

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles, createStyleSheet } from 'material-ui/styles';
import classnames from 'classnames';
import Card, { CardHeader, CardMedia, CardContent, CardActions } from 'material-ui/Card';
import Collapse from 'material-ui/transitions/Collapse';
import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import Typography from 'material-ui/Typography';
import red from 'material-ui/colors/red';
import Grid from 'material-ui/Grid';
import { LinearProgress } from 'material-ui/Progress';

// Icons
import CloseIcon from 'material-ui-icons/Close';
import ZoomOutMap from 'material-ui-icons/ZoomOutMap';
import ExpandMoreIcon from 'material-ui-icons/ExpandLess';


// Import images
import XPLogo from '../assets/svg/xp_logo.svg';

// Constants
const { Constants } = require('./js/Constants.js');

// Modules
const settings = require('electron-settings');


const styleSheet = createStyleSheet(theme => ({
  root: {
    position: "absolute",
    left: "16px",
    right: "16px",
    bottom: "4px",  // Account for resize border
    maxHeight: "150px",
    overflow: "hidden",
    pointerEvents: "none" // Click through the div and handle clicks on the card only
  },
  card: {
    borderBottomLeftRadius: "0px",
    borderBottomRightRadius: "0px",
    background: "linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) )",
    transform: 'translateY(0px)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.enteringScreen,
    }),
    transitionDelay: theme.transitions.duration.leavingScreen,
    pointerEvents: "auto"
  },
  NoVerticalPadding: {
    paddingTop: "0px",
    paddingBottom: "16px !important"
  },
  expand: {
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },

  flyout: {
    transform: 'translateY(150px)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.leavingScreen,
    })
  }
  /*flexGrow: { flex: '1 1 auto' }*/
}));

class StatusItem extends Component {
  state = {
    id: Constants.Game.GAME_SHORT.XP,
    expanded: settings.get(Constants.Settings.StatusTrayExpanded, false)
  };

  handleExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
    settings.set(Constants.Settings.StatusTrayExpanded, !this.state.expanded);
  };

  handleCancelClick = () => {
    var Id = this.state.id;
    this.props.Progress.setVisibility(false);
    console.log("Cancelled");
  }

  render() {
    const classes = this.props.classes;

    return (
      <div className={classes.root}>
        <Card
          className={classnames(classes.card, {
            [classes.flyout]: !this.props.ProgressHolder.Visible
          })}
        >
          <CardHeader
            className={classes.NoVerticalPadding}
            avatar={
              <Avatar src={XPLogo} aria-label="Recipe" className={classes.avatar}>
              </Avatar>
            }
            title={

              <CardActions disableActionSpacing>
                <LinearProgress mode={this.props.ProgressHolder[Constants.Progress.Total].Mode} value={this.props.ProgressHolder[Constants.Progress.Total].Value} style={{ width: '100%' }} />
                <IconButton aria-label="Cancel"
                  onClick={this.handleCancelClick}>
                  <CloseIcon />
                </IconButton>
                <IconButton
                  className={classnames(classes.expand, {
                    [classes.expandOpen]: this.state.expanded,
                  })}
                  onClick={this.handleExpandClick}
                  aria-expanded={this.state.expanded}
                  aria-label="Show more"
                >
                  <ExpandMoreIcon />
                </IconButton>
              </CardActions>
            }
          />
          <Collapse in={this.state.expanded} transitionDuration="auto" unmountOnExit>

            <CardContent className={classes.NoVerticalPadding}>
              <Typography type="body2" style={{ marginBottom: "8px" }}>
                {this.props.ProgressHolder.Status + (this.props.ProgressHolder.StatusSuffix || "")}
              </Typography>
              <LinearProgress mode={this.props.ProgressHolder[Constants.Progress.Current].Mode} value={this.props.ProgressHolder[Constants.Progress.Current].Value} style={{ width: '100%' }} />
              {
                /*
                <Typography paragraph>
                  Heat 1/2 cup of the broth in a pot until simmering, add saffron and set aside for 10
                  minutes.
                </Typography>
                <Typography paragraph>
                  Heat oil in a (14- to 16-inch) paella pan or a large, deep skillet over medium-high
                  heat. Add chicken, shrimp and chorizo, and cook, stirring occasionally until lightly
                  minutes. Add saffron broth and remaining 4 1/2 cups chicken broth; bring to a boil.
                </Typography>
                <Typography paragraph>
                  Add rice and stir very gently to distribute. Top with artichokes and peppers, and
                  cook without stirring, until most of the liquid is absorbed, 15 to 18 minutes.
                </Typography>
                <Typography>
                  Set aside off of the heat to let rest for 10 minutes, and then serve.
                </Typography>
                */
              }
            </CardContent>
          </Collapse>
        </Card>
      </div >
    );
  }
}

StatusItem.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styleSheet)(StatusItem);