# Basics Map/reduce Operation

Here we simply invoke a chain (RunnableSequence)
to extract characters and locations from a text.
It is invoked repeatedly on chunks of the text.

The list of characters and locations are expected to conform to a JSON output schema.

## Parameters

- sourceNickname: hero-of-ages.epub
- modelName: mistral
- chunkSize: 8000

## Level 0 Character Extraction

- Level 0 input summary:
  - 89 docs, length: 1335.42 kB
  - split into 213 chunks, length: 1336.85 kB

Example json output:

```json
{
  "characters": [
    {
      "name": "Marsh",
      "description": "An Inquisitor who has been imprisoned for three years and is struggling to kill himself."
    },
    {
      "name": "Terrisman steward",
      "description": "A companion of Marsh who is also an Inquisitor. He is tied to a table in front of Marsh."
    },
    {
      "name": "Keeper of Terris",
      "description": "The prisoner of Marsh, who is a Keeper of Terris and has worked his entire life for the good of others. Killing him would be not only a crime, but a tragedy."
    }
  ]
}
```

<details>
<summary>- Level 0 progress:</summary>

- Level 0 Chunk 0/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 1/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 2/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 3/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 4/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 5/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 6/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 7/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 8/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 9/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 10/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 11/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 12/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 13/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 14/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 15/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 16/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 17/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 18/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 19/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 20/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 21/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 22/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 23/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 24/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 25/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 26/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 27/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 28/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 29/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 30/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 31/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 32/213 6 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 33/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 34/213 7 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 35/213 7 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 36/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 37/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 38/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 39/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 40/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 41/213 7 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 42/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 43/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 44/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 45/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 46/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 47/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 48/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 49/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 50/213 7 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 51/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 52/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 53/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 54/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 55/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 56/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 57/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 58/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 59/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 60/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 61/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 62/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 63/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 64/213 7 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 65/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 66/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 67/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 68/213 6 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 69/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 70/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 71/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 72/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 73/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 74/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 75/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 76/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 77/213 6 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 78/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 79/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 80/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 81/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 82/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 83/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 84/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 85/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 86/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 87/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 88/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 89/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 90/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 91/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 92/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 93/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 94/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 95/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 96/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 97/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 98/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 99/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 100/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 101/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 102/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 103/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 104/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 105/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 106/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 107/213 6 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 108/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 109/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 110/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 111/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 112/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 113/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 114/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 115/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 116/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 117/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 118/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 119/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 120/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 121/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 122/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 123/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 124/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 125/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 126/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 127/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 128/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 129/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 130/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 131/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 132/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 133/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 134/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 135/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 136/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 137/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 138/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 139/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 140/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 141/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 142/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 143/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 144/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 145/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 146/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 147/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 148/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 149/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 150/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 151/213 6 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 152/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 153/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 154/213 6 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 155/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 156/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 157/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 158/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 159/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 160/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 161/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 162/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 163/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 164/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 165/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 166/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 167/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 168/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 169/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 170/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 171/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 172/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 173/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 174/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 175/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 176/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 177/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 178/213 1 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 179/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 180/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 181/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 182/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 183/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 184/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 185/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 186/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 187/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 188/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 189/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 190/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 191/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 192/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 193/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 194/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 195/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 196/213 6 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 197/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 198/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 199/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 200/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 201/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 202/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 203/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 204/213 4 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 205/213 2 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 206/213 3 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 207/213 8 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 208/213 9 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 209/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 210/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 211/213 5 characters (0.00s rate:Infinityb/s)
- Level 0 Chunk 212/213 4 characters (0.00s rate:Infinityb/s)
</details>

- Level 0 output summary:
  - 213 docs, length: 109.31 kB

## Level 1 Character Aggregation

- Level 1 input summary:
  - 213 docs, length: 109.31 kB

Example json output:

```json
{
  "name": "Vin",
  "descriptions": [
    "A mysterious woman who helps Elend with his powers.",
    "The protagonist. She has pewter and duralumin metals.",
    "The protagonist of the story. A skilled Allomancer who uses her powers to fight against oppression.",
    "The protagonist of the story. She has the ability to control emotions and metal.",
    "The protagonist of the story. She is a powerful Allomancer and has been tasked with defeating the Outer Dominances.",
    "A skaa girl with a powerful koloss servant.",
    "A skilled Allomancer who has been tasked with protecting Elend. She is fiercely loyal to her employer but struggles with her own doubts and fears.",
    "A young woman who has been trained by her father to fight koloss.",
    "A woman who is determined to defeat the thing she has released.",
    "The protagonist of the story. She is an orphan who has been trained in the art of assassination by her uncle.",
    "A young woman with the ability to manipulate metal. She is the protagonist of the story.",
    "A young woman who has been raised by the Lord Ruler and is now on a quest to save her people.",
    "A young woman with short hair and a scar on her cheek. She is a skilled thief and often wears dark clothing.",
    "A street urchin who has been granted noble status by the Emperor. She is a skilled thief and assassin.",
    "A member of the crew, Kelsier's love interest. She is a skilled Allomancer and has a mysterious past.",
    "Heir of the Survivor and wife of Elend.",
    "An Allomancer who flares her metals and transforms her physiology, becoming an Allomantic savant with senses beyond what any normal Allomancer would need.",
    "The protagonist of the story. She is an orphan who has been trained in Allomancy by Kelsier.",
    "The protagonist of the story. A skilled Allomancer and former slave.",
    "A young woman who is searching for her missing brother and becomes involved with Kelsier's plan.",
    "A young woman who possesses magical abilities. She is a skilled archer and serves as a scout for the rebellion.",
    "A Tineye who has been tasked with scouting the city of Urteau.",
    "A young woman who became an Allomancer after being exposed to the metal allomancy of the Lord Ruler's forces. She joined Kelsier's crew and played a key role in the revolution, ultimately killing the Lord Ruler himself.",
    "The protagonist of the story. A skilled thief and member of the crew.",
    "A young woman who has been living in Luthadel since the fall of the Final Empire. She is determined to find her missing father and bring him to justice.",
    "A young woman with the ability to manipulate metal. She is determined and resourceful.",
    "A skilled thief and member of the Mistborn class.",
    "The Hero of Ages. She is the wife of Elend and has the ability to control the mists.",
    "A young woman who has been trained in the art of deception and disguise. She is fiercely independent and determined.",
    "A Mistborn who has been tasked with killing the Lord Ruler and taking control of the empire.",
    "A thieving crewleader who is trying to find a way out of Fadrex City.",
    "A powerful and skilled warrior, who killed an Elariel in a good fight.",
    "A mysterious woman who has captured Elend's heart, Vin is a skilled fighter and an enigma.",
    "A young woman of about eighteen, with long blonde hair and blue eyes. She is the daughter of a street urchin and an assassin.",
    "The protagonist of the story. A skilled Mistborn who is trying to become a good queen.",
    "A Mistborn who dances with Elend at a ball.",
    "A human who has trained TenSoon to leap incredible heights.",
    "A young woman with pewter-colored skin and hair. She is an Allomancer, able to manipulate metals through her body.",
    "A skilled warrior who is able to control koloss.",
    "A young woman with the ability to Push kolosses. She is also an Allomancer.",
    "The protagonist of the story, a human woman with the ability to manipulate metal.",
    "A young woman who is the protagonist of the story. She has the ability to control koloss and kandra.",
    "An attentive and thorough reader who is determined to find out what's in the storage cavern.",
    "A skilled thief and assassin who has been hired to steal a cache of weapons from the Ministry of Canton.",
    "A skilled thief and member of the Elend family.",
    "A person who fights against an enemy.",
    "A skilled Allomancer and thief who uses her powers to survive in the skaa slums.",
    "Elend's love interest and a skilled assassin. She helps Elend in his quest to overthrow Yomen.",
    "A woman who was captured by King Yomen and is trying to escape from a stone door.",
    "The protagonist of the story. A skilled Allomancer with a mysterious past.",
    "The protagonist who opposes Ruin's actions.",
    "A young woman who becomes a Misting and later a full Mistborn, joining Kelsier in his fight against the Lord Ruler.",
    "Elend's daughter and the love interest of the story. She is a skilled Allomancer who is captured by the enemy.",
    "The protagonist of the story. A skilled Mistborn who is searching for the Well of Ascension.",
    "The protagonist of the story. A skilled thief and member of the Keepers.",
    "The protagonist of the story. She is an Allomancer and has been imprisoned in the city of Yomen for several years.",
    "A character who is trying to escape from a cavern.",
    "A skilled assassin who works for Elend. She is fiercely loyal and willing to do whatever it takes to protect her employer.",
    "A young woman who can control kolosses. She has short blonde hair and blue eyes.",
    "A human woman who became the new Lord Ruler after killing Zane Venture.",
    "A skilled thief and Kelsier's love interest. She is also a member of the crew.",
    "The protagonist of the story. A Mistborn with the ability to Push metals.",
    "A blunt woman whose husband is the Lord Ruler. She was captured by Yomen and is awaiting execution.",
    "Elend's wife and love interest. She is an Allomancer and has been searching for the Well of Ascension as well.",
    "The protagonist of the story. A young woman with the ability to manipulate metal.",
    "A character who encounters Ruin and learns about his past and present.",
    "A young girl who possesses the ability to manipulate metal. Vin is fiercely independent and determined to protect those she cares about.",
    "A young woman who has been imprisoned for her crimes.",
    "The protagonist of the story. She is a skilled thief and member of the Lord Ruler's crew.",
    "The protagonist of the story. She is a skilled warrior and leader.",
    "Elend's daughter, who is captured by Yomen in order to secure a truce between the Southern and Northern Dominances. She is intelligent and resourceful, and is determined to rescue her father.",
    "A young woman who helps Sazed on his journey and has a deep understanding of religion and spirituality.",
    "The protagonist of the story. She is a Misting and has the ability to control emotions.",
    "The protagonist of the story. She is an orphan who has been trained in Allomancy by her uncle, Elend.",
    "The protagonist of the story. She is an Allomancer and has been tasked with finding the atium.",
    "A young girl who discovers the atium. She is brave and resourceful, but must navigate dangerous situations as she tries to protect her people from Ruin's grasp.",
    "A young woman with the ability to control metal. She is determined and resourceful.",
    "A woman who possesses the power to push on emotions and understand others' thoughts and feelings.",
    "A young woman who has been trained by the Lord Ruler to be an Allomancer. She is brave and resourceful, but also vulnerable.",
    "The protagonist of the story. A skilled Allomancer and member of the Brotherhood Without Banners.",
    "A young woman who has been through a lot.",
    "A woman with an earring made of metal, which Marsh rips from her ear.",
    "A young woman who has recently discovered her powers as an Allomancer. She is fierce and determined, and she fights with great skill.",
    "A young woman with Allomantic powers. She is the protagonist of the story.",
    "A young girl who discovers she has the power to burn metal. She becomes an important ally to Elend in his quest to protect the city.",
    "A human kandra who is a member of the First Generation.",
    "The protagonist of the story. She has been chosen to wield the power of the Lord Ruler.",
    "A being created by Preservation to be intentionally unbalanced. Stronger than Ruin, but they are equally matched at the moment.",
    "The protagonist, a young woman with the ability to manipulate atium.",
    "The Hero of Ages, a powerful Terris woman who is able to manipulate metal.",
    "A young woman with enhanced abilities who fights alongside Elend.",
    "Died, taking Ruin with him.",
    "A young woman who is the Hero of the story. She is tasked with saving the world from Ruin's power.",
    "A young woman with powerful Allomantic abilities who becomes the crew's mist spirit after touching the power at the Well of Ascension.",
    "A young woman who is a skilled thief and has been searching for something important."
  ]
}
```

<details>
<summary>- Level 1 progress:</summary>

- Level 1 Character name:Vin mentions:95
- Level 1 Character name:Elend mentions:75
- Level 1 Character name:Sazed mentions:55
- Level 1 Character name:Kelsier mentions:49
- Level 1 Character name:Spook mentions:43
- Level 1 Character name:Ruin mentions:42
- Level 1 Character name:Breeze mentions:31
- Level 1 Character name:TenSoon mentions:23
- Level 1 Character name:Yomen mentions:21
- Level 1 Character name:Marsh mentions:20
- Level 1 Character name:Ham mentions:18
- Level 1 Character name:Cett mentions:16
- Level 1 Character name:Beldre mentions:15
- Level 1 Character name:Demoux mentions:14
- Level 1 Character name:Allrianne mentions:13
- Level 1 Character name:Preservation mentions:11
- Level 1 Character name:Rashek mentions:9
- Level 1 Character name:KanPaar mentions:9
- Level 1 Character name:Fatren mentions:7
- Level 1 Character name:Human mentions:7
- Level 1 Character name:Durn mentions:7
- Level 1 Character name:Quellion mentions:7
- Level 1 Character name:Koloss mentions:6
- Level 1 Character name:Elendil mentions:6
- Level 1 Character name:Goradel mentions:5
- Level 1 Character name:MeLaan mentions:4
- Level 1 Character name:Reen mentions:4
- Level 1 Character name:Clubs mentions:4
- Level 1 Character name:Elend Venture mentions:4
- Level 1 Character name:Lord Ruler mentions:4
- Level 1 Character name:Dockson mentions:3
- Level 1 Character name:Slowswift mentions:3
- Level 1 Character name:Zane mentions:3
- Level 1 Character name:Penrod mentions:3
- Level 1 Character name:Haddek mentions:3
- Level 1 Character name:Venture mentions:2
- Level 1 Character name:VarSell mentions:2
- Level 1 Character name:Kandra mentions:2
- Level 1 Character name:Lady Vin mentions:2
- Level 1 Character name:Vin Diesel mentions:2
- Level 1 Character name:Noorden mentions:2
- Level 1 Character name:Tindwyl mentions:2
- Level 1 Character name:Telden mentions:2
- Level 1 Character name:Conrad mentions:2
- Level 1 Character name:OreSeur mentions:2
- Level 1 Character name:Captain Goradel mentions:2
- Level 1 Character name:Terrisman steward mentions:1
- Level 1 Character name:Keeper of Terris mentions:1
- Level 1 Character name:Hero of Ages mentions:1
- Level 1 Character name:Druffel mentions:1
- Level 1 Character name:Judgment mentions:1
- Level 1 Character name:Ruxton mentions:1
- Level 1 Character name:King Lekal mentions:1
- Level 1 Character name:Ash mentions:1
- Level 1 Character name:Inquisitors mentions:1
- Level 1 Character name:Lord Hammond mentions:1
- Level 1 Character name:HunFoor mentions:1
- Level 1 Character name:Mare mentions:1
- Level 1 Character name:Tin mentions:1
- Level 1 Character name:Lord Breeze mentions:1
- Level 1 Character name:Kelsier's wife mentions:1
- Level 1 Character name:The Survivor mentions:1
- Level 1 Character name:Steward 1 mentions:1
- Level 1 Character name:Steward 2 mentions:1
- Level 1 Character name:The Voice mentions:1
- Level 1 Character name:Ruthless mentions:1
- Level 1 Character name:Renata mentions:1
- Level 1 Character name:Jedal mentions:1
- Level 1 Character name:Margel mentions:1
- Level 1 Character name:The Citizen mentions:1
- Level 1 Character name:Hoid mentions:1
- Level 1 Character name:The Lord Ruler mentions:1
- Level 1 Character name:The Mistborn spirit mentions:1
- Level 1 Character name:Vin Venture mentions:1
- Level 1 Character name:Mistral mentions:1
- Level 1 Character name:Skaa mentions:1
- Level 1 Character name:Lady Patresen mentions:1
- Level 1 Character name:Shan mentions:1
- Level 1 Character name:Feruchemy mentions:1
- Level 1 Character name:Mailey mentions:1
- Level 1 Character name:kandra mentions:1
- Level 1 Character name:Blessing of Presence mentions:1
- Level 1 Character name:Blessing of Awareness mentions:1
- Level 1 Character name:Blessing of Stability mentions:1
- Level 1 Character name:Franson mentions:1
- Level 1 Character name:A man with a given power—such as an Allomantic ability—who then gained a Hemalurgic spike granting that same power would be nearly twice as strong as a natural unenhanced Allomancer. mentions:1
- Level 1 Character name:Keeper Jules mentions:1
- Level 1 Character name:Telden Hasting mentions:1
- Level 1 Character name:The mist spirit mentions:1
- Level 1 Character name:The First Generation mentions:1
- Level 1 Character name:Kredik Shaw mentions:1
- Level 1 Character name:Ruthless Ruin mentions:1
- Level 1 Character name:Push mentions:1
- Level 1 Character name:Yeden mentions:1
- Level 1 Character name:Emperor Pax mentions:1
</details>

- Level 1 output summary:
  - 95 docs, length: 71.37 kB

## Level 2 Character Description Summarization

- Level 2 input summary:
  - 95 docs, length: 71.37 kB

<details>
<summary>- Level 2 progress:</summary>

- Level 2 Character name:Vin mentions:95 (0.00s rate:Infinityb/s)
- Level 2 Character name:Elend mentions:75 (0.00s rate:Infinityb/s)
- Level 2 Character name:Sazed mentions:55 (0.00s rate:Infinityb/s)
- Level 2 Character name:Kelsier mentions:49 (0.00s rate:Infinityb/s)
- Level 2 Character name:Spook mentions:43 (0.00s rate:Infinityb/s)
- Level 2 Character name:Ruin mentions:42 (0.00s rate:Infinityb/s)
- Level 2 Character name:Breeze mentions:31 (0.00s rate:Infinityb/s)
- Level 2 Character name:TenSoon mentions:23 (0.00s rate:Infinityb/s)
- Level 2 Character name:Yomen mentions:21 (0.00s rate:Infinityb/s)
- Level 2 Character name:Marsh mentions:20 (0.00s rate:Infinityb/s)
- Level 2 Character name:Ham mentions:18 (0.00s rate:Infinityb/s)
- Level 2 Character name:Cett mentions:16 (0.00s rate:Infinityb/s)
- Level 2 Character name:Beldre mentions:15 (0.00s rate:Infinityb/s)
- Level 2 Character name:Demoux mentions:14 (0.00s rate:Infinityb/s)
- Level 2 Character name:Allrianne mentions:13 (0.00s rate:Infinityb/s)
- Level 2 Character name:Preservation mentions:11 (0.00s rate:Infinityb/s)
- Level 2 Character name:Rashek mentions:9 (0.00s rate:Infinityb/s)
- Level 2 Character name:KanPaar mentions:9 (0.00s rate:Infinityb/s)
- Level 2 Character name:Fatren mentions:7 (0.00s rate:Infinityb/s)
- Level 2 Character name:Human mentions:7 (0.00s rate:Infinityb/s)
- Level 2 Character name:Durn mentions:7 (0.00s rate:Infinityb/s)
- Level 2 Character name:Quellion mentions:7 (0.00s rate:Infinityb/s)
- Level 2 Character name:Koloss mentions:6 (0.00s rate:Infinityb/s)
- Level 2 Character name:Elendil mentions:6 (0.00s rate:Infinityb/s)
- Level 2 Character name:Goradel mentions:5 (0.00s rate:Infinityb/s)
- Level 2 Character name:MeLaan mentions:4 (0.00s rate:Infinityb/s)
- Level 2 Character name:Reen mentions:4 (0.00s rate:Infinityb/s)
- Level 2 Character name:Clubs mentions:4 (0.00s rate:Infinityb/s)
- Level 2 Character name:Elend Venture mentions:4 (0.00s rate:Infinityb/s)
- Level 2 Character name:Lord Ruler mentions:4 (0.00s rate:Infinityb/s)
- Level 2 Character name:Dockson mentions:3 (0.00s rate:Infinityb/s)
- Level 2 Character name:Slowswift mentions:3 (0.00s rate:Infinityb/s)
- Level 2 Character name:Zane mentions:3 (0.00s rate:Infinityb/s)
- Level 2 Character name:Penrod mentions:3 (0.00s rate:Infinityb/s)
- Level 2 Character name:Haddek mentions:3 (0.00s rate:Infinityb/s)
- Level 2 Character name:Venture mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:VarSell mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Kandra mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Lady Vin mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Vin Diesel mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Noorden mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Tindwyl mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Telden mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Conrad mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:OreSeur mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Captain Goradel mentions:2 (0.00s rate:Infinityb/s)
- Level 2 Character name:Terrisman steward mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Keeper of Terris mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Hero of Ages mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Druffel mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Judgment mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Ruxton mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:King Lekal mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Ash mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Inquisitors mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Lord Hammond mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:HunFoor mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Mare mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Tin mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Lord Breeze mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Kelsier's wife mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:The Survivor mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Steward 1 mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Steward 2 mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:The Voice mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Ruthless mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Renata mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Jedal mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Margel mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:The Citizen mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Hoid mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:The Lord Ruler mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:The Mistborn spirit mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Vin Venture mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Mistral mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Skaa mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Lady Patresen mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Shan mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Feruchemy mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Mailey mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:kandra mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Blessing of Presence mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Blessing of Awareness mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Blessing of Stability mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Franson mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:A man with a given power—such as an Allomantic ability—who then gained a Hemalurgic spike granting that same power would be nearly twice as strong as a natural unenhanced Allomancer. mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Keeper Jules mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Telden Hasting mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:The mist spirit mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:The First Generation mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Kredik Shaw mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Ruthless Ruin mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Push mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Yeden mentions:1 (0.00s rate:Infinityb/s)
- Level 2 Character name:Emperor Pax mentions:1 (0.00s rate:Infinityb/s)
</details>

## Level 2 Character Summaries

### Vin (95 mentions) - Level 2 Character Summary

- Elend Venture, an Allomancer and member of the Elend family, is seeking to overthrow King Yomen.
- Kelsier, a skilled Mistborn, is the protagonist who opposes Ruin's actions.
- Vin, a young woman with the ability to manipulate metal, becomes a Misting and later a full Mistborn, joining Kelsier in his fight against the Lord Ruler.
- Elend's daughter, Marsh, is captured by Yomen and is awaiting execution.
- Sazed, an orphaned Misting who has been studying religion for years, helps the crew on their journey.
- The protagonist of the story, a young woman with the ability to manipulate metal, has recently discovered her powers.
- Elend's wife, Tava, is also an Allomancer and is searching for the Well of Ascension.
- Marsh encounters Ruin and learns about his past and present.
- A young girl named Wax discovers the atium and becomes an important ally to Elend in his quest to protect the city.
- A being created by Preservation to be intentionally unbalanced, the Hero of the story is a young woman with powerful Allomantic abilities who becomes the crew's mist spirit after touching the power at the Well of Ascension.

### Elend (75 mentions) - Level 2 Character Summary

Elend is a skilled Allomancer, scholar, and leader of the Final Empire. He has steel metal and controls emotions as part of his abilities. As the son of the Lord Ruler, he inherits the mantle of leadership after his father's death, but struggles with the responsibilities that come with ruling Luthadel and several kingdoms.
Elend is also an ally to Vin in their fight against the Outer Dominances, as well as a member of the Church of the Survivor. He mentors Vin and serves as her love interest in the story. Elend has a scar on his forehead and wears a crown as the emperor of the empire.
Elend's primary goal is to protect his people from harm, whether it be from the mists or external threats. He is determined to find a way to break the curse of the Lord Ruler, who was responsible for the destruction of the world. Elend's ultimate goal is to restore order and stability to the shattered remains of the Final Empire.

### Sazed (55 mentions) - Level 2 Character Summary

Sazed is a Terrisman who serves as Elend Venture's chief ambassador. He was once a Feruchemist, but has lost his faith and become an atheist. Additionally, he has lost his love and is now a Keeper of the Terris. Sazed has been studying the religions of the world and is currently in Luthadel as part of his research.

He is also Vin's mentor and guide, having studied under her tutelage for many years. Sazed is a small, quiet man with a scar on his forehead and is skilled at healing. He often wears a hooded cloak and is tasked with protecting the city of Luthadel as well as its inhabitants.

Sazed is also the Holy Witness of Luthadel and is a member of the Terris Order, which makes him a powerful magic user. Despite his past experiences, Sazed remains optimistic and believes that hope can inspire people to continue struggling on. He has studied all three religions and is now searching for the Well of Ascension, a legendary magical artifact.

Sazed's past as a former Lord Ruler also plays a role in his character. He spent many years studying different religions and became fascinated by them. In addition to his studies, he is also an eunuch steward who left the group to make supplies stop at Luthadel.

In his personal life, Sazed has renounced his powers and taken up the mantle of leadership in Elend's new government. Despite the challenges he faces, Sazed remains determined to find the answers that have eluded him for so long. He is a wise and powerful Allomancer who has been working with Kelsier, the Survivor, to gather support for their cause.

Overall, Sazed is a complex character who has undergone many transformations throughout his life. He is a Keeper of the Terris, an atheist, and a former Lord Ruler. His past experiences have shaped him into a wise and powerful individual who is determined to find the answers that he seeks.

### Kelsier (49 mentions) - Level 2 Character Summary

Kelsier, the protagonist of this story, is a skilled thief and the leader of a group of rebels fighting against the oppressive regime of the Final Empire. He was once an Imperial nobleman who was wronged by his own family and turned to a life of crime as a result. However, he has since become more than just a criminal mastermind; he is also a powerful Allomancer with the ability to manipulate metal.

As a former Lord Ruler's assassin who is now fighting against him, Kelsier has a personal vendetta against the current ruler and is determined to overthrow him. He is known for his bravery and leadership, and he has been able to gather allies and resources for the rebellion through his cunning and resourcefulness.

Despite his past as an assassin, Kelsier has become a hero in his own right after being captured by Rashek and inspired by Sazed's quest. He is also known for his tragic past, which has made him into a complex and subtle character who appears to take on different forms.

In addition to being a skilled thief and leader, Kelsier is also Spook's mentor and ally. He was once a member of the Survivor's crew and has since taken over the Ministry of Assassins, continuing to work towards his goal of overthrowing the Lord Ruler.

Overall, Kelsier is a complex and multifaceted character who embodies the spirit of rebellion against oppressive regimes. His tragic past and personal vendettas make him a compelling figure for readers to follow on his quest to bring about change in the world.

### Spook (43 mentions) - Level 2 Character Summary

Spook is a skilled thief and member of the Citizen resistance, known for his heightened senses and ability to sneak around undetected. He is also a nephew of Clubs and works for Elend and Vin, gathering information about the Citizen. Spook has the unique ability to see whispers and feel screams, which he uses to navigate the city and avoid danger. Despite his past as a thief, he has become a loyal companion to a god and has taken on a mission to overthrow the Ash Lord, now Mistborn, with Kelsier's crew. He is also known for his timid nature and lack of confidence, but has been trained by Kelsier to fight against oppressive regimes using Allomancy. Spook is a former street urchin who was left behind by Kelsier's crew and struggles with feelings of guilt and inadequacy, but has found purpose in his mission with Kelsier's group.

### Ruin (42 mentions) - Level 2 Character Summary

Ruin is an ancient force that possesses immense power and seeks to destroy the world by breaking everything down to its most basic forms. This being was once trapped in the Well of Ascension, where it was imprisoned for centuries. Despite this, Ruin has now been released and is causing chaos throughout the world with its destructive capabilities.

Ruin's true nature remains a mystery, as some describe it as an entity that controls the minds of Inquisitors while others view it as a god-like being trapped by the Well of Ascension. Still, others describe Ruin as an intelligent force that seeks to find its hidden part in order to regain its power.

Regardless of its true nature, there is no denying that Ruin is a powerful force that poses a significant threat to humanity. It has already confronted Vin and been destroyed, but it remains to be seen if this was the end for this ancient being or if it will rise again to continue its destructive path.

### Breeze (31 mentions) - Level 2 Character Summary

Breeze is an assassin who has been Sazed's companion and guide. He is now a friend to Sazed, having helped him overcome a difficult time. Breeze is also an Allomancer with a reputation for being skilled in fashion and wit. He is known to be tall, thin and wear a cloak.

Breeze was once a Terrisman who had been granted noble status by the Emperor. He was known for his skills in stealth and assassination, but has since put these talents to good use as Sazed's friend and ally. Breeze is also an experienced Allomancer who serves as Sazed's second-in-command.

Breeze is a member of House Driek, and is known for his manipulative abilities. He has been described as one of the world's most vile men. Despite this, Breeze is also an attentive and thorough reader who joins Spook and Sazed on their mission to expose Quellion's lies.

Breeze imitates a nobleman and enjoys getting drunk on fine wines. He is also a skaa thief who has joined Spook's group to help them find the Well. Breeze is also the leader of the Thuggery, a criminal organization that he took over after Kelsier's death.

Breeze is a former employee of Kelsier who admired his authenticity and determination. He was present during the event and has since become an experienced Allomancer who fights alongside Sazed and Spook in their quest for the Well. Breeze also has a strong sense of loyalty to his crew, being the former thief and current leader of the crew that accompanies him on this mission.

### TenSoon (23 mentions) - Level 2 Character Summary

TenSoon is a kandra who has defied his contract with the First Generation by breaking it. He is the protagonist of the story and belongs to the Third Generation, having been imprisoned for an extended period. Despite being punished for his actions, TenSoon continues to search for something, driving him to take on the form of a wolfhound in pursuit of his goals.

His journey has led him through various challenges, including serving the Lord Ruler and later Vin, gaining the Blessing of Potency by stealing two spikes from OreSeur's body, being sent on a quest to find Sazed, and even taking on human form to lead the First Generation.

Throughout his journey, TenSoon has been punished severely for his actions, including wearing a dog's bone as a punishment and serving ChanGaar during his ritual imprisonment. However, he continues to persevere, driven by an unknown desire that keeps him moving forward.

Overall, TenSoon is a complex character who has faced numerous challenges and punishments throughout his journey, but remains determined to find what he is searching for.

### Yomen (21 mentions) - Level 2 Character Summary

Yomen is a complex character with multiple facets to his personality. Initially, he is introduced as an ally of Vin's husband who is attending a conference before an attack. However, he later becomes the leader of a group of rebels fighting against the Lord Ruler's rule. He is described as tall and muscular, with short dark hair and a beard.

In terms of his abilities, Yomen possesses the power to manipulate metals through his body, making him an Allomancer. He uses this ability to lead his group of rebels in their fight against the Lord Ruler's forces. Despite his physical prowess, he is also a skilled politician and fighter.

Later in the story, Yomen becomes the main antagonist, revealed to be a Mistborn who has imprisoned Vin in a cavern and is waiting for her to die of dehydration. He is described as tall, thin, with duralumin-colored skin and hair. He is a formidable opponent for Vin and her allies, using his powers and skills to maintain control over the situation.

Overall, Yomen is a complex character with multiple layers of personality and abilities that make him an interesting protagonist in this story.

### Marsh (20 mentions) - Level 2 Character Summary

Marsh is a character who has been imprisoned for three years and is struggling with suicidal thoughts. Despite being an experienced Inquisitor, he is unable to resist Ruin's control. He is known for using Hemalurgy to drain Allomantic abilities from his enemies. Marsh was once an Allomancer himself but turned against his former kind after being tasked with killing Penrod, a fellow Allomancer.

Despite his loyalty to the Lord Ruler, Marsh's emotions were pushed by Vin, leading him to become obsessed with destruction and hatred towards himself. He wields a sword and an axe in battle against a mysterious force. Marsh is controlled by Ruin, using metal as an anchor to push himself into the air.

Marsh is a member of the Brotherhood Without Banners, a group of skilled Allomancers who fight for freedom and justice. He has unique spikes on his chest that he uses as weapons. Marsh is also obsessed with finding the atium, a powerful metal said to grant unlimited life.

Despite his loyalty to the Lord Ruler, Marsh's difficult choices may test his allegiance. He was once a leader of the skaa rebellion but gave up before victory was achieved. He was also killed by Vin's Push, a powerful ability that allows users to manipulate others' emotions.

In addition to being an Inquisitor, Marsh is also an atium Mistinger, a powerful Allomancer who fights alongside Elend, another atium Mistinger. However, he is under the control of Ruin, but not as strongly as Human.

Overall, Marsh is a complex character with a rich backstory and multiple motivations. He struggles with his emotions, loyalty to the Lord Ruler, and obsession with finding the atium. His experiences and actions throughout the story will undoubtedly have a significant impact on its outcome.

### Ham (18 mentions) - Level 2 Character Summary

Ham, a skilled Allomancer and advisor to Elend, hails from House Drell and serves as Elend's right-hand man and trusted advisor. He fondly remembers Kelsier, believing that he would be proud of their achievements together. As a general in the army of the Central Dominance, Ham is known for his loyalty and courage, but can also be paranoid and fearful at times. He joined Kelsier's crew after being released from prison and was admired for his strength and loyalty to their revolutionary cause. In addition to his Allomancer abilities, Ham is a skilled fighter who serves as second-in-command to Elend. As a captain in Elend's army, he is responsible for coordinating the siege against Ruin's forces. He also has a deep understanding of politics and strategy, making him a valuable advisor to Elend. Despite not possessing Allomancer abilities himself, Ham fights bravely alongside Elend and his allies.

### Cett (16 mentions) - Level 2 Character Summary

Cett is an old, crippled man with two legs that don't work. He was once a nobleman from House Drell and served as the king of one of the empire's many kingdoms. Although he had been beaten as a child, he became an Allomancer and later joined Lord Yomen's rebellion.
As a member of Vin's circle, Cett is known for his cunning and manipulation, making him a valuable advisor to Elend. He also serves as an older soldier in Elend's army, having been cured of the sickness that plagued many soldiers during the war. Cett is grateful for his recovery and eager to continue serving his king, despite his bitterness and arrogance.
Cett is also known for being a wise old man with experience in warfare. He serves as one of Elend's most trusted advisors and can be seen leading a group of kolosses in battle against the Lord Ruler's army. As a powerful Misting warrior, Cett is fiercely loyal to his king and will stop at nothing to protect the empire.

### Beldre (15 mentions) - Level 2 Character Summary

Beldre is a young woman who comes from a noble family in Luthadel city-state. She has been exiled to the garden for her Allomancy abilities and is torn between her loyalty to her brother, the Ash Lord, and her growing doubts about his actions. She is half-skaa and was saved from execution by Spook and the Survivor's crew. Beldre has experienced much trauma and is naive, having been sheltered by her family. She is a member of the resistance movement in Luthadel city-state and becomes involved in Spook's quest to stop the flames. She also helps him with his paper and was once Spook's love interest but was captured by Quellion's guards.

### Demoux (14 mentions) - Level 2 Character Summary

Demoux is a key figure in Elend's army, serving as both a general and the leader of the skaa army. As a nobleman from House Vorin and Elend's spymaster, he plays an important role in advancing Elend's agenda.

In addition to his military duties, Demoux is also responsible for ensuring that his troops are well-equipped to deal with any challenges they may face. This includes giving them the necessary training to operate effectively in low light conditions, as well as providing them with the right equipment and tools to carry out their tasks efficiently.

Despite his military prowess, Demoux is not without his own flaws. He can be stubborn at times, which can sometimes lead him astray. However, he is a loyal soldier who is willing to do whatever it takes to serve Elend and defend the Homeland.

Demoux's bravery and resourcefulness have been demonstrated in several battles, including his participation in the fight against Yomen's forces and his leadership of a new company of men during the Battle of Luthadel. He is also known for his heroics in saving Sazed's life by removing his spike.

Overall, Demoux is an important member of Elend's army, and his skills and abilities make him a valuable asset to both the military and the Homeland as a whole.

### Allrianne (13 mentions) - Level 2 Character Summary

Allrianne, a young princess from the House of Alleren, is described as having short hair and a scar on her cheek. She has proved herself to be a skilled archer, often seen wearing leather armor. Her romantic interest in Breeze is noted, along with their ongoing relationship. As a noblewoman from House Ashweather Cett, she was captured by the Citizens during the war and is currently being held captive in Emperor Venture's palace. She is described as a young woman who is passionate about her work and is searching for her missing brother. Her skill with archery has also made her an asset to Spook's group, where she serves as Breeze's second-in-command and is known for her combat skills and romantic relationship with the thief. Additionally, Allrianne has been trained by Sazed to harness her powers of emotion manipulation, which have proven useful in aiding the resistance against their oppressors. Finally, she is remembered as one of the leaders of the crowd during an attack on the soldiers.

### Preservation (11 mentions) - Level 2 Character Summary

Preservation is a character that possesses the power of a god, inhabiting energy in a similar manner to Ruin. This ancient god-like entity was once bound by Rashek, but was later freed. Preservation values preservation and stability above all else, and has been fighting against Ruin for centuries. It is known as a powerful being that seeks to heal and restore life, but its true nature remains mysterious. Despite its dying state, the body of Preservation was left to be buried in ash. It is believed that this deity once opposed Ruin and was imprisoned for several thousand years. Preservation is also known as the Lord Ruler who granted nuggets to nobility, enabling the manifestation of Allomancy. The other half of Ruin's power, Preservation was imprisoned in the Pits of Hathsin. Ultimately, it is a mysterious figure whose true nature remains unknown, but whose power is undeniable.

### Rashek (9 mentions) - Level 2 Character Summary

Rashek is a formidable koloss who possesses immense power and is obsessed with achieving even more. With the ability to burn duralumin and brass, he commands attention and respect wherever he goes. His actions have had significant impacts on the world around him, causing changes that are both transformative and far-reaching. Despite his impressive abilities, Rashek's past is marked by mistakes - he tried to save the world's plants but inadvertently made them worse.

As a skilled man with a keen mind, Rashek has also left a lasting legacy at the Well of Ascension, where he placed a nugget of Allomancy that would change the course of history. He is both the protagonist and antagonist of his own story - using his powers to reshape the landscape of the world and create a new capital for himself, while also imprisoning his former captor, Preservation. His actions represent the duality of Preservation and Ruin, as he wears both black and white in equal measure.

Rashek's past is marked by both triumph and tragedy - he was once a nobleman who discovered the power to manipulate ash, but his ambition led him down a dark path. Now, he is free from the prison that once held him captive and searching for the Well of Ascension with Vin. He represents a formidable force in the world, both feared and respected by those around him.

### KanPaar (9 mentions) - Level 2 Character Summary

KanPaar is the first-generation leader of the Trustwarren and the head of the second generation of kandra, responsible for enforcing the Contract and punishing those who break it. He was a judge during TenSoon's sentencing and was awed by his return but disappointed in him. As an elder kandra, he is shocked by TenSoon's escape attempt and skeptical of Sazed's claims. KanPaar is a human member of the Terris religion, who questions the existence of his faith and its connection to the Hero of Ages. He is also a powerful kandra leader who led the effort to deliver atium to Ruin.

### Fatren (7 mentions) - Level 2 Character Summary

Fatren is a complex character with various descriptions, each portraying him from different angles. One description describes him as a skaa peasant who has been training to fight against the koloss, implying that he is brave and skilled in combat. Another portrays him as a man who has been ruling the city for several years, suggesting that he is powerful and influential. Additionally, Fatren is described as a general in Venture's army, indicating his military prowess and leadership abilities.

However, some of the descriptions paint Fatren in a negative light. He is referred to as the Lord Ruler of the city of Fatren, an enemy of Vin and Elend, suggesting that he is cruel and ruthless. Furthermore, Fatren is described as a nobleman from the city of Tavra, loyal only to the Lord Ruler, implying that he is not concerned with the welfare of his people.

In another description, Fatren is portrayed as a town leader in the village that was attacked by the mists. He is responsible for organizing the evacuation of the villagers, indicating that he is resourceful and strategic. However, this description does not provide any information about his character beyond his leadership abilities.

Finally, Fatren is described as a soldier in Elend's army and Vin's friend and fellow survivor of the koloss attacks, suggesting that he is loyal and supportive.

Overall, Fatren is a complex character with multiple layers, each portraying him from different perspectives. While some descriptions paint him in a negative light, others suggest that he has leadership abilities and is loyal to those he cares about.

### Human (7 mentions) - Level 2 Character Summary

The character described is a man who appears to be a member of the Inquisition, but his true identity is unknown. He is named Vin's guide through the city, leading him on his journey through its labyrinthine streets. Despite his mysterious appearance, he is ultimately controlled by a powerful force known as Koloss, a massive blue creature with formidable strength and abilities. Vin, in turn, controls this Koloss, using it to carry out his own bidding.

This character's past is also shrouded in mystery, but it is known that he was once a human himself. However, he struggled to regain his humanity after being transformed into a koloss, and he took on the name of "Human" as a reminder of what he had lost. Despite this struggle, he remains committed to fighting against the forces of Ruin, who seek to destroy the Homeland and all it holds dear. In this battle, Human fights alongside Elend Venture, another brave warrior determined to protect their home from harm. Together, they use their strength and determination to face down the enemy and defend their way of life.

### Durn (7 mentions) - Level 2 Character Summary

Durn is a skaa who communicates with others through music. He is also a large beggar who serves as a member of the Citizen's army, tasked with guarding Spook. Despite his rough exterior, Durn is not only an ally to Spook but also has other roles he plays in the story.

As a thief, Durn seeks to help Spook by spreading rumors about Kelsier's death. However, as an informant, he is being milked for information, which could lead to dangerous consequences. In addition, Durn is a wealthy merchant who is willing to go to great lengths to get what he wants, even if it means harming others.

Despite his occasional bouts of drinking, Durn cheers for Spook and shows support for him. He is also the leader of the city's underground, which could be an advantage or a disadvantage depending on the situation. Overall, Durn is a complex character with multiple facets that make him both a valuable ally and a potential threat.

### Quellion (7 mentions) - Level 2 Character Summary

Quellion is a prominent citizen of the Central Dominance and a key figure in the resistance movement. He possesses exceptional political skills and is deeply committed to safeguarding his people. He has recently taken on the role of leader of the city, though his rule is characterized by cruelty and a willingness to resort to violence in order to maintain control.

As a skilled fighter with expertise in Allomancy, Quellion plays a crucial role in leading the rebellion against the Lord Ruler. He is highly respected for his abilities and is revered by many within the resistance movement. However, some question his motives and actions, as rumors have spread about his involvement in the event that sparked the rebellion in the first place.

Despite being a wealthy merchant, Quellion finds himself drawn to the fight against tyranny and is willing to risk everything to bring down the oppressive regime. He has been attacked by Spook in the past, but he was able to overcome the attack and continue his work towards liberation. Ultimately, Quellion's legacy will be determined by whether or not he succeeds in bringing about lasting change and freedom for all citizens of the Central Dominance.

### Koloss (6 mentions) - Level 2 Character Summary

Koloss is a large, humanoid creature that poses a significant threat to the main character of the story. These creatures are described as enormous and used as soldiers by the Final Empire. They can be mentally diminished due to the presence of Allomancers controlling their movements. In addition, Koloss was once a slave to Ruin, but has since been freed by Sazed and now serves him in battle. Overall, Koloss is a formidable opponent that requires careful consideration when facing him in combat.

### Elendil (6 mentions) - Level 2 Character Summary

Elendil is the loyal right-hand man of the Lord Ruler, responsible for executing various tasks such as hunting down Vin and Kelsier. He is a man on a mission to find a solution to the mists that come during the day, which threatens the safety of the people. Elendil is also the Emperor of the New Empire, hailing from House Vorin. Despite his noble status, he remains devoted to serving his ruler and maintaining the empire's power. Elendil is a formidable figure known for his cruel and tyrannical rule, using fear and force to keep the people in line. As such, he relentlessly hunts down skaa Mistings, those who dare to oppose the Lord Ruler's reign.

### Goradel (5 mentions) - Level 2 Character Summary

Goradel is a man of many roles and experiences, having played a part in several pivotal events in the story. He is described as a soldier who led Lady Vin into the palace on the night she killed the Lord Ruler, and it was his guidance that ensured her safe passage to her destination. In addition to his role as a guard for Emperor Venture, Goradel has also been known to suggest making stops at Luthadel for supplies. This suggests that he is a strategic thinker who values efficiency and resourcefulness in his duties.

However, Goradel's past is not entirely devoid of conflict. He was once a skaa thug who belonged to the group that rescued Spook's sister from the Citizen's mansion. This background may have given him a certain degree of streetwise knowledge and resourcefulness, but it also indicates that he has a darker side that is capable of violence and deception. Despite this, Goradel has been redeemed by his loyalty to Lady Vin and his desire to stop the Ash from causing further destruction. He is now working alongside her, using his skills and experience to aid in their fight against the enemy.

### MeLaan (4 mentions) - Level 2 Character Summary

MeLaan is a Seventh Generation Kandra with a rebellious nature, who possesses a True Body that she wears. She stands out from her kin as an individual who has joined forces with TenSoon in his fight against the Second Generation. As a female Kandra, MeLaan is unique and possesses qualities that set her apart from others of her kind. Despite being inhuman, she possesses a fierce determination and passion for justice, which propels her to take action against those who seek to oppress her people. Her experiences as a kandra of the Second Generation have given her a keen understanding of her people's struggles and have inspired her to make a difference. MeLaan's True Body is a testament to her strength and resilience, and she uses it to its fullest potential in her quest for freedom and equality for all Kandra.

### Reen (4 mentions) - Level 2 Character Summary

Reen is a skilled allomancer with a history of thievery who currently serves as an advisor to Elend. Despite his past transgressions, he remains a trusted figure in Vin's life, whom she has known for many years. However, their relationship may be complicated by the fact that Reen appears to be one of the main antagonists that Vin and her allies are fighting against. While it is unclear whether Reen is truly an enemy or simply a pawn in a larger game, his role as an allomancer adds another layer of intrigue to his character.

### Clubs (4 mentions) - Level 2 Character Summary

Clubs was a skilled fighter and tactician who served as the leader of Kelsier's crew during the siege. He had previously been a slave, but after gaining his freedom through becoming an Allomancer, he joined Kelsier's group in their fight for revolution. Known for his strength and loyalty, Clubs played an important role in the success of their mission. Unfortunately, he was killed at the Battle of Luthadel, leaving behind a legacy as a dedicated member of the crew.

### Elend Venture (4 mentions) - Level 2 Character Summary

Elend Venture, also known as The Lord Ruler, is a powerful Allomancer who serves as both the main protagonist and ruler of the world in the series. He uses his abilities to maintain order and peace among the people. Elend Venture's heir to the throne of Ages is his son, who at about twenty-five years old is a young man with dark hair and eyes. As the story progresses, this young man will become a skilled Allomancer and leader of the koloss, taking on more responsibilities as he grows older.

### Lord Ruler (4 mentions) - Level 2 Character Summary

Lord Ruler, also known as Vin's husband, is a character in the story. He was once the ruler of the world and has been dead for a thousand years. His body is currently being held by Ruin. Lord Ruler was also known for his plan to transform all living Feruchemists into mistwraiths. However, he made a mistake in his plan by not considering the genetic heritage left in other Terris people, which led to the continuation of Feruchemist births.

Furthermore, Lord Ruler was also known for planting Hemalurgic spikes in his agents. It is unclear what the purpose of this action was or how it affected the story. Overall, Lord Ruler was a significant character in the story and played an important role in shaping the world in which he lived.

### Dockson (3 mentions) - Level 2 Character Summary

Dockson was a bureaucrat in the government of the Central Dominance, but he had previously been a successful thief and was currently a skilled navigator on his crew. He was known for being a loyal member of the crew, while also possessing excellent navigation and strategic skills. Unfortunately, he was killed at the Battle of Luthadel.

### Slowswift (3 mentions) - Level 2 Character Summary

Slowswift, an elderly gentleman, operates a tavern in the bustling city of Fadrex. He is known for his vast knowledge about the history and inhabitants of the city, and he has been serving as an informant for Cett for many years. However, Slowswift has recently grown disillusioned with the regime of the Lord Ruler, and now he actively works to undermine it, using his position to gather valuable intelligence that could help bring about change.

Slowswift is not just a knowledgeable individual, but also a skilled businessman. He runs a successful tavern, catering to the needs of both locals and travelers passing through Fadrex. Slowswift takes pride in providing his customers with high-quality drinks, delicious food, and engaging conversation.

Despite his advanced age, Slowswift remains active and engaged with the world around him. He has a keen eye for detail and is always on the lookout for information that could be of value to Cett or other interested parties. Slowswift is an invaluable resource for anyone looking to understand the complexities of Fadrex and its people, and he is always willing to share his knowledge with those who seek it.

### Zane (3 mentions) - Level 2 Character Summary

Zane is an older gentleman with a tawny complexion that matches the color of his hair. He possesses remarkable abilities as an Allomancer, allowing him to manipulate metals through his own body. Once a devoted follower of Ruin, he has since renounced his allegiance and turned against him. Zane obtained his spike from Ruin and used it to commit a heinous act by murdering the nobility.

### Penrod (3 mentions) - Level 2 Character Summary

Penrod was an older man, known for his command over the forces that were sent to provide support in a battle. However, things did not go as planned, and he ended up being wounded by Marsh during a fierce fight. Despite his age, Penrod still held a significant amount of authority, making him a formidable opponent even in his weakened state. His position as the aging king of Luthadel added to his power and prestige, but ultimately it was his impending death that marked his end. As such, he had to be killed by Marsh before he could pose any further threat to those seeking to overthrow him.

### Haddek (3 mentions) - Level 2 Character Summary

Haddek is an elderly Kandra who plays a vital role in Sazed's life as his mentor. He serves as the leader of the First Generation, which is responsible for safeguarding the Blessings. Haddek is also part of the First Generation and has been recognized as a hero of the ages due to his significant contributions.

### Venture (2 mentions) - Level 2 Character Summary

Venture is an Allomancer who claims to hold the title of Lord. He has announced that he will offer assistance to the city in defending against an approaching army of Koloss. As the Emperor of Allomancers, Venture commands a significant amount of influence and power within his community. He is likely seen as an authority figure and a source of guidance for those seeking protection from the looming threat. Venture's reputation as an experienced and skilled Allomancer may give him credibility when offering help to the city. His claim to be a Lord suggests that he holds a position of respect and power within his community, which could lend weight to his offer of assistance. Overall, Venture is a complex character who embodies the strength and leadership qualities of an Allomancer.

### VarSell (2 mentions) - Level 2 Character Summary

VarSell is a guard tasked with escorting TenSoon to the Trustwarren. He belongs to the Second Generation, which means he is part of a group of people who have been born and raised in this particular society. VarSell is also a Fifth-Generation nobleman, meaning that he has inherited a position of power and wealth within the community. As a member of the Second Generation, VarSell is likely familiar with the customs and traditions of his society and has developed a deep understanding of its inner workings. He may also have formed strong relationships with other members of the Second Generation, as they share a common background and experiences.

### Kandra (2 mentions) - Level 2 Character Summary

Kandra is a member of the First Generation and was once imprisoned alongside TenSoon. As a double agent, she was entrusted with the responsibility of pulling out her Hemalurgic spikes in response to Ruin's attempts to seize them.

### Lady Vin (2 mentions) - Level 2 Character Summary

Lady Vin is a highly accomplished individual known for her proficiency in the art of skaa mistborning. Her past experiences with Demoux have been tumultuous, characterized by ups and downs. Despite this, she remains resolute in her practice and continues to hone her skills. It is noteworthy that she was able to become Mistborn at an advanced age, which adds a layer of complexity to her character profile.

### Vin Diesel (2 mentions) - Level 2 Character Summary

Vin Diesel is a young man who hails from Luthadel, a city in a far-off land. He begins his journey by becoming an apprentice to Elend Venture, a skilled master of the Allomantic arts. It soon becomes apparent that Vin possesses latent Allomantic powers, which are later revealed to be those of a Mistborn.

As the protagonist of the story, Vin quickly proves himself to be a skilled thief and an accomplished Allomancer. He uses his abilities to navigate through treacherous situations and to outsmart his opponents. Despite his rebellious nature, he is ultimately driven by a desire for redemption and a sense of duty to protect those around him.

### Noorden (2 mentions) - Level 2 Character Summary

Noorden is a member of Elend Venture's council and specializes in statistics and mathematics. As such, he is a skilled strategist and advisor who brings valuable knowledge to the council table. Additionally, Noorden is an old friend of Elend, having been friends for many years. Despite their long friendship, Noorden has become a powerful sorcerer with the ability to use Ruin to control the world around him. This newfound power has changed Noorden's demeanor and he is now a formidable force in the council, using his skills and abilities to shape the future of Elend Venture.

### Tindwyl (2 mentions) - Level 2 Character Summary

Tindwyl is a character who played an important role in Sazed's life. He was Sazed's research partner who shared a strong interest in politics and leadership. Tindwyl was someone who supported Sazed in his endeavors, and the two of them worked together closely to advance their research goals.

However, Tindwyl's life took a tragic turn when he was taken by Rashek. This event served as the catalyst for Sazed's quest, and Tindwyl's disappearance became the driving force behind Sazed's efforts to rescue him from Rashek's clutches. Despite the challenges that lay ahead, Sazed remained determined to find Tindwyl and bring him back to safety.

### Telden (2 mentions) - Level 2 Character Summary

Telden is an old friend and advisor to Elend, and he is a historian and philosopher who has known Elend since they were young scholars. He has been by Elend's side throughout their journey, providing guidance and support when needed. In addition to his role as an advisor, Telden is also currently assisting Vin in trying to escape from the cavern. His knowledge and wisdom make him a valuable asset in this endeavor, and he is determined to help Vin succeed. Despite the challenges they face, Telden remains committed to supporting his friend and helping them overcome any obstacles that come their way.

### Conrad (2 mentions) - Level 2 Character Summary

Conrad is a lieutenant in the army of Elend. He is a member of the Mistfallen faction, and has been entrusted with the leadership of a new company of soldiers. As one of four messengers sent by Penrod, he successfully evaded capture by a koloss and managed to escape.

### OreSeur (2 mentions) - Level 2 Character Summary

OreSeur was the brother of TenSoon and a part of Kelsier's crew. At the behest of Zane, he was taken from TenSoon in order to learn his secrets. Ultimately, OreSeur met a tragic end when TenSoon killed him in the process of extracting that information.

### Captain Goradel (2 mentions) - Level 2 Character Summary

Captain Goradel is a brave and courageous leader who commands a group of soldiers responsible for safeguarding Spook and his crew. He is highly skilled in battle and has proven himself to be an effective commander, earning the respect and admiration of his troops. Additionally, Captain Goradel is known for being a messenger of hope, having once delivered a message that saved the people from danger. His charisma and leadership abilities make him a valuable asset to both his comrades and the mission at hand.

### Terrisman steward (1 mentions) - Level 2 Character Summary

Terrisman, the steward and Inquisitor, is Marsh's loyal companion. He can often be found seated at a table directly in front of Marsh, where he is performing his duties as an assistant to Marsh.

### Keeper of Terris (1 mentions) - Level 2 Character Summary

Keeper of Terris is a man who has dedicated his life to working tirelessly for the benefit of others. He is currently being held captive in Marsh. It would be a grave injustice to take his life, as it would not only be a crime but also a great tragedy.

### Hero of Ages (1 mentions) - Level 2 Character Summary

The character described as "the protagonist of the story" is a central figure around which the plot revolves. This individual, known as the "Hero of Ages," has a significant role to play in the narrative and is likely one of the main characters. The Hero of Ages' actions and decisions may drive the story forward and have a profound impact on its outcome.

### Druffel (1 mentions) - Level 2 Character Summary

Druffel is a skaa peasant from Fatren who has joined the army in order to train for battle against the koloss. He is one of the soldiers in the same unit as Fatren and has been training alongside him. Druffel is also a fellow soldier of Fatren, which means that they share the same duties and responsibilities during their training. Druffel's background as a skaa peasant may give him unique perspectives on life, but his commitment to fighting against the koloss is what unites him with his fellow soldiers, including Fatren.

### Judgment (1 mentions) - Level 2 Character Summary

Judgment is a character who possesses immense power, capable of reshaping the world around them. However, despite their great abilities, they remain oblivious to the true nature of their powers. This lack of understanding makes them a dangerous force, as Judgment may unwittingly use their abilities in ways that could have catastrophic consequences for themselves and others. Despite this potential danger, Judgment continues to wield their power with reckless abandon, determined to achieve their goals at any cost. Whether through sheer force of will or a lack of foresight, Judgment remains an enigmatic figure, one whose actions may have far-reaching consequences for all who cross their path.

### Ruxton (1 mentions) - Level 2 Character Summary

Ruxton is a member of the Brotherhood Without Banners, a group of warriors who fight for justice and freedom. He has proven to be a valuable ally to Vin and Kelsier in their quest, using his skills and experience to help them overcome challenges and achieve their goals. Ruxton is a formidable warrior, with a fierce determination and unwavering loyalty to those he cares about. Despite the hardships of his past, he has found redemption and purpose through his affiliation with the Brotherhood Without Banners. Ruxton is a complex character, with a rich history and a strong sense of honor that guides him in everything he does.

### King Lekal (1 mentions) - Level 2 Character Summary

King Lekal is the individual who agreed to the terms of the treaty and put his signature on it. He is a royal figure who played an important role in resolving a conflict or negotiating a mutual understanding between two or more parties through the signing of this document. His actions demonstrate his ability to make decisions, take responsibility for them, and engage in diplomacy.

### Ash (1 mentions) - Level 2 Character Summary

The character you are referring to is named Ash. He seems to be a person of average height and build, with ordinary features that do not particularly stand out. As he walks through the camp, there appears to be a certain clumsiness or lack of coordination about him. It is as if he has difficulty maintaining his balance, causing him to stumble and fall more frequently than others. Despite this, Ash seems to be an amiable and friendly person, with a kind smile on his face and a warm demeanor.

### Inquisitors (1 mentions) - Level 2 Character Summary

The Inquisitors are a group of individuals who are dedicated to the pursuit of knowledge and the eradication of evil. Their ultimate goal is to uncover the truth behind Ruin, a powerful force that threatens to disrupt the balance of their world. Through careful investigation and analysis, they work tirelessly to gather evidence and formulate strategies to combat this malevolent entity. With a keen eye for detail and an unyielding determination to succeed, the Inquisitors are a formidable force to be reckoned with in their quest to protect their realm from ruin.

### Lord Hammond (1 mentions) - Level 2 Character Summary

Lord Hammond, a distinguished figure in the Church of the Survivor, holds a prominent position among its members and has been intimately linked to the machinations of Elend. He is a dedicated follower of the faith, deeply committed to its teachings and principles, and plays an integral role in ensuring that the church's interests are protected at all times. His close association with Elend, the enigmatic leader of the organization, places him in a unique position of influence and power, enabling him to shape the future of the church and its followers in profound ways. As a high-ranking member, Lord Hammond wields significant authority and prestige within the church hierarchy, and his decisions and actions have far-reaching consequences for its members and the wider world. Despite his lofty status, however, he remains humble and devout, always striving to uphold the ideals of the faith and serve the greater good in all that he does.

### HunFoor (1 mentions) - Level 2 Character Summary

HunFoor is a member of the kandra species who belongs to the second generation. Initially, he was tasked with serving Zane Kelsier, but later, he decided to betray his master and assist Vin in killing the Lord Ruler.

### Mare (1 mentions) - Level 2 Character Summary

Mare is a woman who takes charge as the head of the rebellion against the oppressive regime that has been ruling for far too long. She is also the love interest of Kelsier, a man who she respects and admires deeply. She is a strong and determined individual, always fighting for what is right and never backing down from a challenge. She leads her fellow rebels with courage and conviction, inspiring them to continue their fight even in the face of danger. Mare's love for Kelsier is just as strong as her passion for justice, and together they make an unbeatable team. Their love story adds a romantic element to the rebellion, giving hope and motivation to all those who support their cause.

### Tin (1 mentions) - Level 2 Character Summary

Tin is a skilled member of the crew who excels in the art of Tin Allomancy. With his remarkable ability to manipulate metal, he can create awe-inspiring constructs that leave those around him in utter amazement. His talent for this ancient form of magic has earned him the respect and admiration of his fellow crew members, who rely on his expertise to overcome any obstacle they may encounter during their missions.

### Lord Breeze (1 mentions) - Level 2 Character Summary

Lord Breeze is a male character who assumed leadership of the group in the absence of Sazed. His commanding presence and ability to take charge in times of need have earned him respect and authority among his peers. He stepped up and took control, demonstrating strong leadership skills and taking charge of the group's operations. Despite facing various challenges, Lord Breeze remains focused on achieving his objectives and leading his team to success. His determination and commitment make him a formidable leader, and he continues to guide the group with skill and precision.

### Kelsier's wife (1 mentions) - Level 2 Character Summary

Kelsier's wife was a survivor's mother who was tragically killed in the treacherous and dangerous Pits of Hathsin. Her demise is mentioned as a significant event that has affected Kelsier deeply, serving as a driving force behind his actions and motivations.

### The Survivor (1 mentions) - Level 2 Character Summary

The survivor is a young male who was born into difficult circumstances in the Pits of Hathsin. Despite facing numerous challenges throughout his life, he has proven his resilience and determination to overcome adversity. His background has instilled in him an unwavering sense of perseverance, making him a valuable asset in any situation where survival is key. With his unwavering spirit and unbreakable resolve, the survivor is always ready to face whatever challenges come his way.

### Steward 1 (1 mentions) - Level 2 Character Summary

Steward 1 is an elderly individual who provided a warm welcome to Sazed upon his arrival at the Pits of Hathsin.

### Steward 2 (1 mentions) - Level 2 Character Summary

Steward 2 is an elderly individual who welcomed Sazed when he arrived at the Pits of Hathsin. He may be described as a steward, someone responsible for overseeing and maintaining a certain area or task.

### The Voice (1 mentions) - Level 2 Character Summary

The Voice is an accomplished Allomancer who has taken on the responsibility of guiding Spook through a mysterious and potentially dangerous household. With their expertise in the arcane arts, The Voice navigates the treacherous landscape of the house with ease, while also providing valuable insights into the secrets and mysteries that lie hidden within. Despite the many challenges they face, The Voice remains steadfast in their mission to protect Spook and help them navigate the ever-changing world around them.

### Ruthless (1 mentions) - Level 2 Character Summary

Ruthless is an experienced Allomancer who has taken on the role of mentoring Vin. He is notorious for his unrelenting methods and his readiness to employ any means necessary to accomplish his objectives. Despite being feared by many, Ruthless is highly respected within the Allomancer community due to his formidable skills and unwavering dedication to his craft.

### Renata (1 mentions) - Level 2 Character Summary

Renata is a young female character who finds herself in a precarious situation when she is captured by Elendil's guards. Despite the danger she faces, her fate takes an unexpected turn when she becomes entangled in Kelsier's plan. As a result, Renata must navigate through the challenges and obstacles presented to her in order to fulfill her role in this intricate scheme. Her involvement with Kelsier and his plan may place her at odds with Elendil and his guards, but it also presents her with an opportunity to take action and make a difference in the world around her. Ultimately, Renata's actions and decisions will determine the success or failure of this daring mission.

### Jedal (1 mentions) - Level 2 Character Summary

Jedal was the father of Spook, a skaa laborer who tragically lost his life at the hands of a cruel nobleman. He likely worked hard to provide for his family, but ultimately paid the ultimate price for his struggles.

### Margel (1 mentions) - Level 2 Character Summary

Margel is the mother of Spook, and she was a skaa laborer who was eventually taken captive by a nobleman. She may have been working on a construction site or in another job that required physical labor when she was abducted. Margel could have been young and vulnerable, possibly having children to support. The fact that she is Spook's mother suggests that he may have had close ties with her prior to her being taken away. As a skaa laborer, Margel may have faced discrimination and exploitation in the workplace, which could have made her more susceptible to capture by the nobleman or his allies. It is unclear what became of Margel after she was taken, but her disappearance would likely have had a significant impact on Spook's life.

### The Citizen (1 mentions) - Level 2 Character Summary

The Citizen is the governing leader of Urteau, a region renowned for its mystical fog. At the core of his beliefs lies the conviction that the enigmatic forces contained within the mists possess an immense and transformative power. He regards them with reverence and respect, seeking to harness their potential for the betterment of his people and his realm. Through his rule, he strives to maintain harmony between the citizens of Urteau and the natural world, recognizing that the two are inextricably linked. His unwavering faith in the power of the mists guides his every decision, as he seeks to build a future where the people of Urteau can thrive in harmony with the land.

### Hoid (1 mentions) - Level 2 Character Summary

Hoid is a character who is often described as a beggar, and can typically be found sitting quietly in an alleyway at night. He may appear to be lost in thought, humming to himself, but he may also possess valuable information for Vin. Despite his appearance, Hoid is a complex and intriguing character with his own unique story and motivations.

### The Lord Ruler (1 mentions) - Level 2 Character Summary

The Lord Ruler, commonly known by his title Ruin, is a pivotal character in the plot, serving as the main antagonist of the story. He is an enigmatic figure whose actions drive the narrative forward and often lead to conflict between the protagonist and himself. With a sinister air about him and an aura of power, Ruin exerts control over the events that unfold throughout the story. Whether he's manipulating others or employing his own cunning, Ruin is a force to be reckoned with in this complex tale.

### The Mistborn spirit (1 mentions) - Level 2 Character Summary

The Mistborn spirit is an elusive entity, exuding an aura of enigma and possessing the unique ability to imbue individuals with the power of Allomancy. With a mere touch or a glance, this mysterious figure can transform people into Mistborn, bestowing upon them the extraordinary gift of manipulating the very elements themselves. The spirit's origins remain shrouded in mystery, and its intentions are equally unclear. Its presence is felt only in the rarest of occasions, leaving those fortunate enough to encounter it with a sense of awe and wonder, as well as a newfound understanding of their own limitless potential.

### Vin Venture (1 mentions) - Level 2 Character Summary

Vin Venture is the hero of the Final Empire and the spouse of Elend Venture. He has been referred to as the Empress.

### Mistral (1 mentions) - Level 2 Character Summary

Mistral is a young girl who was in a dire situation when she was saved by Kelsier. She was then offered the opportunity to become his apprentice, learning the skills and techniques of a skilled magic user. Despite being new to the ways of magic, Mistral quickly proves herself to be a quick learner and a natural talent. With Kelsier as her guide, she embarks on a journey of self-discovery and growth, becoming an invaluable member of his team. As she learns more about the world around her, she also discovers her own strengths and weaknesses, and begins to develop her own unique style of magic. With each passing day, Mistral becomes more confident and capable, and her bond with Kelsier grows stronger. Together, they tackle challenges and obstacles, and work towards a common goal of bringing about positive change in the world.

### Skaa (1 mentions) - Level 2 Character Summary

Skaa is a solitary and mysterious individual, who stands out from the rest due to his unique ability to recall the demise of the Lord Ruler. He is the only one among the population who seems to have any knowledge of this significant event, which has left many questioning his true identity and motivations. Despite the uncertainty surrounding him, Skaa remains a vital figure in the story, as he holds crucial information that could potentially change the course of events. His enigmatic nature adds an air of intrigue to the plot, leaving readers eager to discover more about his past and intentions.

### Lady Patresen (1 mentions) - Level 2 Character Summary

Lady Patresen is a member of the noble class and hails from a city that is of little significance. Despite her privileged upbringing, she remains grounded and level-headed, with a strong sense of duty and responsibility. She carries herself with grace and poise, always maintaining an air of refinement and sophistication. Her attire reflects her high standing in society, but she never lets it cloud her judgment or obscure her compassion for others. Lady Patresen is known for her kind heart and generous spirit, often going out of her way to help those in need. Despite being from a small city, she has a wide network of connections and is well-connected in the upper echelons of society. Her charm and intelligence have earned her the respect of many, and she is highly regarded for her wisdom and discernment. Lady Patresen is an admirable character who embodies the best qualities of nobility and kindness.

### Shan (1 mentions) - Level 2 Character Summary

Shan is a highly intelligent and proficient individual who possesses the ability to manipulate metal through her knowledge of Alchemy. Her skills in this area make her a formidable force, able to outmaneuver and outsmart those around her with ease.

As a Mistborn woman, Shan has also developed a strong sense of intuition and strategic thinking, which allows her to quickly assess situations and make informed decisions. This makes her a valuable member of any team, as she is able to effectively communicate her ideas and work collaboratively with others to achieve success.

Overall, Shan's combination of intelligence, skill, and intuition make her a formidable and dynamic character in any story. She is sure to captivate readers with her unique abilities and personality traits.

### Feruchemy (1 mentions) - Level 2 Character Summary

Feruchemy is a character known for his ability to maintain balance in the world, a skill that has been passed down through generations of men prior to the conflict between preservation and ruin. This talent allows him to navigate challenging situations with ease and precision, making him a valuable asset in any situation. With Feruchemy's unique power, he can help people find harmony and peace in their lives. His ability to maintain equilibrium is unparalleled and sets him apart from others. Whether it's in work or personal life, Feruchemy's skills make him an invaluable asset.

### Mailey (1 mentions) - Level 2 Character Summary

Mailey is a young girl who has been captured by the Citizen. As a result, she now faces the threat of being burned alive. She is in immediate danger and urgently needs to be rescued before it's too late.

### kandra (1 mentions) - Level 2 Character Summary

Kandra is a character who has been granted the Blessing of Potency, which imbues them with a certain level of strength. However, this strength is not limited to the power of burning pewter, but rather extends to an innate strength that resembles it. As such, Kandra possesses a unique and formidable combination of physical prowess and mystical abilities, making them a force to be reckoned with in any situation. Their strength and versatility make them a valuable asset to any team or group they belong to, as well as a dangerous adversary for anyone who crosses their path. With their unwavering determination and fierce resolve, Kandra is a character that commands respect and awe from all those around them.

### Blessing of Presence (1 mentions) - Level 2 Character Summary

The character named "Blessing of Presence" is someone who grants others with mental capacity in a similar manner. This person has the ability to imbue others with intelligence and understanding, in a way that is similar to how they themselves possess these qualities. They may do this through various means such as teaching or imparting knowledge, but ultimately their presence is what brings about the mental growth and development of those around them.

### Blessing of Awareness (1 mentions) - Level 2 Character Summary

Blessing is a character who possesses the ability to sense with greater acuity. This means that she has a heightened sensitivity to her surroundings and can perceive things more clearly than others. She is highly attuned to subtle changes in her environment, and can often detect things that are not immediately apparent to others. Her acute senses allow her to gain valuable insights and make quick, informed decisions in challenging situations. Blessing's ability to sense with greater acuity gives her a unique advantage in navigating the world around her.

### Blessing of Stability (1 mentions) - Level 2 Character Summary

Blessing of Stability is a character who embodies the trait of emotional stability. With her strong will and unwavering spirit, she has the ability to endure even the most challenging emotions with grace and poise. She possesses a strength of character that allows her to face adversity with courage and determination, always remaining focused on her goals and aspirations. Blessing of Stability is a force to be reckoned with, inspiring those around her with her unwavering sense of calmness and resilience.

### Franson (1 mentions) - Level 2 Character Summary

Franson is an individual employed in the skaa industry and is affiliated with a collective that functions to retrieve Spook's sister from the confines of the Citizen's mansion. He can be described as partaking in his work with zeal and dedication, motivated by a sense of purpose and commitment towards his community.

### A man with a given power—such as an Allomantic ability—who then gained a Hemalurgic spike granting that same power would be nearly twice as strong as a natural unenhanced Allomancer. (1 mentions) - Level 2 Character Summary

A man possessing an Allomantic power, which is amplified by a Hemalurgic spike, would gain significantly increased strength in utilizing that same power compared to a natural unenhanced Allomancer. For instance, an Inquisitor who was previously a Seeker would experience an enhanced ability to work with bronze due to this transformation. This proficiency in bronze allowed many Inquisitors to penetrate copperclouds.

### Keeper Jules (1 mentions) - Level 2 Character Summary

Keeper Jules is a devoted guardian responsible for safeguarding the physical well-being of the Lord Ruler. Initially, he harbors a skeptical disposition towards Vin, but with time, his perception of her shifts, and she gains his trust and alliance.

### Telden Hasting (1 mentions) - Level 2 Character Summary

Telden Hasting is a close friend of Elend from Luthadel, who was captured and incarcerated in Yomen along with him. In his free time, Telden can be found working in the city's mining industry, where he labors tirelessly to extract valuable resources from the earth's depths. Despite his hardworking nature, Telden remains loyal and steadfast in his friendship with Elend, always ready to lend a helping hand when needed. Together, they have faced numerous challenges and hardships, but their unbreakable bond has carried them through even the darkest of times.

### The mist spirit (1 mentions) - Level 2 Character Summary

The mist spirit is a mysterious being that seems to be connected to the mists and ash falls. It is not entirely clear what its true nature is, but it is known for its ethereal appearance, which often appears to shimmer in the mist. Its body is composed of a dense fog that can move and change shape at will, allowing it to blend seamlessly into the surroundings. The mist spirit's powers are also said to be connected to the weather, as it can control the mists and ash falls to create a range of effects. Despite its otherworldly appearance, the mist spirit is not hostile towards humans and is often seen as a protector of the natural world. Its true nature may remain a mystery, but the mist spirit continues to captivate and inspire those who encounter it.

### The First Generation (1 mentions) - Level 2 Character Summary

The First Generation refers to a category of elderly individuals who were not gifted with the ability to form True Bodies during the era when the Lord Ruler distributed their skeletons. These elders possess normal, white skeletons and rely on canes for mobility as they navigate through their environment. Despite their physical limitations, they remain a vital component of the society, contributing with their wealth of knowledge and experience.

### Kredik Shaw (1 mentions) - Level 2 Character Summary

Kredik Shaw is a potent practitioner of the art of Allomancy, a form of magical energy manipulation. He was a victim of death at the hands of Vin, who possesses a remarkable ability known as Push. Despite his powerful abilities, Kredik met a tragic end due to Vin's actions.

### Ruthless Ruin (1 mentions) - Level 2 Character Summary

Ruthless Ruin is a unique entity brought into existence by the powerful being known as Preservation. This being possesses the ability to manipulate and control both preservation and destruction, giving it complete freedom to decide whether to uphold or destroy at any given moment. It is entirely up to Ruthless Ruin's discretion to use these powers, making it a force to be reckoned with in any situation. With the potential to both preserve and ruin at will, Ruthless Ruin's abilities are incredibly versatile and make it an unpredictable force.

### Push (1 mentions) - Level 2 Character Summary

Push is a character from the story, and he is affiliated with the Inquisition, a powerful organization in charge of maintaining order and enforcing rules. Despite his loyalty to this group, Push's actions led him to betray Ruin, the main protagonist of the story, and assist in the destruction of the Well of Ascension, an important location in the story's world. This act of treachery suggests that Push may have his own motivations and agendas that he is unwilling to compromise on, even if it means going against his fellow Inquisition members or harming innocent people.

### Yeden (1 mentions) - Level 2 Character Summary

Yeden, a man of great leadership and courage, met his end alongside his loyal soldiers in a fierce battle. Despite the odds stacked against them, Yeden fought bravely, leading his troops into the fray with unwavering determination. In the heat of the moment, however, tragedy struck and Yeden was struck down, falling to the ground lifeless beside his comrades. His loss was a great blow to those who knew him, as he was not only a skilled warrior but also a kind and fair leader who always put the needs of his soldiers first. Despite his untimely demise, Yeden's legacy will live on in the hearts and minds of those who knew him, and his bravery and sacrifice will never be forgotten.

### Emperor Pax (1 mentions) - Level 2 Character Summary

Emperor Pax is the present sovereign of the Last Empire, known for his sagacity and compassion as he works tirelessly to uphold tranquility and balance within his realm.

## Level 1 Aggregate Character Descriptions:

### Vin (95 mentions) - Level 1 Aggregation by Character

Description of Vin (95 mentions):

- A mysterious woman who helps Elend with his powers.
- The protagonist. She has pewter and duralumin metals.
- The protagonist of the story. A skilled Allomancer who uses her powers to fight against oppression.
- The protagonist of the story. She has the ability to control emotions and metal.
- The protagonist of the story. She is a powerful Allomancer and has been tasked with defeating the Outer Dominances.
- A skaa girl with a powerful koloss servant.
- A skilled Allomancer who has been tasked with protecting Elend. She is fiercely loyal to her employer but struggles with her own doubts and fears.
- A young woman who has been trained by her father to fight koloss.
- A woman who is determined to defeat the thing she has released.
- The protagonist of the story. She is an orphan who has been trained in the art of assassination by her uncle.
- A young woman with the ability to manipulate metal. She is the protagonist of the story.
- A young woman who has been raised by the Lord Ruler and is now on a quest to save her people.
- A young woman with short hair and a scar on her cheek. She is a skilled thief and often wears dark clothing.
- A street urchin who has been granted noble status by the Emperor. She is a skilled thief and assassin.
- A member of the crew, Kelsier's love interest. She is a skilled Allomancer and has a mysterious past.
- Heir of the Survivor and wife of Elend.
- An Allomancer who flares her metals and transforms her physiology, becoming an Allomantic savant with senses beyond what any normal Allomancer would need.
- The protagonist of the story. She is an orphan who has been trained in Allomancy by Kelsier.
- The protagonist of the story. A skilled Allomancer and former slave.
- A young woman who is searching for her missing brother and becomes involved with Kelsier's plan.
- A young woman who possesses magical abilities. She is a skilled archer and serves as a scout for the rebellion.
- A Tineye who has been tasked with scouting the city of Urteau.
- A young woman who became an Allomancer after being exposed to the metal allomancy of the Lord Ruler's forces. She joined Kelsier's crew and played a key role in the revolution, ultimately killing the Lord Ruler himself.
- The protagonist of the story. A skilled thief and member of the crew.
- A young woman who has been living in Luthadel since the fall of the Final Empire. She is determined to find her missing father and bring him to justice.
- A young woman with the ability to manipulate metal. She is determined and resourceful.
- A skilled thief and member of the Mistborn class.
- The Hero of Ages. She is the wife of Elend and has the ability to control the mists.
- A young woman who has been trained in the art of deception and disguise. She is fiercely independent and determined.
- A Mistborn who has been tasked with killing the Lord Ruler and taking control of the empire.
- A thieving crewleader who is trying to find a way out of Fadrex City.
- A powerful and skilled warrior, who killed an Elariel in a good fight.
- A mysterious woman who has captured Elend's heart, Vin is a skilled fighter and an enigma.
- A young woman of about eighteen, with long blonde hair and blue eyes. She is the daughter of a street urchin and an assassin.
- The protagonist of the story. A skilled Mistborn who is trying to become a good queen.
- A Mistborn who dances with Elend at a ball.
- A human who has trained TenSoon to leap incredible heights.
- A young woman with pewter-colored skin and hair. She is an Allomancer, able to manipulate metals through her body.
- A skilled warrior who is able to control koloss.
- A young woman with the ability to Push kolosses. She is also an Allomancer.
- The protagonist of the story, a human woman with the ability to manipulate metal.
- A young woman who is the protagonist of the story. She has the ability to control koloss and kandra.
- An attentive and thorough reader who is determined to find out what's in the storage cavern.
- A skilled thief and assassin who has been hired to steal a cache of weapons from the Ministry of Canton.
- A skilled thief and member of the Elend family.
- A person who fights against an enemy.
- A skilled Allomancer and thief who uses her powers to survive in the skaa slums.
- Elend's love interest and a skilled assassin. She helps Elend in his quest to overthrow Yomen.
- A woman who was captured by King Yomen and is trying to escape from a stone door.
- The protagonist of the story. A skilled Allomancer with a mysterious past.
- The protagonist who opposes Ruin's actions.
- A young woman who becomes a Misting and later a full Mistborn, joining Kelsier in his fight against the Lord Ruler.
- Elend's daughter and the love interest of the story. She is a skilled Allomancer who is captured by the enemy.
- The protagonist of the story. A skilled Mistborn who is searching for the Well of Ascension.
- The protagonist of the story. A skilled thief and member of the Keepers.
- The protagonist of the story. She is an Allomancer and has been imprisoned in the city of Yomen for several years.
- A character who is trying to escape from a cavern.
- A skilled assassin who works for Elend. She is fiercely loyal and willing to do whatever it takes to protect her employer.
- A young woman who can control kolosses. She has short blonde hair and blue eyes.
- A human woman who became the new Lord Ruler after killing Zane Venture.
- A skilled thief and Kelsier's love interest. She is also a member of the crew.
- The protagonist of the story. A Mistborn with the ability to Push metals.
- A blunt woman whose husband is the Lord Ruler. She was captured by Yomen and is awaiting execution.
- Elend's wife and love interest. She is an Allomancer and has been searching for the Well of Ascension as well.
- The protagonist of the story. A young woman with the ability to manipulate metal.
- A character who encounters Ruin and learns about his past and present.
- A young girl who possesses the ability to manipulate metal. Vin is fiercely independent and determined to protect those she cares about.
- A young woman who has been imprisoned for her crimes.
- The protagonist of the story. She is a skilled thief and member of the Lord Ruler's crew.
- The protagonist of the story. She is a skilled warrior and leader.
- Elend's daughter, who is captured by Yomen in order to secure a truce between the Southern and Northern Dominances. She is intelligent and resourceful, and is determined to rescue her father.
- A young woman who helps Sazed on his journey and has a deep understanding of religion and spirituality.
- The protagonist of the story. She is a Misting and has the ability to control emotions.
- The protagonist of the story. She is an orphan who has been trained in Allomancy by her uncle, Elend.
- The protagonist of the story. She is an Allomancer and has been tasked with finding the atium.
- A young girl who discovers the atium. She is brave and resourceful, but must navigate dangerous situations as she tries to protect her people from Ruin's grasp.
- A young woman with the ability to control metal. She is determined and resourceful.
- A woman who possesses the power to push on emotions and understand others' thoughts and feelings.
- A young woman who has been trained by the Lord Ruler to be an Allomancer. She is brave and resourceful, but also vulnerable.
- The protagonist of the story. A skilled Allomancer and member of the Brotherhood Without Banners.
- A young woman who has been through a lot.
- A woman with an earring made of metal, which Marsh rips from her ear.
- A young woman who has recently discovered her powers as an Allomancer. She is fierce and determined, and she fights with great skill.
- A young woman with Allomantic powers. She is the protagonist of the story.
- A young girl who discovers she has the power to burn metal. She becomes an important ally to Elend in his quest to protect the city.
- A human kandra who is a member of the First Generation.
- The protagonist of the story. She has been chosen to wield the power of the Lord Ruler.
- A being created by Preservation to be intentionally unbalanced. Stronger than Ruin, but they are equally matched at the moment.
- The protagonist, a young woman with the ability to manipulate atium.
- The Hero of Ages, a powerful Terris woman who is able to manipulate metal.
- A young woman with enhanced abilities who fights alongside Elend.
- Died, taking Ruin with him.
- A young woman who is the Hero of the story. She is tasked with saving the world from Ruin's power.
- A young woman with powerful Allomantic abilities who becomes the crew's mist spirit after touching the power at the Well of Ascension.
- A young woman who is a skilled thief and has been searching for something important.

### Elend (75 mentions) - Level 1 Aggregation by Character

Description of Elend (75 mentions):

- A scholar and leader who uses pewter to fight koloss.
- The leader of the Final Empire. He has steel metal.
- The Emperor of the koloss. He has the ability to control emotions.
- A member of the Church of the Survivor, Elend is Vin's ally in the fight against the Outer Dominances. He is also a powerful Allomancer and has been tasked with ruling Luthadel.
- The Lord Ruler's son and heir, who has been captured by the skaa.
- The current Emperor of Luthadel and ruler of several kingdoms. He is a brilliant scholar but struggles with the weight of his responsibilities.
- The Lord Ruler of the Final Empire, a powerful man with a beard and a scar on his face.
- The Lord Ruler of the Central Dominance. He is a powerful Allomancer and has been tasked with protecting his people from the mists.
- The emperor of Luthadel, who has been forced into hiding by the koloss beasts. He is Vin's ally and mentor.
- A powerful skaa lord who has joined the Church of the Survivor.
- A character who was saved from death by the nugget of Allomancy.
- The emperor of the empire. He has a scar on his forehead and wears a crown.
- Emperor of the Empire
- The leader of the group who wants to create a skaa government.
- Emperor of the Central Dominance and husband of Vin.
- The protagonist of the story. He is a nobleman and a skilled politician.
- A captain in the army who rides a horse.
- The new ruler of the Central Dominance.
- The emperor of the New Empire. He is a powerful Allomancer who has taken up the mantle of leadership after the death of his father.
- The current king of Fadrex City, and Vin's friend and ally.
- The protagonist and leader of the rebellion against Lord Yomen.
- The Lord Ruler of the Final Empire. Immortal and omnipotent.
- Vin's husband and a skilled Allomancer. He is also a member of the crew.
- A Seeker who is Vin's ally and mentor.
- The Emperor of Ages. He is the husband of Vin and has the ability to manipulate the Well of Ascension.
- Emperor of the Holy Empire and Lord Ruler. He is a powerful and intelligent man, but also very cautious.
- The emperor of Luthadel and leader of the rebellion against the Lord Ruler.
- A young noblewoman who has been betrothed to Yomen.
- A scholar and conqueror who seeks to bring order to the shattered remains of the Final Empire.
- A Venture who led the march to reclaim Luthadel from the Lord Ruler's forces.
- The emperor of Luthadel and Vin's love interest. He is a bit of a barbarian, but also very kind.
- A noble Mistborn who loves Vin and dances with her at the ball.
- The protagonist of the story. He is a Soother and the son of the Emperor.
- The protagonist and leader of the army. He is determined to find a way to break the curse of the Lord Ruler.
- A lord who is trying to understand the events related to the Survivor.
- The main character and leader of the army.
- The king of Fadrex. He is a Mistborn with tin to enhance his ears, allowing him to hear even the softest footsteps approaching.
- A leader who spoke to Penrod after he failed to send support.
- A young nobleman who is attending the ball at the Ministry of Canton as part of his duties. He is Vin's contact within the nobility.
- A person who tries to distract the enemy from attacking the city.
- A wealthy nobleman who is captured by the Inquisitors and held as a prisoner in the Lord Ruler's palace.
- The protagonist of the story. He is an obligator who seeks to overthrow the current ruler of the city.
- A man who lost a lot of blood and was patched up by Ham.
- The protagonist of the story. He is a kind and just ruler who cares deeply for his people.
- The protagonist of the story. A former obligator who seeks to save his empire from destruction.
- The Lord Ruler of Luthadel. He is a powerful and cunning man who will stop at nothing to maintain his rule.
- The Lord Ruler, a man with black hair and eyes that glow like metal. He is the ruler of the Final Empire.
- Kelsier's right-hand man, a former koloss soldier who has been with him since the beginning.
- The protagonist of the story. He is a member of the Church of the Survivor and has been tasked with finding the Well of Ascension.
- The emperor of men.
- An attentive and thorough reader who witnessed the passing of Preservation.
- The Emperor of Venture, a powerful and wise ruler who opposes Ruin's plans for destruction.
- The main antagonist of the story. He is a powerful nobleman who seeks to conquer the world.
- The protagonist and king of the Southern Dominance. He is a skilled fighter and has a strong sense of duty to his people.
- The Lord Ruler's brother and Vin's uncle. He is a skilled Allomancer and the leader of the rebellion against the Lord Ruler.
- An Inquisitor who seeks to capture Vin and use her powers for his own purposes.
- The Lord Ruler of Vetitan. He is a powerful and wise ruler who has been tasked with protecting his people from the threat of the atium.
- The Lord Ruler of the city, who has been killed by Vin.
- The leader of the army who fought against the koloss. He couldn't control them through emotions, so he had to rely on fighting.
- The Lord Ruler of Luthadel. He is a wise and powerful man, but also troubled by his past actions.
- The protagonist of the story. He is a nobleman and scholar who becomes emperor of the Final Empire.
- A man who was taken by the mists and discovered he is an Allomancer.
- A powerful Allomancer and leader of Fadrex. He has the ability to manipulate pewter, a rare metal found in the city's walls.
- The protagonist of the story. He is a skilled swordsman and has been tasked with protecting the city of Luthadel.
- The leader of the Central Dominance and the father of Ruin.
- A First Generation kandra who was imprisoned by KanPaar.
- The First of the Firsts. A powerful and wise kandra who led his people to freedom.
- The protagonist of the story. A Terrisman who is searching for his people and their lost city.
- A person with the goal of survival after undergoing Allomancy.
- The king of Aonisia and leader of the Terris people.
- A white-clad warrior who leads his men into battle.
- The protagonist of the story. He is a powerful atium Mistinger who leads his people to safety.
- Only reason Vin had left to live.
- A man who was once a slave to Ruin, but has been freed by Sazed and now serves as his companion in battle.
- A man who is the leader of a group of people who have been living underground for years.

### Sazed (55 mentions) - Level 1 Aggregation by Character

Description of Sazed (55 mentions):

- A Terrisman who serves as Elend Venture's chief ambassador.
- A Terris Feruchemist who has lost his faith.
- A Terrisman who is an atheist and has lost his love.
- A powerful skaa allomancer and a key figure in the Church of the Survivor.
- A former Lord Ruler who has been studying the various religions of the world.
- A former obligator who has renounced his powers and taken up the mantle of leadership in Elend's new government.
- An elderly man who is a Keeper of the Terris, a powerful magic-wielding race. He is also Vin's mentor and guide.
- A small, quiet man with a scar on his forehead. He is a skilled healer and often wears a hooded cloak.
- The Holy Witness of Luthadel. He is a Keeper of the Terris Order, a powerful magic user.
- A man who remembers Kelsier's smile and believes it can inspire them to keep struggling on.
- A scholar who has studied all three religions.
- An eunuch steward who left the group to make supplies stop at Luthadel.
- A former Keeper who has renounced his faith and is now searching for answers.
- A Keeper who joined Kelsier's crew after being freed from prison. He used his knowledge of ancient texts and history to help the crew plan their rebellion against the Lord Ruler.
- A Terrisman who was once a companion of Kelsier, the Survivor. He is now serving as an advisor to Emperor Venture.
- A young man who is a skilled thief and has a romantic relationship with Spook.
- A scholar and Terrisman who is searching for the Well of Ascension.
- A Soother, a powerful magic user who can manipulate emotions. He is loyal to the Lord Ruler and serves as his personal advisor.
- A former priest and scholar who has renounced his faith.
- A scholar and researcher who becomes Elend's ambassador.
- An Urteauan scientist and historian who helps Spook and Franson in their quest to rescue Spook's sister.
- A former nobleman who has joined the rebellion against Quellion. He is also a member of the Keepers of the Flame.
- A wise and powerful Allomancer who has been working with Kelsier to gather support for their cause.
- A man who was present during the event.
- An ambassador from the city-state of Luthadel, who becomes involved in the rebellion against the Lord Ruler.
- The last Keeper. He has set aside his metalminds and does not believe in the things he once taught.
- A scholar who has been studying the construction that brought water down into the cavern. He is hesitant about using his metalminds to help Spook with their plan.
- A skaa thief who enjoys studying and providing information for others.
- An elderly scholar who is helping Spook with his plan.
- A character who observes the situation and thinks about what will happen next.
- A former member of the Synod who has joined forces with Kelsier to help him rule Luthadel.
- A healer and member of the city's resistance movement.
- Spook's friend and fellow Allomancer. He is a skilled healer and uses his abilities to help the injured during the riots.
- The Keeper who wears the same robes, and has the same Feruchemical bracers on his arms. He is better at dealing with people than TenSoon, and seems to enjoy taking care of the day-to-day concerns of the citizenry.
- A Keeper and member of the Terrisman group. Dangerous and prying for rumors, legends, and tales.
- A former scholar who has dedicated his life to understanding religion and spirituality.
- A former Lord Ruler who has been stripped of his powers and is now living in disguise.
- A kandra who founded his sect for the Terris religion and spent lifetimes searching to discover it.
- A human who is a Keeper of the Pits. He carries bones in his pack to use as weapons.
- Keeper of Terris sent to speak with the First Generation of kandra
- A Keeper of Terris who has lived for over 100 years. He is the Announcer and has discovered the Hero.
- A kandra who is an attentive and thorough reader. He is trying to create a comprehensive list of characters in the story.
- A young man who has been searching for the truth about his religion.
- A Kandra who has been tasked with protecting the Homeland and its inhabitants.
- A human kandra who has spent his life studying religion and philosophy.
- A Keeper who has been tasked with protecting the First Generation.
- A kandra researcher who is a member of the Second Generation.
- A human who has been imprisoned by the Second Generation kandra for his beliefs.
- A First Generation Feruchemist who has been studying Hemalurgy and the nature of Preservation and Ruin.
- A Fifth Generation kandra who was imprisoned by KanPaar.
- The protagonist of the story. A kandra who was taken captive by Ruin, but managed to escape with the help of Elend and Demoux.
- An old kandra who has been serving as a guide for Elend and his army. He knows the location of the Homeland of the kandra people and their hidden cache.
- A kandra who has been tasked with protecting the atium.
- A wise and powerful Allomancer who helps Elend Venture on his journey.
- A man who has been alive for over a thousand years. He is a Keeper of the One Ring, and is tasked with protecting it from those who would use its power to destroy the world.

### Kelsier (49 mentions) - Level 1 Aggregation by Character

Description of Kelsier (49 mentions):

- A former Lord Ruler's assassin who is now fighting against him.
- A former Lord Ruler who is now a mentor to Vin. He has the ability to manipulate metal.
- A skilled thief who led the rebellion against the Final Empire.
- The protagonist of the story. A skilled thief and leader of the crew.
- The Survivor, a man whom Beldre and others speak of in reverence.
- Former Emperor of the Central Dominance, killed by a koloss.
- A former nobleman who became a criminal mastermind after being wronged by his own family. He is Spook's mentor and ally.
- The Survivor, a mysterious figure who was once a thief but has since become a religious icon. He is believed to have been granted divine powers.
- A man who gave Spook pewter to get revenge.
- A skilled thief and the mentor of Vin. He is determined to overthrow the Final Empire.
- A powerful Allomancer and Vin's former lover. He was once a slave like Vin, but he overthrew the Final Empire and became its first emperor.
- A former nobleman who was wronged by the Lord Ruler and seeks revenge through theft and deception. He is also a Mistborn.
- The protagonist of the story, a former Lord Ruler who seeks to overthrow the current one.
- A former nobleman turned thief who becomes Spook's mentor. He is obsessed with killing the Lord Ruler.
- A mysterious figure blamed for the mists and the collapse of the economy.
- The leader of the revolution against the Lord Ruler, Kelsier was a skilled thief who used his abilities to gather allies and resources for the rebellion. He was killed in battle with the Lord Ruler's forces.
- The leader of the crew and a skilled thief. He was once an Imperial nobleman.
- Another member of the Mistborn class who is known for his bravery and leadership.
- A former Lord Ruler's assassin who becomes a hero in his own right.
- The Survivor. A skilled thief and revolutionary who overthrew the Lord Ruler.
- An assassin who has been hired by Elend to help him overthrow his father and take the throne for himself.
- A former member of the Survivor's crew who has taken over the Ministry of Assassins. He is known for his cunning and resourcefulness.
- The leader of the group that Spook belongs to.
- The Survivor of Hathsin and leader of the rebellion against Quellion.
- A former Lord Ruler who was executed for treason.
- A Mistborn who is helping Spook complete his mission.
- An experienced Allomancer and leader of the resistance, determined to overthrow Quellion.
- A former street urchin who became a Mistborn and led the rebellion against the Lord Ruler.
- A former Lord Ruler who has turned away from his past and is now fighting against the oppressive regime of the Ash Lord.
- The Survivor of Hathsin, a human man who led a rebellion against the Lord Ruler.
- The Survivor, a former koloss soldier turned thief and leader of the crew.
- A man who was able to handle adulation like this and inspired Spook to do the same.
- A former criminal mastermind who becomes a mentor to Vin. He is also a Mistborn.
- A former criminal mastermind who is now working with the government to take down other criminals.
- A former thief who became the leader of Luthadel after overthrowing Elend Venture.
- A former nobleman turned revolutionary, and Spook's mentor.
- A mysterious figure who helps Spook on his quest. He is a skilled fighter and has a tragic past.
- An experienced Allomancer and Spook's mentor. He is a skilled fighter and strategist, but also has a tragic past.
- A former thief and current emperor. Kelsier is a skilled fighter and strategist, but also has a strong sense of loyalty to his crew.
- A former thief who becomes a hero after being captured by Rashek and is the inspiration for Sazed's quest.
- The Lord Ruler's brother and Marsh's father. He was an Allomancer who helped found the empire and was killed by the Lord Ruler.
- A clever and subtle character who appears to take on different forms.
- Elend's friend and mentor, Kelsier is an assassin who helps Elend take the throne.
- A former Emperor who raised an army of Mistings to fight against Ruin.
- A former Lord Ruler who was killed by Vin's Push.
- A former slave who led a rebellion against the Central Dominance and destroyed the Well of Ascension.
- Dead long ago.
- A former Lord Ruler who has become a hero and leader of a crew of thieves.
- A person who made Spook Mistborn and healed his body.

### Spook (43 mentions) - Level 1 Aggregation by Character

Description of Spook (43 mentions):

- A member of the crew, Clubs's nephew. He is a skilled pickpocket and has a talent for sneaking around undetected.
- A skilled thief and member of the Citizen's resistance.
- A skaa who uses his heightened senses to navigate the city and avoid danger.
- A skaa who works for Elend and Vin. He is tasked with gathering information about the Citizen.
- A man who can see whispers and feel screams. He is the companion of a god.
- A nobleman with the ability to manipulate metal. He is the protagonist of the story.
- A thief who's been injured and is crawling through a burning house.
- A person who obeys the commands of a man.
- The protagonist of the story. A skaa boy who is taken by a nobleman and becomes a servant in the Lord Ruler's army.
- A Tineye sent to Urteau by Elend to gather information.
- A former slave who became an Allomancer and joined the crew of the Survivor. He is known for his timid nature and lack of confidence.
- A young man who has been tasked with protecting Vin and his companions.
- A former assassin who has become a leader and protector.
- A member of the Thuggery, a criminal organization that operates in the city of Urteau. He is loyal to Kelsier and serves as his right-hand man.
- A young boy who is the apprentice of Kelsier, a former thief turned hero.
- An informant who provides Sazed with information about the city and Kelsier.
- The protagonist of the story. He was once a member of the Survivor's crew, but is now on his own.
- A Soother who stands out a bit.
- A former assassin turned hero who uses his skills to fight against the Citizen.
- A skaa thief who has been tasked with killing several nobles.
- A young man who has been trained by Kelsier to fight against tyranny.
- A young man who rescued a child and fought against the soldiers.
- A mysterious figure who appears to have survived a fall from a rooftop without breaking bones, sparking rumors about his true nature.
- A member of the Survivor's crew who is working with Kelsier to overthrow the Ash Lord.
- The young man who has been raised by the Lord Ruler and is now fighting for Venture.
- An Allomancer who takes the lead in the mission to expose Quellion's lies. He requests that Sazed use his metalminds to help them with their plan.
- A young man who has taken control of the city.
- A member of the Survivor's crew, who is accompanying Sazed and Breeze on their mission in the city.
- A character who is clever and orchestrates a plan to attack the Citizen.
- The leader of the Survivor's crew, who rescued Beldre and is now holding her captive.
- A young man with burned skin and a pewter-colored cloak. He is the protagonist of the story.
- A man who was once insignificant and easily forgotten but now seeks respect and admiration.
- The protagonist of the story. He is a skilled thief and leader of his crew.
- A young man who has been tasked with protecting Kelsier and helping him maintain control of Luthadel.
- A skilled assassin and leader of the city's underground.
- A former street urchin and thief who uses Allomancy to fight against oppressive regimes.
- A former street urchin who has been trained by Kelsier to use Allomancy. He is the protagonist of the story.
- A former thief who was left behind by Kelsier's crew. Spook is a skilled fighter and strategist, but also struggles with feelings of guilt and inadequacy.
- A mysterious figure who helps Sazed on his journey and has a deep understanding of religion and spirituality.
- A former member of the Survivor rebellion who was saved by Lady Vin. He is now working with her to stop the Ash.
- An Allomancer who fights alongside Elend Venture in the battle against Ruin's forces.
- A mysterious figure who appears to be a ghost or spirit.
- The protagonist of the story who is now Mistborn.

### Ruin (42 mentions) - Level 1 Aggregation by Character

Description of Ruin (42 mentions):

- An entity that controls the minds of Inquisitors.
- An intelligent force of destruction that seeks to break everything down to its most basic forms.
- An ancient force that seeks to destroy the world.
- A god-like being trapped by the Well of Ascension
- A mysterious force that was imprisoned in the Well of Ascension. It has been released and is now causing chaos throughout the world.
- An ancient being that has been trapped in the Well for centuries. It possesses immense power and is the source of the Allomantic abilities.
- An ancient being who has been trapped in the Well of Ascension for centuries. He provides Kelsier with the Eleventh Metal, which is crucial to defeating the Lord Ruler.
- A mysterious figure who commands the power of Hemalurgy.
- A person who possesses Hemalurgy power.
- An Inquisitor who guides Marsh's hand to kill Penrod.
- An ancient force that seeks to destroy the world.
- An entity that seeks to end things the protagonist loves.
- A god-like being who is imprisoned by balance and seeks to find the hidden part of himself in order to regain his power.
- An ancient being who seeks to destroy the world and return to its original state.
- A character who seeks destruction and chaos.
- A kandra who serves as Vin's guide and protector. She is a skilled fighter and has the ability to shape-shift into a human form.
- An ancient and malevolent force that seeks to destroy the world.
- An ancient being who seeks to destroy all things and create a new world in its place. The main antagonist of the story.
- An antagonist who seeks to destroy the world, but is opposed by Preservation.
- A mysterious figure who can possess other people's bodies.
- A mysterious figure who appears to be Vin's mentor. He is an expert in Allomancy and Feruchemy.
- A young boy who becomes Vin's apprentice in combat and magic.
- A subtle creature who tries to gain control of people by spiking them with metal, but struggles with logical and prone-to-working-through-actions individuals.
- A mysterious figure who accompanies Vin on her journey. He is also a Misting.
- A mysterious figure who has been communicating with Vin through her dreams. He is believed to be the Lord Ruler's son, but his true identity and motives are unknown.
- The main antagonist of the story. He seeks the atium for his own purposes, and will stop at nothing to get it.
- A koloss who has been given orders to kill all humans. He is loyal to Elend.
- A hateful, destructive thing that hid behind a mask of civility. It was responsible for the destruction in the story.
- A mysterious figure who seeks to destroy the city of Luthadel. He is incredibly strong and cunning, but also unpredictable.
- A character who watches the protagonist carefully and is involved in a chase with them.
- An entity that seeks to control the minds of all living beings. He has corrupted much of the information about the Hero of Ages.
- The main antagonist of the story. Ruin is a powerful spirit that seeks to destroy the Final Empire.
- An entity that seeks to destroy the world.
- The main antagonist of the story, a god-like being seeking to destroy humanity.
- An Inquisitor who seeks to destroy the Brotherhood Without Banners. He is a powerful Feruchemical Lord Ruler with new powers.
- An ancient being who holds the power of the Lord Ruler. He is both a mentor and an antagonist to Vin.
- The god of atium, imprisoned by Balance.
- A being who was imprisoned by Preservation and helped make the mists stronger, leading to the threat known as the Deepness.
- A god-like being who seeks to destroy humanity and rule over it.
- Confronted Vin and was destroyed.
- The main antagonist of the story. He is a being of destruction that seeks to destroy all of creation.
- The former Lord Ruler, now a powerful and malevolent being who seeks to destroy all of humanity.

### Breeze (31 mentions) - Level 1 Aggregation by Character

Description of Breeze (31 mentions):

- An assassin who is Sazed's companion and guide.
- A former Lord Ruler's assassin who is now a friend to Sazed.
- A friend of Sazed who helped him get over a difficult time.
- An Allomancer and Sazed's friend. He is known for his wit and love of fashion.
- An Allomancer and Sazed's lover, who is also a captain in Elend's army.
- A tall, thin man with a long beard. He is a skilled swordsman and often wears a cloak.
- A Terrisman who has been granted noble status by the Emperor. He is a skilled thief and assassin.
- A former employee of Kelsier who admired his authenticity and determination.
- Ambassador to the Western Dominance.
- A skaa girl who is Sazed's assistant.
- An Allomancer who joined Kelsier's crew after being exposed to the metal allomancy of the Lord Ruler's forces. He was known for his ability to manipulate people with his Soothing powers.
- A Soother and member of House Driek. He is known for his manipulative abilities and has a reputation as one of the world's most vile men.
- An older man who is a skilled fighter and leader of the group.
- A thief who has joined Spook's group to help them find the Well.
- The leader of the Thuggery. A skilled fighter and strategist who has taken over the criminal organization after Kelsier's death.
- A thief and member of the Keepers of the Flame. He is also Kelsier's right-hand man.
- An experienced Allomancer who serves as Kelsier's second-in-command, known for his calm demeanor and strategic thinking.
- A man who was present during the event.
- A former student of Sazed who now fights alongside him.
- An attentive and thorough reader who joins Spook and Sazed on their mission to expose Quellion's lies.
- A skaa thief who imitates a nobleman and enjoys getting drunk on fine wines.
- An old man who is helping Sazed and Spook with their plan.
- A member of the Survivor's crew, who is accompanying Sazed and Allrianne on their mission in the city.
- A character who smiles and makes clever remarks.
- A young woman who joins Spook and Kelsier on their quest. She is a skilled fighter and uses Allomancy to help them.
- A former thief and current leader of the crew. Breeze is a skilled fighter and strategist, but also has a strong sense of loyalty to his crew.
- The Soother who sits in a throne-like chair, holding a cup of wine, looking very pleased with himself as he makes proclamations and settles disputes.
- A kandra who serves as Sazed's assistant and protector.
- A human kandra who is a member of the First Generation.
- An Allomancer who fights alongside Elend Venture in the battle against Ruin's forces.
- A young woman who is Ham's wife and a skilled fighter.

### TenSoon (23 mentions) - Level 1 Aggregation by Character

Description of TenSoon (23 mentions):

- A kandra who has broken his contract with the First Generation.
- The protagonist of the story. He is a member of the Third Generation and has been imprisoned for many years.
- A Third Generation kandra who has been accused of treason.
- A kandra of the Third Generation. He was assigned to serve Zane Kelsier, but betrayed him and helped Vin kill the Lord Ruler.
- A member of the Second Generation who betrayed his people and revealed their secret to a human.
- A kandra who was punished for breaking Contract.
- A kandra who was forced to wear a dog's body for over a year.
- Third-Generation Kandra who has been punished by wearing a dog's bone.
- A member of the Third Generation. He was sentenced to the ritual imprisonment of ChanGaar.
- A kandra who has stolen the Blessing of Potency and is trying to escape.
- A kandra who gained the Blessing of Potency by stealing two spikes from OreSeur's body.
- A kandra who served the Lord Ruler and later Vin.
- A kandra who has taken on the form of a wolfhound. He is searching for Kelsier and Vin.
- A kandra who has come from Emperor Venture without a Contract.
- A kandra who is on a long run across the empire to find another storage cavern. He has a very, very long run ahead of him.
- A kandra who has been sent by the Lord Ruler to help Sazed on his quest.
- A member of the crew who is on a quest to find Vin and believes the end has arrived.
- A kandra who can carry a human and all their baggage through the ash. He has metal spikes on his back that grant him strength.
- The protagonist of the story, a young man who becomes a Misting after being Snapped.
- A human kandra who is the leader of the First Generation.
- A kandra who is fighting against the Second Generation and their rule.
- A Fifth Generation Hemalurgic kandra who is a member of the Lord Ruler's personal guard.
- A First Generation kandra who betrayed his comrades and attacked Sazed.

### Yomen (21 mentions) - Level 1 Aggregation by Character

Description of Yomen (21 mentions):

- An ally of Vin's husband, who was invited to the conference before an attack.
- An obligator who is currently negotiating with Elend on behalf of his city.
- The leader of a group of rebels who are fighting against the Lord Ruler's rule. He is a tall, muscular man with short dark hair and a beard.
- A tall, thin man with duralumin-colored skin and hair. He is an Allomancer, able to manipulate metals through his body.
- A leader of a city who is fighting against an enemy.
- The current ruler of the city, who is revealed to be an Allomancer.
- The main antagonist of the story. A powerful Mistborn who has imprisoned Vin in a cavern and is waiting for her to die of dehydration.
- A character who is in charge of the cavern and will not open the trapdoor unless he receives wine.
- The obligator king of Elend. A powerful Allomancer with the ability to burn atium.
- An obligator king who captured Vin to execute her.
- A member of the Church of the Survivor who Elend meets on his journey. He is a former slave who was freed by the Lord Ruler.
- Another man who was once a servant of Ruin but has since turned against him.
- The Lord of the City, a nobleman with atium powers.
- The leader of the obligator city that Vin and her crew attack. She is a skilled politician and fighter.
- The leader of the city that Vin and her allies must conquer to save the world.
- The leader of the Lord Ruler's forces. He is a powerful Allomancer and has the ability to control kolosses.
- A loyal servant of the Lord Ruler who has remained faithful even after his death. He is tasked with protecting the city from Elend's army.
- The leader of the city's soldiers, who is struggling to maintain control after the death of the Lord Ruler.
- A religious leader who takes over Fadrex after Elend's death. He is a skilled politician and military strategist.
- A member of the Church who believes in a god who ordered nature.
- An old man who is revealed to be a Seer, or an atium Misting. He helps Elend and Vin on their journey.

### Marsh (20 mentions) - Level 1 Aggregation by Character

Description of Marsh (20 mentions):

- An Inquisitor who has been imprisoned for three years and is struggling to kill himself.
- A character who is too weak to fight Ruin's control.
- An Inquisitor who uses Hemalurgy to drain Allomantic abilities.
- A former Allomancer turned Inquisitor. He is tasked with killing Penrod.
- An Inquisitor who cuts Penrod and fights with guards.
- A former Lord Ruler who has joined forces with Kelsier and Spook in their fight against the Ash Lord.
- An Inquisitor who serves the Lord Ruler. He is responsible for hunting down and eliminating any threats to the empire.
- An Inquisitor of the Lord Ruler. She is a skilled warrior and leader, but her loyalty to the Lord Ruler may be tested as she faces difficult choices.
- An Inquisitor who has been given orders by Yomen to kill Vin. He is a powerful Feruchemist.
- A man with a love of destruction and hatred towards himself, whose emotions were pushed by Vin.
- A man with a sword and axe who fights against a mysterious force.
- A man controlled by Ruin who uses metal as an anchor to push himself into the air.
- A member of the Brotherhood Without Banners and a skilled Allomancer. He has a unique set of spikes on his chest, which he uses as weapons.
- An Inquisitor who is obsessed with finding the atium.
- A former leader of the skaa rebellion who gave up before the victory.
- An Inquisitor who was killed by Vin's Push.
- An old man who serves as a guide and mentor to Vin. He is also an Allomancer.
- An atium Mistinger who fights alongside Elend. He is also under the control of Ruin, but not as strongly as Human.
- An Inquisitor of the Final Empire who seeks to capture Elend Venture for his master, Ruin.
- Fallen to become an Inquisitor.

### Ham (18 mentions) - Level 1 Aggregation by Character

Description of Ham (18 mentions):

- Allomancer and advisor to Elend
- A nobleman from House Drell. He is Elend's right-hand man and advisor.
- A man who remembers Kelsier fondly and believes he would be proud of their achievements.
- General in the army of the Central Dominance.
- A skilled warrior and second-in-command to Elend. He is often paranoid and fearful, but his loyalty to Elend is unwavering.
- A powerful soldier who joined Kelsier's crew after being freed from prison. He was known for his strength and loyalty to the cause of the revolution.
- A skilled Allomancer and member of the crew. He is also a skilled fighter.
- A thug who has joined the rebellion and is now serving as a captain in Elend's army.
- A young soldier in Elend's army who was cured of the sickness. He is eager to prove himself in battle.
- An officer in Elend's army who is responsible for coordinating the siege.
- A member of the Canton of Inquisition who is obsessed with finding out the truth about the Lord Ruler and his reign.
- A captain in Elend's army. He is a Mistborn with tin to enhance his ears, allowing him to hear even the softest footsteps approaching.
- A man who forced Elend to eat after he didn't arrive.
- A loyal friend and advisor to Elend. He is a skilled fighter and strategist.
- A loyal advisor to Elend who is concerned about the safety of the empire. He is a skilled strategist and has a deep understanding of politics.
- A skilled fighter and loyal friend of Elend. He is not an Allomancer, but he fights bravely nonetheless.
- A koloss who fights alongside Elend Venture in the battle against Ruin's forces.
- A man who is the leader of a group of people who have been living underground for years.

### Cett (16 mentions) - Level 1 Aggregation by Character

Description of Cett (16 mentions):

- An old man with a beard and two legs that don't work. He is the king of one of the empire's many kingdoms.
- King of Fadrex City
- The Lord of Fadrex. He is a nobleman from House Drell.
- An attentive and thorough reader who questions the point of their mission.
- A former nobleman who became an Allomancer after being beaten as a child. He is known for his logic and his willingness to use brutal methods to achieve his goals.
- A former nobleman who defected from Lord Yomen's regime and joined the rebellion. He is a cunning strategist and advisor to Elend.
- An advisor to Elend, known for his cunning and manipulation.
- A nobleman who is one of Vin's informants.
- A thug who has joined the rebellion and is currently serving as a lieutenant in Elend's army.
- An old, crippled general who serves as Elend's advisor. He is known for his arrogance and bitterness.
- An older soldier in Elend's army who was cured of the sickness. He is grateful for his recovery and wants to continue serving his king.
- A member of the Canton of Inquisition who is skeptical of all things.
- A wise old man who serves as Elend's advisor. He is a former soldier with experience in warfare.
- The leader of a group of kolosses who were fighting against the Lord Ruler's army.
- A powerful Misting warrior who serves as one of Elend's most trusted advisors. He is fiercely loyal to his king and will stop at nothing to protect the empire.
- A general who directed the battle tactics and sat at a table with a map of the area.

### Beldre (15 mentions) - Level 1 Aggregation by Character

Description of Beldre (15 mentions):

- The Citizen's sister, a beautiful young woman with deep sorrowful eyes.
- A woman who is exiled to the garden and whose brother's meeting is about to start.
- The sister of the Citizen, she is a member of the ruling family of the Luthadel city-state.
- The younger sister of the Ash Lord, who is torn between her loyalty to her brother and her growing doubts about his actions.
- The sister of Quellion, who has come to warn Spook and the others about her brother's plans.
- A character who is naive and has been sheltered by the Citizen.
- A noblewoman who was half-skaa. She was saved from execution by Spook and the Survivor's crew.
- A young woman who has been through much trauma. She is the love interest of Spook.
- Spook's captive who seems to be warming up to him in an effort to get him to let her go.
- Spook's younger sister who has been exiled from their family for her Allomancy abilities.
- The leader of the city's resistance movement.
- Spook's former love interest who was captured by Quellion's guards. She is an Allomancer and helps Spook on his quest.
- A young woman who becomes involved in the story when she attacks the guards. She later joins Spook and Sazed on their mission to stop the flames.
- A member of the Survivor rebellion who was saved by Spook. He is now working with him to stop the Ash.
- A person who helps Spook with his paper.

### Demoux (14 mentions) - Level 1 Aggregation by Character

Description of Demoux (14 mentions):

- The leader of the skaa army and a close ally to Elend.
- A nobleman from House Vorin. He is Elend's spymaster.
- A man who needs to pass the word to the men about growing plants in little sunlight.
- A general in Elend's army. He is loyal to Elend and believes in the Church of the Survivor.
- A balding soldier who falls from his saddle and collapses to the ground.
- A skilled thief and member of the crew. He is also a skilled fighter.
- A general in Elend's army. He was injured in the battle against Yomen's forces.
- A general in Elend's army who was cured of the sickness. He believes that Kelsier, the Lord of the Mists, is responsible for the sickness and wants to be released from his post as general.
- A faithful priest who believes that the mists are of the Survivor and that people who grow sick are displeasing him.
- A lieutenant in Elend's army. He is a Mistfallen, and has been tasked with leading a new company of men.
- A captain in the army who is tasked with taking control of Luthadel. He is a disciplined and efficient leader.
- A brave and resourceful kandra, who saved Sazed's life by removing his spike.
- A soldier in Elend's army. He is loyal to Elend and willing to do whatever it takes to protect him.
- A general in Elend's army and commander of the soldiers posted at the doorways to the Homeland.

### Allrianne (13 mentions) - Level 1 Aggregation by Character

Description of Allrianne (13 mentions):

- A young princess of the House of Alleren, who is in love with Breeze.
- A woman with short hair and a scar on her cheek. She is a skilled archer and often wears leather armor.
- A woman who needs to talk with the scribes about supply estimates for their trip.
- A skaa girl who is Sazed's assistant.
- A noblewoman from House Ashweather Cett. She was captured by the Citizens during the war and is now being held captive in Emperor Venture's palace.
- A young woman who is a skilled archer and has a romantic relationship with Breeze.
- A young woman who is searching for her missing brother and has joined Spook's group.
- A member of the Thuggery who serves as Breeze's second-in-command. She is a skilled fighter and has a romantic relationship with Spook.
- A young woman who has been trained by Sazed to use her powers of emotion manipulation to aid the resistance.
- A woman who led the crowd in attacking the soldiers.
- A member of the Keepers who is tasked with keeping track of Allomancers and their powers.
- A member of the Survivor's crew, who is accompanying Sazed and Breeze on their mission in the city.
- Spook's lover and a skilled thief.

### Preservation (11 mentions) - Level 1 Aggregation by Character

Description of Preservation (11 mentions):

- The power of a god, inhabiting energy in the same way as Ruin
- An ancient god-like entity that has the power to heal and restore life. It was once bound by Rashek, but was later freed.
- A character who values preservation and stability.
- A powerful being who has been fighting against Ruin for centuries.
- A dying god whose body was left to be buried in ash.
- A force that once opposed Ruin and was imprisoned for several thousand years.
- A deity who imprisoned Ruin and left clues for humanity to find.
- A being who wanted to create something intentionally unbalanced. Gave up a piece of himself to create mankind.
- The other half of Ruin's power, imprisoned in the Pits of Hathsin.
- The Lord Ruler who granted nuggets to nobility, enabling the manifestation of Allomancy.
- A mysterious figure who holds the power to heal and restore life, but whose true nature is unknown.

### Rashek (9 mentions) - Level 1 Aggregation by Character

Description of Rashek (9 mentions):

- A powerful koloss who is obsessed with power. He has the ability to burn duralumin and brass.
- A person who tried to fix the world's plants but made them worse.
- A man who holds immense power and has caused significant changes in the world.
- A character who left a nugget of Allomancy at the Well of Ascension.
- The protagonist who used his power to change the landscape of the world and create a new capital for himself.
- A former nobleman who became a powerful sorcerer after discovering the ability to manipulate ash. He is Spook's father and Preservation's captor.
- A clever man who saves the world by fixing problems, but creates new ones in the process.
- A man wearing both black and white, representing Preservation and Ruin.
- A former Lord Ruler who was imprisoned in the cavern before Vin arrived. He is now free and searching for the Well of Ascension with her.

### KanPaar (9 mentions) - Level 1 Aggregation by Character

Description of KanPaar (9 mentions):

- The First Generation leader of the Trustwarren.
- The leader of the Second Generation of kandra. He is responsible for enforcing the Contract and punishing those who break it.
- A member of the First Generation who served as judge for TenSoon's sentencing.
- The First Generation. He was awed by the return of TenSoon, but disappointed in him.
- An elder kandra who is shocked by TenSoon's escape attempt.
- The First Generation kandra leader who is skeptical of Sazed's claims.
- A human who is a member of the Terris religion. He is skeptical about the existence of his religion and its connection to the Hero of Ages.
- A kandra leader who is a member of the Second Generation.
- A powerful kandra who led the effort to deliver the atium to Ruin.

### Fatren (7 mentions) - Level 1 Aggregation by Character

Description of Fatren (7 mentions):

- The main character. A skaa peasant who has been training to fight against the koloss.
- A man who has been ruling the city for several years.
- A general in Venture's army.
- The Lord Ruler of the city of Fatren, he is a skaa who rose to power through deceit and violence. He is an enemy of Vin and Elend.
- A nobleman from the city of Tavra, who is loyal to the Lord Ruler.
- A town leader in the village that was attacked by the mists. He is responsible for organizing the evacuation of the villagers.
- A soldier in Elend's army, who is also Vin's friend and fellow survivor of the koloss attacks.

### Human (7 mentions) - Level 1 Aggregation by Character

Description of Human (7 mentions):

- A mysterious man who appears to be a member of the Inquisition. He is Vin's guide through the city.
- Koloss under the command of Vin.
- A massive, overly muscled blue koloss who is controlled by Vin.
- A large blue koloss who was once a human.
- The creature who named himself Human and struggled to become human again.
- A koloss soldier under the control of Ruin. He is responsible for the destruction of the Homeland.
- A koloss who fights alongside Elend Venture in the battle against Ruin's forces.

### Durn (7 mentions) - Level 1 Aggregation by Character

Description of Durn (7 mentions):

- A skaa who uses music as a way to communicate with others.
- A large beggar who is a member of the Citizen's army. He is tasked with guarding Spook.
- A thief who is trying to help Spook by spreading rumors about Kelsier's death.
- An informant who is being milked for information.
- A wealthy merchant who is willing to do whatever it takes to get what he wants.
- A man who drinks rarely but cheers for Spook.
- The leader of the city's underground, and Spook's ally.

### Quellion (7 mentions) - Level 1 Aggregation by Character

Description of Quellion (7 mentions):

- A Citizen of the Central Dominance and leader of the Resistance. He is a skilled politician and has a strong sense of duty to his people.
- The current ruler of the city, known for his cruelty and willingness to use violence to maintain control.
- A soldier who was present during the event.
- The leader of the Citizen who is accused of being an Allomancer.
- The leader of the rebellion against the Lord Ruler. He is a skilled fighter and uses Allomancy to enhance his abilities.
- A wealthy merchant who becomes involved in the story when he is attacked by Spook. He is later revealed to have been using Allomancy to control others.
- A Seeker king of Urteau with a bronze spike made from an Allomancer he captured.

### Koloss (6 mentions) - Level 1 Aggregation by Character

Description of Koloss (6 mentions):

- Large, humanoid creatures that are the main enemy of the story.
- Enormous, humanoid creatures that serve as soldiers in the army of the Final Empire.
- A giant, mutated man who serves as Ruin's enforcer.
- A group of massive, humanoid creatures that are controlled by the Lord Ruler. They are used as weapons and laborers.
- Allomancer-controlled kandra with diminished mental capacity
- A giant man who was once a slave to Ruin. He has been freed by Sazed and now serves as his companion in battle.

### Elendil (6 mentions) - Level 1 Aggregation by Character

Description of Elendil (6 mentions):

- The Lord Ruler's right-hand man, who is tasked with hunting down Vin and Kelsier.
- A man who is searching for a way to stop the mists from coming during the day.
- The Lord Ruler, a powerful and wise ruler who has been tasked with protecting his people from harm.
- The Emperor of the New Empire. He is a nobleman from House Vorin.
- The Lord Ruler of the story, a cruel and tyrannical ruler who seeks to maintain his power at all costs.
- The Lord Ruler's right-hand man, who is tasked with hunting down skaa Mistings.

### Goradel (5 mentions) - Level 1 Aggregation by Character

Description of Goradel (5 mentions):

- A soldier who led Lady Vin into the palace the night she killed the Lord Ruler.
- A man who suggested making a stop at Luthadel for supplies.
- A high-ranking officer in the Citizen army who serves as a guard for Emperor Venture. He is fiercely loyal to his master.
- A skaa thug who is part of the group that rescues Spook's sister from the Citizen's mansion.
- A soldier in the Terris army who was saved by Lady Vin. He is now working with her to stop the Ash.

### MeLaan (4 mentions) - Level 1 Aggregation by Character

Description of MeLaan (4 mentions):

- A Seventh Generation kandra with a rebellious True Body.
- A kandra of the Second Generation who sought to lead her people.
- An inhuman kandra who wears a True Body.
- A female kandra who has joined TenSoon in his fight against the Second Generation.

### Reen (4 mentions) - Level 1 Aggregation by Character

Description of Reen (4 mentions):

- Allomancer and advisor to Elend
- Vin's deceased mother, a former thief.
- An Allomancer who appears to be the one Elend and Vin are fighting against.
- A man who Vin has known for years, but is not her husband. He is also an Allomancer.

### Clubs (4 mentions) - Level 1 Aggregation by Character

Description of Clubs (4 mentions):

- Kelsier's uncle and leader of the crew during the siege. He is a skilled fighter and strategist.
- A former slave who became an Allomancer and joined Kelsier's crew. He was known for his strength and loyalty to the cause of the revolution.
- A former thief and current assassin of the crew. Clubs is a skilled fighter and strategist, but also has a strong sense of loyalty to his crew.
- Slaughtered at the Battle of Luthadel.

### Elend Venture (4 mentions) - Level 1 Aggregation by Character

Description of Elend Venture (4 mentions):

- The Lord Ruler and protagonist of the series. He is a powerful Allomancer who uses his abilities to maintain order in the world.
- The Lord Ruler's son and heir to the throne of Ages.
- The Lord Ruler's son and heir. He is a young man of about twenty-five, with dark hair and eyes.
- The protagonist of the story. A skilled Allomancer and leader of the koloss.

### Lord Ruler (4 mentions) - Level 1 Aggregation by Character

Description of Lord Ruler (4 mentions):

- The husband of Vin, who is a man of honor.
- The ruler of the world in the story. He has been dead for a thousand years, and his body is being held by Ruin.
- The ruler of the world who offers a plan to transform all living Feruchemists into mistwraiths, but makes a mistake by not considering the genetic heritage left in other Terris people, leading to the continuation of Feruchemist births.
- The ruler of the world who planted Hemalurgic spikes in his agents.

### Dockson (3 mentions) - Level 1 Aggregation by Character

Description of Dockson (3 mentions):

- Bureaucrat in the government of the Central Dominance.
- A former thief and current navigator of the crew. Dockson is a skilled navigator and strategist, but also has a strong sense of loyalty to his crew.
- Slaughtered at the Battle of Luthadel.

### Slowswift (3 mentions) - Level 1 Aggregation by Character

Description of Slowswift (3 mentions):

- An old man who runs a tavern in Fadrex. He is an informant for Cett, but he has grown disillusioned with the Lord Ruler's regime and now works to undermine it.
- An old man who runs a shop in Fadrex. He is knowledgeable about the city's history and its inhabitants.
- An Elend family servant who helps Vin with her job.

### Zane (3 mentions) - Level 1 Aggregation by Character

Description of Zane (3 mentions):

- An older man with bronze-colored skin and hair. He is an Allomancer, able to manipulate metals through his body.
- A man who was once a servant of Ruin but has since turned against him.
- A man who received his spike from Ruin and used it to kill the nobility.

### Penrod (3 mentions) - Level 1 Aggregation by Character

Description of Penrod (3 mentions):

- The commander of the forces that were supposed to send support.
- The aging king of Luthadel. He must be killed by Marsh.
- A man who is cut by Marsh during a fight.

### Haddek (3 mentions) - Level 1 Aggregation by Character

Description of Haddek (3 mentions):

- An elder kandra who serves as a mentor to Sazed.
- The leader of the First Generation, responsible for keeping the Blessings.
- A member of the First Generation and the Hero of Ages.

### Venture (2 mentions) - Level 1 Aggregation by Character

Description of Venture (2 mentions):

- An Allomancer who claims to be a lord and offers to help the city defend against an approaching army of koloss.
- The emperor of the Allomancers.

### VarSell (2 mentions) - Level 1 Aggregation by Character

Description of VarSell (2 mentions):

- A guard who escorts TenSoon to the Trustwarren. He is a member of the Second Generation.
- Fifth-Generation nobleman and member of the Second Generation.

### Kandra (2 mentions) - Level 1 Aggregation by Character

Description of Kandra (2 mentions):

- The kandra who has been imprisoned with TenSoon. She is a member of the First Generation.
- Double agents who were trusted to pull out their Hemalurgic spikes when Ruin tried to seize them.

### Lady Vin (2 mentions) - Level 1 Aggregation by Character

Description of Lady Vin (2 mentions):

- A skilled skaa mistborn who has had a tumultuous relationship with Demoux.
- An old woman who became Mistborn.

### Vin Diesel (2 mentions) - Level 1 Aggregation by Character

Description of Vin Diesel (2 mentions):

- A young man from the city of Luthadel who becomes an apprentice to Elend Venture. He possesses latent Allomantic powers and is later revealed to be a Mistborn.
- The protagonist of the story, a skilled thief and Allomancer.

### Noorden (2 mentions) - Level 1 Aggregation by Character

Description of Noorden (2 mentions):

- A member of Elend Venture's council who specializes in statistics and mathematics. He is a skilled strategist and advisor.
- An old friend of Elend's who has become a powerful sorcerer. He is able to use Ruin to control the world around him.

### Tindwyl (2 mentions) - Level 1 Aggregation by Character

Description of Tindwyl (2 mentions):

- Sazed's research partner who was interested in politics and leadership.
- Sazed's wife, who was taken by Rashek and is the reason for Sazed's quest.

### Telden (2 mentions) - Level 1 Aggregation by Character

Description of Telden (2 mentions):

- An old friend and advisor to Elend, Telden is a historian and philosopher who has known Elend since they were young scholars.
- A character who is helping Vin try to escape from the cavern.

### Conrad (2 mentions) - Level 1 Aggregation by Character

Description of Conrad (2 mentions):

- A lieutenant in Elend's army. He is a Mistfallen, and has been tasked with leading a new company of men.
- One of four messengers sent by Penrod, who was chased by koloss and managed to escape.

### OreSeur (2 mentions) - Level 1 Aggregation by Character

Description of OreSeur (2 mentions):

- TenSoon's generation brother and a member of Kelsier's crew. He was killed by TenSoon in order to learn his secrets.
- Taken at Zane's command.

### Captain Goradel (2 mentions) - Level 1 Aggregation by Character

Description of Captain Goradel (2 mentions):

- The leader of the soldiers tasked with protecting Spook and his crew.
- A leader who saved the people with his message.

### Terrisman steward (1 mentions) - Level 1 Aggregation by Character

Description of Terrisman steward (1 mentions):

- A companion of Marsh who is also an Inquisitor. He is tied to a table in front of Marsh.

### Keeper of Terris (1 mentions) - Level 1 Aggregation by Character

Description of Keeper of Terris (1 mentions):

- The prisoner of Marsh, who is a Keeper of Terris and has worked his entire life for the good of others. Killing him would be not only a crime, but a tragedy.

### Hero of Ages (1 mentions) - Level 1 Aggregation by Character

Description of Hero of Ages (1 mentions):

- The protagonist of the story.

### Druffel (1 mentions) - Level 1 Aggregation by Character

Description of Druffel (1 mentions):

- One of Fatren's fellow soldiers. A skaa peasant who is also training to fight against the koloss.

### Judgment (1 mentions) - Level 1 Aggregation by Character

Description of Judgment (1 mentions):

- a character with immense power who can remake the world but is also dangerous due to their ignorance of the power's true nature

### Ruxton (1 mentions) - Level 1 Aggregation by Character

Description of Ruxton (1 mentions):

- A member of the Brotherhood Without Banners who helps Vin and Kelsier on their quest.

### King Lekal (1 mentions) - Level 1 Aggregation by Character

Description of King Lekal (1 mentions):

- The king who signed the treaty.

### Ash (1 mentions) - Level 1 Aggregation by Character

Description of Ash (1 mentions):

- A character who falls as he walks through the camp.

### Inquisitors (1 mentions) - Level 1 Aggregation by Character

Description of Inquisitors (1 mentions):

- A group of characters who are trying to discover and defeat Ruin.

### Lord Hammond (1 mentions) - Level 1 Aggregation by Character

Description of Lord Hammond (1 mentions):

- A high-ranking member of the Church of the Survivor who is closely involved with Elend's plans.

### HunFoor (1 mentions) - Level 1 Aggregation by Character

Description of HunFoor (1 mentions):

- A kandra of the Second Generation. He was assigned to serve Zane Kelsier, but betrayed him and helped Vin kill the Lord Ruler.

### Mare (1 mentions) - Level 1 Aggregation by Character

Description of Mare (1 mentions):

- The leader of the rebellion and Kelsier's love interest.

### Tin (1 mentions) - Level 1 Aggregation by Character

Description of Tin (1 mentions):

- A member of the crew, an expert in Tin Allomancy. He has a talent for manipulating metal and can create powerful constructs.

### Lord Breeze (1 mentions) - Level 1 Aggregation by Character

Description of Lord Breeze (1 mentions):

- A man who took command of the group when Sazed left.

### Kelsier's wife (1 mentions) - Level 1 Aggregation by Character

Description of Kelsier's wife (1 mentions):

- The Survivor's mother, murdered in the Pits of Hathsin.

### The Survivor (1 mentions) - Level 1 Aggregation by Character

Description of The Survivor (1 mentions):

- A young man born in the Pits of Hathsin.

### Steward 1 (1 mentions) - Level 1 Aggregation by Character

Description of Steward 1 (1 mentions):

- An aged steward who greeted Sazed when he arrived at the Pits of Hathsin.

### Steward 2 (1 mentions) - Level 1 Aggregation by Character

Description of Steward 2 (1 mentions):

- Another aged steward who greeted Sazed when he arrived at the Pits of Hathsin.

### The Voice (1 mentions) - Level 1 Aggregation by Character

Description of The Voice (1 mentions):

- An Allomancer who's guiding Spook through the house.

### Ruthless (1 mentions) - Level 1 Aggregation by Character

Description of Ruthless (1 mentions):

- An Allomancer who serves as a mentor to Vin. He is known for his ruthless tactics and his willingness to do whatever it takes to achieve his goals.

### Renata (1 mentions) - Level 1 Aggregation by Character

Description of Renata (1 mentions):

- A young woman who is captured by Elendil's guards and becomes involved with Kelsier's plan.

### Jedal (1 mentions) - Level 1 Aggregation by Character

Description of Jedal (1 mentions):

- Spook's father, a skaa laborer who is killed by the nobleman.

### Margel (1 mentions) - Level 1 Aggregation by Character

Description of Margel (1 mentions):

- Spook's mother, a skaa laborer who is taken by the nobleman.

### The Citizen (1 mentions) - Level 1 Aggregation by Character

Description of The Citizen (1 mentions):

- The ruler of Urteau, who believes in the power of the mists.

### Hoid (1 mentions) - Level 1 Aggregation by Character

Description of Hoid (1 mentions):

- A beggar who can be found sitting quietly in an alleyway at night. He hums to himself and may have information for Vin.

### The Lord Ruler (1 mentions) - Level 1 Aggregation by Character

Description of The Lord Ruler (1 mentions):

- The main antagonist of the story, who is also known as Ruin.

### The Mistborn spirit (1 mentions) - Level 1 Aggregation by Character

Description of The Mistborn spirit (1 mentions):

- A mysterious figure that gives off Allomantic pulses and has the ability to make people Mistborn.

### Vin Venture (1 mentions) - Level 1 Aggregation by Character

Description of Vin Venture (1 mentions):

- The Empress, wife of Elend Venture and hero of the Final Empire.

### Mistral (1 mentions) - Level 1 Aggregation by Character

Description of Mistral (1 mentions):

- A young girl who is rescued by Kelsier and becomes his apprentice.

### Skaa (1 mentions) - Level 1 Aggregation by Character

Description of Skaa (1 mentions):

- The mysterious figure who appears to be the only person who remembers the Lord Ruler's death.

### Lady Patresen (1 mentions) - Level 1 Aggregation by Character

Description of Lady Patresen (1 mentions):

- A noblewoman from an insignificant city.

### Shan (1 mentions) - Level 1 Aggregation by Character

Description of Shan (1 mentions):

- A clever and skilled Mistborn woman.

### Feruchemy (1 mentions) - Level 1 Aggregation by Character

Description of Feruchemy (1 mentions):

- The power of balance. Only known to men before the conflict between Preservation and Ruin.

### Mailey (1 mentions) - Level 1 Aggregation by Character

Description of Mailey (1 mentions):

- A young girl who was taken by the Citizen and is in danger of being burned.

### kandra (1 mentions) - Level 1 Aggregation by Character

Description of kandra (1 mentions):

- a kandra granted the Blessing of Potency is actually acquiring a bit of innate strength similar to that of burning pewter.

### Blessing of Presence (1 mentions) - Level 1 Aggregation by Character

Description of Blessing of Presence (1 mentions):

- grants mental capacity in a similar way.

### Blessing of Awareness (1 mentions) - Level 1 Aggregation by Character

Description of Blessing of Awareness (1 mentions):

- ability to sense with greater acuity.

### Blessing of Stability (1 mentions) - Level 1 Aggregation by Character

Description of Blessing of Stability (1 mentions):

- grants emotional fortitude.

### Franson (1 mentions) - Level 1 Aggregation by Character

Description of Franson (1 mentions):

- A skaa worker who is part of a group that rescues Spook's sister from the Citizen's mansion.

### A man with a given power—such as an Allomantic ability—who then gained a Hemalurgic spike granting that same power would be nearly twice as strong as a natural unenhanced Allomancer. (1 mentions) - Level 1 Aggregation by Character

Description of A man with a given power—such as an Allomantic ability—who then gained a Hemalurgic spike granting that same power would be nearly twice as strong as a natural unenhanced Allomancer. (1 mentions):

- An Inquisitor who was a Seeker before his transformation would therefore have an enhanced ability to use bronze. This simple fact explains how many Inquisitors were able to pierce copperclouds.

### Keeper Jules (1 mentions) - Level 1 Aggregation by Character

Description of Keeper Jules (1 mentions):

- A Keeper who is tasked with protecting the Lord Ruler's body. He is initially suspicious of Vin, but eventually becomes her ally.

### Telden Hasting (1 mentions) - Level 1 Aggregation by Character

Description of Telden Hasting (1 mentions):

- A friend of Elend from Luthadel who was also imprisoned in Yomen. He is a worker in the city's mines.

### The mist spirit (1 mentions) - Level 1 Aggregation by Character

Description of The mist spirit (1 mentions):

- A mysterious creature that appears to be connected to the mists and ashfalls.

### The First Generation (1 mentions) - Level 1 Aggregation by Character

Description of The First Generation (1 mentions):

- A group of elderly kandra who were not able to form True Bodies when the Lord Ruler gave them their bones. They have white, normal skeletons and use canes to move around.

### Kredik Shaw (1 mentions) - Level 1 Aggregation by Character

Description of Kredik Shaw (1 mentions):

- A powerful Allomancer who was killed by Vin's Push.

### Ruthless Ruin (1 mentions) - Level 1 Aggregation by Character

Description of Ruthless Ruin (1 mentions):

- A being created by Preservation to be intentionally unbalanced. Can choose to preserve or ruin at will.

### Push (1 mentions) - Level 1 Aggregation by Character

Description of Push (1 mentions):

- A member of the Inquisition who betrayed Ruin and helped destroy the Well of Ascension.

### Yeden (1 mentions) - Level 1 Aggregation by Character

Description of Yeden (1 mentions):

- Dead with his soldiers.

### Emperor Pax (1 mentions) - Level 1 Aggregation by Character

Description of Emperor Pax (1 mentions):

- The current Emperor of the Final Empire, a wise and benevolent ruler who seeks to maintain peace and stability in the empire.
