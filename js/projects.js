/**
 * projects.js  –  Project Configuration File
 * ═══════════════════════════════════════════════════════════
 *
 * HOW TO ADD A NEW PROJECT:
 * ─────────────────────────
 * 1.  Drop your video  (.mp4 / .webm)  into  assets/videos/
 * 2.  Drop your image  (.png / .jpg)   into  assets/images/
 * 3.  Copy one of the objects below and paste it inside the
 *     PROJECTS array.  Fill in your fields and save.
 * 4.  Reload index.html — your card appears automatically!
 *
 * FIELD REFERENCE:
 * ─────────────────
 *  title        (string)   – Project name shown on the card.
 *  description  (string)   – Full description shown in the modal.
 *  year         (number)   – Release / completion year.
 *  videoPath    (string|null) – Path relative to index.html.
 *                              e.g. "assets/videos/mygame.mp4"
 *                              Set to null if no video.
 *  imagePath    (string|null) – Thumbnail / screenshot path.
 *                              Used as poster for video cards.
 *                              Set to null to show a placeholder.
 *  tags         (string[]) – Filter tags. Use lowercase, no spaces.
 *                            Recognised filter values:
 *                              "unity" | "godot" | "unreal" |
 *                              "jam"   | "mobile" | any custom tag
 *  links        (object[]) – Buttons shown in the modal.
 *                  label  – Button text.
 *                  href   – Full URL.
 *                  icon   – Optional HTML entity, e.g. "&#127918;" for 🎮
 *
 * ORDERING:
 *   Cards are rendered in the order listed here.
 *   Move an object up or down to change its position.
 * ═══════════════════════════════════════════════════════════
 */

window.PROJECTS = [

  /* ── Project 1 ────────────────────────────────────────── */
  {
    title:       "BridgSign",
    description: "A real-time sign language avatar built in Unity. " +
                 "MediaPipe pose and hand tracking animate a Mixamo-rigged character. " +
                 "A custom forward kinematics system recreates precise finger articulation.",
    year:        2025,
    videoPath:   "assets/videos/BridgSign.mp4",   // ← replace with your file
    imagePath:   "assets/images/BridgSign.png",   // ← replace with your file
    tags:        ["unity",],
   // links: [
     // { label: "Play on itch.io",  href: "https://yourname.itch.io/hollow-depths", icon: "&#127918;" },
      //{ label: "Source on GitHub", href: "https://github.com/yourhandle/hollow-depths", icon: "&#128279;" }
    //]
  },

  /* ── Project 2 ────────────────────────────────────────── */
  {
    title:       "Bubble Escape",
    description: "A cozy platformer game where you play with a bubble " +
                 "collect bubbles to get bigger and be able to use abilities like dash, shooting mobs. " +
                 "you get smaller when you consume bubbles, might help in some few obstacles " +
                 "relaxing lo-fi music. Global Game Jam Winner Tunisia 2024",
    year:        2025,
    videoPath:   "assets/videos/BubbleEscape.mp4",
    imagePath:   "assets/images/Escape.png",
    tags:        ["unity", "jam"],
    links: [
      { label: "Download",        href: "https://drive.google.com/file/d/1puu2bwam60M7bThtz9rmIS9ZUMJ9_RsO/view?usp=sharing",  icon: "&#9654;" },
      
    ]
  },

  /* ── Project 3 ────────────────────────────────────────── */
  {
    title:       "A World Without You",
    description: "48-hour game-jam entry (PolyTech Monastir Game Jam 2023). " +
                 "A fantasy adventure game that combine action, exploration and environmental restoration. " +
                 "A game that will teach the player how important is out role to protect our mother nature. " +
                 "An open world game where you have tasks that needs to be done to save your world",
    year:        2024,
    videoPath:   "assets/videos/WithoutYou.mp4",
    imagePath:   "assets/images/WithoutYou.png",
    tags:        ["unity", "jam"],
    links: [
      { label: "itch.io page",     href: "https://yourname.itch.io/ragnarok-runners", icon: "&#127918;" }
    ]
  },

  /* ── Project 4 ────────────────────────────────────────── */
  ,{
    title:       "Khotoua",
    description: "My Capstone Project. " +
                 "This project was made during my internship with DMNova " +
                 "the entire game is controlled via motion capture, using only my laptop camera. " +
                 "even the UX is through Motion " +
                 "No Extra Hardware",
    year:        2024,
    videoPath:   "assets/videos/Trailer.mp4",
    imagePath:   "assets/images/Trailer.png",
    tags:        ["unity",],
    links: [
     // { label: "Watch trailer", href: "https://youtube.com/", icon: "&#127909;" },
     // { label: "Download",      href: "https://drive.google.com/file/d/1ckHnI2yau7AraQhzUEsKA0ERmhn0ZmvV/view?usp=sharing", icon: "&#9654;" }
    ]
  }


  /* ── Project 5 ────────────────────────────────────────── */
  ,{
    title:       "Into My Brain",
    description: "A Tower Defense game built in Unity. " +
                 "Drag the orbs to shoot negative Hormones to prevent them entering the brain " +
                 "Heal the positive Hormones to let them reach the brain. " +
                 "Upgrade your weapons and healers. " +
                 "I need a big Laugh",
    year:        2023,
    videoPath:   "assets/videos/IntoTheBrain.mp4",
    imagePath:   "assets/images/IntoTheBrain.png",
    tags:        ["unity", "jam"],
    links: [
     // { label: "Watch trailer", href: "https://youtube.com/", icon: "&#127909;" },
      { label: "Download",      href: "https://drive.google.com/file/d/1ckHnI2yau7AraQhzUEsKA0ERmhn0ZmvV/view?usp=sharing", icon: "&#9654;" }
    ]
  }
  /* ── Project 6 ────────────────────────────────────────── */
  ,{
    title:       "Keskayoun",
    description: "Keskayoun was our school project, and it was the first game we developed. " +
                 "Attackers try to destroy the pile of rocks at first then try to rebuild them. " +
                 "Defenders must eliminate the attackers with the ball before they rebuild the pile " +
                 "Avatar Selection, and abilities selection " +
                 "Teal VS Team. " +
                 "Game Of the Year In ESPRIT SCHOOL",
    year:        2023,
    videoPath:   "assets/videos/Keskayoun.mp4",
    imagePath:   "assets/images/Keskayoun.png",
    tags:        ["unity", "mobile"],
    links: [
      { label: "Our Radio Interview", href: "https://www.youtube.com/watch?v=_gNxHEQnh80&list=PLFwivOw9Fo7sx0_JOffA-0ZftR8vgWH6Z&index=128", icon: "&#127909;" },
     // { label: "Download",      href: "https://drive.google.com/file/d/1ckHnI2yau7AraQhzUEsKA0ERmhn0ZmvV/view?usp=sharing", icon: "&#9654;" }
    ]
  }



  /*
   * ── HOW TO ADD MORE: copy the template below ───────────
   *
   * ,{
   *   title:       "My New Game",
   *   description: "Describe your game here.",
   *   year:        2025,
   *   videoPath:   "assets/videos/my-new-game.mp4",
   *   imagePath:   "assets/images/my-new-game.jpg",
   *   tags:        ["unity", "mobile"],
   *   links: [
   *     { label: "Play", href: "https://...", icon: "&#127918;" }
   *   ]
   * }
   *
   * ─────────────────────────────────────────────────────── */
];
