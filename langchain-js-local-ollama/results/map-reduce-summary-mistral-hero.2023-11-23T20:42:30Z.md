# Basics Map/reduce Operation

Here we simply invoke a chain (RunnableSequence)
to summarize a story "by parts".
It is invoked repeatedly on chunks of text.

The summaries themselves are then concatenated.
This is the reduction part.

This summarization is repeated until a sufficiently concise summary is reached.

## Parameters

- sourceNickname: hero-of-ages.epub
- modelName: mistral
- chunkSize: 8000

## Level 0 Summarization

- Level 0 input summary:

  - 89 docs, length: 1335.42 kB
  - split into 213 chunks, length: 1336.85 kB

- Level 0 progress:

  - Level 0 Chunk 0 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 1 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 2 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 3 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 4 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 5 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 6 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 7 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 8 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 9 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 10 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 11 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 12 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 13 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 14 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 15 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 16 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 17 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 18 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 19 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 20 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 21 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 22 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 23 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 24 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 25 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 26 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 27 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 28 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 29 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 30 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 31 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 32 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 33 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 34 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 35 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 36 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 37 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 38 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 39 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 40 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 41 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 42 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 43 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 44 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 45 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 46 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 47 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 48 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 49 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 50 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 51 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 52 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 53 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 54 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 55 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 56 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 57 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 58 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 59 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 60 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 61 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 62 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 63 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 64 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 65 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 66 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 67 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 68 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 69 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 70 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 71 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 72 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 73 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 74 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 75 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 76 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 77 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 78 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 79 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 80 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 81 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 82 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 83 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 84 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 85 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 86 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 87 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 88 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 89 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 90 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 91 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 92 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 93 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 94 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 95 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 96 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 97 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 98 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 99 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 100 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 101 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 102 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 103 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 104 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 105 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 106 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 107 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 108 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 109 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 110 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 111 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 112 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 113 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 114 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 115 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 116 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 117 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 118 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 119 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 120 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 121 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 122 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 123 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 124 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 125 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 126 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 127 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 128 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 129 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 130 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 131 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 132 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 133 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 134 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 135 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 136 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 137 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 138 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 139 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 140 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 141 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 142 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 143 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 144 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 145 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 146 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 147 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 148 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 149 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 150 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 151 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 152 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 153 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 154 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 155 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 156 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 157 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 158 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 159 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 160 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 161 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 162 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 163 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 164 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 165 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 166 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 167 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 168 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 169 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 170 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 171 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 172 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 173 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 174 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 175 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 176 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 177 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 178 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 179 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 180 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 181 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 182 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 183 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 184 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 185 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 186 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 187 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 188 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 189 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 190 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 191 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 192 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 193 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 194 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 195 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 196 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 197 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 198 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 199 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 200 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 201 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 202 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 203 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 204 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 205 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 206 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 207 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 208 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 209 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 210 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 211 (0.00s rate:Infinityb/s):
  - Level 0 Chunk 212 (0.00s rate:Infinityb/s):

- Level 0 output summary:
  - 213 docs, length: 179.04 kB

## Level 1 Summarization

- Level 1 input summary:

  - 1 docs, length: 179.47 kB
  - split into 23 chunks, length: 179.67 kB

- Level 1 progress:

  - Level 1 Chunk 0 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 1 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 2 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 3 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 4 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 5 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 6 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 7 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 8 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 9 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 10 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 11 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 12 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 13 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 14 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 15 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 16 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 17 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 18 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 19 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 20 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 21 (0.00s rate:Infinityb/s):
  - Level 1 Chunk 22 (0.00s rate:Infinityb/s):

- Level 1 output summary:
  - 23 docs, length: 16.70 kB

## Level 2 Summarization

- Level 2 input summary:

  - 1 docs, length: 16.75 kB
  - split into 3 chunks, length: 16.74 kB

- Level 2 progress:

  - Level 2 Chunk 0 (0.00s rate:Infinityb/s):
  - Level 2 Chunk 1 (0.00s rate:Infinityb/s):
  - Level 2 Chunk 2 (0.00s rate:Infinityb/s):

- Level 2 output summary:
  - 3 docs, length: 1.96 kB

## Level 2 Summary

The Lord Ruler's Inquisitor catches up with Vin, who is running through Luthadel after stealing a sword from a temple. She defeats the kolosses using her Allomancy powers and manages to flee, but the Inquisitor keeps chasing her. He eventually slashes her sword arm and she uses her powers to throw his axe back at him. Vin becomes desperate and tries to flee, but the Inquisitor catches up with her again. She slashes his head off with her sword just as a group of kolosses turn away from her and focus their attacks on the Inquisitor, giving her enough time to escape.

The story follows the adventures of Vin, a young girl with Allomantic powers, as she searches for her father and discovers the truth about her abilities. In this part of the novel, Vin finds herself in the middle of a battle between her father's allies and the oppressive ruler of the city of Quellion. She uses her Allomancy to aid her allies in their fight against Venture and his soldiers. Meanwhile, Spook and Breeze attempt to take over control of the city by targeting Venture's key lieutenants and weakening his grip on power. Despite facing unexpected challenges, they manage to make significant progress towards their goal of restoring freedom to the people of Quellion.

The story follows the events leading up to the capturing of Sazed by KanPaar, who believes he can provide stable leadership for the kandra people and has accused Sazed of unstable behavior. Meanwhile, Vin and Ruin travel across the continent, encountering various cities and landscapes along the way. The Mistborn series continues with the aftermath of part 2, as survivors struggle to rebuild their lives in Luthadel. Sazed returns to help Elend, the new leader, and they face a horde of koloss under Ruin's control. Elend is eventually transformed into an angel and fights monsters, but the story ends with uncertainty as he tries to break free from the mysterious force that has taken over his body and mind.

## Level 1 Summary

The scene opens with Vin running through Luthadel, trying to evade the Lord Ruler's Inquisitors after stealing a sword from a temple. As she runs, she encounters a group of kolosses who are trying to catch up to her. Using her Allomancy powers, Vin is able to defeat the kolosses and continue running.

As she runs, Vin hears the sounds of approaching footsteps and realizes that the Inquisitor has caught up with her. She tries to fight him off, but he manages to grab her sword arm and slash it with his axe.

Vin is able to use her Allomancy powers to Push back against the Inquisitor and throw his axe at him. He catches the axe in mid-air and turns to face Vin. She tries to attack him with her other sword, but he manages to dodge it and counterattack.

Vin becomes desperate and tries to flee, but the Inquisitor chases after her. They continue fighting for a few moments before Vin sees an opportunity to strike. She calls on Elend, who is also fighting in the battle, to use his emotional Allomancy to calm the other kolosses.

The rest of the kolosses turn away from Vin and focus their attacks on the Inquisitor, giving her enough time to slash his head off with her sword. With a final burst of power, Vin calls on her metal to fly into the sky and disappear, leaving the scene as the Lord Ruler's army approaches.

The story is about two characters, Sazed and Lord Breeze, discussing the aftermath of the cataclysmic events of the Final Empire. They sit on a bench in the city of Elendil and talk about how things have changed since then. Sazed reflects on his own role in these events, and how they've impacted him. He feels like he has been stripped of everything—his Feruchemistry, his powers, even his identity as a former Tyrant. Lord Breeze listens to Sazed and offers some words of wisdom, encouraging him to focus on the present and move forward. The story ends with Sazed feeling more hopeful for the future, despite the challenges that lie ahead.

The story follows TenSoon, a Third-Generation kandra servant returning to his homeland after being released from prison. He discovers that much has changed and meets VarSell, another kandra servant, who is also returning to the homeland. As they journey towards their destination, they encounter guards dressed in metal armor, who are members of the First Generation. TenSoon becomes agitated as he realizes that they must be exiled from the Homeland for breaking their Contract with Zane, their master. He also discovers that Vin, who took the Lord Ruler's place as their Mother, killed the Lord Ruler and is now in control of the Trust. TenSoon tries to convince the First Generation to allow him to know the truth about the kandra's Secret, but they ignore his plea and offer judgment instead, sentencing him to one month of imprisonment.

The group of adventurers returns to their camp after a successful mission to gather resources in Fadrex City. They discuss their plans for the future, including traveling to other cities and gathering more resources. Vin is excited about the prospect of finding valuable metals there, while Elend is hesitant to attack a city without permission from its ruler first. Cett suggests attacking by force and taking it by diplomacy, but Elend reminds them that their goal should be to peacefully acquire cities, not invade them. The group prepares for their journey ahead, discussing the need to gather more weapons and supplies while maintaining secrecy about their plans from others. As they set out on their mission, they encounter a guardhouse in Urteau where Spook is searching for information.

The story tells about Spook, a former slave who has been living in the mists for as long as he can remember. He is described as being very skilled with a sword, but also having a weakness to Allomancers. One day, while out hunting, he comes across a group of noblemen who are fleeing from the mists. They are being hunted by their own guards and Spook decides to help them.

As they make their way through the mists, they come across a group of Allomancers who demand that Spook hand over his sword. Spook refuses and the two sides engage in combat. Spook fights valiantly, but is ultimately overwhelmed by the powers of the Allomancers.

The story ends with Spook being knocked unconscious by one of the Allomancers and the noblemen continuing on their journey. The reader is left wondering what will happen to Spook and whether he will be able to overcome his weakness to Allomancers.

In this chapter, Elend Venture is trying to understand why he was chosen by the Lord Ruler as his successor. He reflects on his actions during his time as an Allomancer and how they led him to become the Lord Ruler. We also meet a courier skiff from one of the other narrowboats, carrying a message for Elend, and learn about the plans to take over the city of Urteau. Meanwhile, Spook is on a mission for Elend in the city of Urteau, gathering information about its society and listening to conversations at a tavern.

Chapter 48 of "The Lord Ruler's Gift" follows Kelsier and Spook as they discuss their plans to enter Urteau and gain its people's support. They drink wine from a bottle meant for Spook, reflect on the success of Spook's escape, and express pride in his bravery. Vin continues her mission in Elendil by exploring its layout and gathering information about fortifications, troop positions, and living conditions. She meets with her informant, Slowswift, and discusses Yomen's reign as king and the upcoming ball at Keep Orielle. The story is about Emperor Elend and his advisor Vin who are discussing their strategy for dealing with King Yomen, who holds the key to their survival.

In this excerpt from "The Emperor's Throne," Vin and Elend attend a ball as husband and wife, but they are not received well by the attendees. They have plans to overthrow the local government and create a new empire, which causes tension with those around them. While at the ball, they meet Telden, who expresses concern about their intentions and ability to rule effectively.

In "The Way of Kings," Elend tries to persuade Yomen, the ruler of Elm, to work with him and end the siege of the city. He dances with Vin in the ballroom and invites anyone who wants to escape through his army. Meanwhile, Spook is instructed to meet with Durn to learn more about his plans and help save a man's sister from burning. The battle for Yomen begins, with Elend leading his well-trained and equipped troops into the fray. After hours of fighting, Yomen finally surrenders, but Elend's army suffers heavy losses as earthquakes rumble in the distance.

The chapter begins with Vin and Jax running through the streets of Fadrex, trying to catch up with Yomen. They eventually spot him and give chase, but he is too fast for them. Jax suggests they split up, so Vin decides to follow Yomen on her own while Jax circles back to the camp to warn the other soldiers.

Vin manages to defeat Yomen in a fierce battle using all of her Allomancy skills, and together with Jax, they watch as Elend's soldiers retreat and the city is safe once again.

In the aftermath of the battle, Elend realizes that he should have split up the koloss more evenly. He decides to send ten thousand of them to Vin so she can help him regain control over them. However, this strategy could prove problematic if Yomen decides to attack again with his remaining forces.

Human, a large blue koloss, attacks Elend's camp. His movements are uncharacteristic and he is not fighting for victory, but rather seems to be enraged. Vin, an Allomancer, follows him as he runs through the camp. He eventually stops in front of one of the tents with wounded soldiers. He reaches down and pulls a spike from the side of a dead koloss, then approaches one of the unconscious soldiers in the tent. As he does so, he becomes rigid and stops moving. Vin realizes that he was using Hemalurgic spikes to steal Preservation, the power of sentience, from the soldier.

In this chapter, we find out more about the Inquisitors and their origins. We learn that they are made from humans with spikes inserted into their bodies to transfer Allomantic abilities. The chapter also introduces Vin as she searches for her father, Lord Ruler, and discovers the truth about her abilities. Meanwhile, Spook faces his own struggles as he tries to find a way to stop Quellion and free the Mistralers. In "The Way of Kings," Marsh is tasked with assassinating King Penrod but accidentally decapitates him, causing Ruin to instruct him to flee out the window.

The story follows Vin, who is facing Ruin, an entity that surrounds her and seeks to end things she loves. Vin argues that ending is not always bad, but Ruin disagrees and reveals itself as a part of Vin's life that has been with her since her first years.

Summary: In this part of the novel, Spook and Breeze are tasked with taking over control of the city of Quellion, which is being terrorized by an oppressive ruler known as Venture. The two of them begin to investigate the situation, but they soon realize that there is more to it than meets the eye. They discover that Venture's forces are heavily armed and that he has been using his power to maintain control through fear and intimidation. Spook and Breeze also learn that there are some people within the city who are willing to fight back against Venture, but they are not well-organized and lack resources. With this information in mind, they devise a plan to take out Venture's key lieutenants, which will weaken his grip on power and create chaos within his ranks. They carry out the plan successfully, but not without facing some unexpected challenges along the way. Despite these obstacles, Spook and Breeze manage to make significant progress towards their goal of bringing down Venture and restoring freedom to the people of Quellion.

In this chapter, Spook and Breeze find themselves in a village that has been attacked by koloss. They are searching for a hidden underground stockpile of weapons left by Kelsier and the Lord Ruler. Meanwhile, TenSoon continues his search for the Emperor's army, following a lead from two guards who claim to have seen them in Urteau. As he searches an abandoned warehouse, he finally finds a piece of information that leads him closer to his goal.

The story describes the journey of TenSoon, who leads a group of people out of the city before it is destroyed by Penrod. He helps them escape and eventually reaches the caverns underground, which he believes will be safe for them to hide until the mists clear. Meanwhile, a pact was made between Preservation and Ruin by the gods to create something, but they were never fully satisfied with the outcome. The story also follows Beldre, who is captured by an obligator king named Yomen, intending to execute her for killing the Lord Ruler. Elend, another character in the story, witnesses the passing of a dying god named Preservation and is drawn towards finding a way to defeat Quellion without resorting to violence.

The excerpt from Mistborn shows Sazed, a former member of the synod, struggling with his own doubts and fears about leading a rebellion against the tyrannical ruler of the city. He walks through underground caverns with Spook and others in their rebellion group. As they make their way deeper into the caverns, Sazed's thoughts turn to the challenges they face and the sacrifices that will be made to free the city from the oppressive regime. When they reach the edge of the underground lake, Sazed suddenly snaps at Spook, expressing his frustration and fear that they will never succeed. However, Spook responds by encouraging Sazed to have faith in their ability to succeed, and Sazed reflects on Spook's words and begins to feel a glimmer of hope for the future.

The excerpt from The Alloy of Law concludes with Spook successfully confronting Quellion and his soldiers in the Ministry building. He fights back with his Allomancy powers, controlling the mists and creating powerful blasts of steam to hold off the guards. In the end, he manages to escape through a hidden door in the wall, but not before gaining valuable information about Quellion's plans.

- Chapter 12 begins with Vin and Ruin approaching the entrance to the Great Hall, where they are stopped by guards.
- Vin is able to convince the guard to let her enter, but she must wait outside while her identity is verified.
- After a few minutes, the guard returns with a key that Vin uses to unlock the door to the Great Hall.
- Inside, Vin finds Yomen sitting on his throne, surrounded by guards.
- Yomen agrees to meet with Vin and discuss the food in the storage caches, but he is not interested in discussing the atium or taking the city.
- Vin notices that there are no windows in the Great Hall and wonders what it would be like outside.

This chapter of "Heroes of the Mist" introduces the concept of a mist created by the Lord Ruler that blocks out all sunlight and prevents plants from growing. The main character, Elend, is on a quest to free his people from the enslavement of the Lord Ruler. In this chapter, Elend and his companions encounter a map that leads them to a treasure trove filled with valuable metals, including Atium. However, an Inquisitor is also there and they must decide whether to fight or flee. Meanwhile, in another part of the story, Ruin is still trying to get his hands on Atium after the Lord Ruler's death.

```
In this chapter, we see Vin continue her training with Elend as they prepare for Ruin to attack Venture City. We learn that Ruin is planning on using his "Koloss Army" to attack the city, and Elend has decided to let it happen in order to lure Ruin out of hiding. Meanwhile, Vin is still learning how to control her own emotions and encounters Ruin's Koloss Army on her way into the city. Later in the chapter, we see Vin attack Yomen's soldiers with her Koloss Army, revealing her true form and defeating Ruin.
```

The excerpt describes a scene in "The Ruinous Path" where Patreon kills a soldier and tries to take something from his pocket. The story then advances as Marsh is under the control of Ruin and uses a metal object as an anchor to push himself into the air towards Luthadel. The chapter ends with Elend discovering that there may be more Allomantic metals than previously thought, and he believes it is because there are four mental metals and four enhancements in the number sixteen.

"The Alloy of Law," "The Way of Kings," and "The Gathering Storm" by Brandon Sanderson are all part of different series of epic fantasy novels. In the first excerpt, Kelsier returns to his homeland after years in hiding and is tasked with killing the Lord Ruler and taking control of the empire for himself. He demonstrates his mastery of Allomancy by using Push and Pull to move himself and objects around him at incredible speeds. However, he ultimately decides not to take control of the empire but instead leaves it alone. In the second excerpt, Vin is an orphaned and mistborn who is searching for her identity and purpose in life. She travels through a dangerous landscape using horseshoes as she has been taught by Vin. In the third excerpt, Sazed is a scholar who has lost his faith in the Lord Ruler and is studying the doctrines of various religions to find one he can believe in. He receives an answer to his prayers when he reads the journals and letters of rebels who have been fighting against the Lord Ruler's rule for years.

The story follows the events leading up to the capturing of Sazed by the First Generation Allomancers led by KanPaar, who believes that he can provide stable leadership for the kandra people and has accused Sazed of unstable behavior. The story also includes the adventures of Vin and Ruin as they travel across the continent, encountering various cities and landscapes along the way.

The Mistborn series by Brandon Sanderson continues in this part, with the aftermath of the events from part 2. The survivors are struggling to rebuild their lives in the ruins of Luthadel and have a new leader, Elend. Sazed returns and is determined to help Elend and the others in any way he can. The chapter ends with uncertainty as the koloss continue to march towards Luthadel. In another scene, Vin is inside a cavern with her sister and sees Elend standing in front of the entrance, surrounded by a wall of fire. Elend uses his powers to fight monsters and is eventually transformed into an angel, using his powers to defeat them. The story ends with Elend being pursued by a horde of koloss under Ruin's control as he tries to find a way to break free from the mysterious force that has taken over his body and mind.
