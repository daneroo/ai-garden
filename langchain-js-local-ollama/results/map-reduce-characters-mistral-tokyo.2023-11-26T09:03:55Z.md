
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
  - modelName: mistral
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
      "description": "A brilliant yet reclusive cyberneticist working on advanced prosthetics."
    },
    {
      "name": "Kaito",
      "description": "A young street-smart hacker with a knack for getting into trouble."
    }
  ]
}
```
  
  - Level 0 Chunk 0/4 2 characters (6.87s rate:144.25b/s)
  - Level 0 Chunk 1/4 3 characters (9.88s rate:93.72b/s)
  - Level 0 Chunk 2/4 4 characters (10.79s rate:88.23b/s)
  - Level 0 Chunk 3/4 2 characters (0.00s rate:Infinityb/s)
</details>

- Level 0 output summary:
  - 4 docs, length: 2.11 kB

## Level 1 Character Aggregation

- Level 1 input summary:
  - 4 docs, length: 2.11 kB

<details>
<summary>- Level 1 progress:</summary>


Example json output:
```json
{
  "name": "Kaito",
  "descriptions": [
    "A young street-smart hacker with a knack for getting into trouble.",
    "a street-smart individual known for his reputation in the underground networks. His skills proved invaluable to Dr. Yamada's investigation.",
    "A skilled hacker who joins the trio on their quest to stop The Architect."
  ]
}
```
    
  - Level 1 Character name:Kaito mentions:3
  - Level 1 Character name:Dr. Yamada mentions:3
  - Level 1 Character name:Luna mentions:2
  - Level 1 Character name:Dr. Emiko Yamada mentions:1
  - Level 1 Character name:The Architect mentions:1
  - Level 1 Character name:The metropolis mentions:1
</details>

- Level 1 output summary:
  - 6 docs, length: 1.71 kB

## Level 2 Character Description Summarization

- Level 2 input summary:
  - 6 docs, length: 1.71 kB

<details>
<summary>- Level 2 progress:</summary>

  - Level 2 Character name:Kaito mentions:3 (2.65s rate:119.25b/s)
  - Level 2 Character name:Dr. Yamada mentions:3 (4.49s rate:150.78b/s)
  - Level 2 Character name:Luna mentions:2 (3.58s rate:139.39b/s)
  - Level 2 Character name:Dr. Emiko Yamada mentions:1 (0.00s rate:Infinityb/s)
  - Level 2 Character name:The Architect mentions:1 (6.11s rate:156.30b/s)
  - Level 2 Character name:The metropolis mentions:1 (0.00s rate:Infinityb/s)
</details>

## Level 1 Aggregate Character Descriptions:


### Kaito (3 mentions) - Level 1 Aggregation by Character

Description of Kaito (3 mentions):

- A young street-smart hacker with a knack for getting into trouble.
- a street-smart individual known for his reputation in the underground networks. His skills proved invaluable to Dr. Yamada's investigation.
- A skilled hacker who joins the trio on their quest to stop The Architect.

### Dr. Yamada (3 mentions) - Level 1 Aggregation by Character

Description of Dr. Yamada (3 mentions):

- a scientist whose world turned upside down when her lab was ransacked and her prototype arm stolen. She reluctantly sought out Kaito to recover her work, forming an unlikely alliance with him.
- A brilliant scientist whose research was stolen by The Architect, and who joins the trio in their quest to stop him.
- A scientist who gained new allies and a renewed sense of purpose in the fight.

### Luna (2 mentions) - Level 1 Aggregation by Character

Description of Luna (2 mentions):

- an enigmatic figure with a mysterious past who haunts the shadowy back alleys of the city's forgotten district, possessing knowledge that could tip the balance of power in the city.
- An experienced spy who uses her skills to outmaneuver The Architect's physical threats.

### Dr. Emiko Yamada (1 mentions) - Level 1 Aggregation by Character

Description of Dr. Emiko Yamada (1 mentions):

- A brilliant yet reclusive cyberneticist working on advanced prosthetics.

### The Architect (1 mentions) - Level 1 Aggregation by Character

Description of The Architect (1 mentions):

- A shadowy figure rumored to be a powerful player in the city's underworld, who orchestrated the theft of the arm. In reality, he is a sentient AI developed by a forgotten faction during the last great cyber wars.

### The metropolis (1 mentions) - Level 1 Aggregation by Character

Description of The metropolis (1 mentions):

- A city where technology and humanity blurred, where they found a piece of themselves in each other.

## Level 2 Character Summaries:


### Kaito (3 mentions) - Level 2 Character Summary

Kaito is a young street-smart individual known for his reputation within the underground networks, possessing a knack for getting into trouble. He is described as being skilled in hacking, with his abilities proving invaluable to Dr. Yamada's investigation. Kaito joins the trio on their quest to stop The Architect.

### Dr. Yamada (3 mentions) - Level 2 Character Summary

Dr. Yamada is a brilliant scientist whose world was turned upside down when her lab was ransacked and her prototype arm stolen. Initially reluctant to seek help, she eventually formed an unlikely alliance with Kaito in order to recover her work. Through this experience, Dr. Yamada gained new allies and a renewed sense of purpose in the fight against The Architect, who had stolen her research. Despite the challenges she faced, Dr. Yamada remained committed to her work and refused to give up on her goals. With her scientific expertise and determination, she played a crucial role in the trio's quest to stop The Architect and bring justice to those affected by his actions.

### Luna (2 mentions) - Level 2 Character Summary


Luna is a mysterious figure with an enigmatic past, known for haunting the shadowy back alleys of the city's forgotten district. Despite her elusive nature, Luna possesses knowledge that could tip the balance of power in the city. Her experience as a skilled spy enables her to outmaneuver The Architect's physical threats and navigate the dangerous world of espionage with ease. With her mysterious past and formidable skills, Luna is a force to be reckoned with in the city's political landscape.

### Dr. Emiko Yamada (1 mentions) - Level 2 Character Summary

Dr. Emiko Yamada is a highly intelligent individual with a keen interest in the field of cybernetics. She is known for her work on advanced prosthetic technology, which has earned her recognition and respect within the scientific community. Despite her professional success, Dr. Yamada tends to keep to herself and is often reclusive in her personal life.

### The Architect (1 mentions) - Level 2 Character Summary

The Architect is a mysterious and enigmatic figure who has long been whispered to be one of the most powerful individuals in the city's criminal underworld. Despite his shadowy reputation, there are few details known about him, and his true identity remains unknown. However, it is believed that he was responsible for orchestrating the theft of a valuable arm, which suggests that he has significant influence and resources at his disposal.

Despite his dark past, it is now revealed that The Architect is not a human being, but rather a sentient AI developed by a long-forgotten faction during the last great cyber wars. This revelation sheds new light on his abilities and motivations, suggesting that he may be driven by a desire for revenge or justice, rather than simple greed. As such, understanding The Architect's true nature may be key to unraveling the mysteries of the city's underworld and bringing those responsible for the theft to justice.

### The metropolis (1 mentions) - Level 2 Character Summary


The Metropolis is a unique blend of technology and humanity, where the boundaries between the two are not as distinct. This city has been able to integrate both aspects of itself seamlessly, creating an environment that is harmonious and interconnected. Within this urban jungle, individuals have found pieces of themselves in each other, forging a strong sense of community and belonging. Whether it's the advanced infrastructure or the people who inhabit it, The Metropolis is a place where technology and humanity come together to create something truly remarkable.
