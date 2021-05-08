import React, { useContext, useEffect, useState } from "react";
import createPersistedState from "use-persisted-state";
import TextField from "../../components/TextField";
import Button from "../../components/Button";
import styles from "./style.module.css";
import { BrowserHistoryContext } from "../../App";
import validateGame from "../../api/validateGame";
import createPlayer from "../../api/createPlayer";
import socket from "../../socket";

const usePlayerIdState = createPersistedState("playerId");
const useTokenState = createPersistedState("token");

type Props = {
  gameCode: string;
};

const NicknamePage = ({ gameCode }: Props) => {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [playerId, setPlayerId] = usePlayerIdState("");
  const [token, setToken] = useTokenState("");
  const browserHistory = useContext(BrowserHistoryContext);

  const tryConnect = async () => {
    const res = await validateGame({ gameCode });

    const gameCodeIsValid = res.success;
    if (gameCodeIsValid) {
      if (playerId && token) {
        socket.auth = { gameCode, playerId, token };
        socket.connect();
        // If the connection fails here, it means the playerId is invalid so need to remove it
        // It reruns this useEffect since playerId changed, but it does not connect again because playerId is falsy
        socket.on("connect_error", () => {
          setPlayerId("");
          setToken("");
        });
      }
    } else {
      browserHistory.push("/");
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      tryConnect();
    }
    return () => {
      mounted = false;
    };
  }, [gameCode, playerId, token]);

  const handleSubmit = async () => {
    const res = await createPlayer({ gameCode, nickname });

    if (res.success) {
      if (res.data) {
        // This triggers the useEffect to connect to socket.io
        setPlayerId(res.data.playerId);
        setToken(res.data.token);
      } else {
        setError("Unknown Error, please try again");
      }
    } else {
      setError(res.error);
    }
  };

  return (
    <div className={styles.container}>
      <h4>Nickname:</h4>
      <div className={styles.spacer}>
        <TextField
          label="Nickname"
          textValue={nickname}
          onChangeHandler={setNickname}
        />
      </div>
      <h5 style={{ color: "red", textAlign: "center" }}>{error}</h5>
      <Button text="Submit" handleOnClick={handleSubmit} disabled={!nickname} />
    </div>
  );
};

export default NicknamePage;
