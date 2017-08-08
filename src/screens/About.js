// Import React and Material UI components
import React, { Component } from 'react';
import Typography from 'material-ui/Typography';

// Import functionality modules
var { GameManager, GameInfo } = require('./js/GameManager');

class About extends Component {
  render() {
    return (
      <div>
        <Typography type="body2">
          About page n' stuff
        </Typography>
      </div>
    );
  }
}

export default About;