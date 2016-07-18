import React from 'react'
import UserInfo from '../components/User'
import SearchBar from '../containers/SearchBar'
import AccountBlock from '../components/Accounts'
import Checkouts from '../components/Checkouts'
import Withdrawals from '../components/Withdrawals'
import {Row, Col, Grid} from "react-bootstrap"

const App = () => (
  <Grid style={{"height":"100%"}}>
    <Row>
        <Col lg={5} sm={12} style={{"border-right":"solid black 1px"}}>
            <SearchBar />
            <UserInfo />
            <AccountBlock />
            <Withdrawals />
        </Col>
        <Col lg={6} sm={12} lgOffset={1}>
            <Checkouts />
        </Col>
    </Row>  
  </Grid>
)

export default App
