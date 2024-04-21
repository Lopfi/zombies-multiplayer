import {
  PlayerHealthState,
  PlayerState,
} from "../../../../server/src/rooms/schema/MyRoomState";
import { useColyseusRoom, useColyseusState } from "../../colyseus";
import { Sprite, useTick } from "@pixi/react";
import { useLerped, useLerpedRadian } from "../../lib/useLerped";
import { PlayerSprite } from "./PlayerSprite";
import { PlayerSelf } from "./PlayerSelf";
import Matter, { Body } from "matter-js";
import { useBodyRef } from "../../lib/physics/hooks";
import { SpectateControls } from "./SpectateControls";
import { useState } from "react";

export function Players() {
  const state = useColyseusState();
  const players = state?.players;

  if (!players) {
    return null;
  }

  return (
    <>
      {Array.from(players.entries()).map(([id, player]) => (
        <Player key={id} player={player} />
      ))}
    </>
  );
}

function Player({ player }: { player: PlayerState }) {
  const sessionId = useColyseusRoom()?.sessionId;
  const isMe = player.sessionId === sessionId;

  if (isMe) {
    return player.healthState == PlayerHealthState.ALIVE ? (
      <PlayerSelf player={player} />
    ) : (
      <>
        <SpectateControls />
        <PlayerGrave x={player.x} y={player.y} />
      </>
    );
  } else {
    return <OtherPlayer player={player} />;
  }
}

function OtherPlayer({ player }: { player: PlayerState }) {
  if (player.healthState === PlayerHealthState.ALIVE) {
    return <OtherAlivePlayer player={player} />;
  } else {
    return <PlayerGrave x={player.x} y={player.y} />;
  }
}

function PlayerGrave({ x, y }: { x: number; y: number }) {
  const rotation = useState(Math.random() * Math.PI * 2)[0];
  return (
    <Sprite
      anchor={[0.5, 0.5]}
      x={x}
      y={y}
      rotation={rotation}
      image="assets/dogtag.png"
      scale={0.2}
    />
  );
}

function OtherAlivePlayer({ player }: { player: PlayerState }) {
  const x = useLerped(player.x, 0.5);
  const y = useLerped(player.y, 0.5);
  const rotation = useLerpedRadian(player.rotation, 0.5);
  const collider = useBodyRef(() => {
    return Matter.Bodies.circle(player.x, player.y, 40);
  });
  useTick(() => {
    Body.setPosition(collider.current, {
      x,
      y,
    });
  });

  return (
    <PlayerSprite
      playerClass={player.playerClass}
      x={x}
      y={y}
      rotation={rotation}
      health={player.health}
      velocityX={player.velocityX}
      velocityY={player.velocityY}
    />
  );
}