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
    "assets/rojo-torta.png", // ← REGALO FINAL BLOQUEADO
  ];

  const giftCinematics = [
    {
      video: "",
      text: "¡Jogger de dudosa procedencia desbloqueado! (10k en avellaneda)",
      audio: "",
    },
    {
      video: "assets/buzonikeswoosh.mp4",
      text: "¡Buzo Nike SWOOSH desbloqueado!",
      audio: "",
    },
    { video: "", text: "¡Medias Game of Thrones desbloqueadaas!", audio: "" },
    { video: "", text: "¡Cuaderno A4 de Historia desbloqueado!", audio: "" },
    { video: "", text: "¡Una remera Nike salvaje apareció!", audio: "" },
    { video: "", text: "¡Otro jogger por si el otro no te entra!", audio: "" },
    { video: "", text: "¡La torta final, tu premio máximo!", audio: "" },
  ];

  const finalCinematic = {
    video: "",
    text: "Te amooooo",
    audio: "",
  };

  const npcCinematic = {
    video: "",
    text: "28/08",
    audio: "",
  };

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


  // --- Cinemáticas sin video real ---
  function showCinematic({ video, text, audio }, callback, isFinal = false) {
    cinematicOverlay.classList.remove("hidden");
    cinematicText.textContent = text;

    if (video) {
      cinematicVideo.src = video;
      cinematicVideo.classList.remove("hidden");
      cinematicVideo.muted = true;
      cinematicVideo.play().catch(() => {});

      cinematicVideo.onended = () => {
        cinematicOverlay.classList.add("hidden");
        cinematicVideo.classList.add("hidden");
        cinematicVideo.src = "";
        if (callback) callback();
        if (isFinal) {
          endGame();
        } else {
          gameActive = true;
          if (!isMuted) backgroundMusic.play();
        }
      };
    } else {
      cinematicVideo.classList.add("hidden");

      setTimeout(() => {
        cinematicOverlay.classList.add("hidden");
        if (callback) callback();
        if (isFinal) {
          endGame();
        } else {
          gameActive = true;
          if (!isMuted) backgroundMusic.play();
        }
      }, 4000);
    }

    gameActive = false;
    if (!isMuted) backgroundMusic.pause();
  }

  // --- Colisiones ---
  function checkCollision(obj1, obj2) {
    const r1 = obj1.getBoundingClientRect();
    const r2 = obj2.getBoundingClientRect();
    return !(
      r1.right < r2.left ||
      r1.left > r2.right ||
      r1.bottom < r2.top ||
      r1.top > r2.bottom
    );
  }

  // --- Lógica principal del juego ---
  function gameLoop() {
    if (gameFinished) {
      cancelAnimationFrame(animationFrameId);
      return;
    }

    if (gameActive) {
      let dx = 0,
        dy = 0;
      if (keys.KeyW) dy -= PLAYER_SPEED;
      if (keys.KeyS) dy += PLAYER_SPEED;
      if (keys.KeyA) dx -= PLAYER_SPEED;
      if (keys.KeyD) dx += PLAYER_SPEED;
      if (dx || dy) setPlayerPosition(playerX + dx, playerY + dy);

      // Interacción con NPC
      if (!npcInteracted && checkCollision(player, npc) && keys.Space) {
        keys.Space = false;
        npcInteracted = true;
        showCinematic(npcCinematic, () => {
          spawnGifts();
          giftCounter.classList.remove("hidden");

          // Aquí ocultamos la instrucción tras interactuar con NPC
          instructionText.classList.add("hidden");

          if (!isMuted) backgroundMusic.play();
        });
      }

      // Interacción con regalos
      if (npcInteracted) {
        document.querySelectorAll(".gift").forEach((gift) => {
          if (
            gift.dataset.found === "false" &&
            checkCollision(player, gift) &&
            keys.Space
          ) {
            const id = parseInt(gift.dataset.id);

            if (
              id === giftImages.length - 1 &&
              giftsFound < giftImages.length - 1
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
  function initGame() {
    giftsFound = 0;
    npcInteracted = false;
    gameActive = false;
    gameFinished = false;

    giftCounter.textContent = `Regalos encontrados: 0/${giftImages.length}`;
    giftCounter.classList.add("hidden");

    player.classList.add("hidden");
    npc.classList.add("hidden");
    giftsWrapper.innerHTML = "";
    cinematicOverlay.classList.add("hidden");
    cinematicVideo.classList.add("hidden");

    // Ocultar instrucción en menú de inicio
    instructionText.classList.add("hidden");

    backgroundMusic.src = "assets/audio/menu_music.mp3";
    backgroundMusic.volume = 0.3;
    backgroundMusic.loop = true;
    backgroundMusic.muted = isMuted;
  }

  function startGameplay() {
    startEndScreen.classList.add("hidden");
    player.classList.remove("hidden");
    npc.classList.remove("hidden");
    setPlayerPosition(50, 50);
    gameActive = true;

    // Mostrar instrucción apenas inicia el juego
    instructionText.classList.remove("hidden");

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

    backgroundMusic.pause();
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
    [backgroundMusic, pickupSound, npcMusic, endMusic].forEach(
      (audio) => (audio.muted = isMuted)
    );

    if (isMuted) {
      muteIcon.classList.replace("fa-volume-up", "fa-volume-mute");
      backgroundMusic.pause();
    } else {
      muteIcon.classList.replace("fa-volume-mute", "fa-volume-up");
      backgroundMusic.play().catch(() => {});
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
