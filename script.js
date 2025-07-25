document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos del DOM ---
  const player = document.getElementById("player");
  const npc = document.getElementById("npc");

  const giftCounter = document.getElementById("gift-counter");
  const giftsWrapper = document.getElementById("gifts-wrapper");
  const cinematicOverlay = document.getElementById("cinematic-overlay");
  const cinematicVideo = document.getElementById("cinematic-video");
  const cinematicText = document.getElementById("cinematic-text");
  const startEndScreen = document.getElementById("start-end-screen");
  const screenTitle = document.getElementById("screen-title");
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");
  const gameContainer = document.getElementById("game-container");
  const instructionText = document.getElementById("instruction-text");

  const backgroundMusic = document.getElementById("background-music");
  const menuMusic = document.getElementById("menu-music");
  const pickupSound = document.getElementById("pickup-sound");
  const npcMusic = document.getElementById("npc-music");
  const endMusic = document.getElementById("end-music");
  const muteButton = document.getElementById("mute-button");
  const muteIcon = muteButton.querySelector("i");

  // --- Configuración del juego ---
  const PLAYER_SPEED = 4;
  const PLAYER_WIDTH = 210;
  const PLAYER_HEIGHT = 210;

  // --- Estado ---
  let playerX = 0;
  let playerY = 0;
  let giftsFound = 0;
  let gameActive = false;
  let gameFinished = false;
  let npcInteracted = false;
  let isMuted = false;
  let facingRight = true;
  let animationFrameId = null;

  // --- Teclas ---
  const keys = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    Space: false,
  };

  // --- Recursos del juego ---
  const giftImages = [
    "assets/jogger-nike.png",
    "assets/buzo-nike.png",
    "assets/got-medias.png",
    "assets/cuaderno-a4.png",
    "assets/remera-nike.png",
    "assets/jogger2.png",
    "assets/rojo-torta.png", //
  ];

  const giftCinematics = [
    {
      video: "cinematics/cinematica_jogger1.mp4",
      text: "¡Jogger de dudosa procedencia desbloqueado! (10k en avellaneda)",
      audio: "assets/audio/cinematic-audio.mp3",
    },
    {
      video: "cinematics/cinematica_buzo-nike.mp4",
      text: "¡Buzo Nike SWOOSH desbloqueado!",
      audio: "assets/audio/cinematic-audio.mp3",
    },
    {
      video: "cinematics/cinematica_got-mediass.mp4",
      text: "¡Medias Game of Thrones desbloqueadaas!",
      audio: "",
    },
    {
      video: "",
      text: "¡Cuaderno A4 de Historia desbloqueado!",
      audio: "assets/audio/cinematic-audio.mp3",
    },
    {
      video: "cinematics/cinematica_remera-nike.mp4",
      text: "¡Una remera Nike salvaje apareció!",
      audio: "assets/audio/cinematic-audio.mp3",
    },
    {
      video: "cinematics/cinematica_jogger2.mp4",
      text: "¡Otro jogger por si el otro no te entra!",
      audio: "assets/audio/cinematic-audio.mp3",
    },
    {
      video: "",
      text: "CHOCOTORTA DEL BOJO DESBLOQUEADAAA!!",
      audio: "assets/audio/bojo.mp3",
    },
  ];

  const finalCinematic = {
    video: "cinematics/cinematica_end.mp4",
    text: "🩷",
    audio: "",
  };

  const npcCinematic = {
    video: "cinematics/cinematica_npc.mp4",
    text: "🩷",
    audio: "",
  };

  npc.style.backgroundImage = "url('assets/yo.png')"; // imagen base del NPC

  npc.classList.add("masked", "floating");
  // --- Funciones para máscara y animación del NPC ---
  // --- Inicialización visual del NPC (antes de interactuar)
  // --- Inicialización visual del NPC (antes de interactuar)
  function initNpcBeforeInteraction() {
    npc.classList.remove("hidden");
    npc.classList.add("masked", "floating", "breathing");
    npc.style.backgroundImage = "url('assets/yo.png')"; // Imagen del NPC real
    npc.style.backgroundColor = "black"; // Fondo negro para efecto máscara
    npc.style.webkitMaskImage = "url('assets/yo-silueta.png')";
    npc.style.maskImage = "url('assets/yo-silueta.png')";
    npc.style.webkitMaskSize = "cover";
    npc.style.maskSize = "cover";
    npc.style.webkitMaskRepeat = "no-repeat";
    npc.style.maskRepeat = "no-repeat";
  }

  // --- Después de la primera interacción: se revela el NPC completo
  function onFirstNpcInteraction() {
    npc.classList.remove("masked", "floating");
    npc.style.backgroundColor = "transparent";
    npc.style.webkitMaskImage = "none";
    npc.style.maskImage = "none";
  }

  // --- Movimiento del jugador ---
  function setPlayerPosition(x, y) {
    const prevX = playerX;
    playerX = Math.max(
      0,
      Math.min(x, gameContainer.offsetWidth - PLAYER_WIDTH)
    );
    playerY = Math.max(
      0,
      Math.min(y, gameContainer.offsetHeight - PLAYER_HEIGHT)
    );

    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;

    // Girar sprite horizontalmente sin mover jugador visualmente
    if (playerX > prevX && !facingRight) {
      player.style.transform = "scaleX(1)";
      facingRight = true;
    } else if (playerX < prevX && facingRight) {
      player.style.transform = "scaleX(-1)";
      facingRight = false;
    }

    // Parallax fondo
    const bgPosX = Math.floor(playerX / 25);
    const bgPosY = Math.floor(playerY / 25);

    gameContainer.style.backgroundPosition = `calc(5% - ${bgPosX}px) calc(5% - ${bgPosY}px)`;
  }

  // --- Spawneo de regalos ---
  function spawnGifts() {
    console.log("spawnGifts() ejecutado");
    giftsWrapper.innerHTML = "";
    const margin = 40;
    const giftSize = 200; // width y height de .gift
    const minDistance = giftSize + 30; // distancia mínima para evitar superposiciones
    const placed = [];

    // Primero, colocamos el gift7 (torta roja) fijo junto al NPC
    const npcRect = npc.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const offsetLeft = 1 * 37.8; // 20cm en px (1cm ≈ 37.8px)

    const gift7X = npcRect.left - containerRect.left - offsetLeft;
    const gift7Y = npcRect.top - containerRect.top;

    const gift7 = document.createElement("div");
    gift7.classList.add("gift", "locked");
    gift7.style.backgroundImage = `url(${giftImages[giftImages.length - 1]})`;
    gift7.style.left = `${gift7X}px`;
    gift7.style.top = `${gift7Y}px`;
    gift7.style.zIndex = "20";
    gift7.dataset.id = giftImages.length - 1;
    gift7.dataset.found = "false";
    giftsWrapper.appendChild(gift7);

    placed.push({ x: gift7X, y: gift7Y });

    // Ahora, colocamos el resto de regalos sin superposición
    for (let index = 0; index < giftImages.length - 1; index++) {
      let tries = 0;
      const maxTries = 1000;
      let x, y;
      let tooClose;

      do {
        x =
          Math.floor(
            Math.random() * (gameContainer.clientWidth - giftSize - margin * 2)
          ) + margin;
        y =
          Math.floor(
            Math.random() * (gameContainer.clientHeight - giftSize - margin * 2)
          ) + margin;

        tooClose = placed.some((pos) => {
          const dx = pos.x - x;
          const dy = pos.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });

        tries++;
        if (tries > maxTries) {
          console.warn(
            "No se pudo encontrar lugar sin superposición para regalo",
            index
          );
          break;
        }
      } while (tooClose);

      placed.push({ x, y });

      const gift = document.createElement("div");
      gift.classList.add("gift");
      gift.style.backgroundImage = `url(${giftImages[index]})`;
      gift.style.left = `${x}px`;
      gift.style.top = `${y}px`;
      gift.style.zIndex = "20";
      gift.dataset.id = index;
      gift.dataset.found = "false";

      giftsWrapper.appendChild(gift);

      console.log(`Gift #${index + 1} creado en x:${x}, y:${y}`);
    }
  }

  // --- Cinemáticas con video y audio particular ---
  let isFinalCinematicPlaying = false;

  function showCinematic(
    { video, text, audio },
    callback = null,
    isFinal = false
  ) {
    cinematicOverlay.classList.remove("hidden");
    cinematicText.textContent = text;

    // Pausar música de fondo siempre al mostrar una cinemática
    backgroundMusic.pause();

    // Si es la cinemática final, activamos bandera
    if (isFinal) {
      isFinalCinematicPlaying = true;
    }

    // Detener audio de cinemática previo
    if (cinematicOverlay.currentAudio) {
      cinematicOverlay.currentAudio.pause();
      cinematicOverlay.currentAudio = null;
    }

    // Reproducir audio específico de la cinemática
    let cinematicAudio = null;
    if (audio && !isMuted) {
      cinematicAudio = new Audio(audio);
      cinematicAudio.volume = 0.7;
      cinematicAudio.play().catch(() => {});
      cinematicOverlay.currentAudio = cinematicAudio;
    }

    gameActive = false;

    const finishCinematic = () => {
      cinematicOverlay.classList.add("hidden");

      // Ejecutar callback si existe
      if (callback) callback();

      if (isFinal) {
        // Asegurar que backgroundMusic no suene más
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        endGame();
        isFinalCinematicPlaying = false; // por si reinicia el juego
      } else {
        gameActive = true;
        if (!isMuted && !isFinalCinematicPlaying) {
          backgroundMusic.play().catch(() => {});
        }
      }
    };

    if (video) {
      cinematicVideo.src = video;
      cinematicVideo.classList.remove("hidden");
      cinematicVideo.muted = false;

      cinematicVideo.play().catch(() => {});

      cinematicVideo.onended = () => {
        cinematicVideo.onended = null;
        cinematicVideo.classList.add("hidden");
        cinematicVideo.src = "";
        finishCinematic();
      };
    } else {
      cinematicVideo.classList.add("hidden");
      setTimeout(finishCinematic, 4000);
    }
  }

  // --- Colisiones ---
  // Función general de colisión ajustable
  function checkUltraTightCollision(obj1, obj2, shrink = 0.995) {
    const r1 = obj1.getBoundingClientRect();
    const r2 = obj2.getBoundingClientRect();

    const shrinkX = (r1.width * shrink) / 2;
    const shrinkY = (r1.height * shrink) / 2;

    const tightR1 = {
      top: r1.top + shrinkY,
      bottom: r1.bottom - shrinkY,
      left: r1.left + shrinkX,
      right: r1.right - shrinkX,
    };

    return !(
      tightR1.right < r2.left ||
      tightR1.left > r2.right ||
      tightR1.bottom < r2.top ||
      tightR1.top > r2.bottom
    );
  }

  // --- Lógica principal del juego ---
  let memePlaying = false; // Variable de control

  function gameLoop() {
    if (gameFinished) {
      cancelAnimationFrame(animationFrameId);
      return;
    }

    if (gameActive) {
      // Movimiento jugador
      let dx = 0,
        dy = 0;
      if (keys.KeyW) dy -= PLAYER_SPEED;
      if (keys.KeyS) dy += PLAYER_SPEED;
      if (keys.KeyA) dx -= PLAYER_SPEED;
      if (keys.KeyD) dx += PLAYER_SPEED;
      if (dx || dy) setPlayerPosition(playerX + dx, playerY + dy);

      // Interacción inicial con NPC
      if (
        !npcInteracted &&
        checkUltraTightCollision(player, npc, 0.995) &&
        keys.Space
      ) {
        keys.Space = false;
        npcInteracted = true;

        // *** NUEVO: ocultar la instrucción en la primera interacción con el NPC ***
        instructionText.classList.add("hidden");

        // Cambiar imagen del NPC a la real
        npc.style.backgroundImage = "url('assets/yo.png')";
        npc.style.backgroundSize = "cover";
        npc.style.backgroundRepeat = "no-repeat";
        npc.style.backgroundColor = "transparent";

        onFirstNpcInteraction();

        showCinematic(npcCinematic, () => {
          spawnGifts();
          giftCounter.classList.remove("hidden");
          instructionText.classList.add("hidden");
          if (!isMuted) backgroundMusic.play();
        });
      }

      // Reproducción de video meme tras interacción inicial
      if (npcInteracted) {
        const memeVideo = document.getElementById("meme-video");
        const isCollidingWithNPC = checkUltraTightCollision(player, npc);
        const gift7Unlocked =
          giftsFound === giftImages.length ||
          document.querySelector(".gift.locked") === null;

        if (
          isCollidingWithNPC &&
          keys.Space &&
          !memePlaying &&
          !gift7Unlocked // Solo si la torta NO está desbloqueada
        ) {
          memePlaying = true;
          keys.Space = false;

          // Configuración del video
          memeVideo.src = "assets/kisss-fish.mp4"; // ← ruta de tu video con chroma
          memeVideo.muted = false;
          memeVideo.playbackRate = 1;
          memeVideo.currentTime = 0;

          // Posicionar encima del NPC
          const npcRect = npc.getBoundingClientRect();
          const containerRect = gameContainer.getBoundingClientRect();
          const cmToPx = 30.8;
          const offsetY = cmToPx * 6;

          const left =
            npcRect.left - containerRect.left + npcRect.width / 2 - 110; // centrado (320px / 2)
          const top = npcRect.top - containerRect.top - offsetY;

          memeVideo.style.left = `${left}px`;
          memeVideo.style.top = `${top}px`;
          memeVideo.classList.remove("hidden");

          memeVideo.play().catch(() => {
            memePlaying = false;
          });

          memeVideo.onended = () => {
            memePlaying = false;
            memeVideo.classList.add("hidden");
            memeVideo.src = "";
          };
        }
      }

      // Interacción con regalos
      if (npcInteracted) {
        document.querySelectorAll(".gift").forEach((gift) => {
          if (
            gift.dataset.found === "false" &&
            checkUltraTightCollision(player, gift, 0.995) &&
            keys.Space
          ) {
            const id = parseInt(gift.dataset.id);

            if (
              id === giftImages.length - 1 && // Si es la torta roja final
              giftsFound < giftImages.length - 1 // Y no desbloqueaste todos los demás
            ) {
              keys.Space = false;
              return;
            }

            if (giftsFound === giftImages.length - 2) {
              const locked = document.querySelector(".gift.locked");
              if (locked) locked.classList.remove("locked");
            }

            keys.Space = false;
            gift.dataset.found = "true";
            gift.classList.add("hidden");
            giftsFound++;
            giftCounter.textContent = `Regalos encontrados: ${giftsFound}/${giftImages.length}`;

            if (!isMuted) {
              pickupSound.currentTime = 0;
              pickupSound.play();
            }

            const cinematic = giftCinematics[id];
            showCinematic(cinematic, () => {
              if (giftsFound === giftImages.length) {
                showCinematic(finalCinematic, null, true);
              }
            });
          }
        });
      }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  // --- Inicialización del juego ---
  // --- Inicialización del juego ---
function initGame() {
  giftsFound = 0;
  npcInteracted = false;
  gameActive = false;
  gameFinished = false;

  giftCounter.textContent = `Regalos encontrados: 0/${giftImages.length}`;
  giftCounter.classList.add("hidden");
  instructionText.classList.add("hidden"); // Ocultar instrucciones en menú inicial

  player.classList.add("hidden");

  npc.classList.remove("hidden");
  npc.classList.add("breathing");

  npc.style.backgroundImage = "url('assets/yo-silueta.png')";
  npc.style.backgroundSize = "cover";
  npc.style.backgroundRepeat = "no-repeat";
  npc.style.backgroundColor = "transparent";

  giftsWrapper.innerHTML = "";
  cinematicOverlay.classList.add("hidden");
  cinematicVideo.classList.add("hidden");

  backgroundMusic.src = "assets/audio/background-music.mp3";
  backgroundMusic.volume = 0.1;
  backgroundMusic.loop = true;

  menuMusic.volume = 0.25;
  menuMusic.loop = true;
  menuMusic.currentTime = 0;
  if (!isMuted) {
    menuMusic.play().catch(() => {});
  }
}

function startGameplay() {
  menuMusic.pause();
  menuMusic.currentTime = 0;

  startEndScreen.classList.add("hidden");
  player.classList.remove("hidden");
  npc.classList.remove("hidden");
  setPlayerPosition(50, 50);
  gameActive = true;

  instructionText.classList.remove("hidden"); // <-- Aquí se muestra la instrucción

  if (!isMuted) {
    backgroundMusic.play().catch(() => {});
  }

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

  function endGame() {
    gameFinished = true;
    gameActive = false;

    player.classList.add("hidden");
    npc.classList.add("hidden");
    giftsWrapper.innerHTML = "";
    giftCounter.classList.add("hidden");
    cinematicOverlay.classList.add("hidden");
    cinematicVideo.classList.add("hidden");
    instructionText.classList.add("hidden");

    // Asegurar que la música de fondo no suene más
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;

    // Si querés música de cierre:
    // Volver a la música de menú
    if (!isMuted) {
      menuMusic.currentTime = 0;
      menuMusic.play().catch(() => {});
    }

    startEndScreen.classList.remove("hidden");
    screenTitle.textContent = "¡Feliz Cumpleaños!";
    startButton.classList.remove("hidden");
    restartButton.classList.add("hidden");
  }

  // --- Eventos de teclado ---
  document.addEventListener("keydown", (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
    if (e.code === "Space") {
      setTimeout(() => {
        keys.Space = true;
      }, 50);
      e.preventDefault();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
    if (e.code === "Space") keys.Space = false;
  });

  // --- Botones ---
  muteButton.addEventListener("click", () => {
    isMuted = !isMuted;
    [backgroundMusic, pickupSound, npcMusic, endMusic, menuMusic].forEach(
      (audio) => (audio.muted = isMuted)
    );

    if (isMuted) {
      muteIcon.classList.replace("fa-volume-up", "fa-volume-mute");
      backgroundMusic.pause();
      menuMusic.pause();
    } else {
      muteIcon.classList.replace("fa-volume-mute", "fa-volume-up");

      // Si estoy en el menú inicial o final (no activo y no terminado aún => menú inicial,
      // o terminado => estamos en pantalla final) => reproducir menuMusic.
      if (!gameActive || gameFinished) {
        menuMusic.play().catch(() => {});
      } else if (gameActive && !gameFinished && !isFinalCinematicPlaying) {
        backgroundMusic.play().catch(() => {});
      }
    }
  });

  startButton.addEventListener("click", () => {
    initGame();
    startGameplay();
  });

  restartButton.addEventListener("click", () => {
    initGame();
    startGameplay();
  });

  // --- Inicio ---
  initGame();
  console.log(
    "Cantidad de regalos en DOM:",
    giftsWrapper.querySelectorAll(".gift").length
  );
});
