import { useEffect, useReducer, useState } from 'react'
import { applyAction } from './logic/actions'
import { resolveMe } from './logic/players'
import { createGame, type PlayerId } from './logic/state'
import { playerTags } from './logic/view'
import { browserStorage, createLocalStore } from './storage/store'
import { BoardScreen } from './ui/BoardScreen'
import { MyClaimsScreen } from './ui/MyClaimsScreen'
import { SetupScreen } from './ui/SetupScreen'

// Where the game is saved. Phase 1: this phone. M11 swaps this one line
// for the hosted service.
const store = createLocalStore(browserStorage())

export default function App() {
  // The game: loaded from the phone if there's a save, otherwise new.
  // useReducer: React keeps `state` and redraws whenever `dispatch(action)`
  // produces a new one through applyAction.
  const [state, dispatch] = useReducer(
    applyAction,
    undefined,
    () => store.loadGame() ?? createGame(),
  )
  // useState: single values React remembers between redraws.
  const [rememberedMe, setMe] = useState<PlayerId | null>(() => store.loadMe())
  const [screen, setScreen] = useState<'setup' | 'board' | 'claims'>(() =>
    state.players.length === 0 ? 'setup' : 'board',
  )
  const me = resolveMe(state, rememberedMe)

  // useEffect: after every change, save. ([state] = "when state changes".)
  useEffect(() => store.saveGame(state), [state])
  useEffect(() => store.saveMe(me), [me])

  if (screen === 'setup' || me === null) {
    return (
      <SetupScreen
        players={playerTags(state)}
        onAdd={(characterId) => dispatch({ type: 'addPlayer', characterId })}
        onRemove={(playerId) => dispatch({ type: 'removePlayer', playerId })}
        onNewGame={() => dispatch({ type: 'newGame' })}
        onDone={() => setScreen('board')}
      />
    )
  }

  if (screen === 'claims') {
    return (
      <MyClaimsScreen
        state={state}
        me={me}
        dispatch={dispatch}
        onBack={() => setScreen('board')}
      />
    )
  }

  return (
    <BoardScreen
      state={state}
      me={me}
      onSwitchPlayer={setMe}
      onOpenSetup={() => setScreen('setup')}
      onOpenClaims={() => setScreen('claims')}
      dispatch={dispatch}
    />
  )
}
