// @flow weak
//import '../assets/css/App.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles, createStyleSheet } from 'material-ui/styles';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Divider from 'material-ui/Divider';
import List, { ListItem, ListItemIcon, ListItemText, ListSubheader } from 'material-ui/List';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import MenuIcon from 'material-ui-icons/Menu';
import Menu, { MenuItem } from 'material-ui/Menu';

import MenuDots from './MenuDots';

// Routing
import { NavLink } from 'react-router-dom';

// Icons
import InboxIcon from 'material-ui-icons/Inbox';
import DraftsIcon from 'material-ui-icons/Drafts';
import StarIcon from 'material-ui-icons/Star';
import SendIcon from 'material-ui-icons/Send';
import MailIcon from 'material-ui-icons/Mail';
import DeleteIcon from 'material-ui-icons/Delete';
import ReportIcon from 'material-ui-icons/Report';

const styleSheet = createStyleSheet({
  root: {
    width: '100%'
  },
  appbar: {
    // Red>Blue gradient
    // background: 'linear-gradient(45deg, #f80008 0%, #2400ff 100%)'

    // Carbon Fibre pattern
    //background: "radial-gradient(black 15%, transparent 16%) 0 0, radial-gradient(black 15%, transparent 16%) 8px 8px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px, radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 8px 9px",
    //backgroundColor: "#282828",
    //backgroundSize: "16px 16px"

    // Use the body background (currently an image)
    background: "none"
  },
  flex: {
    flex: 1,
  },
  list: {
    width: 250,
    flex: 'initial',
  },
  listFull: {
    width: 'auto',
    flex: 'initial'
  }
});

class MenuBar extends Component {
  constructor() {
    super();
    this.state = {
      open: false
    }
  }

  //Toggle function (open/close Drawer)
  toggleDrawer(_state) {
    if (_state === true || _state === false) {
      this.setState({
        open: _state
      })
    } else {
      this.setState({
        open: !this.state.open
      })
    }
  }

  handleLeftOpen = () => this.toggleDrawer(true);
  handleLeftClose = () => this.toggleDrawer(false);

  render() {
    const classes = this.props.classes;

    const mailFolderListItems = (
      <div className="no-window-drag">
        {/* Change to /legacyxp before release */}
        <NavLink to="/" style={{ textDecoration: 'none', color: 'unset' }} >
          <ListItem button>
            <ListItemText primary="Legacy XP" />
          </ListItem>
        </NavLink >
        {
          /*
          <NavLink to="/legacyxp" style={{ textDecoration: 'none', color: 'unset' }} >
            <ListItem button>
              <ListItemText primary="Legacy XP"/>
            </ListItem>
          </NavLink >
          */
        }

      </div>
    );

    const otherMailFolderListItems = (
      <div className="no-window-drag">
        <NavLink to="/settings" style={{ textDecoration: 'none', color: 'unset' }} >
          <ListItem button>
            <ListItemText primary="Settings" />
          </ListItem>
        </NavLink >
      </div>
    );

    const sideList = (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List className={classes.list} disablePadding subheader={<ListSubheader>Legacy Manager</ListSubheader>}>
          {mailFolderListItems}
        </List>
        <div style={{ flex: '1' }} />
        <List className={classes.list} disablePadding>
          {otherMailFolderListItems}
        </List>
      </div>
    );


    return (
      <div>
        <AppBar position="static" className={classes.appbar} style={{ WebkitAppRegion: "drag" }} elevation={0}>
          <Toolbar style={{ paddingLeft: "8px", paddingRight: "8px" }}>
            <IconButton color="contrast" aria-label="Menu" onClick={this.toggleDrawer.bind(this)}>
              <MenuIcon />
            </IconButton>
            <Typography type="title" color="inherit" className={classes.flex}>
              Legacy Manager
          </Typography>
            {/* <Button color="contrast">Sample Button</Button> */}
            <MenuDots></MenuDots>
          </Toolbar>
        </AppBar>
        <Drawer
          id="drawer"
          open={this.state.open}
          onRequestClose={this.handleLeftClose}
          onClick={this.handleLeftClose}
        >
          {sideList}
        </Drawer>
      </div>
    );
  }
}

MenuBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styleSheet)(MenuBar);