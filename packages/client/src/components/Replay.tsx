import React, { useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import {
  Button,
  Space,
  View,
} from './';

const REPLAY = {
  border: '2px solid rgba(9,30,66,.1)',
  backgroundColor: '#4f4f4f33',
  borderRadius: 8,
  padding: 8,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  width: '100%'
};

const REPLAY_HOVERED = {
  backgroundColor: '#efefef33',
  filter: 'brightness(90%)',
  cursor: 'pointer',
};

const getMinutes = (seconds: number) => {
  return Math.floor(seconds / 60);
};

const getSeconds = (seconds: number) => {
  const left = Math.floor(seconds % 60);
  return left < 0 ? 0 : left;
};

const getPadded = (time: number, padding: number = 2) => {
  return time.toString().padStart(padding, '0');
};

export function Replay(props: {
  // id: string;
  // time: number;
  hash: string;

  onClick: (id: string) => void;
}): React.ReactElement {
  const {
    // id,
    // time,
    hash,
    onClick,
  } = props;
  const [hovered, setHovered] = React.useState(false);

  let timeDisplay: string;

  // if (time <= 0) {
  //   timeDisplay = '00:00';
  // } else {
  //   const minutesLeft: number = getMinutes(time / 1000);
  //   const secondsLeft: number = getSeconds(time / 1000);

  //   timeDisplay = getPadded(minutesLeft) + ":" + getPadded(secondsLeft);
  // }

  useEffect(() => {
    onClick(hash);
  }, [])



  return (null);
}

  // <View
  //   style={{
  //     ...REPLAY,
  //     flexDirection: isMobile ? 'column' : 'row',
  //     ...(hovered && REPLAY_HOVERED),
  //   }}
  //   onMouseEnter={() => setHovered(true)}
  //   onMouseLeave={() => setHovered(false)}
  //   onClick={() => onClick(hash)}
  // >
  //   {isMobile && <Space size="xs" />}
  //   <Button
  //     type="button"
  //     style={{
  //       marginLeft: 'auto',
  //       width: isMobile ? '100%' : 'fit-content',
  //     }}
  //   >
  //     Watch
  //   </Button>
  // </View>