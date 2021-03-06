import React, { Component } from 'react';
import { drizzleConnect } from "@drizzle/react-plugin";
import { Box, Card, Heading, Image, Flash } from "rimble-ui";
import styled from "styled-components";

import { Constants } from '@game3js/common';
import { TOURNAMENT_STATE_WINNERS_DECLARED } from '../constants';

import ViewResultsModal from './ViewResultsModal';
import SkeletonResultsLoader from './SkeletonResultsLoader';

const PlayerTournamentResultsCard = styled(Card)`
  margin-bottom: 2rem;
  padding: 2rem 1rem;
  width: 90%;

  @media screen and (min-width: 1024px) {
    width: 45%;
  }
`

const EventsCard = styled(Card)`
  box-shadow: none;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 1rem;
  width: 100%;

  .tournamentID {
    font-size: 0.75rem;
    letter-spacing: 0.4px;
    margin: 0;
  }

  .gameName {
    font-size: 1rem;
    letter-spacing: 0.15px;
    margin: 0 0 1rem 0;
  }

  .prize {
    font-size: 1.25rem;
    letter-spacing: 0;
    margin-bottom: 1rem;
  }
  
  @media screen and (min-width: 500px) {
    justify-content: flex-start;
    align-items: center;
    flex-direction: row;
  }
`

const GameImage = styled(Image)`
  border-radius: 15px;
  margin-bottom: 1rem;
  width: 220px;
  height: 140px;
  
  @media screen and (min-width: 500px) {
    margin-right: 2rem;
    margin-bottom : 0;
    width: 185px;
    height: 123px;
  }
`

interface IProps {
  account: any;
  address: any;
  networkId: any;
  drizzleStatus: any;
  drizzle: any;
  isLoading: boolean;
  parseData: any;
  tournaments: Array<any>;
}

interface IState {
  currentNetwork: any;
  address: any;
  events: Array<any>;
}

class PayoutEventsView extends Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      currentNetwork: null,
      address: null,
      events:[]
    }
  }

  componentDidMount() {
    const { address, networkId, drizzleStatus, drizzle} =  this.props

    this.updateAddress(address)
    this.updateDrizzle(networkId, drizzleStatus, drizzle)
  }

  componentWillReceiveProps(newProps) {
    const { address, networkId, drizzleStatus, drizzle } = this.props
    const { address: newAddress, networkId: newNetworkId, 
      drizzleStatus: newDrizzleStatus, drizzle: newDrizzle } = newProps

    if (address !== newAddress) {
      this.updateAddress(newAddress)
    }
    if (networkId !== newNetworkId || drizzleStatus !== newDrizzleStatus
      || drizzle !== newDrizzle) {
      this.updateDrizzle(newNetworkId, newDrizzleStatus, newDrizzle)
    }
  }

  updateAddress = (address) => {
    this.setState({ address })
  }

  updateDrizzle = (networkId, drizzleStatus, drizzle) => {
    if (networkId) {
      this.setState({ currentNetwork: networkId} );
    }
    if (!drizzleStatus.initialized && window.web3 && drizzle !== null) {
      window.web3.version.getNetwork((error, networkId) => {
        this.setState({ currentNetwork: parseInt(networkId) } );
      });
    }
    if (drizzleStatus.initialized && window.web3 && drizzle !== null) {
      this.fetchEvents();
    }
  }

  fetchEvents = async () => {
    const { drizzle, account } = this.props;

    const contract = drizzle.contracts.Tournaments;
    contract.events.PrizeTransfered({
      filter: { player: account },
      fromBlock: 0
    })
    .on('data', (event) => {
      this.fetchTournamentDetails(event.returnValues.tournamentId)
      .then( tournamentDetails => {
        this.addEvent({
          ...event,
          ...tournamentDetails
        })
      })
      // this.addEvent(event)
    })

    // Mock Data
    // let sampleEvent = {
    //   returnValues: {
    //     id: 0,
    //     amount: 2,
    //     tournamentId: 0,
    //     resultId: 1
    // }}

    // this.fetchTournamentDetails(sampleEvent.returnValues.tournamentId)
    // .then( tournamentDetails => {
    //   this.addEvent({
    //     ...sampleEvent, 
    //     ...tournamentDetails
    //   });
    // })
  }

  addEvent = (event) => {
    const { events } = this.state
    events.push(event)
    this.setState({
      events
    })
  }

  fetchTournamentDetails = async (tournamentId) => {
    const { drizzle, parseData } = this.props;

    const contract = drizzle.contracts.Tournaments;
    const tournamentDetails = await contract.methods.getTournament(tournamentId).call();
    const data = parseData(tournamentDetails['5']);
   
    const tournament = {
      gameName: '',
      gameStage: data[1],
      gameImage: ''
    }

    switch (data[0]) {
      case 'wom' :
        tournament.gameName = 'World of Mines';
        tournament.gameImage = Constants.WOM_IMG;
        break;
      case 'tosios' :
        tournament.gameName = 'TOSIOS';
        tournament.gameImage = Constants.TOSIOS_IMG;
        break;
      case 'fp' :
        tournament.gameName = 'Flappy Bird Open-Source';
        tournament.gameImage = Constants.FP_IMG;
        break;
    }
  
    return tournament;
  }

  render() {
    const { address, tournaments, drizzle, isLoading } = this.props
    const { events } = this.state
    const eventTournamentIds = [];
    let noEventsTournaments = [];

    if (isLoading) {
      return(
        <SkeletonResultsLoader />
      )
    }

    // If player has winnings
    const eventsRendered = events.map( event =>
      <EventsCard key={event.id} mb={3}>
        <GameImage src={"images/" + event.gameImage} />
        <Box>
          <p className="tournamentID">Tournament {event.returnValues.tournamentId}</p>
          <h6 className="gameName">{event.gameName} {event.gameStage !== undefined ? "- " + event.gameStage : ""}</h6>
          <h3 className="prize">You have won {event.returnValues.amount} ETH</h3>
        </Box>
      </EventsCard>
    );


    // If none 
    const doneTournaments = tournaments.filter (tournament => tournament.state === TOURNAMENT_STATE_WINNERS_DECLARED);
    events.forEach( event => {
      eventTournamentIds.push(event.returnValues.tournamentId);
      noEventsTournaments = doneTournaments.filter( tournament => tournament.id !== event.returnValues.tournamentId);
    })
    const noPayouts = noEventsTournaments.filter( tournament => {
      return tournament.results.filter( result => result.isWinner !== true);
    });

    const noPayoutsRendered = noPayouts.map( noPayout => 
      <EventsCard key={noPayout.id} mb={3}>
        <GameImage src={"images/" + noPayout.gameImage} />
          <Box>
            <p className="tournamentID">Tournament {noPayout.id}</p>
            <h6 className="gameName">{noPayout.gameName} {noPayout.gameStage !== undefined ? "- " + noPayout.gameStage : ""}</h6>
            <h3 className="prize">You'll win next time!</h3>

            <ViewResultsModal 
              tournamentId={noPayout.id}
              playerAddress={address}
              drizzle={drizzle}
              />
          </Box>
      </EventsCard>
      );

    return (
      <PlayerTournamentResultsCard>
        <Heading as={"h2"} mb={3}>Your Tournament Results</Heading>
        {events.length !== 0 ? eventsRendered : ""}
        {noPayoutsRendered.length !== 0 ? noPayoutsRendered : ""}
        {events.length === 0 && noPayoutsRendered.length === 0 ? (
          <Flash>
            No results available
          </Flash>
        ) : ""}
      </PlayerTournamentResultsCard>  
    );
  }

}
/*
 * Export connected component.
 */
const mapStateToProps = state => {
  return {
    drizzleStatus: state.drizzleStatus,
    address: state.accounts[0],
    networkId: state.web3.networkId
  };
};
  
export default drizzleConnect(PayoutEventsView, mapStateToProps);