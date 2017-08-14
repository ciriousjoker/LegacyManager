// @flow weak

import React, { Component } from 'react';
import IconButton from 'material-ui/IconButton';
import Menu, { MenuItem } from 'material-ui/Menu';
import MoreVertIcon from 'material-ui-icons/MoreVert';
import MenuIcon from 'material-ui-icons/Menu';

// Routing
import { Link, NavLink } from 'react-router-dom';


const { app } = window.require('electron').remote;

const options = [
  'About',
  'Exit'
];

const ITEM_HEIGHT = 48;

class MenuDots extends Component {
  state = {
    anchorEl: undefined,
    open: false,
  };

  handleClick = event => {
    this.setState({ open: true, anchorEl: event.currentTarget });
  };

  handleRequestClose = () => {
    this.setState({ open: false });
  };

  handleExit = () => {
    this.handleRequestClose();
    app.quit();
  };

  

  render() {
    return (
      <div>
        <IconButton
          aria-label="More"
          aria-owns="menu-dots"
          aria-haspopup="true"
          color="contrast"
          onClick={this.handleClick}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="menu-dots"
          className="no-window-drag"
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onRequestClose={this.handleRequestClose}
        >
          <NavLink to="/about" style={{ textDecoration: 'none', color: 'unset', outline: 'none' }} >
            <MenuItem onClick={this.handleRequestClose}>
              About
            </MenuItem>
          </NavLink >
          <MenuItem onClick={this.handleExit}>
            Exit
          </MenuItem>
        </Menu>
      </div>
    );
  }
}

export default MenuDots;