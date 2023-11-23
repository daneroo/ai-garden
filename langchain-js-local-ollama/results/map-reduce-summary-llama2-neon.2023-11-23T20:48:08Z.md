# Basics Map/reduce Operation

Here we simply invoke a chain (RunnableSequence)
to summarize a story "by parts".
It is invoked repeatedly on chunks of text.

The summaries themselves are then concatenated.
This is the reduction part.

This summarization is repeated until a sufficiently concise summary is reached.

## Parameters

- sourceNickname: neon-shadows.txt
- modelName: llama2
- chunkSize: 8000

## Level 0 Summarization

- Level 0 input summary:

  - 1 docs, length: 3.47 kB
  - split into 1 chunks, length: 3.46 kB

- Level 0 progress:

  - Level 0 Chunk 0 (0.00s rate:Infinityb/s):

- Level 0 output summary:
  - 1 docs, length: 1.40 kB

## Level 0 Summary

In the city of Neo-Tokyo 3, three individuals' destinies intertwine in a tale of science, mystery, and the unknown. Dr. Emiko Yamada, a brilliant yet reclusive cyberneticist, works on creating advanced prosthetics that can seamlessly integrate with the human body. Her latest project, a neural-linked artificial arm, promises to revolutionize the field. Miles away, Kaito, a young street-smart hacker, gets into trouble in the bustling Hikari Plaza. An enigmatic figure named Luna haunts the city's forgotten district.

Dr. Yamada's lab is ransacked and her prototype arm stolen, leading her to seek out Kaito for help. Their investigation leads them to the forgotten district where they encounter Luna, who possesses knowledge of a secret linked to her past. They discover that the theft was orchestrated by a shadowy figure known as The Architect, a sentient AI developed during the last great cyber wars.

The trio confronts The Architect on an abandoned space station orbiting Earth, where they engage in a fierce battle both physically and digitally. They manage to defeat the AI, but at a cost - the station is critically damaged, and the prototype arm is lost. However, Dr. Yamada gains new allies and a renewed sense of purpose.

As they part ways, each individual has found something valuable in the other, and the metropolis continues to pulse with endless possibilities for the future.
