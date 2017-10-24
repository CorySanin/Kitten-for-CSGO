# Music Kitten for CS:GO
Music Kitten, or simply Kitten, is an Electron application that plays audio
tracks when CS:GO gives it certain cues. Essentially, this allows you to
create and use your own music kits.

## Getting Started
For now, you're going to need node.js and npm all set up. In the future, I plan
on distributing packages for the big three target OS's. If you've never
configured node before, I recommend using
[nvm](https://github.com/creationix/nvm#install-script) on Linux,
[nvm for Windows](https://github.com/coreybutler/nvm-windows), or
[homebrew and nvm](http://lmgtfy.com/?s=b&q=mac+os+homebrew+nvm) for Mac OS.

Once you have node and npm ready to go, cd to where Kitten was downloaded. Then
run `npm install` and then `npm start` and you'll be running Kitten.

## How to use
The first thing Kitten is going to do is request a directory to look in for
music kits. Kitten's configuration file is also stored here. Create/select a
dedicated folder for Kitten to use.

If you'd like to use a different port than the default, change the value in the
textbox, click save, and restart Kitten.

Next, a configuration file for CS:GO needs to be generated. This file tells
CS:GO to notify Kitten when something happens. Click the "Generate Config"
button and follow the instructions Kitten gives you. You'll probably need to
restart CS:GO after placing the file in its destination.

Lastly, you need music kits. A music kit is a collection of audio files grouped
in a directory in the Kitten save folder. Basically, inside the folder you
picked at the beginning, you're going to have a folder for each music kit you
have. Which brings us to...

## Creating kits
First thing is making a folder fot the kit. Create a directory in the Kitten
folder you chose to use and call it whatever you want the kit to be called.
Inside, you'll need to have these audio files:


1. mainmenu

  * mainmenu plays and loops at the mainmenu. Sometimes it plays elsewhere,
  but that's a minor bug that's not all that bad.

2. startround_01 - startround_03

  * startround_0X starts playing in the frozen phase of a new round and loopstate
  until the round starts. There are three variants from which Kitten selects
  randomly.

3. startaction_01 - startaction_03

  * startaction_0X plays as soon as the startround track ends and the round has
  already started. It plays for about 9 seconds and fades out.

4. bombplanted

  * bombplanted plays when the bomb gets planted. It plays and loops (if necessary) for
  30 seconds. The delay before it starts is due to CS:GO taking it's time
  notifying Kitten. The delay varies from time to time.

5. bombtenseccount

  * bombtenseccount plays 30 seconds after bombplanted started playing. If
  bombplanted was late, this will be too.

6. wonround

  * Plays when you win

7. lostround

  * Plays when you lose

8. roundmvpanthem_01

  * roundmvpanthem_01 plays when you're the MVP\*. Despite the naming convention,
  there's only one MVP anthem. The name was chosen to align with the naming
  scheme already in place for real music kits.

  \*Due to how CS:GO sends information, this won't play if you're dead and
  spectating another player. in that case, it'll just play wonround.

---

You can use any file type that Chrome's audio player can play. I'd recommend
anything that supports gapless playback (like FLAC). Also, make sure you use the
same filetype for every track.

Optionally, you can add a cover.jpeg to the music kit's folder. This is
isplayed in Kitten when the kit is selected.

Aside from these files, try to refrain from adding too many other files, namely
files of a type different from the one you chose for the kit's tracks.
