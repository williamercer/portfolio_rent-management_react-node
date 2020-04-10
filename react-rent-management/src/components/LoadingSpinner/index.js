import React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import './styles.scss'

const style = {
  margin   : '0px',
  position : 'absolute',
  top      : '50%',
  left     : '50%',
}

const View = () => (
  <div className="loading-overlay-div">
    <div className="loading-center-wrapper">
      <CircularProgress style={style} color="primary" />
    </div>
  </div>
)
export default View
