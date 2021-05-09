import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import styles from "./style.module.css";
import PlayerList from "../../components/PlayerList";
import PunchlineCard from "../../components/PunchlineCard";
import { RoundContext } from "../../providers/ContextProviders/RoundContextProvider";

const EndRoundPage = ({ roundLimit }: { roundLimit: number }) => {
  const memoryHistory = useHistory();

  const { roundNumber, setup } = useContext(RoundContext);

  const [winningPunchline] = useState(
    "Looking in the mirror, applying lipstick, and whispering “tonight, you will have sex with Tom Cruise.”"
  );
  const [nextRoundIn, setNextRoundIn] = useState(5);

  useEffect(() => {
    const nextRoundTimer = setTimeout(
      () => setNextRoundIn(nextRoundIn - 1),
      1000
    );
    return () => clearTimeout(nextRoundTimer);
  });

  // For the purposes of dummy testing, this goes to the EndGamePage
  // But it should really go back to StartRoundPage until the game actually ends
  // TODO: Redirect to StartRoundPage once backend is connected
  useEffect(() => {
    if (nextRoundIn === 0) {
      memoryHistory.push("/scoreboard");
    }
  }, [nextRoundIn]);

  return (
    <div className={styles.container}>
      <h4 className={styles.round}>
        Round {roundNumber} of {roundLimit}
      </h4>
      <div className={styles.endOfRound}>
        <div style={{ margin: `24px 0` }}>
          <h5>The Setup:</h5>
          <h2>{setup.setup}</h2>
        </div>

        <h5 style={{ marginBottom: `12px` }}>Winning Punchline:</h5>
        <PunchlineCard text={winningPunchline} />

        <h2>Scoreboard</h2>
        <PlayerList gameState="endround" />
      </div>

      <p className={styles.waitingMsg}>Next round in {nextRoundIn}...</p>
    </div>
  );
};

export default EndRoundPage;
