import React from 'react'
import UserInfo from '../components/User'
import SearchBar from '../containers/SearchBar'
import AccountBlock from '../components/Accounts'
import Checkouts from '../components/Checkouts'
import Withdrawals from '../components/Withdrawals'
import {Row, Col, Grid} from "react-bootstrap"

const App = () => (
  <Grid fluid={true}>
    <Row>
        <Col lg={6} sm={12}>
            <SearchBar />
            <UserInfo />
            <AccountBlock />
            <Withdrawals />
        </Col>
        <Col lg={6} sm={12}>
            <Checkouts />
        </Col>
    </Row>  
  </Grid>
)

export default App
