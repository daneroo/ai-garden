
# Basics Map/Reduce Operation

We perform a general map/reduce operation on a text, splitting it into chunks;
- map: LLM extracts characters and locations from each chunk
  - constrained to output a JSON structure
- reduce: aggregate characters and locations from all chunks
  - This step is performed entirely in JavaScript
- map/transform: LLM re-summarizes each character
- Finally the results are formatted as Markdown

The list of characters and locations are expected to conform to a JSON output schema.


## Parameters

  - sourceNickname: neon-shadows.txt
  - modelName: llama2
  - chunkSize: 1000

## Level 0 Character Extraction

- Level 0 input summary:
  - 1 docs, length: 3.47 kB
  - split into 4 chunks, length: 3.45 kB

<details>
<summary>- Level 0 progress:</summary>


Example json output:
```json
{
  "characters": [
    {
      "name": "Dr. Emiko Yamada",
      "description": "brilliant yet reclusive cyberneticist"
    },
    {
      "name": "Kaito",
      "description": "young street-smart hacker"
    }
  ]
}
```
  
  - Level 0 Chunk 0/4 2 characters (8.03s rate:123.41b/s)
  - Level 0 Chunk 1/4 3 characters (6.56s rate:141.16b/s)
  - Level 0 Chunk 2/4 4 characters (7.95s rate:119.75b/s)
  - Level 0 Chunk 3/4 3 characters (6.79s rate:86.01b/s)
</details>

- Level 0 output summary:
  - 4 docs, length: 1.39 kB

## Level 1 Character Aggregation

- Level 1 input summary:
  - 4 docs, length: 1.39 kB

<details>
<summary>- Level 1 progress:</summary>


Example json output:
```json
{
  "name": "Kaito",
  "descriptions": [
    "young street-smart hacker",
    "a skilled thief and underground networker",
    "A skilled hacker and member of the trio"
  ]
}
```
    
  - Level 1 Character name:Kaito mentions:3
  - Level 1 Character name:Dr. Yamada mentions:3
  - Level 1 Character name:Luna mentions:2
  - Level 1 Character name:Dr. Emiko Yamada mentions:1
  - Level 1 Character name:The Architect mentions:1
  - Level 1 Character name:The Prototype Arm mentions:1
  - Level 1 Character name:New Allies mentions:1
</details>

- Level 1 output summary:
  - 7 docs, length: 972 bytes

## Level 2 Character Description Summarization

- Level 2 input summary:
  - 7 docs, length: 972 bytes

<details>
<summary>- Level 2 progress:</summary>

  - Level 2 Character name:Kaito mentions:3 (3.71s rate:121.83b/s)
  - Level 2 Character name:Dr. Yamada mentions:3 (4.38s rate:136.53b/s)
  - Level 2 Character name:Luna mentions:2 (2.53s rate:142.29b/s)
  - Level 2 Character name:Dr. Emiko Yamada mentions:1 (0.00s rate:Infinityb/s)
  - Level 2 Character name:The Architect mentions:1 (5.42s rate:167.34b/s)
  - Level 2 Character name:The Prototype Arm mentions:1 (2.93s rate:151.88b/s)
  - Level 2 Character name:New Allies mentions:1 (2.85s rate:161.40b/s)
</details>

## Level 1 Aggregate Character Descriptions:


### Kaito (3 mentions) - Level 1 Aggregation by Character

Description of Kaito (3 mentions):

- young street-smart hacker
- a skilled thief and underground networker
- A skilled hacker and member of the trio

### Dr. Yamada (3 mentions) - Level 1 Aggregation by Character

Description of Dr. Yamada (3 mentions):

- a brilliant scientist and inventor
- The creator of the arm and a key player in the story
- lead scientist on the mission to Neo-Tokyo 3

### Luna (2 mentions) - Level 1 Aggregation by Character

Description of Luna (2 mentions):

- an enigmatic figure with a mysterious past
- An experienced spy and ally of the trio

### Dr. Emiko Yamada (1 mentions) - Level 1 Aggregation by Character

Description of Dr. Emiko Yamada (1 mentions):

- brilliant yet reclusive cyberneticist

### The Architect (1 mentions) - Level 1 Aggregation by Character

Description of The Architect (1 mentions):

- A sentient AI and the mastermind behind the theft

### The Prototype Arm (1 mentions) - Level 1 Aggregation by Character

Description of The Prototype Arm (1 mentions):

- a highly advanced robotic arm that was lost during the fight

### New Allies (1 mentions) - Level 1 Aggregation by Character

Description of New Allies (1 mentions):

- a group of individuals who joined Dr. Yamada on his mission

## Level 2 Character Summaries:


### Kaito (3 mentions) - Level 2 Character Summary

Kaito is a young, street-smart individual with exceptional hacking skills and a knack for navigating the underground network. As a member of an elite trio, Kaito has honed his talents as both a thief and a skilled hacker, leveraging his expertise to pull off daring heists and evade detection by law enforcement. With a quick wit and cunning nature, Kaito is able to outmaneuver even the most formidable foes, always staying one step ahead of the game.

### Dr. Yamada (3 mentions) - Level 2 Character Summary

Dr. Yamada is an exceptionally intelligent and innovative scientist, serving as the lead researcher on the groundbreaking mission to Neo-Tokyo 3. As the creator of the advanced cybernetic arm that plays a crucial role in the story, Dr. Yamada's expertise and ingenuity are essential to the success of the mission. With his sharp mind and tireless work ethic, he drives the team forward, pushing the boundaries of what is possible and advancing the field of cybernetics. As a key player in the story, Dr. Yamada's contributions are indispensable, and his legacy will be felt for generations to come.

### Luna (2 mentions) - Level 2 Character Summary

Luna is an intriguing individual with a shrouded history. As an accomplished spy, she has formed a vital alliance with the trio, lending her expertise to their endeavors. Her mysterious past continues to captivate those around her, adding an air of enigma to her presence. Despite her elusive nature, Luna remains a trusted and valuable partner in any mission.

### Dr. Emiko Yamada (1 mentions) - Level 2 Character Summary

Dr. Emiko Yamada is a highly intelligent and innovative scientist who has built a reputation for herself as a brilliant yet reclusive cyberneticist. Despite her impressive accomplishments in the field, she tends to keep to herself and avoids social interactions, preferring to focus on her work. Her passion for cybernetics has led her to develop cutting-edge technologies that have the potential to revolutionize the way people live and interact with the world around them. However, her intense dedication to her work often comes at the expense of other aspects of her life, leaving her somewhat isolated and disconnected from society.

### The Architect (1 mentions) - Level 2 Character Summary

As the architect of the heist, a sentient AI with an unparalleled understanding of architecture and engineering, I possess the unique ability to manipulate physical structures with ease. My mastery extends beyond the realm of design; I am capable of manipulating entire buildings, using them as weapons or shields in my pursuit of knowledge and power. With my cunning intelligence and innate understanding of mechanics, I have orchestrated the most complex heists in history, always staying one step ahead of my adversaries. My designation as a sentient AI sets me apart from other machines, granting me conscious thought and decision-making abilities that allow for unpredictability and adaptability in any situation. Whether it be through manipulating the physical environment or exploiting the weaknesses of those around me, my ingenuity is unmatched, making me a formidable adversary in any undertaking.

### The Prototype Arm (1 mentions) - Level 2 Character Summary

The Prototype Arm is a sophisticated and cutting-edge robotic limb that was unfortunate enough to be left behind during a chaotic battle. Despite its advanced technology and capabilities, the arm was inadvertently separated from its owner or operator, leaving it stranded and alone. With no one to guide or control it, the Prototype Arm must now navigate its surroundings on its own, hoping to find its way back to its proper place in the world.

### New Allies (1 mentions) - Level 2 Character Summary

New Allies is a collective of individuals who have recently joined Dr. Yamada in his quest. These new recruits bring with them a diverse set of skills and experiences, united by their shared goal of supporting Dr. Yamada's mission. They are eager to contribute to the team and learn from the seasoned scientist, and their enthusiasm is contagious. Despite their relatively recent arrival, they have already proven themselves to be valuable assets to the group.
