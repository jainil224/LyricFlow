export interface LyricLine {
  time: number; // Time in seconds when the line starts
  text: string;
}

export const TRACK_LYRICS: Record<string, LyricLine[]> = {
  'sunflower': [
    { time: 0, text: "♪ (Intro instrumental beat) ♪" },
    { time: 5, text: "Ayy, ayy, ayy, ayy (Ooh)" },
    { time: 9, text: "Ooh, ooh, ooh, ooh (Ooh)" },
    { time: 13, text: "Needless to say, I keep her in check" },
    { time: 17, text: "She was a bad-bad, nevertheless" },
    { time: 21, text: "Calling it quits now, baby, I'm a wreck" },
    { time: 25, text: "Crash at my place, baby, you're a wreck" },
    { time: 29, text: "Thinking in a car, side-track" },
    { time: 33, text: "Some things you say that you can't take back" },
    { time: 37, text: "If I'm gonna fall, don't trip me, babe" },
    { time: 41, text: "Then you're left in the dust, unless I stuck by ya" },
    { time: 45, text: "You're the sunflower, I think your love would be too much" },
    { time: 49, text: "Or you'll be left in the dust, unless I stuck by ya" },
    { time: 53, text: "You're the sunflower, you're the sunflower" },
    { time: 57, text: "Every time I'm leaving on ya, you don't make it easy" },
    { time: 61, text: "Wish I could be there for ya, give me a reason" },
    { time: 65, text: "Don't fight it, don't fight it, don't hide it" },
    { time: 69, text: "You know I'm fighting for you, don't doubt it" },
    { time: 73, text: "You're a sunflower, I think your love would be too much" },
    { time: 77, text: "Or you'll be left in the dust, unless I stuck by ya" },
    { time: 82, text: "You're the sunflower, you're the sunflower" },
    { time: 90, text: "♪ (Outro beat fading) ♪" }
  ],
  'falling': [
    { time: 0, text: "♪ (Intro synth pad) ♪" },
    { time: 6, text: "My last made me feel like I would never try again" },
    { time: 12, text: "But when I saw you, I felt something I never felt" },
    { time: 18, text: "Come closer, I give you all my love" },
    { time: 24, text: "If you treat me right, baby, I'll give you everything" },
    { time: 30, text: "My last made me feel like I would never try again" },
    { time: 36, text: "But when I saw you, I felt something I never felt" },
    { time: 42, text: "Come closer, I give you all my love" },
    { time: 48, text: "If you treat me right, baby, I'll give you everything" },
    { time: 54, text: "Talk to me, I need to hear you say" },
    { time: 60, text: "That you're mine, baby, every single day" },
    { time: 66, text: "I'm falling for you, falling for you" },
    { time: 72, text: "I'm falling for you, falling for you" },
    { time: 80, text: "And I can't stop the feeling inside" },
    { time: 88, text: "I'm falling for you, falling for you" }
  ],
  'perfect': [
    { time: 0, text: "♪ (Acoustic guitar intro) ♪" },
    { time: 9, text: "I found a love for me" },
    { time: 16, text: "Darling, just dive right in and follow my lead" },
    { time: 24, text: "Well, I found a girl, beautiful and sweet" },
    { time: 32, text: "Oh, I never knew you were the someone waiting for me" },
    { time: 40, text: "'Cause we were just kids when we fell in love" },
    { time: 45, text: "Not knowing what it was" },
    { time: 49, text: "I will not give you up this time" },
    { time: 56, text: "But darling, just kiss me slow" },
    { time: 60, text: "Your heart is all I own" },
    { time: 64, text: "And in your eyes, you're holding mine" },
    { time: 71, text: "Baby, I'm dancing in the dark with you between my arms" },
    { time: 80, text: "Barefoot on the grass, listening to our favourite song" },
    { time: 88, text: "When you said you looked a mess, I whispered underneath my breath" },
    { time: 96, text: "But you heard it, darling, you look perfect tonight" }
  ],
  'until-i-found-you': [
    { time: 0, text: "♪ (Retro guitar intro) ♪" },
    { time: 7, text: "Georgia, wrap me up in all your..." },
    { time: 12, text: "I want you in my arms" },
    { time: 17, text: "Oh, let me hold you" },
    { time: 22, text: "I'll never let you go again, like I did" },
    { time: 28, text: "Oh, I used to say" },
    { time: 33, text: "I would never fall in love until I found her" },
    { time: 39, text: "I said, 'I would never fall unless it's you I fall into'" },
    { time: 46, text: "I was lost within the darkness, but then I found her" },
    { time: 52, text: "I found you..." },
    { time: 58, text: "Heaven, when I held you again" },
    { time: 64, text: "How could we ever just be friends?" },
    { time: 70, text: "I would never fall in love until I found you" }
  ],
  'death-bed': [
    { time: 0, text: "♪ (Coffee cup lo-fi beat) ♪" },
    { time: 5, text: "Don't stay awake for too long, don't go to bed" },
    { time: 9, text: "I'll make a cup of coffee for your head" },
    { time: 13, text: "It'll get you up and going out of bed" },
    { time: 17, text: "Yeah, I don't wanna fall asleep, I don't wanna pass away" },
    { time: 22, text: "I been thinking 'bout my life and I'm running out of time" },
    { time: 27, text: "I hope you know that I loved you till the end" },
    { time: 32, text: "Yeah, you were my best friend" },
    { time: 38, text: "Don't stay awake for too long, don't go to bed" },
    { time: 43, text: "I'll make a cup of coffee for your head" },
    { time: 48, text: "It'll get you up and going out of bed" }
  ],
  'demons': [
    { time: 0, text: "♪ (Piano intro) ♪" },
    { time: 8, text: "When the days are cold and the cards all fold" },
    { time: 13, text: "And the saints we see are all made of gold" },
    { time: 18, text: "When your dreams all fail and the ones we hail" },
    { time: 23, text: "Are the worst of all, and the blood's run stale" },
    { time: 28, text: "I want to hide the truth, I want to shelter you" },
    { time: 33, text: "But with the beast inside, there's nowhere we can hide" },
    { time: 38, text: "No matter what we breed, we still are made of greed" },
    { time: 43, text: "This is my kingdom come, this is my kingdom come" },
    { time: 48, text: "When you feel my heat, look into my eyes" },
    { time: 53, text: "It's where my demons hide, it's where my demons hide" },
    { time: 58, text: "Don't get too close, it's dark inside" },
    { time: 63, text: "It's where my demons hide, it's where my demons hide" }
  ],
  'red': [
    { time: 0, text: "♪ (Upbeat country rock guitar) ♪" },
    { time: 8, text: "Loving him is like driving a new Maserati down a dead-end street" },
    { time: 14, text: "Faster than the wind, passionate as sin, ending so suddenly" },
    { time: 20, text: "Loving him is like trying to change your mind once you're already flying through the free fall" },
    { time: 27, text: "Like the colors in autumn, so bright, just before they lose it all" },
    { time: 34, text: "Losing him was blue, like I'd never known" },
    { time: 39, text: "Missing him was dark gray, all alone" },
    { time: 44, text: "Forgetting him was like trying to know somebody you never met" },
    { time: 49, text: "But loving him was red! Oh, red, burning red..." },
    { time: 56, text: "Loving him was red!" }
  ]
};

// Generic fallback lyrics generator for songs without dedicated LRC files
export function getLyricsForTrack(trackId: string, trackTitle: string, artistName: string): LyricLine[] {
  if (TRACK_LYRICS[trackId]) {
    return TRACK_LYRICS[trackId];
  }

  // High quality structured placeholder lyrics for demo tracks
  return [
    { time: 0, text: `♪ (Intro groove - ${trackTitle}) ♪` },
    { time: 6, text: `Listening to ${trackTitle} by ${artistName}` },
    { time: 12, text: "Feel the beat pulsing in the night" },
    { time: 18, text: "Every rhythm taking us to the sky" },
    { time: 24, text: "Lost inside the melody and harmony" },
    { time: 30, text: "Dancing under neon lights so bright" },
    { time: 36, text: "This is the moment we've been waiting for" },
    { time: 42, text: "Turn up the sound, open up your mind" },
    { time: 48, text: `Stream the best in English music on LyricFlow` },
    { time: 54, text: "♪ (Beat drop & chorus) ♪" },
    { time: 60, text: "Hold on tight to the rhythm" },
    { time: 66, text: "Let the sound take control" },
    { time: 72, text: "♪ (Melodic guitar solo) ♪" },
    { time: 80, text: "Forever in tune with the music" }
  ];
}
