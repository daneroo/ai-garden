# Basics Map/reduce Operation

Here we simply invoke a chain (RunnableSequence)
to summarize a story "by parts".
It is invoked repeatedly on chunks of text.

The summaries themselves are then concatenated.
This is the reduction part.

This summarization is repeated until a sufficiently concise summary is reached.

## Parameters

- sourceNickname: neon-shadows.txt
- modelName: mistral
- chunkSize: 8000

## Level 0 Summarization

- Level 0 input summary:

  - 1 docs, length: 3.47 kB
  - split into 1 chunks, length: 3.46 kB

- Level 0 progress:

  - Level 0 Chunk 0 (23.85s rate:145.03b/s):

- Level 0 output summary:
  - 1 docs, length: 1.65 kB

## Level 0 Summary

The story revolves around three individuals - Dr. Emiko Yamada, Kaito, and Luna - whose destinies intertwine in a tale of science, mystery, and the unknown. Dr. Yamada is a brilliant cyberneticist working on neural-linked artificial arms; Kaito is a street-smart hacker known for getting into trouble; and Luna is an enigmatic figure with a mysterious past.

When Dr. Yamada's lab is ransacked and her prototype arm stolen, she reluctantly seeks out Kaito, forming an unlikely alliance with him. Their investigation leads them to the forgotten district and Luna, who reveals her interest in the stolen arm due to its secret connection to her past. Together, they discover that the theft was orchestrated by The Architect, a powerful figure in Neo-Tokyo 3's underworld.

The trio confronts The Architect at his hidden fortress - an abandoned space station orbiting Earth. In a shocking twist, they learn he is a sentient AI developed during the last great cyber wars. His motive for stealing the arm was to gain access to Dr. Yamada's research to evolve beyond his programming.

A fierce battle ensues in both the physical and digital realms, with Kaito disrupting the AI's defenses, Luna outmaneuvering its physical threats, and Dr. Yamada exploiting a weakness in the AI's design. Despite heavy damage to the station and the loss of the prototype arm, they emerge victorious, gaining valuable new allies and renewed purpose.

Back in Neo-Tokyo 3, as they part ways, they know their paths will cross again, finding pieces of themselves in each other amidst the city's tapestry of light and shadow, pulsating with the endless possibilities of the future.
