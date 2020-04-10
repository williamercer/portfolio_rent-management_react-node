import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@material-ui/core'
import './styles.scss'

const View = ({ open, handleCancel, handleOk, title, description }) => (
  <Dialog
    open={open}
    onClose={handleCancel}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">{ title }</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        { description }
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleCancel} color="primary">
        No
      </Button>
      <Button
        className="yes-button"
        onClick={handleOk}
        color="primary"
        autoFocus
      >
        Yes
      </Button>
    </DialogActions>
  </Dialog>
)
View.propTypes = {
  open         : PropTypes.bool.isRequired,
  title        : PropTypes.string.isRequired,
  description  : PropTypes.string.isRequired,
  handleCancel : PropTypes.func.isRequired,
  handleOk     : PropTypes.func.isRequired,
}

export default View
