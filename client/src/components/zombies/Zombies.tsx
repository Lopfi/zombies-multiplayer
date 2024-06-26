import { AnimatedSprite, Container, useTick } from "@pixi/react";
import { useColyseusRoom, useColyseusState } from "../../colyseus";
import { ZombieState } from "../../../../server/src/rooms/schema/MyRoomState";
import { ZombieType, zombieInfo } from "../../../../server/src/game/zombies";
import { MyZombie } from "./MyZombie";
import { useLerped, useLerpedRadian } from "../../lib/useLerped";
import { useBodyRef } from "../../lib/physics/hooks";
import Matter, { Body } from "matter-js";
import { ComponentProps } from "react";
import { useGrowling, useZombieBulletHitListener } from "./zombieHooks";
import { HealthBar } from "../HealthBar";
import { EntityShadow } from "../Shadow";
import { useRoomMessageHandler } from "../../lib/networking/hooks";
import {
  playZombieDead,
  playZombieGrowl,
  playZombieHitSound,
} from "../../lib/sound/sound";
import { spriteSheets } from "../../assets/assetHandler";

export function Zombies() {
  const state = useColyseusState();
  const zombies = state?.zombies;

  useRoomMessageHandler("zombieHit", () => {
    playZombieHitSound();
    playZombieGrowl(0.5);
  });

  useRoomMessageHandler("zombieDead", () => {
    playZombieDead();
  });

  return (
    <Container>
      {zombies?.map((zombie) => (
        <Zombie key={zombie.id} zombie={zombie} />
      ))}
    </Container>
  );
}

function Zombie({ zombie }: { zombie: ZombieState }) {
  const sessionId = useColyseusRoom()?.sessionId;
  const isMe = zombie.playerId === sessionId;
  useGrowling();

  if (isMe) {
    return <MyZombie zombie={zombie} />;
  } else {
    return <OtherZombie zombie={zombie} />;
  }
}

function OtherZombie({ zombie }: { zombie: ZombieState }) {
  const collider = useBodyRef(
    () => {
      return Matter.Bodies.circle(zombie.x, zombie.y, 40);
    },
    {
      tags: ["zombie"],
      id: zombie.id,
    }
  );

  useZombieBulletHitListener(collider.current, zombie.id);

  const x = useLerped(zombie.x, 0.1);
  const y = useLerped(zombie.y, 0.1);
  const rotation = useLerpedRadian(zombie.rotation, 0.1);

  useTick(() => {
    Body.setPosition(collider.current, {
      x,
      y,
    });
  });

  return (
    <ZombieSprite
      type={zombie.zombieType}
      maxHealth={zombie.maxHealth}
      x={x}
      y={y}
      rotation={rotation}
      health={zombie.health}
    />
  );
}

export function ZombieSprite({
  x,
  y,
  rotation,
  health,
  maxHealth,
  type,
  ...other
}: {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  rotation: number;
  type: ZombieType;
} & Partial<ComponentProps<typeof AnimatedSprite>>) {
  const typeInfo = zombieInfo[type];

  const scale = 0.4 * typeInfo.size;

  return (
    <Container x={x} y={y}>
      <EntityShadow radius={40} />
      <AnimatedSprite
        rotation={rotation}
        animationSpeed={0.36 * typeInfo.baseSpeed}
        isPlaying
        textures={spriteSheets.zombieAtlas.animations.walk}
        tint={typeInfo.tint ?? 0xffffff}
        scale={{ x: scale, y: scale }}
        anchor={{ x: 0.35, y: 0.55 }}
        {...other}
      />
      <Container y={70}>
        <HealthBar health={health} maxHealth={maxHealth} />
      </Container>
    </Container>
  );
}
