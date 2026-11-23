import { useEffect, useState, type ReactNode } from 'react'
import { playerFaces } from './logic/art'
import { myPlayer } from './logic/room'
import { playerTags } from './logic/view'
import { browserStorage, createLocalStore } from './storage/store'
import { ArtContext } from './ui/useArt'
import { BoardScreen } from './ui/BoardScreen'
import { BuiltScreen } from './ui/BuiltScreen'
import { MyClaimsScreen } from './ui/MyClaimsScreen'
import { JoinScreen, RoomScreen, StatusScreen } from './ui/RoomScreens'
import { SeasonScreen } from './ui/SeasonScreen'
import { SetupScreen } from './ui/SetupScreen'
import { useKeepAwake } from './ui/useKeepAwake'
import { useRoom } from './ui/useRoom'

// This phone's own settings (which room, keep awake). The game itself
// lives in the shared room (M11, src/storage/firebaseRoom.ts).
const store = createLocalStore(browserStorage())

export default function App() {
  const session = useRoom(store)
  const [screen, setScreen] = useState<
    'board' | 'players' | 'claims' | 'built' | 'season'
  >('board')
  // M10: keep the screen awake while the app is open (toggle on Players).
  const [keepAwake, setKeepAwake] = useState(() => store.loadKeepAwake())
  const keepAwakeSupported = useKeepAwake(keepAwake)
  useEffect(() => store.saveKeepAwake(keepAwake), [keepAwake])

  if (session.phase === 'signing-in')
    return session.failed ? (
      <StatusScreen
        title="📴 No connection"
        text="The very first start needs the internet, once. After that the app works offline."
        action={{ label: 'Try again', onClick: session.retry }}
      />
    ) : (
      <StatusScreen title="🔥 Starting…" />
    )

  if (session.phase === 'no-room')
    return (
      <RoomScreen
        busy={session.busy}
        error={session.error}
        onCreate={session.create}
        onJoin={session.join}
      />
    )

  const { code, view, art, send, leave } = session
  const leaveRoom = () => {
    leave()
    setScreen('board')
  }

  if (!view || view.status === 'loading')
    return (
      <StatusScreen
        title={`Opening ${code}…`}
        text="Joining a room the first time needs the internet."
        secondary={{ label: '← Other room', onClick: leaveRoom }}
      />
    )

  if (view.status === 'missing')
    return (
      <StatusScreen
        title={`No room ${code}`}
        text="Check the code with your friends, or create a new room."
        action={{ label: 'OK', onClick: leaveRoom }}
      />
    )

  const { state } = view
  const me = myPlayer(state, session.deviceId)
  const players = playerTags(state)
  // M12: every screen below can show faces and item pictures.
  const withArt = (screen: ReactNode) => (
    <ArtContext.Provider value={{ art, faces: playerFaces(state) }}>
      {screen}
    </ArtContext.Provider>
  )

  if (me === null)
    return withArt(
      <JoinScreen
        code={code}
        players={players}
        onPick={(characterId) =>
          send({ type: 'joinRoom', playerId: session.deviceId, characterId })
        }
        onLeave={leaveRoom}
      />,
    )

  const connection = { online: view.online, waiting: view.waiting }
  const toBoard = () => setScreen('board')

  if (screen === 'players')
    return withArt(
      <SetupScreen
        roomCode={code}
        players={players}
        me={me}
        myCharacter={state.players.find((p) => p.id === me)?.characterId}
        onPickCharacter={(characterId) =>
          send({ type: 'pickCharacter', playerId: me, characterId })
        }
        onRemove={(playerId) => send({ type: 'removePlayer', playerId })}
        onNewGame={() => {
          send({ type: 'newGame' })
          toBoard()
        }}
        onLeave={leaveRoom}
        onDone={toBoard}
        keepAwake={keepAwake}
        keepAwakeSupported={keepAwakeSupported}
        onToggleKeepAwake={() => setKeepAwake((on) => !on)}
      />,
    )

  if (screen === 'season')
    return withArt(
      <SeasonScreen
        state={state}
        onPick={(season) => {
          send({ type: 'setSeason', season })
          toBoard()
        }}
        onBack={toBoard}
      />,
    )

  if (screen === 'built')
    return withArt(
      <BuiltScreen state={state} dispatch={send} onBack={toBoard} />,
    )

  if (screen === 'claims')
    return withArt(
      <MyClaimsScreen
        state={state}
        me={me}
        connection={connection}
        dispatch={send}
        onBack={toBoard}
      />,
    )

  return withArt(
    <BoardScreen
      state={state}
      me={me}
      connection={connection}
      onOpenSetup={() => setScreen('players')}
      onOpenClaims={() => setScreen('claims')}
      onOpenBuilt={() => setScreen('built')}
      onOpenSeason={() => setScreen('season')}
      dispatch={send}
    />,
  )
}
