import React from "react";
import Unity, { UnityContent } from "react-unity-webgl";
import { Box, Button, IListItem, Inline, Input, Room, Replay, Select, Separator, Space, View } from '../components';
import GameSceneContainer from '../components/GameSceneContainer';
import styled from 'styled-components';
import { Card } from "rimble-ui";
import { DEFAULT_GAME_DIMENSION } from '../constants'

import { getGameNo, getGameSessionId } from '../helpers/database';

const StyledBox= styled(Box)`
  height: 100%;
  width: 100%;

  .web-gl canvas#canvas {
    height: 100%;
    width: 100%;
  }
`

interface IProps extends RouteComponentProps {
  path: string;
  roomId?: string;
  drizzle?: any;
  drizzleState?: any;
  startRecording: any;
  stopRecording: any;
  contractMethodSendWrapper?: any;
  isGameRunning?: boolean;
  tournamentId: any;
}

export class GameUnity extends React.Component<IProps, any> {

  constructor(props) {
    super(props);
    this.state = {
      rotation: 0,
      unityShouldBeMounted: true,
      gameReady: false,
      sessionId: '0',
      playerAddress: '',
      tournamentId: '',
      selectedLevel: false,
      isGameRunning: false,
      progression: 0,
      gameNo: 0,
      tournament: null,
      playBtnText: "Play"
    };

    this.initializeUnity();
    this.initializeGame();
  }

  speed = 30;
  unityContent = null as any;

  initializeGame = async () => {
    await this.getBlockchainInfo(this.props);
    await this.fetchGameNo(this.props.address, this.props.tournamentId);
  }

  

  getBlockchainInfo = async (props) => {
    try {
    const { tournamentId, drizzle } = props

    const contract = drizzle.contracts.Tournaments;
    console.log(contract);
    const maxTries = await contract.methods.getMaxTries(tournamentId).call();
    console.log(maxTries);

    const tournament = {
      maxTries: parseInt(maxTries)
    }

    this.setState({
      tournament
    })

    } catch (e) {
      console.log("GameUnity: No tourney contract loaded");
    }
  }


  fetchGameNo = async (account, tournamentId) => {
    const gameSessionId = await getGameSessionId(account, tournamentId);
    const gameNo = await getGameNo(gameSessionId, account, tournamentId);
    const playBtnText = this.state.tournament != null ?
    `Play ( ${typeof gameNo !== "number" ? 0 : gameNo} out of ${this.state.tournament.maxTries} )` : 
    'Play';

    console.log(playBtnText)

    this.setState(
      { 
        playBtnText,
        gameNo: gameNo,
        sessionId: gameSessionId
      });

  }

  onPlayGame = async (e) => {
    let gameServerUrl = "ws://localhost:3001";

    const gameId = this.props.path;

    switch (gameId)
    {
      case "wom":
        this.unityContent.send("OutplayManager", "SetLevel",
        this.state.selectedLevel ? this.state.selectedLevel : "French Southern and Antarctic Lands");
        this.unityContent.send("OutplayManager", "StartGame", "start");
      break;
      case "flappybird":
        this.unityContent.send("FlappyColyseusGameServerManager", "Connect", gameServerUrl);
        this.unityContent.send("Game3JsManager", "StartGame", "start");
      break;

    }

    // TODO: disable recording for now
    // this.props.startRecording.call(null, gameId);

    this.setState(
      {
        gameReady: false,
        isGameRunning: true
      }
    );

    // const updateUser = this.context.updateUser;
    // const response = await this.nakamaServiceInstance.PlayGame();
    // if (response.payload.response)
    // {
    //   updateUser(await this.nakamaServiceInstance.updateAccountDetails());
    //   this.unityContent.send("OutplayManager", "SetLevel",
    //     this.state.selectedLevel ? this.state.selectedLevel : "French Southern and Antarctic Lands");
    //   this.unityContent.send("OutplayManager", "StartGame", "start");
    //   this.eventDispatcher.dispatch(events.game.start);
    // }
    // else {
    //   this.eventDispatcher.dispatch(events.error.insufficientFunds);
    // }
  }

//   onChangeLevel = async (e) => {
//     this.setState(
//       {
//         selectedLevel: e.target.innerText
//       }
//     )
//   }


  processOutplayEvent = (outplayEvent) => {

    switch (outplayEvent) {
      case 'GameReady':
        this.setState(
          {
            gameReady: true
          }
        );
      break;

        // TODO: add any relevant game end code
        case 'GameEndFail':
          this.setState(
            {
              isGameRunning: false
            }
            );
          // this.props.stopRecording.call(null, "wom");

      break;
        case 'GameEndSuccess':
          this.setState(
            {
              isGameRunning: false
            }
            );
          // this.props.stopRecording.call(null, "wom");
      break;

    }

    console.log(outplayEvent);
    // send out an event
    // this.eventDispatcher.dispatch(outplayEvent);
  }

  initializeUnity() {
    // load unity from the same server (public folder)
    const path = this.props.path;

    this.unityContent = new UnityContent(
      "/" + path + "/unitygame.json",
      "/" + path + "/UnityLoader.js"
    );

    this.unityContent.on("progress", progression => {
      this.setState({ progression })
      console.log("Unity progress", progression);
    });

    this.unityContent.on("loaded", () => {
      console.log("Yay! Unity is loaded!");
    });

    this.unityContent.on("SendEvent", outplayEvent => {
      this.processOutplayEvent(outplayEvent);
    });

    this.unityContent.on("SendString", message => {
      window.alert(message);
      console.log(message);
    });

    this.unityContent.on("SendNumber", rotation => {
      this.setState({ rotation: Math.round(rotation) });
    });

    this.unityContent.on("quitted", () => {
      this.setState({isGameRunning: false})
    });

    this.unityContent.on("error", () => {
      this.setState({isGameRunning: false})
    })
  }

  onClickSendToJS() {
    this.unityContent.send("OutplayManager", "ConsoleLog", "Receive Message from Javascript!");
  }

  onClickStart() {
    this.unityContent.send("Cube", "StartRotation");
  }

  onClickStop() {
    this.unityContent.send("Cube", "StopRotation");
  }

  onClickUpdateSpeed(speed) {
    this.speed += speed;
    this.unityContent.send("Cube", "SetRotationSpeed", this.speed);
  }

  onClickUnount() {
    this.setState({ unityShouldBeMounted: false });
  }

  render() {
    const { isGameRunning, gameReady, playBtnText, progression } = this.state;
    const { tournamentId } = this.props;

    return (
      <GameSceneContainer when={isGameRunning} tournamentId={tournamentId}>
        <Button
          block
          disabled={!gameReady}
          className="mb-3"
          color="primary"
          type="button"
          onClick={this.onPlayGame}
        >
        {
         isGameRunning ?
          "Game In Progress" :
           gameReady ?
              playBtnText  :
              (progression === 1) ?
                'Waiting for Game Start' :
                `Loading Game ... ${Math.floor(progression * 100)}%`
        }
        </Button>

        <Space size="xxs" />
        <StyledBox>
          {
            this.state.unityShouldBeMounted === true && (
              <Unity width="100%" height="100%" unityContent={this.unityContent} className="web-gl"/>
            )
          } 
        </StyledBox>
      </GameSceneContainer>
    );
  }
}

export default GameUnity;

// <p>{"Rotation: " + this.state.rotation}deg</p>
// <button onClick={this.onClickSendToJS.bind(this)}>{"Send to JS"}</button>
// <button onClick={this.onClickStart.bind(this)}>{"Start"}</button>
// <button onClick={this.onClickStop.bind(this)}>{"Stop"}</button>
// <button onClick={this.onClickUpdateSpeed.bind(this, 10)}>
//   {"Faster"}
// </button>
// <button onClick={this.onClickUpdateSpeed.bind(this, -10)}>
//   {"Slower"}
// </button>
// <button onClick={this.onClickUnount.bind(this)}>
//   {"Unmount (2019.1=>)"}
// </button>
