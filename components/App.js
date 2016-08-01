import React from 'react'
import UserInfo from '../components/User'
import SearchBar from '../containers/SearchBar'
import AccountBlock from '../components/Accounts'
import Checkouts from '../components/Checkouts'
import Withdrawals from '../components/Withdrawals'
import CreditCardBlock from "../components/CreditCard"
import {Row, Col, Grid} from "react-bootstrap"

/**
 * The main application.  Defines the bootstrap grid in which all of our various objects live
 */
const App = () => (
  <Grid fluid={true}>
    <Row>
        <SearchBar />
    </Row>
    <hr></hr>
    <Row>
        <Col lg={6} sm={12}>
            <UserInfo />
            <AccountBlock />
            <Withdrawals />
        </Col>
        <Col lg={6} sm={12}>
            <Checkouts />
            <CreditCardBlock />
        </Col>
    </Row>  
  </Grid>
)

export default App
