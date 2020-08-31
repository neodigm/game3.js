import * as React from 'react'

import { RouteComponentProps } from '@reach/router'

import Modal from './Modal';
import { View, Button } from '../components';
import GameJavascript, { GameJavascriptContext } from '../scenes/GameJavascript';

import { updateGameNo , getGameNo, getGameSession, putGameReplay } from '../helpers/database'

export default class GameResult extends React.Component<any, any> {
  constructor(props) {
    super(props)

    this.state = {
      sessionData: null,
      tournament: {}
    }
  }

  componentDidMount = async () => {
    const { gameSessionId, playerAddress } = this.props;
    await this.getTournamentInfo();
    await this.updateTriesUsed(gameSessionId, playerAddress); // Decerease user's remaining tries by 1
    await this.getSessionData(gameSessionId, playerAddress);
  }

  componentWillReceiveProps = (newProps) => {
    const { gameSessionId, playerAddress } = this.props
    const { gameSessionId: newGameSessionId, 
      playerAddress: newPlayerAddress } = newProps

    if (gameSessionId !== newGameSessionId ||
      playerAddress !== newPlayerAddress) {
      this.getSessionData(newGameSessionId, newPlayerAddress)
    }
  }

  async updateTriesUsed(gameSessionId, playerAddress) {
    const {tournament} = this.state;

    const currentGameNo = await getGameNo(gameSessionId, playerAddress);
    console.log("GAME NUMBEEER",currentGameNo);

    if (currentGameNo < tournament.maxTries) {
      await updateGameNo(gameSessionId, playerAddress)
    }
  } 

  getSessionData = async (gameSessionId, playerAddress) => {
    if (!gameSessionId || !playerAddress) {
      return
    }
    const sessionData = await getGameSession(gameSessionId, playerAddress)
    console.log("Session Data", sessionData);
    this.setState({
      sessionData
    })
  }

  async saveGameSession() {

  }

  submitResult = async () => {
    const { tournamentId, recordFileHash, playerAddress,
      onToggle, gameSessionId, contractMethodSendWrapper } = this.props

    const result = await putGameReplay(gameSessionId, playerAddress, recordFileHash)
    console.log(result)

    contractMethodSendWrapper(
      "submitResult", // name
      [tournamentId, gameSessionId], //contract parameters
      {from: playerAddress}, // send parameters
      (txStatus, transaction) => { // callback
        console.log("submitResult callback: ", txStatus, transaction);
      })
    onToggle(true)
  }

  async getTournamentInfo() {
    let tournament = { // Test Tournament Info
      maxTries: 3 
    }

    this.setState({
      tournament
    })
  }

  render () {
    const { show, onToggle, didWin, gameSessionId, playerAddress } = this.props
    const { sessionData, tournament } = this.state

    const score = (sessionData && sessionData.timeLeft);
    const highScore = (sessionData && sessionData.currentHighestNumber);
    const gameNo = (sessionData && sessionData.gameNo);

    console.log('Your current game no is', gameNo);

    return (
      <GameJavascript>
        <GameJavascriptContext.Consumer>{context => {          
          
          let shouldSubmit = didWin || gameNo === tournament.maxTries;
          let isMaxTries = gameNo === tournament.maxTries;

          return (
            <Modal show={show} toggleModal={onToggle}>
              <View style={{ margin: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>Game {gameNo} of {tournament.maxTries}</View>
              <View style={{ margin: '20px' }}>Score: {score}</View>
              <View style={{ margin: '20px' }}>High Score: {highScore}</View>
              { (shouldSubmit) && (
                <View style={{ display: 'flex', flexDirection: 'row', width: '100%', margin: '0px auto 1rem auto'}}>
                  <Button onClick={this.submitResult}>Submit Score</Button>
                </View>
              )}

              {(!didWin || gameNo < tournament.maxTries) && (
                <View style={{ display: 'flex', flexDirection: 'row', width: '100%', margin: '0px auto'}}>
                  <Button 
                  onClick={async () => await context.updateSessionHighScore(gameSessionId, playerAddress)}>
                    Try Again
                  </Button>
                </View>
              )}
            </Modal>  
          )
        }}
        </GameJavascriptContext.Consumer>
      </GameJavascript>
    )
  }
}