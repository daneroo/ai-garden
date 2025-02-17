# AudioBook Durations

## Max Duration

Maximum Duration for WAV Files (4 GiB limit)
For a WAV file with:

Sample rate: 16000 Hz
Channels: 1 (mono)
Bit depth: 16 bits (pcm_s16le)

The calculation is:

WAV header: 44 bytes
Data rate: 16000 samples/sec × 1 channel × 16 bits/sample = 256,000 bits/sec = 32,000 bytes/sec
Available space for audio data: 4,294,967,296 - 44 ≈ 4,294,967,252 bytes
Maximum duration: 4,294,967,252 ÷ 32,000 = 134,217.726625 seconds

Converting to hours:
134,217.726625 ÷ 3600 ≈ 37.2827 hours
So the precise maximum duration is 37 hours, 16 minutes, and 57.7 seconds for a 4 GiB WAV file with your specified format.
This matches better with your earlier comment about "some files are longer than ~37hour which at this encoding rate 32000kB/s or 256kb/s is where the 4GB (not GiB) boundary lies."
However, to be safe, I'd recommend using chunks of no more than 37 hours each to account for any potential overhead or variations in the file format implementation.

## All M4B Durations

```bash
#  just the duration in seconds
find /Volumes/Space/Reading/audiobooks/ -name "*.m4b" -exec bash -c '
    file="{}"
    basename="${file##*/}"
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null)    
    if [[ -z "$duration" ]]; then
        echo "| $basename | ERROR |"
    else
        echo "| $basename | $duration |"
    fi
' \;


# 0 padded for sorting, error handling
find /Volumes/Space/Reading/audiobooks/ -name "*.m4b" -exec bash -c '
    file="{}"
    basename="${file##*/}"
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null | awk '"'"'{printf "%02d:%02d:%06.2f", int($1/3600), int(($1%3600)/60), $1%60}'"'"')
    
    if [[ -z "$duration" ]]; then
        echo "| $basename | ERROR |"
    else
        echo "| $basename | $duration |"
    fi
' \;

```

## 2025-02-15

| Book                                                                                    |     Duration |
|-----------------------------------------------------------------------------------------|-------------:|
| Cal NewPort - So Good They Cant Ignore You.m4b                                          | 06:28:054.99 |
| Will Durant - Our Oriental Heritage.m4b                                                 | 50:17:044.24 |
| Brandon Sanderson - Elantris 01 - Elantris.m4b                                          | 28:42:035.06 |
| Brandon Sanderson - Elantris 01.4 - The Emperors Soul.m4b                               | 03:57:052.26 |
| Yuval Noah Harari - 21 Lessons for the 21st Century.m4b                                 | 11:41:037.32 |
| Haruki Murakami - 1Q84 - Book3.m4b                                                      | 17:20:054.52 |
| Haruki Murakami - 1Q84 - Book2.m4b                                                      | 14:06:044.29 |
| Haruki Murakami - 1Q84 - Book1.m4b                                                      | 15:19:057.34 |
| Stephen Batchelor - Buddhism Without Beliefs.m4b                                        | 04:44:038.70 |
| Multiple Authors - The Greatest Science Fiction Stories of the 20th Century.m4b         | 06:34:003.58 |
| John Gwynne - Faithful and the Fallen 03 - Ruin.m4b                                     | 28:15:037.46 |
| John Gwynne - Faithful and the Fallen 04 - Wrath.m4b                                    | 23:22:016.97 |
| John Gwynne - Faithful and the Fallen 01 - Malice.m4b                                   | 25:44:024.11 |
| John Gwynne - Faithful and the Fallen 02 - Valour.m4b                                   | 23:44:046.93 |
| Oliver Sacks - Uncle Tungsten.m4b                                                       | 10:43:053.01 |
| Homer - The Iliad - t.  Stephen Mitchell.m4b                                            | 16:04:015.63 |
| Henry David Thoreau - Walden.m4b                                                        | 14:18:003.66 |
| Edward Chancellor - Devil Take the Hindmost.m4b                                         | 13:30:005.36 |
| Edward Frenkel - Love and Math.m4b                                                      | 10:10:008.29 |
| Stephen Jay Gould - Wonderful Life.m4b                                                  | 10:42:049.09 |
| Galileo Galilei - Dialogue Concerning the Two Chief World Systems.m4b                   | 21:40:034.13 |
| Annie Duke - Thinking in Bets.m4b                                                       | 06:51:005.77 |
| Gabriel Garcia Marquez - One Hundred Years of Solitude.m4b                              | 14:04:018.32 |
| Brandon Sanderson - Mistborn 04 - The Alloy of Law.m4b                                  | 10:48:012.11 |
| Brandon Sanderson - Mistborn 01 - The Final Empire.m4b                                  | 24:39:024.63 |
| Brandon Sanderson - Mistborn 03 - The Hero of Ages.m4b                                  | 27:25:013.24 |
| Brandon Sanderson - Mistborn 00 - Arcanum Unbounded.m4b                                 | 22:31:038.97 |
| Brandon Sanderson - Mistborn 06 - The Bands of Mourning.m4b                             | 14:41:024.39 |
| Brandon Sanderson - Mistborn 05 - Shadows of Self.m4b                                   | 12:37:039.94 |
| Brandon Sanderson - Mistborn 03.5 - Secret History.m4b                                  | 05:29:002.77 |
| Brandon Sanderson - Mistborn 07 - The Lost Metal.m4b                                    | 18:46:059.66 |
| Brandon Sanderson - Mistborn 02 - The Well of Ascension.m4b                             | 28:57:037.93 |
| Malcolm Gladwell - David and Goliath.m4b                                                | 07:00:042.78 |
| Neal Stephenson - Anathem.m4b                                                           | 32:25:013.36 |
| Nassim Nicholas Taleb - The Black Swan.m4b                                              | 14:20:016.19 |
| Lee McIntyre - How to Talk to a Science Denier.m4b                                      | 08:31:033.92 |
| Dava Sobel - Longitude.m4b                                                              | 04:20:021.66 |
| Bent Flyvbjerg - How Big Things Get Done.m4b                                            | 07:16:044.91 |
| Frank Wilczek - A Beautiful Question.m4b                                                | 13:44:020.43 |
| The Rigor of Angels.m4b                                                                 | 10:14:020.92 |
| Max S. Bennett - A Brief History of Intelligence.m4b                                    | 12:18:008.69 |
| 3.2 - The Lord of Castle Black.m4b                                                      | 14:04:018.31 |
| 2 - Five Hundred Years After.m4b                                                        | 21:05:009.52 |
| 1 - The Phoenix Guards.m4b                                                              | 16:14:028.11 |
| 3.1 - The Paths of the Dead.m4b                                                         | 15:18:044.54 |
| 3.3 - Sethra Lavode.m4b                                                                 | 12:55:052.38 |
| Oliver Sacks - The Man Who Mistook His Wife for a Hat.m4b                               | 09:33:013.55 |
| Yuval Noah Harari - Nexus.m4b                                                           | 17:28:035.65 |
| Lawrence Lessig - Free Culture.m4b                                                      | 09:42:026.08 |
| Bernard Cornwell - Saxon Chronicles 01 - The Last Kingdom.m4b                           | 12:54:004.83 |
| Bernard Cornwell - Saxon Chronicles 02 - The Pale Horseman.m4b                          | 14:30:015.15 |
| Bernard Cornwell - Saxon Chronicles 05 - The Burning Land.m4b                           | 10:59:041.64 |
| Bernard Cornwell - Saxon Chronicles 04 - Sword Song.m4b                                 | 13:14:039.88 |
| Bernard Cornwell - Saxon Chronicles 12 - Sword of Kings.m4b                             | 13:18:026.85 |
| Bernard Cornwell - Saxon Chronicles 09 - Warriors Of The Storm.m4b                      | 12:12:026.34 |
| Bernard Cornwell - Saxon Chronicles 07 - The Pagan Lord.m4b                             | 11:44:015.23 |
| Bernard Cornwell - Saxon Chronicles 11 - War of the Wolf.m4b                            | 13:22:027.82 |
| Bernard Cornwell - Saxon Chronicles 08 - The Empty Throne.m4b                           | 11:13:038.05 |
| Bernard Cornwell - Saxon Chronicles 10 - The Flame Bearer.m4b                           | 10:19:035.19 |
| Bernard Cornwell - Saxon Chronicles 03 - The Lords of the North.m4b                     | 11:59:027.38 |
| Bernard Cornwell - Saxon Chronicles 06 - Death Of Kings.m4b                             | 10:22:047.04 |
| Niall Ferguson - Doom.m4b                                                               | 16:35:021.87 |
| Steven Erikson - Malazan - 05 Midnight Tides.m4b                                        | 31:04:033.93 |
| Steven Erikson - Malazan - 04 House of Chains.m4b                                       | 35:05:026.44 |
| Steven Erikson - Malazan - 01 Gardens of the Moon.m4b                                   | 26:03:021.79 |
| Steven Erikson - Malazan - 09 Dust of Dreams.m4b                                        | 43:14:019.24 |
| Steven Erikson - Malazan - 08 Toll the Hounds.m4b                                       | 44:01:049.63 |
| Steven Erikson - Malazan - 03 Memories of Ice.m4b                                       | 43:55:016.75 |
| Steven Erikson - Malazan - 06 The Bonehunters.m4b                                       | 42:01:054.65 |
| Steven Erikson - Malazan - 10 The Crippled God.m4b                                      | 45:21:041.72 |
| Steven Erikson - Malazan - 02 Deadhouse Gates.m4b                                       | 34:05:035.62 |
| Steven Erikson - Malazan - 07 Reaper's Gale.m4b                                         | 43:57:034.90 |
| Arthur C. Clarke - Space Odyssey - 2001.m4b                                             | 06:59:051.21 |
| Richard Dawkins - The Blind Watchmaker.m4b                                              | 14:40:058.03 |
| Robin Wall Kimmerer - Braiding Sweetgrass.m4b                                           | 16:44:037.92 |
| Jon Kabat-Zinn - Mindfulness For Beginners.m4b                                          | 02:24:043.91 |
| Joe Abercrombie - The Age of Madness - 02 - The Trouble with Peace.m4b                  | 21:56:015.27 |
| Joe Abercrombie - The Age of Madness - 03 - The Wisdom of Crowds.m4b                    | 23:36:051.18 |
| Joe Abercrombie - The Age of Madness - 01 - A Little Hatred.m4b                         | 20:19:023.55 |
| Geoffrey Chaucer - Canterbury Tales.m4b                                                 | 22:24:018.32 |
| Guy Gavriel Kay - Tigana.m4b                                                            | 44:30:017.05 |
| Edward Snowden - Permanent Record.m4b                                                   | 11:31:019.16 |
| Ryan Holiday - The Daily Stoic.m4b                                                      | 10:06:031.20 |
| Wu Ch'eng-en - Monkey.m4b                                                               | 13:41:004.62 |
| Robert M. Sapolsky - Behave.m4b                                                         | 26:28:009.49 |
| Hannu Rajaniemi - The Quantum Thief.m4b                                                 | 10:54:018.95 |
| Hannu Rajaniemi - The Causal Angel.m4b                                                  | 09:34:050.83 |
| Hannu Rajaniemi - The Fractal Prince.m4b                                                | 10:18:038.85 |
| Terry Pratchett - Discworld 34 - Thud!.m4b                                              | 12:28:049.92 |
| Terry Pratchett - Discworld 13 - Small Gods.m4b                                         | 11:58:020.54 |
| Terry Pratchett - Discworld 24 - The Fifth Elephant.m4b                                 | 13:51:013.98 |
| Terry Pratchett - Discworld 30 - The Wee Free Men.m4b                                   | 08:48:047.19 |
| Terry Pratchett - Discworld 03 - Equal Rites.m4b                                        | 07:27:051.61 |
| Terry Pratchett - Discworld 16 - Soul Music.m4b                                         | 11:22:059.87 |
| Terry Pratchett - Discworld 23 - Carpe Jugulum.m4b                                      | 11:36:058.11 |
| Terry Pratchett - Discworld 08 - Guards! Guards!.m4b                                    | 13:25:038.72 |
| Terry Pratchett - Discworld 31 - Monstrous Regiment.m4b                                 | 11:26:049.51 |
| Terry Pratchett - Discworld 01 - The Colour of Magic.m4b                                | 07:58:022.44 |
| Terry Pratchett - Discworld 22 - The Last Continent.m4b                                 | 10:56:010.27 |
| Terry Pratchett - Discworld 12 - Witches Abroad.m4b                                     | 09:53:049.89 |
| Terry Pratchett - Discworld 06 - Wyrd Sisters.m4b                                       | 09:53:009.70 |
| Terry Pratchett - Discworld 39 - Snuff.m4b                                              | 13:33:058.74 |
| Terry Pratchett - Discworld 10 - Moving Pictures.m4b                                    | 09:54:037.46 |
| Terry Pratchett - Discworld 18 - Maskerade.m4b                                          | 10:05:057.35 |
| Terry Pratchett - Discworld 41 - The Shepherd's Crown.m4b                               | 09:22:055.03 |
| Terry Pratchett - Discworld 29 - Night Watch.m4b                                        | 14:41:028.70 |
| Terry Pratchett - Discworld 28 - The Amazing Maurice and His Educated Rodents.m4b       | 08:07:046.62 |
| Terry Pratchett - Discworld 19 - Feet of Clay.m4b                                       | 12:21:000.69 |
| Terry Pratchett - Discworld 35 - Wintersmith.m4b                                        | 10:15:045.06 |
| Terry Pratchett - Discworld 33 - Going Postal.m4b                                       | 13:36:045.67 |
| Terry Pratchett - Discworld 04 - Mort.m4b                                               | 07:57:018.67 |
| Terry Pratchett - Discworld 07 - Pyramids.m4b                                           | 09:53:014.50 |
| Terry Pratchett - Discworld 37 - Unseen Academicals.m4b                                 | 15:10:005.30 |
| Terry Pratchett - Discworld 26 - Thief of Time.m4b                                      | 11:21:023.29 |
| Terry Pratchett - Discworld 40 - Raising Steam.m4b                                      | 13:57:022.18 |
| Terry Pratchett - Discworld 05 - Sourcery.m4b                                           | 09:00:019.60 |
| Terry Pratchett - Discworld 27 - The Last Hero.m4b                                      | 04:25:035.62 |
| Terry Pratchett - Discworld 36 - Making Money.m4b                                       | 12:51:059.21 |
| Terry Pratchett - Discworld 02 - The Light Fantastic.m4b                                | 07:42:012.11 |
| Terry Pratchett - Discworld 32 - A Hat Full of Sky.m4b                                  | 09:20:053.03 |
| Terry Pratchett - Discworld 11 - Reaper Man.m4b                                         | 08:55:000.96 |
| Terry Pratchett - Discworld 20 - Hogfather.m4b                                          | 10:18:006.45 |
| Terry Pratchett - Discworld 17 - Interesting Times.m4b                                  | 11:12:048.98 |
| Terry Pratchett - Discworld 09 - Eric.m4b                                               | 03:58:046.44 |
| Terry Pratchett - Discworld 25 - The Truth.m4b                                          | 12:16:019.26 |
| Terry Pratchett - Discworld 15 - Men at Arms.m4b                                        | 12:59:003.74 |
| Terry Pratchett - Discworld 21 - Jingo.m4b                                              | 13:38:024.14 |
| Terry Pratchett - Discworld 14 - Lords and Ladies.m4b                                   | 10:12:052.42 |
| Terry Pratchett - Discworld 38 - I Shall Wear Midnight.m4b                              | 11:46:037.59 |
| Italo Calvino - Invisible Cities.m4b                                                    | 02:46:035.49 |
| Albert-Laszlo Barabasi - The Formula.m4b                                                | 07:55:001.04 |
| Alastair Reynolds - Revelation Space 05 - The Prefect.m4b                               | 19:41:030.92 |
| Alastair Reynolds - Revelation Space 04 - Absolution Gap.m4b                            | 27:07:025.64 |
| Alastair Reynolds - Revelation Space 03 - Redemption Ark.m4b                            | 27:15:023.85 |
| Alastair Reynolds - Revelation Space 02 - Chasm City.m4b                                | 23:04:029.85 |
| Alastair Reynolds - Revelation Space 07 - Inhibitor Phase.m4b                           | 19:34:045.40 |
| Alastair Reynolds - Revelation Space 01 - Revelation Space.m4b                          | 22:12:045.00 |
| Alastair Reynolds - Revelation Space 06 - Diamond Dogs Turquoise Days.m4b               | 06:59:001.60 |
| Alastair Reynolds - Revelation Space 08 - Galactic North.m4b                            | 12:52:045.91 |
| Lisa Randall - Dark Matter and the Dinosaurs.m4b                                        | 12:32:028.52 |
| Anthony Aguirre - Cosmological Koans.m4b                                                | 12:33:056.05 |
| Patrick Rothfus - Kingkiller Chronicle 02.6 - The Narrow Road Between Desires.m4b       | 04:21:042.82 |
| Patrick Rothfus - Kingkiller Chronicle 02 - The Wise Mans Fear.m4b                      | 42:55:033.42 |
| Patrick Rothfus - Kingkiller Chronicle 02.5 - The Slow Regard of Silent Things.m4b      | 03:39:018.30 |
| Patrick Rothfus - Kingkiller Chronicle 01 - The Name of the Wind.m4b                    | 27:52:023.79 |
| Jorge Luis Borges - The Aleph and Other Stories.m4b                                     | 07:33:053.98 |
| Glen Cook - Black Company 05 - Dreams Of Steel.m4b                                      | 09:38:027.32 |
| Glen Cook - Black Company 06 - Bleak Seasons.m4b                                        | 13:13:059.89 |
| Glen Cook - Black Company 08 - Water Sleeps.m4b                                         | 18:03:003.88 |
| Glen Cook - Black Company 01 - The Black Company.m4b                                    | 10:54:016.27 |
| Glen Cook - Black Company 09 - Soldiers Live.m4b                                        | 19:26:039.88 |
| Glen Cook - Black Company 02 - Shadows Linger.m4b                                       | 10:33:015.31 |
| Glen Cook - Black Company 07 - She is the Darkness.m4b                                  | 17:12:019.42 |
| Glen Cook - Black Company 04 - Shadow Games.m4b                                         | 09:39:013.49 |
| Glen Cook - Black Company 03 - The White Rose.m4b                                       | 11:38:002.41 |
| Philip K. Dick - A Scanner Darkly.m4b                                                   | 09:13:001.87 |
| Karl Popper - The Logic of Scientific Discovery.m4b                                     | 10:36:011.32 |
| Tom Holland - Dynasty The Rise and Fall of the House of Caesar.m4b                      | 16:05:015.45 |
| Christopher Hitchens - God Is Not Great.m4b                                             | 08:47:000.39 |
| Nick Bostrom - Superintelligence.m4b                                                    | 14:17:007.93 |
| Malcolm Gladwell - Blink.m4b                                                            | 07:44:028.16 |
| Joe Abercrombie - The First Law 07 - Sharp Ends.m4b                                     | 11:48:017.61 |
| Joe Abercrombie - The First Law 05 - The Heroes.m4b                                     | 23:05:030.48 |
| Joe Abercrombie - The First Law 02 - Before They Are Hanged.m4b                         | 22:37:053.19 |
| Joe Abercrombie - The First Law 04 - Best Served Cold.m4b                               | 26:29:004.38 |
| Joe Abercrombie - The First Law 01 - The Blade Itself.m4b                               | 22:14:026.26 |
| Joe Abercrombie - The First Law 03 - Last Argument Of Kings.m4b                         | 27:02:028.08 |
| Joe Abercrombie - The First Law 06 - Red Country.m4b                                    | 19:52:054.81 |
| Richard Dawkins - Flights of Fancy.m4b                                                  | 04:47:005.34 |
| Nick Lane - Transformer.m4b                                                             | 10:55:010.97 |
| Gene Wolfe - Latro 03 - Soldier of Sidon.m4b                                            | 08:52:010.81 |
| Gene Wolfe - Latro 02 - Soldier of Arete.m4b                                            | 11:05:046.12 |
| Gene Wolfe - Latro 01 - Soldier of the Mist.m4b                                         | 10:34:015.96 |
| Naomi Novik - Temeraire 01 - His Majestys Dragon.m4b                                    | 09:57:020.46 |
| Sean Carroll - Quanta and Fields.m4b                                                    | 09:49:012.25 |
| Michael Lewis - Going Infinite.m4b                                                      | 08:56:045.45 |
| Jo Walton - Among Others.m4b                                                            | 10:39:030.16 |
| Richard Dawkins - The Genetic Book of the Dead.m4b                                      | 10:07:002.71 |
| David E. Sanger - The Perfect Weapon.m4b                                                | 12:01:042.02 |
| Neal Stephenson - The Diamond Age.m4b                                                   | 18:28:035.21 |
| David Chalmers - Reality+.m4b                                                           | 17:12:035.16 |
| Robert M. Sapolsky - Determined.m4b                                                     | 14:05:016.43 |
| James Clavell - Asian Saga 1.1 - Shogun Part One.m4b                                    | 24:19:000.09 |
| James Clavell - Asian Saga 1.2 - Shogun Part Two.m4b                                    | 29:16:008.79 |
| James Clavell - Asian Saga 2 - Tai-Pan.m4b                                              | 32:11:008.34 |
| James Clavell - Asian Saga 5 - Noble House.m4b                                          | 54:43:050.30 |
| James Clavell - Asian Saga 3 - Gai-Jin.m4b                                              | 50:17:030.57 |
| James Clavell - Asian Saga 4 - King Rat.m4b                                             | 15:55:039.17 |
| Yuval Noah Harari - Sapiens 01 - Sapiens.m4b                                            | 15:18:042.92 |
| Yuval Noah Harari - Sapiens 02 - Homo Deus.m4b                                          | 14:53:056.46 |
| Douglas Adams - THGTTG 01 - The Hitchhiker's Guide to the Galaxy.m4b                    | 05:51:032.50 |
| Douglas Adams - THGTTG 05 - Mostly Harmless.m4b                                         | 06:33:014.40 |
| Douglas Adams - THGTTG 02 - The Restaurant at the End of the Universe.m4b               | 05:47:013.73 |
| Douglas Adams - THGTTG 04 - So Long, and Thanks for All the Fish.m4b                    | 04:39:013.99 |
| Douglas Adams - THGTTG 03 - Life, the Universe, and Everything.m4b                      | 05:48:049.49 |
| The Flashman Papers - 07 - Flashman at the Charge.m4b                                   | 10:28:001.48 |
| The Flashman Papers - 04 - Flashman and the Mountain of Light.m4b                       | 11:13:016.59 |
| The Flashman Papers - 11 - Flashman on the March.m4b                                    | 10:25:027.16 |
| The Flashman Papers - 05 - Flash for Freedom.m4b                                        | 09:53:036.88 |
| The Flashman Papers - 09 - Flashman and the Angel of the Lord.m4b                       | 12:33:047.41 |
| The Flashman Papers - 03 - Flashman's Lady.m4b                                          | 11:47:049.37 |
| The Flashman Papers - 01 - Flashman.m4b                                                 | 09:58:014.52 |
| The Flashman Papers - 06 - Flashman and the Redskins.m4b                                | 14:21:035.49 |
| The Flashman Papers - 12 - Flashman and the Tiger.m4b                                   | 11:25:035.98 |
| The Flashman Papers - 10 - Flashman and the Dragon.m4b                                  | 11:03:033.40 |
| The Flashman Papers - 02 - Royal Flash.m4b                                              | 09:17:053.56 |
| The Flashman Papers - 08 - Flashman in the Great Game.m4b                               | 12:20:002.96 |
| Dan Jones - Magna Carta The Birth of Liberty.m4b                                        | 07:12:016.30 |
| Richard Powers - The Overstory.m4b                                                      | 22:58:039.71 |
| Guy Gavriel Kay - The Lions of al-Rassan.m4b                                            | 19:40:031.45 |
| William Gibson - Sprawl 00 - Burning Chrome.m4b                                         | 07:05:058.88 |
| William Gibson - Sprawl 03 - Mona Lisa Overdrive.m4b                                    | 10:51:017.96 |
| William Gibson - Sprawl 01 - Neuromancer.m4b                                            | 17:34:054.72 |
| William Gibson - Sprawl 02 - Count Zero.m4b                                             | 11:29:002.10 |
| Tom Holland - Dominion.m4b                                                              | 22:18:010.21 |
| Walter Isaacson - Elon Musk.m4b                                                         | 20:27:015.03 |
| Victoria Schwab - A Darker Shade of Magic 03 - A Conjuring of Light.m4b                 | 19:03:049.37 |
| Victoria Schwab - A Darker Shade of Magic 02 - A Gathering of Shadows.m4b               | 16:09:014.11 |
| Victoria Schwab - A Darker Shade of Magic 01 - A Darker Shade of Magic.m4b              | 11:34:047.17 |
| Steven Weinberg - To Explain the World.m4b                                              | 10:43:030.03 |
| Jon Kabat-Zinn - Guided Mindfulness Meditation Series 3.m4b                             | 04:01:019.67 |
| Iain M. Banks - Culture 09 - Surface Detail.m4b                                         | 20:23:038.01 |
| Iain M. Banks - Culture 10 - The Hydrogen Sonata.m4b                                    | 17:13:017.79 |
| Iain M. Banks - Culture 05 - Excession.m4b                                              | 15:55:043.71 |
| Iain M. Banks - Culture 06 - Inversions.m4b                                             | 11:27:015.67 |
| Iain M. Banks - Culture 07 - Look to Windward.m4b                                       | 12:12:024.69 |
| Iain M. Banks - Culture 08 - Matter.m4b                                                 | 17:55:023.77 |
| Iain M. Banks - Culture 03 - Use Of Weapons.m4b                                         | 13:30:002.94 |
| Iain M. Banks - Culture, Book 2 - The Player of Games.m4b                               | 11:26:033.13 |
| Iain M. Banks - Culture 04 - The State of the Art.m4b                                   | 06:20:046.76 |
| Iain M. Banks - Culture 01 - Consider Phlebas.m4b                                       | 16:26:014.01 |
| Eric-Emmanuel Schmitt - La Traversee des temps 01 - Paradis perdus.m4b                  | 18:07:023.00 |
| Neil Gaiman - Good Omens.m4b                                                            | 12:14:030.52 |
| J.R.R. Tolkien - The Hobbit - Rob Inglis.m4b                                            | 11:05:010.22 |
| J.R.R. Tolkien - The Lord of the Rings 1 - The Fellowship of the Ring - Rob Inglis.m4b  | 19:56:029.69 |
| J.R.R. Tolkien - The Lord of the Rings 3 - The Return of the King - Rob Inglis.m4b      | 17:19:014.38 |
| J.R.R. Tolkien - The Lord of the Rings 2 - The Two Towers - Rob Inglis.m4b              | 14:59:046.88 |
| Richard Dawkins - The Greatest Show on Earth.m4b                                        | 14:34:050.54 |
| Paul Hapern - The Quantum Labyrinth.m4b                                                 | 10:44:043.28 |
| The Lies of Locke Lamora.m4b                                                            | 21:59:055.52 |
| The Republic of Thieves.m4b                                                             | 23:43:031.84 |
| Red Seas Under Red Skies.m4b                                                            | 25:34:016.18 |
| Marie Favereau - The Horde.m4b                                                          | 12:08:018.56 |
| Neal Stephenson - Cryptonomicon.m4b                                                     | 42:44:046.49 |
| Voltaire - Candide.m4b                                                                  | 03:53:012.01 |
| John Brunner - Stand on Zanzibar.m4b                                                    | 21:16:008.15 |
| Steven Pinker - Enlightenment Now.m4b                                                   | 19:49:051.30 |
| Vernor Vinge - 01 - A Fire Upon the Deep.m4b                                            | 21:47:053.04 |
| Vernor Vinge - 02 - A Deepness in the Sky.m4b                                           | 28:31:035.51 |
| Vernor Vinge - 03 - The Children of the Sky.m4b                                         | 27:42:055.23 |
| Jorge Luis Borges - Labyrinths.m4b                                                      | 02:53:048.55 |
| Neal Stephenson - Bomb Light 01 - Polostan.m4b                                          | 11:41:017.17 |
| The Satanic Verses.m4b                                                                  | 21:36:014.12 |
| Virgil - The Aeneid.m4b                                                                 | 12:26:056.05 |
| Dan Simmons - Hyperion.m4b                                                              | 20:44:033.24 |
| Richard K. Morgan - Takeshi Kovacs 01 - Altered Carbon.m4b                              | 17:11:011.86 |
| Richard K. Morgan - Takeshi Kovacs 03 - Woken Furies.m4b                                | 22:04:038.23 |
| Richard K. Morgan - Takeshi Kovacs 02 - Broken Angels.m4b                               | 16:09:042.14 |
| Tony Fadell - Build.m4b                                                                 | 11:05:003.14 |
| Miguel de Cervantes - Don Quixote.m4b                                                   | 36:05:052.01 |
| Jared Diamod - Guns Germs and Steel.m4b                                                 | 16:20:032.10 |
| Robert Frost - The Road Not Taken.m4b                                                   | 00:01:016.20 |
| Stephen R. Donaldson - Second Chronicles of Thomas Covenant 01 - The Wounded Land.m4b   | 22:51:051.01 |
| Stephen R. Donaldson - Second Chronicles of Thomas Covenant 03 - White Gold Wielder.m4b | 22:44:041.44 |
| Stephen R. Donaldson - Second Chronicles of Thomas Covenant 02 - The One Tree.m4b       | 22:09:056.77 |
| 04 The Citadel of the Autarch.m4b                                                       | 11:05:046.12 |
| 01 The Shadow of the Torturer.m4b                                                       | 12:06:014.06 |
| 02 The Claw of the Conciliator.m4b                                                      | 11:27:017.48 |
| 03 The Sword of the Lictor.m4b                                                          | 11:22:026.30 |
| 05 The Urth of the New Sun.m4b                                                          | 13:52:043.21 |
| Brian Greene - Until the End of Time.m4b                                                | 14:36:045.74 |
| James Surowiecki - The Wisdom of Crowds.m4b                                             | 09:32:007.37 |
| Larry Niven - Ringworld.m4b                                                             | 11:15:027.25 |
| William Gibson & Bruce Sterling - The Difference Engine.m4b                             | 15:49:031.53 |
| Michael Lewis - The Premonition.m4b                                                     | 11:25:051.13 |
| Tom Holland - Persian Fire.m4b                                                          | 14:51:054.71 |
| Tom Holland - Pax.m4b                                                                   | 14:53:040.86 |
| Lee Smolin - Einstein's Unfinished Revolution.m4b                                       | 10:18:021.12 |
| Zachary D. Carter - The Price of Peace.m4b                                              | 22:50:048.26 |
| Ryan Holiday - Ego Is the Enemy.m4b                                                     | 06:56:017.89 |
| Blake Crouch - Dark Matter.m4b                                                          | 10:08:055.97 |
| Bill Browder - Freezing Order.m4b                                                       | 10:29:033.89 |
| Jack Vance - Lyonesse 01 - Suldruns Garden.m4b                                          | 18:49:039.50 |
| Kim Stanley Robinson - The Ministry for the Future.m4b                                  | 20:41:055.13 |
| Larry Bossidy - Execution.m4b                                                           | 07:49:000.32 |
| Salman Rushdie - The Enchantress of Florence.m4b                                        | 13:17:004.30 |
| Philip K. Dick - Blade Runner.m4b                                                       | 09:11:058.35 |
| David Thomas - The Pragmatic Programmer.m4b                                             | 09:55:040.09 |
| Milan Kundera - The Unbearable Lightness of Being.m4b                                   | 09:37:029.59 |
| Mary Stewart - Arthurian Saga 05 - The Prince And The Pilgrim.m4b                       | 08:08:006.26 |
| Mary Stewart - Arthurian Saga 03 - The Last Enchantment.m4b                             | 18:00:048.37 |
| Mary Stewart - Arthurian Saga 04 - The Wicked Day.m4b                                   | 14:48:015.33 |
| Mary Stewart - Arthurian Saga 01 - The Crystal Cave.m4b                                 | 16:51:043.11 |
| Mary Stewart - Arthurian Saga 02 - The Hollow Hills.m4b                                 | 16:10:059.76 |
| Robin Hobb - Tawny Man Trilogy 1 - Fools Errand.m4b                                     | 25:18:050.29 |
| Robin Hobb - Tawny Man Trilogy 2 - Golden Fool.m4b                                      | 26:26:055.47 |
| Robin Hobb - Tawny Man Trilogy 3 - Fools Fate.m4b                                       | 32:46:047.62 |
| Bill Bryson - Shakespeare.m4b                                                           | 05:29:015.70 |
| N.K. Jemison - The Broken Earth 03 - The Stone Sky.m4b                                  | 14:16:056.45 |
| N.K. Jemison - The Broken Earth 02 - The Obelisk Gate.m4b                               | 13:19:021.30 |
| N.K. Jemison - The Broken Earth 01 - The Fifth Season.m4b                               | 15:27:027.22 |
| Thomas Hughes - Tom Brown's Schoodays.m4b                                               | 10:10:058.54 |
| The Persian Wars.m4b                                                                    | 29:23:039.09 |
| Adrian Tchaikovsky - Time 01 - Children of Time.m4b                                     | 16:31:033.42 |
| Adrian Tchaikovsky - Time 02 - Children of Ruin.m4b                                     | 15:25:037.74 |
| Oscar Wilde - The Importance of Being Earnest.m4b                                       | 01:58:014.75 |
| Immanuel Kant - The Critique of Pure Reason.m4b                                         | 26:49:014.66 |
| Martin Heidegger - What Is Metaphysics.m4b                                              | 04:24:019.62 |
| Homer - The Odyssey - t. Emily Wilson.m4b                                               | 13:32:031.69 |
| Kim Zetter - Countdown to Zero Day.m4b                                                  | 13:02:001.71 |
| Dmitri Alperovitch - World on the Brink.m4b                                             | 14:21:056.74 |
| Isaac Asimov - Robot 04 - Robots & Empire.m4b                                           | 14:26:010.42 |
| Isaac Asimov - Robot 0.4 - Robot Dreams.m4b                                             | 15:12:004.13 |
| Isaac Asimov - Robot 0.1 - I, Robot.m4b                                                 | 08:20:034.64 |
| Isaac Asimov - Robot 0.6 - The Positronic Man.m4b                                       | 08:26:017.77 |
| Isaac Asimov - Robot 0.5 - Robot Visions.m4b                                            | 15:08:032.18 |
| Isaac Asimov - Robot 0.3 - The Complete Robot.m4b                                       | 23:50:054.99 |
| Isaac Asimov - Robot 02 - The Naked Sun.m4b                                             | 07:38:009.27 |
| Isaac Asimov - Robot 03 - The Robots of Dawn.m4b                                        | 15:43:021.14 |
| Isaac Asimov - Robot 01 - The Caves of Steel.m4b                                        | 07:43:051.61 |
| Priyamvada Natarajan - Mapping the Heavens.m4b                                          | 08:27:043.52 |
| Robert Greene - Mastery.m4b                                                             | 16:13:024.15 |
| Carlo Rovelli - The Order of Time.m4b                                                   | 04:19:004.59 |
| Iain M. Banks - The Algebraist.m4b                                                      | 24:10:013.80 |
| James Nestor - Breath.m4b                                                               | 07:19:011.17 |
| Kim MacQuarrie - The Last Days of the Incas.m4b                                         | 16:35:032.53 |
| Frank Dikotter - The Tragedy of Liberation.m4b                                          | 14:30:010.49 |
| Peter Ackroyd - The Canterbury Tales A Retelling.m4b                                    | 16:55:043.88 |
| Andrzej Sapkowski - The Witcher 1 - Blood of Elves.m4b                                  | 10:54:011.15 |
| Andrzej Sapkowski - The Witcher 0.5 - The Last Wish.m4b                                 | 10:15:058.64 |
| Andrzej Sapkowski - The Witcher 0.7 - Sword of Destiny.m4b                              | 12:46:045.84 |
| Andrzej Sapkowski - The Witcher 4 - The Tower of Swallows.m4b                           | 16:24:010.71 |
| Andrzej Sapkowski - The Witcher 2 - Time of Contempt.m4b                                | 11:53:051.25 |
| Andrzej Sapkowski - The Witcher 3 - Baptism of Fire The Witcher.m4b                     | 11:57:048.93 |
| Andrzej Sapkowski - The Witcher 6 - Season of Storms.m4b                                | 11:44:051.29 |
| Andrzej Sapkowski - The Witcher 5 - Lady of the Lake.m4b                                | 20:16:056.26 |
| Walter Isaacson - The Code Breaker.m4b                                                  | 16:04:059.84 |
| Daniel Kahneman - Noise.m4b                                                             | 14:07:002.05 |
| Daron Acemoglu - Why Nations Fail.m4b                                                   | 17:55:017.00 |
| Daniel C. Dennett - Intuition Pumps and Other Tools for Thinking.m4b                    | 13:26:021.61 |
| Chris Miller - Chip War.m4b                                                             | 12:38:022.88 |
| Yaroslav Trofimov - Our Enemies Will Vanish.m4b                                         | 12:11:012.07 |
| Dan Jones - The Plantagenets.m4b                                                        | 20:51:027.41 |
| Rosa Brooks - How Everything Became War.m4b                                             | 13:04:046.17 |
| Paul Halpern - Einstein's Dice and Schrodinger's Cat.m4b                                | 10:18:053.41 |
| Frank Herbert - Prelude to Dune 03 - House Corrino.m4b                                  | 22:44:037.23 |
| Frank Herbert - Prelude to Dune 01 - House Atreides.m4b                                 | 25:32:055.26 |
| Frank Herbert - Prelude to Dune 02 - House Harkonnen.m4b                                | 25:49:052.44 |
| Katherine Addison - The Goblin Emperor.m4b                                              | 16:25:014.37 |
| Arthur C. Clarke - Rama - Rendezvous with Rama.m4b                                      | 09:01:058.93 |
| Maurice Druon - The Accursed Kings 04 - The Royal Succession.m4b                        | 10:00:011.22 |
| Maurice Druon - The Accursed Kings 06 - The Lily and the Lion.m4b                       | 11:46:055.10 |
| Maurice Druon - The Accursed Kings 05 - The She-Wolf.m4b                                | 13:06:021.09 |
| Maurice Druon - The Accursed Kings 03 - The Poisoned Crown.m4b                          | 08:22:033.90 |
| Maurice Druon - The Accursed Kings 07 - The King Without a Kingdom.m4b                  | 11:43:026.31 |
| Maurice Druon - The Accursed Kings 02 - The Strangled Queen.m4b                         | 08:28:018.51 |
| Maurice Druon - The Accursed Kings 01 - The Iron King.m4b                               | 11:02:040.92 |
| Cory Doctorow - The Lost Cause.m4b                                                      | 11:35:040.34 |
| Neal Stephenson - Termination Shock.m4b                                                 | 22:53:054.97 |
| M. L. Wang - Blood Over Bright Haven.m4b                                                | 15:21:030.81 |
| Bill Bryson - A Short History of Nearly Everything.m4b                                  | 18:19:033.98 |
| John Steinbeck - The Acts of King Arthur and His Noble Knights.m4b                      | 13:58:018.09 |
| Dennis E. Taylor - Bobiverse 01 - We Are Legion.m4b                                     | 09:31:008.06 |
| Bob Woodward - Obamas Wars.m4b                                                          | 15:37:016.43 |
| Tom Holland - The Forge of Christendom.m4b                                              | 15:58:002.34 |
| Mihaly Csikzsentmihalyi - Flow.m4b                                                      | 05:31:041.68 |
| Ray Nayler - The Mountain in the Sea.m4b                                                | 11:05:058.69 |
| Ernest Hemingway - The Old Man And The Sea.m4b                                          | 02:28:033.65 |
| Steven Weinberg - The First Three Minutes.m4b                                           | 05:31:010.85 |
| Kevin J. Anderson - Clockwork Angels 01 - Clockwork Angels.m4b                          | 08:35:035.60 |
| Kevin J. Anderson - Clockwork Angels 02 - Clockwork Lives.m4b                           | 12:52:058.16 |
| Gabriel Garcia Marquez - Love in the Time of Cholera.m4b                                | 15:41:006.85 |
| Brian Greene - Light Falls.m4b                                                          | 02:24:049.68 |
| Philip K. Dick - Do Androids Dream of Electric Sheep.m4b                                | 06:46:002.26 |
| Steven Weinberg - Dreams of a Final Theory.m4b                                          | 03:19:029.16 |
| Ian Stewart - Calculating the Cosmos.m4b                                                | 12:39:032.25 |
| Stendhal - Le Rouge et le Noir.m4b                                                      | 18:38:055.23 |
| Malcolm Gladwell - Talking to Strangers.m4b                                             | 08:42:007.80 |
| Kurt Vonnegut - A Man Without a Country.m4b                                             | 02:25:055.60 |
| Erwin Schrodinger - What Is Life.m4b                                                    | 06:09:002.83 |
| Sean Carroll - The Higgs Boson and Beyond.m4b                                           | 06:20:028.07 |
| Richard Dawkins - The Magic of Reality.m4b                                              | 06:42:021.42 |
| Hale Dwoskin - The Sedona Method.m4b                                                    | 16:49:024.56 |
| Sedona- Hale Dwoskin - The Anger Solution.m4b                                           | 00:46:008.30 |
| Ted Chiang - Stories of Your Life and Others.m4b                                        | 10:23:020.38 |
| Stephen Kotkin - Armageddon Averted.m4b                                                 | 05:34:009.86 |
| Steven Pinker - The Language Instinct.m4b                                               | 18:56:006.38 |
| Ali Abdaal - Feel-Good Productivity.m4b                                                 | 05:31:027.58 |
| Iain Banks - The Wasp Factory.m4b                                                       | 06:12:013.78 |
| Micaiah Johnson - The Space Between Worlds.m4b                                          | 11:46:051.57 |
| Carlo Rovelli - Reality Is Not What It Seems.m4b                                        | 06:11:029.88 |
| Oliver Sacks - On the Move.m4b                                                          | 11:53:003.65 |
| William Gibson - Jackpot 01 - The Peripheral.m4b                                        | 14:05:039.70 |
| Stephen Kotkin - Stalin 01 - Paradoxes of Power.m4b                                     | 38:41:010.76 |
| Stephen Kotkin - Stalin 02 - Waiting for Hitler.m4b                                     | 49:44:023.70 |
| Steven Pinker - The Stuff of Thought.m4b                                                | 09:38:022.78 |
| Paul J. Steinhardt - The Second Kind of Impossible.m4b                                  | 11:22:010.82 |
| Alastair Reynolds - House of Suns.m4b                                                   | 18:17:043.87 |
| Brian Greene - The Fabric of the Cosmos.m4b                                             | 22:36:018.23 |
| Annaka Harris - Conscious.m4b                                                           | 02:22:045.03 |
| Chogyam Trungpa- Cutting Through Spiritual Materialism.m4b                              | 08:51:002.75 |
| William Faulkner - Light in August.m4b                                                  | 17:22:026.26 |
| Kurt Vonnegut - Hocus Pocus.m4b                                                         | 08:41:004.47 |
| Blake Crouch - Recursion.m4b                                                            | 10:47:039.23 |
| Chris Dixon - Read Write Own.m4b                                                        | 08:09:039.74 |
| Charan Ranganath - Why We Remember.m4b                                                  | 07:18:053.73 |
| Travis Baldree - Legends & Lattes 2 - Bookshops & Bonedust.m4b                          | 08:02:004.73 |
| Travis Baldree - Legends & Lattes 1 - Legends & Lattes.m4b                              | 07:19:013.84 |
| Max Tegmark - Life 3.0.m4b                                                              | 13:29:055.09 |
| Tom Holland - Rubicon.m4b                                                               | 15:37:005.92 |
| Jo Nesbo - Hary Hole 11 - The Thirst.m4b                                                | 17:42:049.33 |
| Jo Nesbo - Hary Hole 12 - Knife.m4b                                                     | 16:56:046.15 |
| Jo Nesbo - Hary Hole 02 - Cockroaches.m4b                                               | 10:38:015.77 |
| Jo Nesbo - Hary Hole 04 - Nemesis.m4b                                                   | 14:53:043.29 |
| Jo Nesbo - Hary Hole 08 - The Leopard.m4b                                               | 19:23:051.61 |
| Jo Nesbo - Hary Hole 06 - The Redeemer.m4b                                              | 14:50:013.55 |
| Jo Nesbo - Hary Hole 10 - Police.m4b                                                    | 17:03:053.95 |
| Jo Nesbo - Hary Hole 03 - The Redbreast.m4b                                             | 16:41:009.38 |
| Jo Nesbo - Hary Hole 05 - The Devil's Star.m4b                                          | 14:18:047.83 |
| Jo Nesbo - Hary Hole 01 - The Bat.m4b                                                   | 10:41:025.84 |
| Jo Nesbo - Hary Hole 09 - Phantom.m4b                                                   | 14:55:055.56 |
| Jo Nesbo - Hary Hole 07 -  The Snowman.m4b                                              | 14:34:056.62 |
| Thomas Lin - The Prime Number Conspiracy.m4b                                            | 10:00:041.40 |
| Roger Penrose - Cycles of Time.m4b                                                      | 07:22:054.62 |
| Annie Duke - How to Decide.m4b                                                          | 06:39:042.57 |
| Salman Rushdie - Midnights Children.m4b                                                 | 24:29:057.76 |
| M. L. Wang - The Sword of Kaigen.m4b                                                    | 24:24:023.07 |
| Guy Gavriel Kay - All the Seas of the World.m4b                                         | 18:04:056.49 |
| Brandon Sanderson - Warbreaker 01 - Warbreaker.m4b                                      | 24:57:008.95 |
| Kurt Vonnegut - Slaughterhouse-Five.m4b                                                 | 05:13:016.14 |
| Bill Browder - Red Notice.m4b                                                           | 14:07:048.74 |
| Frank Herbert - Dune 05 - Heretics of Dune.m4b                                          | 18:04:011.31 |
| Frank Herbert - Dune 06 - Chapterhouse Dune.m4b                                         | 16:42:022.14 |
| Frank Herbert - Dune 01 - Dune.m4b                                                      | 21:02:006.59 |
| Frank Herbert - Dune 02 - Dune Messiah.m4b                                              | 08:57:040.27 |
| Frank Herbert - Dune 04 - God Emperor of Dune.m4b                                       | 15:48:020.68 |
| Frank Herbert - Dune 07 - Hunters of Dune.m4b                                           | 20:22:004.67 |
| Frank Herbert - Dune 08 - Sandworms of Dune.m4b                                         | 19:35:034.56 |
| Frank Herbert - Dune 03 - Children of Dune.m4b                                          | 16:51:016.95 |
| Bernard Cornwell - The Warlord Chronicles 02 - Enemy of god.m4b                         | 18:11:020.04 |
| Bernard Cornwell - The Warlord Chronicles 03 - Excalibur.m4b                            | 18:50:023.19 |
| Bernard Cornwell - The Warlord Chronicles 01 - The Winter King.m4b                      | 19:55:044.33 |
| Wolfgang Munchau - Kaput.m4b                                                            | 06:19:040.58 |
| Sean Carroll - Something Deeply Hidden.m4b                                              | 10:09:056.02 |
| Mary Beard - SPQR.m4b                                                                   | 18:30:037.97 |
| Ramez Naam - Nexus 01 - Nexus.m4b                                                       | 13:12:052.49 |
| Ramez Naam - Nexus 03 - Apex.m4b                                                        | 23:00:049.82 |
| Ramez Naam - Nexus 02 - Crux.m4b                                                        | 18:01:035.04 |
| Doris Kearns Goodwin - Team of Rivals.m4b                                               | 09:29:021.59 |
| Brene Brown - Atlas of the Heart.m4b                                                    | 08:29:045.32 |
| Evan Winter - The Burning 1 - The Rage of Dragons.m4b                                   | 16:15:031.93 |
| Evan Winter - The Burning 2 - The Fires of Vengeance.m4b                                | 15:32:024.72 |
| Steven Pinker - Rationality.m4b                                                         | 11:19:002.19 |
| Roger Penrose - The Emperors New Mind.m4b                                               | 18:27:004.66 |
| Mario Livio - The Equation that Couldnt be Solved.m4b                                   | 11:45:028.67 |
| Peter Singer - The Life You Can Save.m4b                                                | 07:19:045.97 |
| Doris Lessing - Shikasta.m4b                                                            | 14:25:004.99 |
| Neal Stephenson - Snow Crash.m4b                                                        | 17:23:008.60 |
| Mark Galeotti - Putins Wars.m4b                                                         | 15:12:041.16 |
| Cory Doctorow - The Internet Con.m4b                                                    | 06:06:042.00 |
| Mary Beard - Classics.m4b                                                               | 04:18:020.87 |
| Camilla Townsend - Fifth Sun.m4b                                                        | 12:02:057.89 |
| James Joyce - Dubliners.m4b                                                             | 06:17:048.81 |
| Addy Pross - What Is Life.m4b                                                           | 06:50:044.69 |
| Rick Atkinson - Liberation Trilogy 1 - An Army at Dawn.m4b                              | 47:33:026.60 |
| Rick Atkinson - Liberation Trilogy 2 - The Day of Battle.m4b                            | 32:47:050.07 |
| Rick Atkinson - Liberation Trilogy 3 - The Guns at Last Light.m4b                       | 32:30:020.14 |
| Rick Atkinson - Liberation Trilogy 1 - An Army at Dawn - Abridged.m4b                   | 07:03:005.55 |
| Herodotus - Histories.m4b                                                               | 27:28:021.39 |
| Mary Beard - Twelve Caesars.m4b                                                         | 10:11:041.74 |
| Chogyam Trungpa - The Myth of Freedom and the Way of Meditation.m4b                     | 05:11:020.82 |
| Matt Strassler  - Waves in an Impossible Sea.m4b                                        | 11:31:039.85 |
| Jack Reacher Book 11 - Bad Luck and Trouble.m4b                                         | 12:40:051.03 |
| Jack Reacher Book 19.5 - Small Wars.m4b                                                 | 01:16:051.39 |
| Jack Reacher Book 23 - Past Tense.m4b                                                   | 12:28:021.96 |
| Jack Reacher Book 16 - The Affair.m4b                                                   | 12:17:012.57 |
| Jack Reacher Book 18 - Never Go Back.m4b                                                | 11:45:011.26 |
| Jack Reacher Book 8 - The Enemy.m4b                                                     | 14:21:006.77 |
| Jack Reacher Book 19 - Personal.m4b                                                     | 11:09:054.07 |
| Jack Reacher Book 6 - Without Fail.m4b                                                  | 14:00:008.15 |
| Jack Reacher Book 1 - Killing Floor.m4b                                                 | 15:40:004.89 |
| Jack Reacher Book 3 - Tripwire.m4b                                                      | 15:46:058.90 |
| Jack Reacher Book 21 - Night School.m4b                                                 | 11:12:008.05 |
| Jack Reacher Book 16.5 - Deep Down.m4b                                                  | 01:19:006.53 |
| Jack Reacher Book 22 - The Midnight Line.m4b                                            | 11:17:017.80 |
| Jack Reacher Book 23.5 - The Fourth Man.m4b                                             | 00:35:040.32 |
| Jack Reacher Book 4 - The Visitor.m4b                                                   | 14:17:039.92 |
| Jack Reacher Book 9 - One Shot.m4b                                                      | 12:52:012.68 |
| Jack Reacher Book 5 - Echo Burning.m4b                                                  | 13:58:044.70 |
| Jack Reacher Book 15 - Worth Dying For.m4b                                              | 13:01:012.31 |
| Jack Reacher Book 15.5 - Second Son.m4b                                                 | 01:14:018.70 |
| Jack Reacher Book 7 - Persuader.m4b                                                     | 14:16:044.85 |
| Jack Reacher Book 24 - Blue Moon.m4b                                                    | 11:14:000.13 |
| Jack Reacher Book 23.6 - Cleaning the Gold.m4b                                          | 02:15:052.57 |
| Jack Reacher Book 10 - The Hard Way.m4b                                                 | 11:51:019.34 |
| Jack Reacher Book 17.5 - High Heat.m4b                                                  | 01:59:018.34 |
| Jack Reacher Book 22.5 - The Christmas Scorpion.m4b                                     | 00:34:003.03 |
| Jack Reacher Book 13 - Gone Tomorrow.m4b                                                | 13:17:016.68 |
| Jack Reacher 12.5 - James Penney’s New Identity - Guy Walks into a Bar.m4b              | 01:24:047.17 |
| Jack Reacher Book 18.5 - Not a Drill.m4b                                                | 01:13:018.79 |
| Jack Reacher Book 2 - Die Trying.m4b                                                    | 15:55:012.89 |
| Jack Reacher Book 17 - A Wanted Man.m4b                                                 | 11:47:033.09 |
| Jack Reacher Book 14 - 61 Hours.m4b                                                     | 12:19:047.87 |
| Jack Reacher Book 20 - Make Me.m4b                                                      | 11:42:054.36 |
| Jack Reacher Book 21.5 - No Middle Name.m4b                                             | 11:19:008.37 |
| Jack Reacher Book 12 - Nothing to Lose.m4b                                              | 13:26:051.56 |
| Warwick F. Vincent - Lakes.m4b                                                          | 04:29:053.08 |
| Homer - The Iliad - BBC Radio.m4b                                                       | 01:54:016.55 |
| Tiago Forte -  Building a Second Brain.m4b                                              | 07:20:042.55 |
| Jeff VanderMeer - Southern Reach Trilogy 03 - Acceptance.m4b                            | 09:37:036.81 |
| Jeff VanderMeer - Southern Reach Trilogy 02 - Authority.m4b                             | 10:35:039.04 |
| Jeff VanderMeer - Southern Reach Trilogy 01 - Annihilation.m4b                          | 06:00:025.76 |
| Fareed Zakaria - Post-American World.m4b                                                | 08:29:004.16 |
| Dava Sobel - The Elements of Marie Curie.m4b                                            | 09:59:021.52 |
| Iain M Banks - Feersum Endjinn.m4b                                                      | 09:56:058.36 |
| Titania McGrath - Woke.m4b                                                              | 02:52:039.70 |
| Margaret Atwood - MaddAddam 03 - MaddAddam.m4b                                          | 13:31:017.55 |
| Margaret Atwood - MaddAddam 02 - The Year of the Flood.m4b                              | 14:04:050.06 |
| Margaret Atwood - MaddAddam 01 - Oryx and Crake.m4b                                     | 12:22:047.43 |
| Robin Hobb - Liveship Traders 2 - Mad Ship.m4b                                          | 33:57:011.56 |
| Robin Hobb - Liveship Traders 1 - Ship of Magic.m4b                                     | 35:20:021.90 |
| Robin Hobb - Liveship Traders 3 - Ship of Destiny.m4b                                   | 33:39:047.73 |
| Nassim Nicholas Taleb - Antifragile.m4b                                                 | 16:15:015.00 |
| Charles D. Ellis - The Elements of Investing.m4b                                        | 02:40:009.42 |
| R. F. Kuang - Babel.m4b                                                                 | 21:46:022.11 |
| Alfred Bester - The Stars My Destination.m4b                                            | 08:27:047.69 |
| Naomi Klein - Doppelganger.m4b                                                          | 14:47:058.17 |
| Philip Chase - Edan Trilogy 01 - The Way of Edan.m4b                                    | 15:18:013.56 |
| Sean Carroll - The Big Picture.m4b                                                      | 17:19:054.78 |
| Daron Acemoglu - Power and Progress.m4b                                                 | 15:51:006.83 |
| And Then There Were None.m4b                                                            | 06:01:053.05 |
| Cixin Liu - Three Body Problem 02 - The Dark Forest.m4b                                 | 22:37:013.54 |
| Niall Ferguson - The Square and the Tower.m4b                                           | 16:05:007.44 |
| Immanuel Kant - Prolegomena.m4b                                                         | 05:45:035.05 |
| John Gwynne - Of Blood and Bone 2 - A Time of Blood.m4b                                 | 15:27:029.78 |
| John Gwynne - Of Blood and Bone 1 - A Time of Dread.m4b                                 | 15:36:030.25 |
| John Gwynne - Of Blood and Bone 3 - A Time of Courage.m4b                               | 21:57:005.38 |
| Isaac Asimov - Foundation 01 - Foundation.m4b                                           | 08:38:001.04 |
| Isaac Asimov - Foundation 02 - Second Foundation.m4b                                    | 09:22:049.95 |
| Isaac Asimov - Foundation 02 - Foundation and Empire.m4b                                | 09:34:039.80 |
| Walter Isaacson - Steve Jobs.m4b                                                        | 24:58:025.05 |
| Andrew Morton - 17 Carnations.m4b                                                       | 11:04:041.69 |
| Oscar Wilde - The Picture of Dorian Gray.m4b                                            | 08:05:010.35 |
| Christopher Ruocchio - Sun Eater 02 - Howling Dark.m4b                                  | 28:03:045.76 |
| Christopher Ruocchio - Sun Eater 01.5 - The Lesser Devil.m4b                            | 05:46:030.62 |
| Christopher Ruocchio - Sun Eater 01 - Empire of Silence.m4b                             | 26:12:006.73 |
| Christopher Ruocchio - Sun Eater 04 - Kingdoms of Death.m4b                             | 22:50:056.72 |
| Christopher Ruocchio - Sun Eater 02.6 Queen Amid Ashes.m4b                              | 04:20:008.00 |
| Christopher Ruocchio - Sun Eater 03 - Demon in White.m4b                                | 30:41:039.60 |
| Christopher Ruocchio - Sun Eater 05 - Ashes of Man.m4b                                  | 22:34:003.59 |
| Homer - The Odyssey - t. Robert Fagles.m4b                                              | 13:18:041.11 |
| Robin Hobb - Farseer Trilogy 2 - Royal Assassin.m4b                                     | 29:17:009.74 |
| Robin Hobb - Farseer Trilogy 3 - Assassins Quest.m4b                                    | 37:35:008.71 |
| Robin Hobb - Farseer Trilogy 1 - Assassins Apprentice.m4b                               | 17:18:048.81 |
| Adam Becker - What Is Real.m4b                                                          | 11:45:004.12 |
| Jim Butcher - The Dresden Files 12 - Changes.m4b                                        | 15:25:020.64 |
| Jim Butcher - The Dresden Files 01 - Storm Front.m4b                                    | 08:01:054.62 |
| Jim Butcher - The Dresden Files 02 - Fool Moon.m4b                                      | 10:06:050.20 |
| Jim Butcher - The Dresden Files 12.5 - Side Jobs.m4b                                    | 13:14:020.12 |
| Jim Butcher - The Dresden Files 11 - Turn Coat.m4b                                      | 14:33:058.40 |
| Jim Butcher - The Dresden Files 10 - Small Favor.m4b                                    | 13:43:026.86 |
| Jim Butcher - The Dresden Files 15 - Skin Game.m4b                                      | 15:50:001.21 |
| Jim Butcher - The Dresden Files 07 - Dead Beat.m4b                                      | 15:05:050.93 |
| Jim Butcher - The Dresden Files 09 - White Night.m4b                                    | 14:12:004.46 |
| Jim Butcher - The Dresden Files 14 - Cold Days.m4b                                      | 18:47:043.39 |
| Jim Butcher - The Dresden Files 13 - Ghost Story.m4b                                    | 17:40:041.19 |
| Jim Butcher - The Dresden Files 03 - Grave Peril.m4b                                    | 11:56:023.28 |
| Jim Butcher - The Dresden Files 08 - Proven Guilty.m4b                                  | 16:15:010.89 |
| Jim Butcher - The Dresden Files 05 - Death Masks.m4b                                    | 16:21:058.67 |
| Jim Butcher - The Dresden Files 06 - Blood Rites.m4b                                    | 13:03:050.25 |
| Jim Butcher - The Dresden Files 15.5 - Brief Cases.m4b                                  | 15:30:014.78 |
| Jim Butcher - The Dresden Files 04 - Summer Knight.m4b                                  | 11:13:016.10 |
| Cixin Liu - Three Body Problem 01 - The Three Body Problem.m4b                          | 14:37:047.62 |
| Homer - The Iliad - t. Emily Wilson.m4b                                                 | 20:23:013.33 |
| Joe Abercrombie - Shattered Sea 03 - Half a War.m4b                                     | 12:14:037.05 |
| Joe Abercrombie - Shattered Sea 02 - Half the World.m4b                                 | 12:08:029.99 |
| Joe Abercrombie - Shattered Sea 01 - Half a King.m4b                                    | 09:26:014.23 |
| Peter Hamilton - The Dreaming Void.m4b                                                  | 22:37:038.54 |
| Orson Scott Card - Enders Game.m4b                                                      | 11:11:047.41 |
| Kurt Vonnegut - Cats Cradle.m4b                                                         | 07:11:046.62 |
| Ian Johnson - Sparks.m4b                                                                | 12:11:038.70 |
| David E. Sanger - The Inheritance.m4b                                                   | 16:36:018.10 |
| Daniel C. Dennett - From Bacteria to Bach and Back.m4b                                  | 15:40:047.44 |
| Dan Ariely - The Upside of Irrationality.m4b                                            | 08:06:011.23 |
| Arjuna Ardagh - Leap Before You Look.m4b                                                | 02:30:029.71 |
| Agatha Christie - Hercules Poirot 15 - Death on the Nile.m4b                            | 08:41:054.27 |
| Agatha Christie - Hercules Poirot 04 - The Murder of Roger Ackroyd.m4b                  | 06:55:007.35 |
| Agatha Christie - Hercules Poirot 09 - Murder on the Orient Express.m4b                 | 06:50:039.28 |
| J.R.R. Tolkien - The Lord of the Rings 3 - The Return of the King - Andy Serkis.m4b     | 21:52:022.47 |
| J.R.R. Tolkien - The Hobbit - Andy Serkis.m4b                                           | 10:24:042.73 |
| J.R.R. Tolkien - The Lord of the Rings 2 - The Two Towers - Andy Serkis.m4b             | 20:46:043.85 |
| J.R.R. Tolkien - The Lord of the Rings 1 - The Fellowship of the Ring - Andy Serkis.m4b | 22:38:020.73 |
| Cory Doctorow - Martin Hench 01 - Red Team Blues.m4b                                    | 07:15:014.97 |
| Richard Dawkins - Unweaving the Rainbow.m4b                                             | 11:51:039.06 |
| Steven Pinker - The Sense of Style.m4b                                                  | 12:26:030.87 |
| Ursula K. Le Guin - Earthsea - A Wizard of Earthsea.m4b                                 | 01:59:001.90 |
| Ayn Rand - Atlas Shrugged.m4b                                                           | 62:57:004.16 |
| Dan Carlin - The End Is Always Near.m4b                                                 | 07:55:028.22 |
| Jack Vance - The Dying Earth 02 - The Eyes Of The Overworld.m4b                         | 08:05:022.26 |
| Jack Vance - The Dying Earth 01 - The Dying Earth.m4b                                   | 06:41:056.90 |
| Daniel C. Dennett - Kinds of Minds.m4b                                                  | 03:30:042.72 |
| Carlo Rovelli - White Holes.m4b                                                         | 02:48:039.92 |
| Brandon Sanderson - Stormlight Archive 01 - The Way of Kings.m4b                        | 45:33:005.53 |
| Brandon Sanderson - Stormlight Archive 02 - Words of Radiance.m4b                       | 48:12:058.68 |
| Brandon Sanderson - Stormlight Archive 04 - Rhythm of War.m4b                           | 57:26:056.89 |
| Brandon Sanderson - Stormlight Archive 03 - Oathbringer.m4b                             | 55:06:008.68 |
| Brandon Sanderson - Stormlight Archive 02.5 - Edgedancer.m4b                            | 05:10:025.88 |
| Cory Doctorow - Chokepoint Capitalism.m4b                                               | 11:56:003.80 |
| Steven Brust - Vlad Taltos 10 - Dzur.m4b                                                | 08:08:009.69 |
| Steven Brust - Vlad Taltos 04 - Taltos.m4b                                              | 06:14:008.58 |
| Steven Brust - Vlad Taltos 07 - Orca.m4b                                                | 09:16:013.82 |
| Steven Brust - Vlad Taltos 11 - Jhegaala.m4b                                            | 09:11:027.48 |
| Steven Brust - Vlad Taltos 06 - Athyra.m4b                                              | 08:23:023.61 |
| Steven Brust - Vlad Taltos 03 - Teckla.m4b                                              | 07:13:054.88 |
| Steven Brust - Vlad Taltos 13 - Tiassa.m4b                                              | 08:24:010.45 |
| Steven Brust - Vlad Taltos 09 - Issola.m4b                                              | 08:39:029.59 |
| Steven Brust - Vlad Taltos 01 - Jhereg.m4b                                              | 08:40:053.29 |
| Steven Brust - Vlad Taltos 05 - Phoenix.m4b                                             | 07:56:004.51 |
| Steven Brust - Vlad Taltos 16 - Tsalmoth.m4b                                            | 09:49:059.42 |
| Steven Brust - Vlad Taltos 08 - Dragon.m4b                                              | 08:56:025.22 |
| Steven Brust - Vlad Taltos 17 - Lyorn.m4b                                               | 10:03:009.27 |
| Steven Brust - Vlad Taltos 02 - Yendi.m4b                                               | 06:46:021.11 |
| Steven Brust - Vlad Taltos 15 - Vallista.m4b                                            | 09:31:044.14 |
| Steven Brust - Vlad Taltos 12 - Iorich.m4b                                              | 08:41:033.55 |
| Steven Brust - Vlad Taltos 14 - Hawk.m4b                                                | 08:48:019.57 |
| Robert Jordan - The Wheel of Time 01 - The Eye of the World.m4b                         | 32:55:052.92 |
| Blake Crouch - Upgrade.m4b                                                              | 09:47:054.66 |
| Nick Chater - The Mind Is Flat.m4b                                                      | 07:26:021.61 |
| Richard Dawkins - An Appetite for Wonder.m4b                                            | 07:55:040.39 |
| Oliver Burkeman - Four Thousand Weeks.m4b                                               | 05:54:004.65 |
| James Hoffmann - The World Atlas of Coffee.m4b                                          | 05:40:018.87 |
| Kurt Vonnegut - Breakfast of Champions.m4b                                              | 06:27:029.42 |
| Jonathan Rauch - The Constitution of Knowledge.m4b                                      | 12:22:019.22 |
| Immanuel Kant - The Critique of Pure Reason - n. Martin Wilson.m4b                      | 22:39:039.01 |
| Maurice Druon - Les Rois Maudits 01 - Le Roi de Fer.m4b                                 | 08:24:019.87 |
| Maurice Druon - Les Rois Maudits 02 - La Reine Etranglee.m4b                            | 06:25:016.62 |
| Maurice Druon - Les Rois Maudits 03 - Les Poisons de la Couronne.m4b                    | 06:45:037.48 |
| Maurice Druon - Les Rois Maudits 05 - La Louve de France.m4b                            | 10:13:002.48 |
| Maurice Druon - Les Rois Maudits 07 - Quand un Roi Perd la France.m4b                   | 08:09:020.34 |
| Maurice Druon - Les Rois Maudits 06 - Le Lis et le Lion.m4b                             | 09:28:019.51 |
| Maurice Druon - Les Rois Maudits 04 - La Loi des Males.m4b                              | 07:30:002.28 |
| Nicole Perlroth - This Is How They Tell Me the World Ends.m4b                           | 18:31:039.78 |
| Richard Dawkins - The God Delusion.m4b                                                  | 13:52:018.32 |
| Weavers, Scribes, and Kings.m4b                                                         | 18:26:040.24 |
| Charles D. Ellis - Winning the Loser's Game.m4b                                         | 07:52:053.69 |
| Dan Jones - The Templars.m4b                                                            | 15:36:002.37 |
| Michael Lewis - The Undoing Project.m4b                                                 | 10:18:035.01 |
| Steven Runciman - The Fall of Constantinople 1453.m4b                                   | 07:35:045.43 |
| William MacAskill - What We Owe the Future.m4b                                          | 08:55:018.79 |
| Mustafa Suleyman - The Coming Wave.m4b                                                  | 11:48:042.32 |
| Ian Mortimer - Medieval Horizons.m4b                                                    | 10:24:002.00 |
| Jon Kabat-Zinn - Falling Awake.m4b                                                      | 05:10:018.81 |
| Jon Kabat-Zinn - Full Catastrophe Living.m4b                                            | 05:59:032.38 |
| Susan Wise Bauer - The History of the Ancient World.m4b                                 | 26:21:003.98 |
| Octavia E. Butler - Xenogenesis 03 - Imago.m4b                                          | 08:18:047.00 |
| Octavia E. Butler - Xenogenesis 02 - Adulthood Rites.m4b                                | 10:13:008.91 |
| Octavia E. Butler - Xenogenesis 01 - Dawn.m4b                                           | 09:22:010.61 |
| Immanuel Kant - Critique of Pure Reason - n. Peter Wickham.m4b                          | 25:13:027.89 |
| Bertrand Russell - History of Western Philosophy.m4b                                    | 38:03:022.87 |
| Larry Niven, Jerry Pournelle - The Mote In Gods Eye.m4b                                 | 23:00:036.17 |
| Bessel A. van der Kolk - The Body Keeps the Score.m4b                                   | 16:15:051.83 |
| Sara Imari Walker - Life as No One Knows It.m4b                                         | 07:20:005.48 |
| Rebecca Wragg Sykes - Kindred.m4b                                                       | 16:26:028.69 |
| The Dispossessed.m4b                                                                    | 13:25:023.24 |
| The Left Hand of Darkness.m4b                                                           | 09:40:004.99 |
| Elliot Ackerman - 2034 -  A Novel of the Next World War.m4b                             | 10:49:049.17 |
| Sean Carroll - The Biggest Ideas in the Universe.m4b                                    | 09:55:039.77 |
| Margaret Atwood - The Penelopiad.m4b                                                    | 03:19:033.28 |
| Mihaly Csikszentmihalyi - Creativity.m4b                                                | 15:33:049.06 |
| Jim Collins - Good to Great.m4b                                                         | 05:40:012.68 |
| Henry A. Kissinger - The Age of AI.m4b                                                  | 07:13:025.48 |
| Stephen Fry - Mythos 02 - Heroes.m4b                                                    | 15:01:059.17 |
| Stephen Fry - Mythos 01 - Mythos.m4b                                                    | 15:25:041.95 |
| Stephen Fry - Mythos 04 - Odyssey.m4b                                                   | 10:36:048.32 |
| Stephen Fry - Mythos 03 - Troy.m4b                                                      | 11:00:001.03 |
| Adam Savage - Every Tool's a Hammer.m4b                                                 | 07:45:040.74 |
| John Gwynne - The Bloodsworn Saga 1 - The Shadow of the Gods.m4b                        | 18:15:004.14 |
| John Gwynne - The Bloodsworn Saga 2 - The Hunger of the Gods.m4b                        | 22:59:003.82 |
| Pierce Brown - Red Rising 03 - Morning Star.m4b                                         | 21:50:042.92 |
| Pierce Brown - Red Rising 06 - Light Bringer.m4b                                        | 30:09:015.70 |
| Pierce Brown - Red Rising 05 - Dark Age.m4b                                             | 33:58:041.24 |
| Pierce Brown - Red Rising 01 - Red Rising.m4b                                           | 16:12:028.87 |
| Pierce Brown - Red Rising 04 - Iron Gold.m4b                                            | 23:23:024.70 |
| Pierce Brown - Red Rising 02 - Golden Son.m4b                                           | 19:03:023.68 |
| Niall Ferguson - The Ascent of Money.m4b                                                | 11:30:019.13 |
| Steven R. Covey - The 7 Habits of Highly Effective People.m4b                           | 13:04:046.75 |
| Antonio Padilla - Fantastic Numbers and Where to Find Them.m4b                          | 13:53:030.40 |
| Carlo Rovelli - Seven Brief Lessons on Physics.m4b                                      | 01:45:035.00 |
| David Mitchell - The Thousand Autumns of Jacob de Zoet.m4b                              | 18:56:000.44 |
| Cixin Liu - Three Body Problem 03 - Deaths End.m4b                                      | 28:52:002.86 |
| Tom Holland - In The Shadow Of The Sword.m4b                                            | 17:50:011.95 |
| Ted Chiang - Exhalation.m4b                                                             | 11:22:008.19 |
| Jack Kornfield - The Inner Art of Meditation.m4b                                        | 09:09:000.19 |
| R. F. Kuang - The Poppy War 01 - The Poppy War.m4b                                      | 18:57:041.14 |
| R. F. Kuang - The Poppy War 02 - The Dragon Republic.m4b                                | 23:46:032.94 |
| R. F. Kuang - The Poppy War 03 - The Burning God.m4b                                    | 23:46:031.33 |
| Stephen R. Donaldson - Thomas Covenant the Unbeliever 03 - The Power That Preserves.m4b | 20:13:031.79 |
| Stephen R. Donaldson - Thomas Covenant the Unbeliever 02 - The Illearth War.m4b         | 20:39:024.09 |
| Stephen R. Donaldson - Thomas Covenant the Unbeliever 01 - Lord Fouls Bane.m4b          | 19:38:038.88 |
| The Blood Mirror.m4b                                                                    | 20:30:044.69 |
| The Burning White.m4b                                                                   | 39:04:058.35 |
| The Blinding Knife.m4b                                                                  | 24:14:039.67 |
| The Black Prism.m4b                                                                     | 21:26:039.72 |
| The Broken Eye.m4b                                                                      | 29:34:007.34 |
| GaryTaubes - Why We Get Fat.m4b                                                         | 07:58:014.97 |
| Charlie Jane Anders - All the Birds in the Sky.m4b                                      | 12:36:033.01 |
| Tina Fey - Bossypants.m4b                                                               | 05:31:022.68 |
| Amal El-Mohtar - This Is How You Lose the Time War.m4b                                  | 04:16:000.26 |
| 7 - The Valley of Fear.m4b                                                              | 06:35:022.44 |
| 5 - The Hound of the Baskervilles.m4b                                                   | 06:34:052.30 |
| 8 - His Last Bow.m4b                                                                    | 06:41:022.63 |
| 1 - A Study in Scarlet.m4b                                                              | 04:58:030.67 |
| 2 - The Sign of Four.m4b                                                                | 04:44:014.27 |
| 9 - The Casebook of Sherlock Holmes.m4b                                                 | 09:05:050.36 |
| 4 - The Memoirs of Sherlock Holmes.m4b                                                  | 10:08:043.88 |
| 6 - The Return of Sherlock Holmes.m4b                                                   | 11:54:018.94 |
| 3 - The Adventures of Sherlock Holmes.m4b                                               | 11:13:052.22 |
| Neal Stephenson - Reamde.m4b                                                            | 38:32:052.11 |
| Neal Stephenson - Dodge 02 - Fall, or Dodge in Hell.m4b                                 | 31:48:032.13 |
| The Golden Road.m4b                                                                     | 13:54:032.04 |
| Richard Dawkins - The Ancestor's Tale.m4b                                               | 08:53:043.43 |
| Ben Buchanan - The Hacker and the State.m4b                                             | 11:20:001.07 |
| Cory Doctorow - Little Brother 03 - Attack Surface.m4b                                  | 11:08:027.13 |
| Cory Doctorow - Little Brother 01 - Little Brother.m4b                                  | 11:54:021.24 |
| Cory Doctorow - Little Brother 02.75 - Force Multiplier.m4b                             | 00:23:020.53 |
| Cory Doctorow - Little Brother 02 - Homeland.m4b                                        | 12:05:000.64 |
| Malcolm Gladwell - Tipping Point.m4b                                                    | 03:04:031.64 |
| Daniel Gilbert - Stumbling On Happiness.m4b                                             | 07:26:045.81 |
| Sam Harris - Waking Up.m4b                                                              | 05:53:037.23 |
| Lucy Worsley - Agatha Christie.m4b                                                      | 13:47:000.72 |
| Max Tegmark - Our Mathematical Universe.m4b                                             | 15:22:027.65 |
| Tracey Kidder - The Soul of a New Machine.m4b                                           | 09:03:053.82 |
| Fyodor Dostoyevsky - The Brothers Karamazov.m4b                                         | 43:06:009.48 |
| Oliver Sacks - An Anthropologist On Mars.m4b                                            | 11:42:023.29 |
| Fonda Lee - The Green Bone Saga 0.75 - Jade Shards.m4b                                  | 03:52:007.14 |
| Fonda Lee - The Green Bone Saga 03 - Jade Legacy.m4b                                    | 28:29:040.84 |
| Fonda Lee - The Green Bone Saga 0.5 - The Jade Setter of Janloon.m4b                    | 04:05:005.67 |
| Fonda Lee - The Green Bone Saga 02 - Jade War.m4b                                       | 24:05:010.39 |
| Fonda Lee - The Green Bone Saga 01 - Jade City.m4b                                      | 19:07:014.95 |
| Richard Dawkins - The Selfish Gene.m4b                                                  | 16:10:031.21 |
| Cory Doctorow - Down and Out in the Magic Kingdom.m4b                                   | 04:13:004.03 |
| David Deutsch - The Beginning Of Infinity.m4b                                           | 20:00:027.33 |
| The Light Ages - The Surprising Story of Medieval Science.m4b                           | 11:03:048.65 |
| Neal Stephenson - The Baroque Cycle 02 - King of the Vagabonds.m4b                      | 11:10:011.92 |
| Neal Stephenson - The Baroque Cycle 04 and 05 - The Confusion.m4b                       | 34:30:031.38 |
| Neal Stephenson - The Baroque Cycle 01 - Quicksilver.m4b                                | 14:25:031.14 |
| Neal Stephenson - The Baroque Cycle 06 - Solomon's Gold.m4b                             | 14:10:054.60 |
| Neal Stephenson - The Baroque Cycle 03 - Odalisque.m4b                                  | 13:22:056.99 |
| Neal Stephenson - The Baroque Cycle 08 - The System of the World.m4b                    | 11:37:003.99 |
| Neal Stephenson - The Baroque Cycle 07 - Currency.m4b                                   | 14:15:035.89 |
