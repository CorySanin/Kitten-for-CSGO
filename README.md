# Music Kitten for CS:GO
[![Travis CI Build Status](https://api.travis-ci.org/CorySanin/Kitten-for-CSGO.svg?branch=master)](https://travis-ci.org/CorySanin/Kitten-for-CSGO)
[![node.js dependencies](https://david-dm.org/CorySanin/Kitten-for-CSGO.svg)](https://david-dm.org/CorySanin/Kitten-for-CSGO)
[![node.js devDependencies](https://david-dm.org/CorySanin/Kitten-for-CSGO/dev-status.svg)](https://david-dm.org/CorySanin/Kitten-for-CSGO?type=dev)
[![Codacy Score](https://api.codacy.com/project/badge/Grade/7b187bf2c3344d56868021e0609eded2)](https://www.codacy.com/app/CorySanin/Kitten-for-CSGO?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=CorySanin/Kitten-for-CSGO&amp;utm_campaign=Badge_Grade)
[![License](https://img.shields.io/github/license/CorySanin/Kitten-for-CSGO.svg)](LICENSE)

Music Kitten, or simply Kitten, is an Electron application that plays audio
tracks when CS:GO gives it certain cues. Essentially, this allows you to
create and use your own music kits.

## Getting Started
Grab the latest "stable" release
[here](https://www.musickitten.net/download/).

To run Music Kitten from source, you'll need node. If you've never
configured node before, I recommend using
[nvm](https://github.com/creationix/nvm#install-script) on Linux and Mac OS,
or [nvm for Windows](https://github.com/coreybutler/nvm-windows).

Once you have node and npm ready to go, cd to where Kitten was cloned. Next, I
suggest that you delete the package-lock.json file since it can cause problems.
Then run `npm install` and `npm start` and you'll be running Kitten.

To build Kitten for your target platform, do `npm run dist`.

## How to use
The first thing Kitten is going to do is request a directory to look in for
music kits. Kitten's configuration file is also stored here. Create/select a
dedicated folder for Kitten to use.

If you'd like to use a different port than the default, change the value in the
textbox, click save, and restart Kitten.

If CS:GO was already open before you started the setup process, you may need to
restart it.

Remember to mute in-game music if you haven't done so.

Lastly, you need music kits. A music kit is a collection of audio files grouped
in a directory in the Kitten save folder. Basically, inside the folder you
picked at the beginning, you're going to have a folder for each music kit you
have. If you don't have any music kits, Kitten will offer to download the
[sample music kit](https://www.musickitten.net/kit/1). Otherwise, you can
download one from [musickitten.net](https://www.musickitten.net/browse/) or make
your own. Which brings us to...

## Creating kits
First thing is making a folder fot the kit. Create a directory in the Kitten
folder you chose to use and call it whatever you want the kit to be called.
Inside, you'll need to have these audio files:


1. mainmenu

  * mainmenu plays and loops at the mainmenu. Should be long enough to not drive
  people crazy since it loops.

2. startround_01 - startround_03

  * startround_0X starts playing in the frozen phase of a new round and loops
  until the round starts. These should be short, around 8 seconds (or shorter).
  There are three variants from which Kitten selects randomly.

3. startaction_01 - startaction_03

  * startaction_0X plays as soon as the startround track ends and the round has
  already started. In other words, startround_0X should seamlessly transition
  into startaction_0X. This track fades out automatically. Make it at least 10
  seconds.

4. bombplanted

  * bombplanted plays when the bomb gets planted. It plays and loops (if necessary) for
  30 seconds. The delay before it starts is due to CS:GO taking it's time
  notifying Kitten. The delay varies from time to time.

5. bombtenseccount

  * bombtenseccount plays and loops (if necessary) 30 seconds after bombplanted
  started playing. If bombplanted was late, this will be too.

6. wonround

  * Plays (and loops) when you win. Anything over 20 seconds is excessive.

7. lostround

  * Plays (and loops) when you lose. Anything over 20 seconds is excessive.

8. roundmvpanthem_01

  * roundmvpanthem_01 plays (and loops) when you're the MVP\*.
   Anything over 20 seconds is excessive. Despite the naming convention,
  there's only one MVP anthem. The name was chosen to align with the naming
  scheme already in place for real music kits.

  \*Due to how CS:GO sends information, this won't play if you're dead and
  spectating another player. in that case, it'll just play wonround.

---

You can use any file type that Chrome's audio player can play. I'd recommend
anything that supports gapless playback (like FLAC). Filenames are CASE
SENSATIVE

Optionally, you can add a cover.jpeg to the music kit's folder. This is
displayed in Kitten when the kit is selected.

Take a look at the sample music kit for an example of what a music kit could
look like:
[Big Croint Music Kit](https://www.musickitten.net/kit/1)
