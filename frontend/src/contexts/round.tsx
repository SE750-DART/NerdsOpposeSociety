import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Punchline } from "../types";

type Setup = {
  setup: string;
  type: "PICK_ONE" | "PICK_TWO" | "DRAW_TWO_PICK_THREE";
};

type Winner = {
  winningPlayerId: string;
  winningPunchlines: string[];
};

type RoundContextType = {
  // round:number
  roundNumber: number;
  setRoundNumber: (roundNumber: number) => void;

  // round:setup
  setup: Setup;
  setSetup: (setup: Setup) => void;

  // round:increment-players-chosen
  numPlayersChosen: number;
  incrementPlayersChosen: () => void;

  // round:chosen-punchlines
  punchlinesChosen: Punchline[];
  setPunchlinesChosen: (punchlines: string[][]) => void;
  markPunchlineRead: (index: number) => void;

  // round:host-view
  hostViewIndex: number;
  setHostViewIndex: (index: number) => void;

  // round:winner
  winner: Winner;
  setWinner: (winningPlayerId: string, winningPunchlines: string[]) => void;
};

const RoundContext = React.createContext<RoundContextType | undefined>(
  undefined
);

export const RoundProvider = ({ children }: PropsWithChildren<unknown>) => {
  // round:setup
  const [setupState, setSetup] = useState<Setup>({
    setup: "",
    type: "PICK_ONE",
  });

  // round:increment-players-chosen
  const [numPlayersChosenState, setNumPlayersChosen] = useState(0);

  const incrementPlayersChosen = useCallback(
    () => setNumPlayersChosen(numPlayersChosenState + 1),
    [numPlayersChosenState]
  );

  // round:chosen-punchlines
  const [punchlinesChosenState, setPunchlinesChosenState] = useState<
    Punchline[]
  >([]);

  const setPunchlinesChosen = (punchlines: string[][]) => {
    const punchlineObjs = punchlines.map((punchlinesOnePlayer) => ({
      text: punchlinesOnePlayer[0],
      viewed: false,
    }));
    setPunchlinesChosenState(punchlineObjs);
  };

  const markPunchlineRead = useCallback(
    (index: number) => {
      const newPunchlines = [...punchlinesChosenState];
      newPunchlines[index] = {
        ...punchlinesChosenState[index],
        viewed: true,
      };
      setPunchlinesChosenState(newPunchlines);
    },
    [punchlinesChosenState]
  );

  // round:host-view
  const [hostViewIndexState, setHostViewIndex] = useState(0);

  // round:winner
  const [winnerState, setWinner] = useState<Winner>({
    winningPlayerId: "",
    winningPunchlines: [],
  });

  // round:number
  const [roundNumberState, setRoundNumberState] = useState(0);

  const reset = useCallback(() => {
    setRoundNumberState(0);
    setSetup({
      setup: "",
      type: "PICK_ONE",
    });
    setNumPlayersChosen(0);
    setPunchlinesChosen([]);
    setHostViewIndex(0);
    setWinner({
      winningPlayerId: "",
      winningPunchlines: [],
    });
  }, []);

  const setRoundNumber = useCallback(
    (roundNumber: number) => {
      if (roundNumber !== roundNumberState) {
        reset();
        setRoundNumberState(roundNumber);
      }
    },
    [reset, roundNumberState]
  );

  // The context value that will be supplied to any descendants of this component.
  const context = useMemo(
    () => ({
      // round:number
      roundNumber: roundNumberState,
      setRoundNumber,

      // round:setup
      setup: setupState,
      setSetup: (setup: Setup) => setSetup(setup),

      // round:increment-players-chosen
      numPlayersChosen: numPlayersChosenState,
      incrementPlayersChosen,

      // round:chosen-punchlines
      punchlinesChosen: punchlinesChosenState,
      setPunchlinesChosen,
      markPunchlineRead,

      // round:host-view
      hostViewIndex: hostViewIndexState,
      setHostViewIndex: (index: number) => setHostViewIndex(index),

      // round:winner
      winner: winnerState,
      setWinner: (winningPlayerId: string, winningPunchlines: string[]) =>
        setWinner({ winningPlayerId, winningPunchlines }),
    }),
    [
      hostViewIndexState,
      incrementPlayersChosen,
      markPunchlineRead,
      numPlayersChosenState,
      punchlinesChosenState,
      roundNumberState,
      setRoundNumber,
      setupState,
      winnerState,
    ]
  );

  // Wraps the given child components in a Provider for the above context.
  return (
    <RoundContext.Provider value={context}>{children}</RoundContext.Provider>
  );
};

export const useRound = (): RoundContextType => {
  const round = useContext(RoundContext);

  if (round === undefined) {
    throw new Error("useRound() must be used within a RoundProvider");
  }

  return round;
};
